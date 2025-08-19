import { api, NodeSDK } from "@opentelemetry/sdk-node";

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Environment } from "../env";
import { Attributes, context, trace } from "@opentelemetry/api";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LanguageClient } from "vscode-languageclient/node";
import {
  ProtocolRequestType,
  ProtocolRequestType0,
  RequestType,
  RequestType0,
  type Connection,
} from "vscode-languageserver";
import { StackContextManager } from "@opentelemetry/sdk-trace-web";
import * as vscode from "vscode";

/******************************************************************************/
/* Prelude */
/******************************************************************************/
/**
 * OpenTelemetry tracing for the Semgrep VS Code extension, specifically
 * the language client.
 *
 * This file contains most of the main tracing logic which we need in order to
 * send OpenTelemetry spans to our telemetry infrastructure.
 * This will let us see the kinds of requests being made, how long they take,
 * etc, which will hopefully help us understand the efficacy of the extension.
 */

/******************************************************************************/
/* Types */
/******************************************************************************/

export enum ExtensionEnvironment {
  Prod = "semgrep-prod",
  Dev = "semgrep-dev",
  Local = "semgrep-local",
}

/******************************************************************************/
/* Constants */
/******************************************************************************/

/* Coupling: these need to be kept in sync with semgrep-proprietary/tracing.py */
const default_trace_endpoint = "https://telemetry.semgrep.dev/v1/traces";
const default_dev_endpoint = "https://telemetry.dev2.semgrep.dev/v1/traces";
const default_local_endpoint = "http://localhost:4318/v1/traces";

// Some globals which let us maintain a "top-level span" so we can
// nest our spans underneath a common parent.
// See the large comment near `RootContextManager` for more details.
export let topLevelSpan: api.Span | null = null;

/**
 * Deregisters any existing OpenTelemetry global state.
 *
 * This is important because we want to avoid any potential
 * conflicts with other OpenTelemetry instances.
 *
 * For instance, Cursor ships with its own OpenTelemetry code and
 * state, which will result in a conflict when we attempt to register
 * our own (e.g. trace providers, context managers)
 *
 * This conflict ends up preventing our ability to sent OpenTelemetry
 * spans whatsoever in Cursor.
 */
export function deregisterExistingOtel(): void {
  // Helps us avoid type errors.
  const globalThis_any = globalThis as any;

  // Warning! This will change if we upgrade to OpenTelemetry 2 or greater!
  // Why is this the solution?
  // https://github.com/open-telemetry/opentelemetry-js/blob/cb42f7d511a1b54d12d32a6a6bdc6266d5569c1b/api/src/internal/global-utils.ts#L39
  // Registration of OpenTelemetry globals is done via indexing into the
  // globalThis with a particular symbol, derived from `opentelemetry.js.api.${major}`
  // So to deregister, we just need to set those fields of globalThis back to undefined.
  const otelSymbol = Symbol.for("opentelemetry.js.api.1");
  const existing = globalThis_any[otelSymbol];

  if (existing) {
    // Can't leave an `env.logger.log` because we did this super early on.
    // nosem:
    console.log("Found existing OpenTelemetry instance, deregistering it");
    globalThis_any[otelSymbol] = undefined;
  }
}

/******************************************************************************/
/* Context management */
/******************************************************************************/
// I took this code from this GitHub thread:
// https://github.com/open-telemetry/opentelemetry-js/issues/3558#issuecomment-2039249345
//
// Basically, the reason why this needs to exist is that in order
// to get spans to nest with each other properly, we need to associate
// each span to a context, then explicitly pass these contexts to
// each span that we want to be a child of it.
//
// But, this is problematic, because we can only run a context when
// we use the `context.with` function, which accepts a callback.
//
// Our language client is invoked via our `activate` and `deactivate` functions.
// This means we have no first-party code which runs for the duration of the LSP.
// This means we cannot just stick the entire application's code into a callback
// and put it underneath the `context.with`.
//
// So somehow we have to ensure this top-level context is set-up at the language
// client's start, and disposed of at the language client's end, while
// only being able to run code from two distinct points.
//
// The solution ends up to be essentially monkeypatching the context manager,
// and making sure that we have the ability to override the private
// `_currentContext` field.
// This code may be a little longer than is necessary, but gets the job done.
// The overall effect is that `context.bind` becomes a way that we can
// manually set the current context in a non-`with` way.
export class RootContextManager extends StackContextManager {
  /**
   * If the current span is terminated (span.end() was called), reset the context to ROOT_CONTEXT
   */
  override active(): api.Context {
    const span = api.trace.getSpan(this._currentContext);
    // If the current span is terminated (span.end() was called), reset the context to ROOT_CONTEXT
    if (span?.isRecording() === false) {
      this._currentContext = api.ROOT_CONTEXT;
    }
    return super.active();
  }

  override bind<T>(context: api.Context, target: T): T {
    const span = api.trace.getActiveSpan(); //getSpan(this._currentContext);
    // only bind the context if there is no recording active span. First win, it can be only have one active span.
    if (!span || !span.isRecording()) {
      this._currentContext = context;
    } else {
      const activeSpanName = (span as any).name;
      const newSpanName = (api.trace.getSpan(context) as any)?.name;
      api.diag.info(
        `There is already an open active span: '${activeSpanName}' -> '${newSpanName}' will not be used as parent span`,
      );
    }
    return super.bind(context, target);
  }
}

/******************************************************************************/
/* Helpers */
/******************************************************************************/

function extensionEnvToTraceEnvironment(
  extensionEnv: ExtensionEnvironment,
): string {
  switch (extensionEnv) {
    case ExtensionEnvironment.Dev:
      return "dev";
    case ExtensionEnvironment.Prod:
      return "prod";
    case ExtensionEnvironment.Local:
      return "local";
    default:
      return "dev";
  }
}

/******************************************************************************/
/* Setup */
/******************************************************************************/
/**
 * The problem statement: We would like to be able to instrument the requests
 * that are sent to the language server, from the client side, so that we can
 * measure the true "wall time" of requests.
 *
 * This will give us better signal into whether we are taking too long, causing
 * user disruption, etc, than just the time it takes on the server side.
 *
 * The context: We rely on `vscode-languageclient`, which makes it very easy to
 * set up a language client by handling all the hard bits and low-level parts of
 * the API for us.
 * Unfortunately, this means that we rely on the API of the language client package,
 * which is more limited in some ways.
 *
 * In particular, we have to be able to make some of our custom code run on
 * every time that `vscode-languageclient` makes a request. This happens inside of
 * the package, when it instantiates a `Connection` object, and then invokes the
 * `sendRequest` method on it.
 * There is no API-level way for us to easily instrument the `sendRequest` method.
 *
 * Thankfully (maybe), TypeScript is really just dynamic Javascript in disguise,
 * and so we can do blatantly unsafe things like monkeypatch methods at runtime.
 * This is the approach we will take.
 * Since we have to monkeypatch not just a specific method of the package, but a
 * specific method on a specific object it will instantiate, we will:
 * 1) instantiate the Connection object ourselves, monkeypatching `createConnection`
 *    to instead return the same object we created earlier
 *    - this is because `createConnection` cannot be invoked twice, we need to change
 *      the _same_ object that the client uses
 * 2) monkeypatch the `sendRequest` method of the Connection object that we created
 */

/**
 * Sets up tracing for the language client.
 * This will monkeypatch the `sendRequest` method of the connection, as well as the `createConnection` method of the client.
 *
 * Extensional behavior should ideally be preserved, but we add tracing to the requests that are sent.
 *
 * @param env The environment to use for logging and tracing.
 * @param c The language client to set up tracing for.
 */
export async function setupLanguageClientTracing(
  env: Environment,
  c: LanguageClient,
): Promise<void> {
  const c_any: any = c as any; // TypeScript does not allow us to access private members directly, so we cast to any.
  // We know what we're doing, promise.

  const connection: Connection = await c_any.createConnection();
  c_any.createConnection = async () => {
    env.logger.log("Reused existing connection");
    return connection;
  };

  const originalSendRequest = connection.sendRequest.bind(connection);
  connection.sendRequest = (...args: any[]): Promise<any> => {
    // It should only be possible that we get args with at least one arg, according
    // to the type of `sendRequest`.
    if (args.length >= 1) {
      // First arg has to be of these types, according to the package type spec.
      const info:
        | ProtocolRequestType0<any, any, any, any>
        | ProtocolRequestType<any, any, any, any, any>
        | RequestType0<any, any>
        | RequestType<any, any, any> = args[0];
      const method = info.method;

      env.logger.log(`Sending request ${method}`);

      // Instrument the request with a span. This will let us see what kinds
      // of requests are being sent, as well as how long they take to complete.
      return withSpan(`sendRequest.${method}`, {}, async () => {
        // Call back to the original sendRequest, like nothing happened :)
        return await (originalSendRequest as any)(...args);
      });
    }

    // But let's gracefully handle, if possible.
    env.logger.log(`Got zero args for sendRequest somehow, returning null`);
    return Promise.resolve(null);
  };

  env.logger.log("Patched language server with tracing.");
}

export function startTracing(env: Environment): void {
  let endpoint: string;

  // Decide the endpoint based on the environment.
  if (env.extensionDevEnvironment === ExtensionEnvironment.Dev) {
    endpoint = default_dev_endpoint;
  } else if (env.extensionDevEnvironment === ExtensionEnvironment.Prod) {
    endpoint = default_trace_endpoint;
  } else {
    endpoint = default_local_endpoint;
  }

  const traceExporter = new OTLPTraceExporter({
    url: endpoint,
  });

  const hasMetrics: boolean | undefined = env.config.cfg.get("metrics");

  const attributes: Attributes = {
    [SEMRESATTRS_SERVICE_NAME]: "semgrep-vscode",
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: extensionEnvToTraceEnvironment(
      env.extensionDevEnvironment,
    ),
    ["client.proIntrafile"]: env.config.cfg.get("scan.pro_intrafile"),
    ["client.secrets"]: env.config.cfg.get("scan.secrets"),
    ["client.experimentalLs"]: env.config.cfg.get("useExperimentalLS"),
    ["client.metrics"]: hasMetrics,
    // Not exactly the same as the auto-collected OpenTelemetry
    // resources, so don't rely on exact correctness.
    // But, these are useful and good to collect.
    ["arch"]: process.arch,
    ["process.runtime.name"]: "node",
    ["process.runtime.version"]: process.versions.node,
    ["machine_id"]: vscode.env.machineId,
    ["trace_id"]: topLevelSpan?.spanContext().traceId,
  };

  // We want this so that we can correlate logs in Datadog with reported trace IDs.
  if (topLevelSpan) {
    attributes["trace_id"] = topLevelSpan.spanContext().traceId;
  }

  const sdk = new NodeSDK({
    traceExporter,
    resource: resourceFromAttributes(attributes),
    // Don't auto-detect resources, this picks up things like IP addresses
    // and usernames, which we don't want to collect.
    // Because it does collect some useful things, we manually add
    // them back up above.
    autoDetectResources: false,
    instrumentations: [getNodeAutoInstrumentations()],
    contextManager: new RootContextManager(),
  });

  sdk.start();

  env.sdk = sdk;

  const tracer = trace.getTracer("semgrep-vscode");

  // Spawn the top-level span and context.
  // Important: We bind it here to activate the logic we added in `RootContextManager`.
  const span = tracer.startSpan("vscode-client");
  topLevelSpan = span;
  const ctx = api.trace.setSpan(api.context.active(), span);
  api.context.bind(ctx, null);

  env.logger.log(`Tracing initialized to ${endpoint}`);
  env.logger.log(
    `Tracing initialized with span ID: ${span.spanContext().spanId} and trace ID: ${span.spanContext().traceId}`,
  );
}

export async function stopTracing(sdk: NodeSDK): Promise<void> {
  topLevelSpan?.end(); // End the top-level span

  await sdk.shutdown();
}

/******************************************************************************/
/* Tracing primitives */
/******************************************************************************/

/**
 * Main tracing function which allows us to run some code with a span.
 *
 * @param name The name of the span to create.
 * @param attributes Attributes to set on the span.
 * @param f The function to run within the span. This function should return a Promise.
 * @returns A Promise that resolves to the result of the function `f`.
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, any> = {},
  f: () => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer("semgrep-vscode");

  const span = tracer.startSpan(name);
  span.setAttributes(attributes);
  try {
    return await context.with(trace.setSpan(api.context.active(), span), f);
  } catch (err) {
    if (err instanceof Error) {
      span.recordException(err);
      span.setStatus({ code: 2, message: String(err) });
    } else {
      span.recordException("Unknown error");
      span.setStatus({ code: 2, message: String(err) });
    }
    throw err;
  } finally {
    span.end();
  }
}

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Environment } from "../env";
import { Attributes, context, trace } from "@opentelemetry/api";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LanguageClient } from "vscode-languageclient/node";
import {
  ProtocolRequestType,
  ProtocolRequestType0,
  RequestType,
  RequestType0,
  type Connection,
} from "vscode-languageserver";

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

export type DevEnvironment = "dev" | "prod" | "local";

/******************************************************************************/
/* Constants */
/******************************************************************************/

/* Coupling: these need to be kept in sync with semgrep-proprietary/tracing.py */
const default_trace_endpoint = "https://telemetry.semgrep.dev/v1/traces";
const default_dev_endpoint = "https://telemetry.dev2.semgrep.dev/v1/traces";
const default_local_endpoint = "http://localhost:4318/v1/traces";

const tracer = trace.getTracer("semgrep-vscode");

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

export function startTracing(
  env: Environment,
  environment: DevEnvironment,
): void {
  let endpoint: string;
  if (environment === "dev") {
    endpoint = default_dev_endpoint;
  } else if (environment === "prod") {
    endpoint = default_trace_endpoint;
  } else {
    endpoint = default_local_endpoint;
  }

  const traceExporter = new OTLPTraceExporter({
    url: endpoint,
    // TODO?
    // headers: {
    //   'Authorization': 'Bearer 3336af88b367d72803be908bbb192a845141fc09a092f5f76d59439d8f48cb92',
    // },
  });

  const sdk = new NodeSDK({
    traceExporter,
    resource: resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: "semgrep-vscode",
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  env.logger.log(`Tracing initialized to ${endpoint}`);
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
  const span = tracer.startSpan(name);
  span.setAttributes(attributes);
  try {
    return await context.with(trace.setSpan(context.active(), span), f);
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

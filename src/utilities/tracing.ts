import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Environment } from '../env';
import { Attributes, context, trace } from '@opentelemetry/api';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from "@opentelemetry/semantic-conventions";
import { resourceFromAttributes} from '@opentelemetry/resources';
import { LanguageClient } from 'vscode-languageclient/node';
import { ProtocolRequestType, ProtocolRequestType0, RequestType, RequestType0, type Connection } from "vscode-languageserver";

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
/* Constants */
/******************************************************************************/

/* Coupling: these need to be kept in sync with semgrep-proprietary/tracing.py */
const default_trace_endpoint = "https://telemetry.semgrep.dev"
const default_dev_endpoint = "https://telemetry.dev2.semgrep.dev"
const default_local_endpoint = "http://localhost:4318/v1/traces"

const tracer = trace.getTracer("semgrep-vscode");

/******************************************************************************/
/* Entry points */
/******************************************************************************/

/**
 * Main tracing function which allows us to run some code with a span.
 *
 * @param name The name of the span to create.
 * @param attributes Attributes to set on the span.
 * @param f The function to run within the span. This function should return a Promise.
 * @returns A Promise that resolves to the result of the function `f`.
 */
export async function withSpan<T>(name: string, attributes: Record<string, any> = {}, f : () => Promise<T>): Promise<T> {
  const span = tracer.startSpan(name);
  span.setAttributes(attributes);
  try {
    console.log("sending span")
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
    console.log("ending span")
    span.end();
  }
}

/**
 * Sets up tracing for the language client.
 * This will monkeypatch the `sendRequest` method of the connection, as well as the `createConnection` method of the client.
 *
 * Extensional behavior should ideally be preserved, but we add tracing to the requests that are sent.
 *
 * @param env The environment to use for logging and tracing.
 * @param c The language client to set up tracing for.
 */
export async function setupLanguageClientTracing(env: Environment, c: LanguageClient) : Promise<void> {
    const c_any : any = c as any; // TypeScript does not allow us to access private members directly, so we cast to any.
                                  // We know what we're doing, promise.

    const connection : Connection = await c_any.createConnection();
    c_any.createConnection = async () =>  {
      env.logger.log("Reused existing connection")
      return connection;
    }

    const originalSendRequest = connection.sendRequest.bind(connection);
    connection.sendRequest = ((...args: any[]): Promise<any> => {
      // It should only be possible that we get args with at least one arg, according
      // to the type of `sendRequest`.
      if (args.length >= 1) {
        // First arg has to be of these types, according to the package type spec.
        const info :
          ProtocolRequestType0<any, any, any, any>
          | ProtocolRequestType<any, any, any, any, any>
          | RequestType0<any, any>
          | RequestType<any, any, any> = args[0];
        const method = info.method;

        env.logger.log(`got args for sendRequest: ${JSON.stringify(args)}`);
        env.logger.log(`sending request ${method}`);

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
    });

    env.logger.log("Patched language server with tracing.");
}

/**
 * Decorator for tracing a method.
 *
 * @param name Optional custom span name
 */
export function TraceMethod(name?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const spanName = name || String(propertyKey);
      const span = tracer.startSpan(spanName);

      const run = () => {
        return originalMethod.apply(this, args);
      };

      try {
        // If the method returns a Promise, bind context and end span when it resolves/rejects
        const result = context.with(trace.setSpan(context.active(), span), run);
        if (result instanceof Promise) {
          return result
            .then((res) => {
              span.end();
              return res;
            })
            .catch((err) => {
              span.recordException(err);
              span.setStatus({ code: 2, message: String(err) });
              span.end();
              throw err;
            });
        } else {
          // Synchronous
          span.end();
          return result;
        }
      } catch (err) {
        if (err instanceof Error) {
          span.recordException(err);
          span.setStatus({ code: 2, message: String(err) });
          span.end();
          throw err;
        } else {
          span.recordException(new Error(String(err)));
          span.setStatus({ code: 2, message: String(err) });
          span.end();
          throw err
        }
      }
    };
  };
}

type DevEnvironment = "dev" | "prod" | "local"

export function startTracing(env: Environment, environment: DevEnvironment): void {
  let endpoint: string;
  if (environment === "dev") {
    endpoint = default_dev_endpoint
  } else if (environment === "prod") {
    endpoint = default_trace_endpoint
  } else {
    endpoint = default_local_endpoint
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
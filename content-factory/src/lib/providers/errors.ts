import {
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
} from "openai";

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

export type ProviderErrorType =
  | "configuration"
  | "authentication"
  | "permission"
  | "rate_limit"
  | "timeout"
  | "connection"
  | "unknown";

export function getProviderErrorType(error: unknown): ProviderErrorType {
  if (error instanceof ProviderConfigurationError) return "configuration";
  if (error instanceof AuthenticationError) return "authentication";
  if (error instanceof PermissionDeniedError) return "permission";
  if (error instanceof RateLimitError) return "rate_limit";
  if (error instanceof APIConnectionTimeoutError) return "timeout";
  if (error instanceof APIConnectionError) return "connection";
  return "unknown";
}

export function getProviderErrorMessage(error: unknown) {
  const messages: Record<ProviderErrorType, string> = {
    configuration: "AI service configuration is incomplete.",
    authentication: "AI credentials are invalid or expired.",
    permission: "This account cannot access the selected model.",
    rate_limit: "AI service rate limit or quota reached.",
    timeout: "AI service request timed out.",
    connection: "Unable to connect to AI service.",
    unknown: "AI service call failed.",
  };
  return messages[getProviderErrorType(error)];
}

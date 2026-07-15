// Compatibility entry point: workflow code imports this module only.
export {
  getActiveProviderName,
  getAiProviders,
  getImageProvider,
  getImageProviderName,
  getVideoProvider,
  getVideoProviderName,
  type ProviderName,
} from "@/lib/providers/registry";
export {
  getProviderErrorMessage,
  getProviderErrorType,
  ProviderConfigurationError,
  type ProviderErrorType,
} from "@/lib/providers/errors";
export { getOpenAiNetworkDiagnostics } from "@/lib/providers/openai";
export type {
  AiProviders,
  GeneratedTextContent,
  ImageProvider,
  TextProvider,
  VideoProvider,
  VoiceProvider,
} from "@/lib/providers/contracts";

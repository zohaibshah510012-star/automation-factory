import { MockDistributionProvider, type DistributionProvider } from "@/lib/distribution-provider";

const providers = new Map<string, DistributionProvider>();

export function registerProvider(platform: string, provider: DistributionProvider) { providers.set(platform.toLowerCase(), provider); }
export function getDistributionProvider(platform: string) { const provider = providers.get(platform.toLowerCase()); if (!provider) throw new Error(`Distribution provider is not registered: ${platform}`); return provider; }

registerProvider("mock", new MockDistributionProvider());

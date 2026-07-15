import { MockDistributionProvider, type DistributionProvider } from "@/lib/distribution-provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const providers = new Map<string, DistributionProvider>();

export function registerProvider(platform: string, provider: DistributionProvider) { providers.set(platform.toLowerCase(), provider); }
export function getDistributionProvider(platform: string) { const provider = providers.get(platform.toLowerCase()); if (!provider) throw new Error(`Distribution provider is not registered: ${platform}`); return provider; }
export async function getEnabledDistributionProvider(platform:string){const s=getSupabaseServerClient();if(!s)throw new Error("Distribution config unavailable");const{data}=await s.from("distribution_providers").select("enabled").eq("platform",platform).maybeSingle();if(!data?.enabled)throw new Error(`Distribution platform ${platform} is disabled.`);return getDistributionProvider(platform)}

registerProvider("mock", new MockDistributionProvider());

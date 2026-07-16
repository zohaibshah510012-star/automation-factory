export type DistributionRequest = { platform: string; payload: Record<string, unknown> };
export type DistributionResult = { externalId: string; url: string };
export type DistributionStatus = "published" | "failed";

export interface DistributionProvider {
  publish(input: DistributionRequest): Promise<DistributionResult>;
  getStatus(externalId: string): Promise<DistributionStatus>;
}

export class PreparedDistributionProvider implements DistributionProvider {
  async publish(input: DistributionRequest) {
    const jobId = typeof input.payload.jobId === "string" ? input.payload.jobId : crypto.randomUUID();
    return {
      externalId: `prepared-${input.platform}-${jobId}`,
      url: `/api/distributions/${jobId}/export`,
    };
  }

  async getStatus() {
    return "published" as const;
  }
}

export class MockDistributionProvider extends PreparedDistributionProvider {}

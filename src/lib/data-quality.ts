export type DataQualityStatus = 'complete' | 'partial' | 'unavailable';

export interface DataQualitySource {
  name: string;
  status: DataQualityStatus;
  message?: string;
  expected?: number;
  received?: number;
}

export interface DataQuality {
  status: DataQualityStatus;
  isPartial: boolean;
  checkedAt: string;
  sources: DataQualitySource[];
  message?: string;
}

interface BuildQualityInput {
  sources: DataQualitySource[];
  checkedAt?: string;
}

const STATUS_RANK: Record<DataQualityStatus, number> = {
  complete: 0,
  partial: 1,
  unavailable: 2,
};

export function buildDataQuality({ sources, checkedAt = new Date().toISOString() }: BuildQualityInput): DataQuality {
  const worstStatus = sources.reduce<DataQualityStatus>((worst, source) => {
    return STATUS_RANK[source.status] > STATUS_RANK[worst] ? source.status : worst;
  }, 'complete');

  const affected = sources.filter((source) => source.status !== 'complete');

  return {
    status: worstStatus,
    isPartial: worstStatus !== 'complete',
    checkedAt,
    sources,
    message: affected.length
      ? `Partial data: ${affected.map((source) => source.name).join(', ')} ${affected.length === 1 ? 'is' : 'are'} incomplete.`
      : 'All required sources returned complete data.',
  };
}

export function completeSource(name: string, message?: string): DataQualitySource {
  return { name, status: 'complete', message };
}

export function partialSource(name: string, message: string, counts?: { expected?: number; received?: number }): DataQualitySource {
  return { name, status: 'partial', message, ...counts };
}

export function unavailableSource(name: string, message: string): DataQualitySource {
  return { name, status: 'unavailable', message };
}

export function qualityFromHttpResponse(name: string, response: Response | null, expectedOk = true): DataQualitySource {
  if (!response) return unavailableSource(name, 'Request did not complete.');
  const complete = expectedOk ? response.ok : !response.ok;
  return complete
    ? completeSource(name)
    : unavailableSource(name, `HTTP ${response.status}`);
}

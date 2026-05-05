const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

export type HubSpotOwner = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  archived?: boolean;
};

export type HubSpotSearchObject = {
  id: string;
  properties: Record<string, string | null>;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
};

export type HubSpotSearchResponse = {
  total: number;
  results: HubSpotSearchObject[];
  paging?: { next?: { after: string } };
};

export function getHubSpotToken() {
  return (
    process.env.HUBSPOT_ACCESS_TOKEN ||
    process.env.HUBSPOT_PRIVATE_APP_TOKEN ||
    process.env.HUBSPOT_API_KEY ||
    ''
  ).trim();
}

export function isHubSpotConfigured() {
  return getHubSpotToken().length > 0;
}

export async function hubSpotRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getHubSpotToken();
  if (!token) {
    throw new Error('HubSpot token is not configured');
  }

  const response = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const body = await response.text();
  const data = body ? JSON.parse(body) : {};

  if (!response.ok) {
    const message = data?.message || data?.error || `${response.status} ${response.statusText}`;
    throw new Error(`HubSpot API error: ${message}`);
  }

  return data as T;
}

export async function listHubSpotOwners(limit = 10) {
  const qs = new URLSearchParams({ limit: String(limit) });
  const data = await hubSpotRequest<{ results: HubSpotOwner[] }>(`/crm/v3/owners/?${qs.toString()}`);
  return data.results || [];
}

export async function searchHubSpotDeals(limit = 10) {
  const body = {
    limit,
    properties: ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate', 'hubspot_owner_id', 'hs_lastmodifieddate'],
    sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
  };

  return hubSpotRequest<HubSpotSearchResponse>('/crm/v3/objects/deals/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

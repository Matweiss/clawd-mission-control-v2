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

// CRM kanban additions —————————————————————————————————————————————————

export type HubSpotPipelineStage = {
  id: string;
  label: string;
  displayOrder: number;
  metadata?: { isClosed?: 'true' | 'false'; probability?: string };
};

export type HubSpotPipeline = {
  id: string;
  label: string;
  displayOrder: number;
  stages: HubSpotPipelineStage[];
};

export async function listDealPipelines() {
  const data = await hubSpotRequest<{ results: HubSpotPipeline[] }>('/crm/v3/pipelines/deals');
  return data.results || [];
}

export async function searchAllOpenDeals(limit = 100) {
  const body = {
    limit,
    properties: [
      'dealname',
      'amount',
      'dealstage',
      'pipeline',
      'closedate',
      'hubspot_owner_id',
      'hs_lastmodifieddate',
      'createdate',
      'description',
      'hs_deal_stage_probability',
    ],
    sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
  };
  return hubSpotRequest<HubSpotSearchResponse>('/crm/v3/objects/deals/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getDealWithAssociations(dealId: string) {
  const qs = new URLSearchParams({
    properties: 'dealname,amount,dealstage,pipeline,closedate,hubspot_owner_id,hs_lastmodifieddate,createdate,description',
    associations: 'contacts,companies',
  });
  return hubSpotRequest<HubSpotSearchObject & {
    associations?: {
      contacts?: { results?: Array<{ id: string }> };
      companies?: { results?: Array<{ id: string }> };
    };
  }>(`/crm/v3/objects/deals/${dealId}?${qs.toString()}`);
}

export async function getContact(contactId: string) {
  const qs = new URLSearchParams({
    properties: 'firstname,lastname,email,phone,jobtitle,company',
  });
  return hubSpotRequest<HubSpotSearchObject>(`/crm/v3/objects/contacts/${contactId}?${qs.toString()}`);
}

export async function getCompany(companyId: string) {
  const qs = new URLSearchParams({
    properties: 'name,domain,industry,city,state',
  });
  return hubSpotRequest<HubSpotSearchObject>(`/crm/v3/objects/companies/${companyId}?${qs.toString()}`);
}

export async function updateDealStage(dealId: string, dealstage: string) {
  return hubSpotRequest<HubSpotSearchObject>(`/crm/v3/objects/deals/${dealId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties: { dealstage } }),
  });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { buildDataQuality, completeSource, unavailableSource } from '../../../lib/data-quality';
import { isHubSpotConfigured, listHubSpotOwners, searchHubSpotDeals } from '../../../lib/hubspot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isHubSpotConfigured()) {
    return res.status(200).json({
      connected: false,
      source: 'HubSpot',
      dataQuality: buildDataQuality({
        sources: [unavailableSource('HubSpot', 'HUBSPOT_ACCESS_TOKEN or HUBSPOT_API_KEY is not configured.')],
      }),
    });
  }

  try {
    const [owners, deals] = await Promise.all([
      listHubSpotOwners(5),
      searchHubSpotDeals(5),
    ]);

    return res.status(200).json({
      connected: true,
      source: 'HubSpot',
      owners: owners.map(owner => ({
        id: owner.id,
        name: [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email || owner.id,
        email: owner.email,
        archived: owner.archived,
      })),
      dealSample: {
        total: deals.total || 0,
        count: deals.results?.length || 0,
        deals: (deals.results || []).map(deal => ({
          id: deal.id,
          name: deal.properties.dealname,
          amount: deal.properties.amount,
          stage: deal.properties.dealstage,
          pipeline: deal.properties.pipeline,
          lastModified: deal.properties.hs_lastmodifieddate,
        })),
      },
      lastChecked: new Date().toISOString(),
      dataQuality: buildDataQuality({
        sources: [completeSource('HubSpot', `Connected; sampled ${deals.results?.length || 0} deals and ${owners.length} owners.`)],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown HubSpot error';
    return res.status(200).json({
      connected: false,
      source: 'HubSpot',
      error: message,
      lastChecked: new Date().toISOString(),
      dataQuality: buildDataQuality({
        sources: [unavailableSource('HubSpot', message)],
      }),
    });
  }
}

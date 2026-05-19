import type { NextApiRequest, NextApiResponse } from 'next';
import {
  isHubSpotConfigured,
  listDealPipelines,
  searchAllOpenDeals,
  type HubSpotPipelineStage,
} from '../../../lib/hubspot';

interface DealCard {
  id: string;
  name: string;
  amount: number | null;
  amountFormatted: string;
  pipelineId: string;
  stageId: string;
  stageLabel: string;
  closeDate: string | null;
  ownerId: string | null;
  lastModified: string | null;
  daysInStage: number | null;
  url: string;
}

interface PipelineColumn {
  id: string;
  label: string;
  isClosed: boolean;
  probability: number | null;
  deals: DealCard[];
  totalValue: number;
}

interface PipelineGroup {
  id: string;
  label: string;
  stages: PipelineColumn[];
}

function formatCurrency(amount: number | null) {
  if (amount == null || !Number.isFinite(amount)) return '—';
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 10_000 ? 0 : 1)}k`;
  return `$${amount.toFixed(0)}`;
}

function daysBetween(from: string | null, to: Date) {
  if (!from) return null;
  const t = new Date(from).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((to.getTime() - t) / 86_400_000));
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (!isHubSpotConfigured()) {
    return res.status(500).json({ error: 'HubSpot env not configured', pipelines: [] });
  }

  try {
    // Filter to the dashboard owner when HUBSPOT_OWNER_ID is set so Mat's
    // kanban only shows deals he owns. Leave unfiltered if the env is absent.
    const ownerId = (process.env.HUBSPOT_OWNER_ID || '').trim() || undefined;

    const [pipelines, dealsResp] = await Promise.all([
      listDealPipelines(),
      searchAllOpenDeals(150, ownerId),
    ]);

    const now = new Date();
    const groups: PipelineGroup[] = pipelines
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p) => ({
        id: p.id,
        label: p.label,
        stages: [...p.stages]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((stage: HubSpotPipelineStage) => ({
            id: stage.id,
            label: stage.label,
            isClosed: stage.metadata?.isClosed === 'true',
            probability:
              typeof stage.metadata?.probability === 'string' && stage.metadata.probability.length
                ? Number(stage.metadata.probability)
                : null,
            deals: [] as DealCard[],
            totalValue: 0,
          })),
      }));

    const stageIndex = new Map<string, { group: PipelineGroup; column: PipelineColumn }>();
    for (const group of groups) {
      for (const column of group.stages) {
        stageIndex.set(`${group.id}::${column.id}`, { group, column });
      }
    }

    for (const deal of dealsResp.results || []) {
      const pipelineId = deal.properties.pipeline ?? '';
      const stageId = deal.properties.dealstage ?? '';
      const target = stageIndex.get(`${pipelineId}::${stageId}`);
      if (!target) continue;
      if (target.column.isClosed) continue; // skip closed-stage deals from the active kanban

      const amount = deal.properties.amount ? Number(deal.properties.amount) : null;
      const card: DealCard = {
        id: deal.id,
        name: deal.properties.dealname || `Deal ${deal.id}`,
        amount: amount != null && Number.isFinite(amount) ? amount : null,
        amountFormatted: formatCurrency(amount),
        pipelineId,
        stageId,
        stageLabel: target.column.label,
        closeDate: deal.properties.closedate || null,
        ownerId: deal.properties.hubspot_owner_id || null,
        lastModified: deal.properties.hs_lastmodifieddate || null,
        daysInStage: daysBetween(deal.properties.hs_lastmodifieddate, now),
        url: `https://app.hubspot.com/contacts/deals/${deal.id}`,
      };
      target.column.deals.push(card);
      if (card.amount) target.column.totalValue += card.amount;
    }

    // Drop pipelines that have no deals across any open stage so the UI stays
    // focused on real ones (some HubSpot accounts have empty test pipelines).
    const visible = groups.filter((g) => g.stages.some((s) => s.deals.length > 0));

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({
      pipelines: visible.length > 0 ? visible : groups,
      meta: {
        totalDeals: (dealsResp.results || []).length,
        fetchedAt: new Date().toISOString(),
        ownerFilter: ownerId || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch CRM deals', detail: err?.message, pipelines: [] });
  }
}

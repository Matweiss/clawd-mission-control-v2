import type { NextApiRequest, NextApiResponse } from 'next';
import { hasShopifyConfig, shopifyAdminRequest } from '../../../lib/shopify';

type ShopifyCustomer = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  orders_count?: number;
  total_spent?: string;
  created_at?: string;
  updated_at?: string;
  email_marketing_consent?: { state?: string };
  tags?: string;
};

type ShopifyOrder = {
  id: number;
  name: string;
  created_at: string;
  total_price: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  line_items?: Array<{ quantity?: number; title?: string }>;
  customer?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
};

type ShopifyProduct = {
  id: number;
  title: string;
  status?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  variants?: Array<{ inventory_quantity?: number }>;
};

const DAY = 24 * 60 * 60 * 1000;

function fullName(customer?: { first_name?: string; last_name?: string; email?: string }) {
  const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(' ').trim();
  return name || customer?.email || 'Unknown customer';
}

function daysAgo(date?: string | null) {
  if (!date) return null;
  const ts = new Date(date).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.floor((Date.now() - ts) / DAY);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasShopifyConfig()) return res.status(500).json({ error: 'Shopify env vars not configured' });

  try {
    const [ordersResp, customersResp, productsResp] = await Promise.all([
      shopifyAdminRequest<{ orders: ShopifyOrder[] }>('/orders.json?status=any&limit=100&order=created_at%20desc'),
      shopifyAdminRequest<{ customers: ShopifyCustomer[] }>('/customers.json?limit=100'),
      shopifyAdminRequest<{ products: ShopifyProduct[] }>('/products.json?limit=100&status=active'),
    ]);

    const orders = ordersResp.orders || [];
    const customers = customersResp.customers || [];
    const products = productsResp.products || [];

    const now = Date.now();
    const last7 = now - 7 * DAY;
    const last30 = now - 30 * DAY;
    const last60 = now - 60 * DAY;

    const revenue7d = orders.filter((o) => new Date(o.created_at).getTime() >= last7).reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0);
    const revenue30d = orders.filter((o) => new Date(o.created_at).getTime() >= last30).reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0);
    const newSubscribers30d = customers.filter((c) => c.email_marketing_consent?.state === 'subscribed' && (new Date(c.created_at || 0).getTime() >= last30)).length;
    const recentProducts = products.filter((p) => new Date(p.created_at || 0).getTime() >= last30);
    const unpublishedProducts = products.filter((p) => !p.published_at).length;
    const lowInventory = products
      .map((p) => ({ ...p, inventory: (p.variants || []).reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) }))
      .filter((p) => p.inventory > 0 && p.inventory <= 2)
      .sort((a, b) => a.inventory - b.inventory);

    const firstTimeBuyers = customers.filter((c) => (c.orders_count || 0) === 1);
    const repeatCollectors = customers.filter((c) => (c.orders_count || 0) >= 2);
    const dormantVip = customers
      .filter((c) => (parseFloat(c.total_spent || '0') >= 1500 || (c.orders_count || 0) >= 3) && (daysAgo(c.updated_at) || 0) >= 45)
      .sort((a, b) => parseFloat(b.total_spent || '0') - parseFloat(a.total_spent || '0'));

    const heroStats = [
      { label: '30d revenue', value: `$${Math.round(revenue30d).toLocaleString()}` },
      { label: 'new subscribers', value: `${newSubscribers30d} in 30d` },
      { label: 'active works', value: `${products.length} live` },
    ];

    const collectorPulse = [
      `${repeatCollectors.length} repeat collectors in the store right now`,
      `${firstTimeBuyers.length} first-time collectors to nurture toward a second purchase`,
      `${dormantVip.length} high-value collectors have gone 45+ days without a fresh touchpoint`,
    ];

    const studioPriorities = [
      lowInventory[0] ? `Low inventory watch: ${lowInventory[0].title} has only ${lowInventory[0].inventory} left` : null,
      unpublishedProducts > 0 ? `${unpublishedProducts} active products are unpublished and worth reviewing` : null,
      recentProducts.length > 0 ? `${recentProducts.length} new works were added in the last 30 days, good candidates for launch framing` : null,
      dormantVip[0] ? `Reconnect with ${fullName(dormantVip[0])}, a high-value collector currently out of the recent touch window` : null,
    ].filter(Boolean);

    const launchRhythm = [
      `${newSubscribers30d} subscribers joined in the last 30 days and can be folded into the next early-access drop`,
      `${orders.filter((o) => new Date(o.created_at).getTime() >= last7).length} orders landed in the last 7 days, a strong signal for fresh collector storytelling`,
      `${recentProducts.length} recently created works can anchor the next newsletter-first launch sequence`,
    ];

    const firstTimeSignals = {
      firstTimeCollectors: firstTimeBuyers.length,
      repeatCollectors: repeatCollectors.length,
      conversionPressure: firstTimeBuyers.filter((c) => (daysAgo(c.updated_at) || 0) >= 14 && (daysAgo(c.updated_at) || 0) <= 60).length,
      strongestSegment: firstTimeBuyers
        .slice()
        .sort((a, b) => parseFloat(b.total_spent || '0') - parseFloat(a.total_spent || '0'))
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          name: fullName(c),
          spent: parseFloat(c.total_spent || '0'),
          daysSinceTouch: daysAgo(c.updated_at),
        })),
      recommendation: firstTimeBuyers.length
        ? `Focus on ${firstTimeBuyers.length} first-time collectors, especially the ones who bought once but have been quiet for 2 to 8 weeks.`
        : 'No first-time collector segment found yet.',
    };

    const inboxFraming = {
      summary: `${orders.filter((o) => new Date(o.created_at).getTime() >= last60).length} orders in the last 60 days means inbox review should prioritize buyers, shortlist requests, and shipping-related reassurance.`,
      cues: [
        dormantVip[0] ? `Give VIP replies from collectors like ${fullName(dormantVip[0])} first-class treatment.` : null,
        firstTimeBuyers.length ? `Watch for first-time buyers replying with fit, scale, or framing questions.` : null,
        recentProducts.length ? `Expect questions around the ${recentProducts.length} most recent product additions.` : null,
      ].filter(Boolean),
    };

    res.status(200).json({
      lastUpdated: new Date().toISOString(),
      heroStats,
      collectorPulse,
      studioPriorities,
      launchRhythm,
      firstTimeSignals,
      inboxFraming,
      metrics: {
        revenue7d,
        revenue30d,
        repeatCollectors: repeatCollectors.length,
        firstTimeCollectors: firstTimeBuyers.length,
        dormantVip: dormantVip.length,
      },
    });
  } catch (error) {
    console.error('Shopify signals API error:', error);
    res.status(500).json({ error: 'Failed to load Shopify signals', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

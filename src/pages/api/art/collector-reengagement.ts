import type { NextApiRequest, NextApiResponse } from 'next';
import { hasShopifyConfig, shopifyAdminRequest } from '../../../lib/shopify';

type Priority = 'high' | 'medium' | 'low';

type ShopifyCustomer = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  orders_count?: number;
  total_spent?: string;
  created_at?: string;
  updated_at?: string;
  tags?: string;
};

type ShopifyOrder = {
  id: number;
  customer?: { id?: number };
  created_at: string;
  total_price: string;
  tags?: string;
};

type RadarCollector = {
  id: number;
  name: string;
  email?: string | null;
  segment: string;
  lifetimeOrders: number;
  lifetimeSpend: number;
  lastPurchaseDate: string | null;
  lastTouchDate?: string | null;
  favoriteThemes?: string[];
  notes?: string;
  reasons?: string[];
  recommendedAction?: string;
  priority: Priority;
  daysSincePurchase: number | null;
  daysSinceTouch: number | null;
  score: number;
};

const MS_DAY = 86400000;

function daysSince(date?: string | null) {
  if (!date) return null;
  const ts = new Date(date).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / MS_DAY));
}

function customerName(customer: ShopifyCustomer) {
  return [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() || customer.email || `Customer ${customer.id}`;
}

function inferSegment(customer: ShopifyCustomer, totalSpent: number) {
  if (totalSpent >= 3000 || (customer.orders_count || 0) >= 5) return 'VIP';
  if ((customer.orders_count || 0) >= 3) return 'Repeat';
  if ((customer.orders_count || 0) === 2) return 'Warm';
  return 'First-time';
}

function inferPriority(days: number | null, totalSpent: number, ordersCount: number): Priority {
  if ((days !== null && days >= 120) || totalSpent >= 3000 || ordersCount >= 5) return 'high';
  if ((days !== null && days >= 60) || ordersCount >= 2) return 'medium';
  return 'low';
}

function inferRecommendedAction(segment: string, days: number | null, totalSpent: number) {
  if (segment === 'VIP') return 'Send a personal first-look note with 2 handpicked pieces before the next public drop.';
  if (segment === 'Repeat') return 'Reach out with a warm check-in and a shortlist tied to prior buying patterns.';
  if (segment === 'Warm') return 'Share a concise shortlist of new work and invite a reply for styling help.';
  if ((days || 0) > 120 || totalSpent > 500) return 'Reconnect with a low-friction personal note and one approachable original.';
  return 'Keep this collector in the monitored queue until the next launch window.';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasShopifyConfig()) {
    return res.status(500).json({ error: 'Shopify env vars not configured' });
  }

  try {
    const [customersResp, ordersResp] = await Promise.all([
      shopifyAdminRequest<{ customers: ShopifyCustomer[] }>('/customers.json?limit=100'),
      shopifyAdminRequest<{ orders: ShopifyOrder[] }>('/orders.json?status=any&limit=250&fields=id,customer,created_at,total_price,tags'),
    ]);

    const customers = customersResp.customers || [];
    const orders = ordersResp.orders || [];

    const customerOrders = new Map<number, ShopifyOrder[]>();
    for (const order of orders) {
      const customerId = order.customer?.id;
      if (!customerId) continue;
      if (!customerOrders.has(customerId)) customerOrders.set(customerId, []);
      customerOrders.get(customerId)!.push(order);
    }

    const collectors: RadarCollector[] = customers
      .map((customer) => {
        const ordersForCustomer = (customerOrders.get(customer.id) || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lifetimeSpend = parseFloat(customer.total_spent || '0');
        const lastPurchaseDate = ordersForCustomer[0]?.created_at || customer.updated_at || null;
        const daysSincePurchase = daysSince(lastPurchaseDate);
        const daysSinceTouch = daysSince(customer.updated_at || null);
        const segment = inferSegment(customer, lifetimeSpend);
        const priority = inferPriority(daysSincePurchase, lifetimeSpend, customer.orders_count || 0);

        const reasons = [
          daysSincePurchase !== null ? `${daysSincePurchase} days since last order` : 'No recent order history loaded',
          `${customer.orders_count || 0} lifetime orders`,
          `$${Math.round(lifetimeSpend).toLocaleString()} lifetime spend`,
        ];

        let score = 0;
        score += priority === 'high' ? 35 : priority === 'medium' ? 20 : 10;
        score += Math.min((customer.orders_count || 0) * 5, 30);
        score += Math.min(Math.floor(lifetimeSpend / 200), 30);
        score += daysSincePurchase ? Math.min(Math.floor(daysSincePurchase / 10), 20) : 0;
        score += daysSinceTouch ? Math.min(Math.floor(daysSinceTouch / 14), 10) : 0;

        return {
          id: customer.id,
          name: customerName(customer),
          email: customer.email || null,
          segment,
          lifetimeOrders: customer.orders_count || 0,
          lifetimeSpend,
          lastPurchaseDate,
          lastTouchDate: customer.updated_at || null,
          favoriteThemes: customer.tags ? customer.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 3) : [],
          notes: customer.tags ? `Tags: ${customer.tags}` : 'No collector notes yet.',
          reasons,
          recommendedAction: inferRecommendedAction(segment, daysSincePurchase, lifetimeSpend),
          priority,
          daysSincePurchase,
          daysSinceTouch,
          score,
        };
      })
      .filter((collector) => collector.lifetimeOrders > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    const totals = {
      totalCollectors: collectors.length,
      highPriority: collectors.filter((c) => c.priority === 'high').length,
      vipAtRisk: collectors.filter((c) => c.segment === 'VIP').length,
      avgDaysSincePurchase: collectors.length
        ? Math.round(collectors.reduce((sum, collector) => sum + (collector.daysSincePurchase || 0), 0) / collectors.length)
        : 0,
    };

    return res.status(200).json({
      lastUpdated: new Date().toISOString(),
      totals,
      collectors,
      topRecommendation: collectors[0]?.recommendedAction || null,
      source: 'Shopify Admin API',
    });
  } catch (error) {
    console.error('Collector re-engagement API error:', error);
    return res.status(500).json({
      error: 'Failed to load collector re-engagement radar',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

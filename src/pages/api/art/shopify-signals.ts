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
  tags?: string;
  line_items?: Array<{ quantity?: number; title?: string; product_id?: number }>;
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
  product_type?: string;
  vendor?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  published_scope?: string;
  handle?: string;
  variants?: Array<{ inventory_quantity?: number }>;
};

type ShopifyCustomCollection = {
  id: number;
  title: string;
  handle?: string;
  updated_at?: string;
};

type ShopifyCollect = {
  product_id: number;
  collection_id: number;
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

function tagList(tags?: string) {
  return (tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
}

function titleCase(text: string) {
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasShopifyConfig()) return res.status(500).json({ error: 'Shopify env vars not configured' });

  try {
    const [ordersResp, customersResp, productsResp, collectionsResp, collectsResp] = await Promise.all([
      shopifyAdminRequest<{ orders: ShopifyOrder[] }>('/orders.json?status=any&limit=100&order=created_at%20desc'),
      shopifyAdminRequest<{ customers: ShopifyCustomer[] }>('/customers.json?limit=100'),
      shopifyAdminRequest<{ products: ShopifyProduct[] }>('/products.json?limit=100&status=active'),
      shopifyAdminRequest<{ custom_collections: ShopifyCustomCollection[] }>('/custom_collections.json?limit=100'),
      shopifyAdminRequest<{ collects: ShopifyCollect[] }>('/collects.json?limit=250'),
    ]);

    const orders = ordersResp.orders || [];
    const customers = customersResp.customers || [];
    const products = productsResp.products || [];
    const collections = collectionsResp.custom_collections || [];
    const collects = collectsResp.collects || [];

    const now = Date.now();
    const last7 = now - 7 * DAY;
    const last30 = now - 30 * DAY;
    const last60 = now - 60 * DAY;

    const collectionMap = new Map(collections.map((collection) => [collection.id, collection]));
    const productCollections = new Map<number, ShopifyCustomCollection[]>();
    for (const collect of collects) {
      const collection = collectionMap.get(collect.collection_id);
      if (!collection) continue;
      if (!productCollections.has(collect.product_id)) productCollections.set(collect.product_id, []);
      productCollections.get(collect.product_id)!.push(collection);
    }

    const enrichedProducts = products.map((product) => {
      const tags = tagList(product.tags);
      const collectionsForProduct = productCollections.get(product.id) || [];
      const inventory = (product.variants || []).reduce((sum, variant) => sum + (variant.inventory_quantity || 0), 0);
      const createdDaysAgo = daysAgo(product.created_at);
      const updatedDaysAgo = daysAgo(product.updated_at);
      const isRecentlyCreated = (createdDaysAgo ?? 9999) <= 30;
      const isFreshlyUpdated = (updatedDaysAgo ?? 9999) <= 14;
      const noveltyScore = (isRecentlyCreated ? 3 : 0) + (isFreshlyUpdated ? 2 : 0) + Math.min(tags.length, 2) + Math.min(collectionsForProduct.length, 2);
      return {
        ...product,
        tags,
        collections: collectionsForProduct,
        inventory,
        createdDaysAgo,
        updatedDaysAgo,
        noveltyScore,
      };
    });

    const revenue7d = orders.filter((o) => new Date(o.created_at).getTime() >= last7).reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0);
    const revenue30d = orders.filter((o) => new Date(o.created_at).getTime() >= last30).reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0);
    const newSubscribers30d = customers.filter((c) => c.email_marketing_consent?.state === 'subscribed' && (new Date(c.created_at || 0).getTime() >= last30)).length;
    const firstTimeBuyers = customers.filter((c) => (c.orders_count || 0) === 1);
    const repeatCollectors = customers.filter((c) => (c.orders_count || 0) >= 2);
    const dormantVip = customers
      .filter((c) => (parseFloat(c.total_spent || '0') >= 1500 || (c.orders_count || 0) >= 3) && (daysAgo(c.updated_at) || 0) >= 45)
      .sort((a, b) => parseFloat(b.total_spent || '0') - parseFloat(a.total_spent || '0'));

    const lowInventory = enrichedProducts.filter((p) => p.inventory > 0 && p.inventory <= 2).sort((a, b) => a.inventory - b.inventory);
    const unpublishedProducts = enrichedProducts.filter((p) => !p.published_at || p.status !== 'active');
    const recentlyCreatedProducts = enrichedProducts.filter((p) => (p.createdDaysAgo ?? 9999) <= 30);
    const recentlyUpdatedProducts = enrichedProducts.filter((p) => (p.updatedDaysAgo ?? 9999) <= 14);
    const launchCandidates = [...enrichedProducts].sort((a, b) => b.noveltyScore - a.noveltyScore).slice(0, 5);

    const dominantTagCounts = new Map<string, number>();
    const dominantCollectionCounts = new Map<string, number>();
    for (const product of enrichedProducts) {
      for (const tag of product.tags) dominantTagCounts.set(tag, (dominantTagCounts.get(tag) || 0) + 1);
      for (const collection of product.collections) dominantCollectionCounts.set(collection.title, (dominantCollectionCounts.get(collection.title) || 0) + 1);
    }

    const topTag = Array.from(dominantTagCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topCollection = Array.from(dominantCollectionCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const heroStats = [
      { label: '30d revenue', value: `$${Math.round(revenue30d).toLocaleString()}` },
      { label: 'new subscribers', value: `${newSubscribers30d} in 30d` },
      { label: 'launch-ready works', value: `${launchCandidates.length} scored` },
    ];

    const collectorPulse = [
      `${repeatCollectors.length} repeat collectors are in the current Shopify base`,
      `${firstTimeBuyers.length} first-time collectors still need a second-purchase path`,
      `${dormantVip.length} high-value collectors have gone 45+ days without a fresh touchpoint`,
      topTag ? `Most common product tag right now: ${titleCase(topTag)}` : `${enrichedProducts.length} live works are shaping the store mix`,
    ];

    const studioPriorities = [
      lowInventory[0] ? `Low inventory watch: ${lowInventory[0].title} has only ${lowInventory[0].inventory} left` : null,
      unpublishedProducts[0] ? `${unpublishedProducts.length} products are unpublished or not active, worth checking before the next drop` : null,
      recentlyCreatedProducts[0] ? `${recentlyCreatedProducts.length} genuinely new works were created in the last 30 days` : null,
      recentlyUpdatedProducts.length > recentlyCreatedProducts.length ? `${recentlyUpdatedProducts.length - recentlyCreatedProducts.length} older works were recently edited, likely catalog maintenance not new art` : null,
      dormantVip[0] ? `Reconnect with ${fullName(dormantVip[0])}, a high-value collector currently outside the recent touch window` : null,
    ].filter(Boolean);

    const launchRhythm = [
      `${newSubscribers30d} subscribers joined in the last 30 days and can feed the next early-access drop`,
      `${orders.filter((o) => new Date(o.created_at).getTime() >= last7).length} orders landed in the last 7 days, a current proof point for launch timing`,
      launchCandidates[0] ? `Top launch candidate: ${launchCandidates[0].title}${launchCandidates[0].collections[0] ? ` in ${launchCandidates[0].collections[0].title}` : ''}` : null,
      topCollection ? `The collection with the strongest current presence is ${topCollection}` : null,
    ].filter(Boolean);

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
          tags: tagList(c.tags).slice(0, 3),
        })),
      recommendation: firstTimeBuyers.length
        ? `Focus on ${firstTimeBuyers.length} first-time collectors, especially the ones who bought once and have been quiet for 2 to 8 weeks.`
        : 'No first-time collector segment found yet.',
    };

    const inboxFraming = {
      summary: `${orders.filter((o) => new Date(o.created_at).getTime() >= last60).length} orders in the last 60 days means inbox review should prioritize buyers, shortlist requests, shipping reassurance, and follow-ups tied to active collections.`,
      cues: [
        dormantVip[0] ? `Give VIP replies from collectors like ${fullName(dormantVip[0])} first-class treatment.` : null,
        firstTimeBuyers.length ? `Watch for first-time buyers replying with fit, scale, or framing questions.` : null,
        topCollection ? `Expect some questions to cluster around ${topCollection}.` : null,
        topTag ? `Use product tag cues like ${titleCase(topTag)} to keep recommendations specific.` : null,
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
      quality: {
        topTag,
        topCollection,
        recentCreatedCount: recentlyCreatedProducts.length,
        recentUpdatedCount: recentlyUpdatedProducts.length,
        launchCandidates: launchCandidates.map((product) => ({
          id: product.id,
          title: product.title,
          noveltyScore: product.noveltyScore,
          tags: product.tags.slice(0, 4),
          collections: product.collections.map((collection) => collection.title),
        })),
      },
    });
  } catch (error) {
    console.error('Shopify signals API error:', error);
    res.status(500).json({ error: 'Failed to load Shopify signals', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

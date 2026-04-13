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
};

type ShopifyOrder = {
  id: number;
  name: string;
  created_at: string;
  total_price: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  line_items?: Array<{ quantity?: number }>;
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
  vendor?: string;
  product_type?: string;
  created_at?: string;
  updated_at?: string;
  variants?: Array<{ inventory_quantity?: number }>;
  images?: Array<{ src?: string }>;
};

function fullName(customer?: { first_name?: string; last_name?: string; email?: string }) {
  const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(' ').trim();
  return name || customer?.email || 'Unknown customer';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasShopifyConfig()) {
    return res.status(500).json({ error: 'Shopify env vars not configured' });
  }

  try {
    const [ordersResp, customersResp, productsResp] = await Promise.all([
      shopifyAdminRequest<{ orders: ShopifyOrder[] }>('/orders.json?status=any&limit=25&order=created_at%20desc'),
      shopifyAdminRequest<{ customers: ShopifyCustomer[] }>('/customers.json?limit=100'),
      shopifyAdminRequest<{ products: ShopifyProduct[] }>('/products.json?limit=25&status=active'),
    ]);

    const orders = ordersResp.orders || [];
    const customers = customersResp.customers || [];
    const products = productsResp.products || [];

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentOrders = orders.filter((order) => new Date(order.created_at).getTime() >= thirtyDaysAgo);
    const weeklyOrders = orders.filter((order) => new Date(order.created_at).getTime() >= sevenDaysAgo);
    const newsletterSubscribers = customers.filter((customer) => customer.email_marketing_consent?.state === 'subscribed');
    const repeatCollectors = customers.filter((customer) => (customer.orders_count || 0) >= 2);
    const vipCollectors = customers.filter((customer) => parseFloat(customer.total_spent || '0') >= 1500 || (customer.orders_count || 0) >= 3);
    const newCollectors30d = customers.filter((customer) => {
      const created = customer.created_at ? new Date(customer.created_at).getTime() : 0;
      return created >= thirtyDaysAgo;
    });
    const lowInventoryProducts = products
      .map((product) => ({
        ...product,
        inventory: (product.variants || []).reduce((sum, variant) => sum + (variant.inventory_quantity || 0), 0),
      }))
      .filter((product) => product.inventory > 0 && product.inventory <= 2)
      .slice(0, 5);

    const topCollectors = [...customers]
      .sort((a, b) => parseFloat(b.total_spent || '0') - parseFloat(a.total_spent || '0'))
      .slice(0, 5)
      .map((customer) => ({
        id: customer.id,
        name: fullName(customer),
        email: customer.email || null,
        ordersCount: customer.orders_count || 0,
        totalSpent: parseFloat(customer.total_spent || '0'),
        lastUpdated: customer.updated_at || null,
      }));

    const recentOrderFeed = orders.slice(0, 6).map((order) => ({
      id: order.id,
      name: order.name,
      createdAt: order.created_at,
      totalPrice: parseFloat(order.total_price || '0'),
      financialStatus: order.financial_status || null,
      fulfillmentStatus: order.fulfillment_status || null,
      customerName: fullName(order.customer),
      itemCount: (order.line_items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
    }));

    const freshProducts = products.slice(0, 6).map((product) => ({
      id: product.id,
      title: product.title,
      status: product.status || 'unknown',
      createdAt: product.created_at || null,
      updatedAt: product.updated_at || null,
      inventory: (product.variants || []).reduce((sum, variant) => sum + (variant.inventory_quantity || 0), 0),
      image: product.images?.[0]?.src || null,
    }));

    return res.status(200).json({
      lastUpdated: new Date().toISOString(),
      metrics: {
        totalCustomers: customers.length,
        newsletterSubscribers: newsletterSubscribers.length,
        repeatCollectors: repeatCollectors.length,
        vipCollectors: vipCollectors.length,
        newCollectors30d: newCollectors30d.length,
        orders30d: recentOrders.length,
        orders7d: weeklyOrders.length,
        revenue30d: recentOrders.reduce((sum, order) => sum + parseFloat(order.total_price || '0'), 0),
        activeProducts: products.length,
        lowInventoryCount: lowInventoryProducts.length,
      },
      topCollectors,
      recentOrders: recentOrderFeed,
      products: freshProducts,
      lowInventoryProducts: lowInventoryProducts.map((product) => ({
        id: product.id,
        title: product.title,
        inventory: product.inventory,
        updatedAt: product.updated_at || null,
      })),
    });
  } catch (error) {
    console.error('Shopify overview API error:', error);
    return res.status(500).json({
      error: 'Failed to load Shopify overview',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import React, { useEffect, useState } from 'react';
import { Package, RefreshCw, ShoppingBag, Users, AlertTriangle, DollarSign } from 'lucide-react';

type OverviewResponse = {
  lastUpdated: string;
  metrics: {
    totalCustomers: number;
    newsletterSubscribers: number;
    repeatCollectors: number;
    vipCollectors: number;
    newCollectors30d: number;
    orders30d: number;
    orders7d: number;
    revenue30d: number;
    activeProducts: number;
    lowInventoryCount: number;
  };
  topCollectors: Array<{
    id: number;
    name: string;
    email: string | null;
    ordersCount: number;
    totalSpent: number;
    lastUpdated: string | null;
  }>;
  recentOrders: Array<{
    id: number;
    name: string;
    createdAt: string;
    totalPrice: number;
    financialStatus: string | null;
    fulfillmentStatus: string | null;
    customerName: string;
    itemCount: number;
  }>;
  products: Array<{
    id: number;
    title: string;
    status: string;
    createdAt: string | null;
    updatedAt: string | null;
    inventory: number;
    image: string | null;
  }>;
  lowInventoryProducts: Array<{
    id: number;
    title: string;
    inventory: number;
    updatedAt: string | null;
  }>;
};

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export function ShopifyOverviewCard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/art/shopify-overview');
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || 'Failed to load Shopify overview');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return (
      <div className="bg-surface border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-red-300">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Shopify unavailable</span>
          </div>
          <button onClick={loadData} className="text-xs bg-surface-light px-2 py-1 rounded">Retry</button>
        </div>
        <p className="text-xs text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-rose-300" />
          <h2 className="text-sm font-semibold text-white">Live Shopify overview</h2>
        </div>
        <button onClick={loadData} className="text-gray-400 hover:text-white" aria-label="Refresh Shopify overview">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loading && !data ? (
          <div className="text-sm text-gray-500">Loading live store data…</div>
        ) : data ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric icon={Users} label="Collectors" value={String(data.metrics.totalCustomers)} sub={`${data.metrics.repeatCollectors} repeat, ${data.metrics.vipCollectors} VIP`} />
              <Metric icon={DollarSign} label="30d revenue" value={currency(data.metrics.revenue30d)} sub={`${data.metrics.orders30d} orders in 30 days`} />
              <Metric icon={Package} label="Active works" value={String(data.metrics.activeProducts)} sub={`${data.metrics.lowInventoryCount} low inventory`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-light p-3">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Top collectors</div>
                <div className="space-y-2">
                  {data.topCollectors.slice(0, 4).map((collector) => (
                    <div key={collector.id} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="text-white">{collector.name}</div>
                        <div className="text-xs text-gray-400">{collector.ordersCount} orders</div>
                      </div>
                      <div className="text-amber-200">{currency(collector.totalSpent)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-light p-3">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Recent orders</div>
                <div className="space-y-2">
                  {data.recentOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white truncate">{order.name} • {order.customerName}</span>
                        <span className="text-emerald-300">{currency(order.totalPrice)}</span>
                      </div>
                      <div className="text-xs text-gray-400">{order.itemCount} items • {new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {data.lowInventoryProducts.length > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <div className="text-xs uppercase tracking-wide text-amber-200 mb-2">Low inventory watch</div>
                <div className="space-y-1">
                  {data.lowInventoryProducts.map((product) => (
                    <div key={product.id} className="text-sm text-white">
                      {product.title} <span className="text-amber-200">({product.inventory} left)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">Updated {new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • Source: Shopify Admin API</div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-light p-3">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}

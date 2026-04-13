const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.SARAH_SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SARAH_SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';

export function hasShopifyConfig() {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_ACCESS_TOKEN);
}

export function getShopifyConfig() {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Missing Shopify config. Expected SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN');
  }

  return {
    storeDomain: SHOPIFY_STORE_DOMAIN,
    accessToken: SHOPIFY_ACCESS_TOKEN,
    apiVersion: SHOPIFY_API_VERSION,
  };
}

export async function shopifyAdminRequest<T = any>(path: string): Promise<T> {
  const { storeDomain, accessToken, apiVersion } = getShopifyConfig();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `https://${storeDomain}/admin/api/${apiVersion}${normalizedPath}`;

  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API ${response.status}: ${text}`);
  }

  return response.json();
}

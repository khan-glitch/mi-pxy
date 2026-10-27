// api/proxy.js

export default async function handler(req, res) {
  // 1. Instantly handle the CORS Preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'apikey, Authorization, Content-Type, Prefer');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  // 2. Set CORS headers for the actual data request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'apikey, Authorization, Content-Type, Prefer');

  // 🔴 REPLACE THESE WITH YOUR ACTUAL SUPABASE DETAILS
  const SUPABASE_URL = 'https://zbdhvfexyjocxqmkobdo.supabase.co';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZGh2ZmV4eWpvY3hxbWtvYmRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDk5MTUyMiwiZXhwIjoyMTA2NTY3NTIyfQ.7bs3iqyYKF_RN7mu3PunN9CtlEFedcKYP0qnEbh_vdw';

  // 3. Parse the incoming path and query string safely
  // req.url will be like "/api/rest/v1/mi_locations?updated_at=gt..."
  const path = req.url.replace(/^\/api/, '') || '/';
  const targetUrl = `${SUPABASE_URL}${path}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': req.headers['prefer'] || '',
      },
      // Only send a body for non-GET requests
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // 4. Send the data back to the browser
    const data = await response.text();
    res.status(response.status).send(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Proxy failed to reach Supabase' });
  }
}

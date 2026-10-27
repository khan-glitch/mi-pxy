export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { return res.status(200).end(); }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const path = req.url.replace(/^\/api/, '');
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  // 1. Photo Upload Endpoint
  if (path === '/photo-upload' && req.method === 'POST') {
    const { base64, filename } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ error: 'Missing data' });
    try {
      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/mi_inventory/${filename}`, {
        method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'x-upsert': 'true' }, body: buffer
      });
      if (!up.ok) return res.status(500).json({ error: await up.text() });
      return res.status(200).json({ success: true, url: `/${filename}` });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // 2. Database Sync Pass-through
  try {
    const response = await fetch(`${SUPABASE_URL}${path}${query}`, {
      method: req.method,
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: req.headers['prefer'] || '' },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) { res.status(500).json({ error: error.message }); }
}

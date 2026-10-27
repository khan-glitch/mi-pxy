export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { return res.status(200).end(); }


  // 🔴 PASTE YOUR KEYS HERE (Replace the strings below)
  const SUPABASE_URL = 'https://zbdhvfexyjocxqmkobdo.supabase.co';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZGh2ZmV4eWpvY3hxbWtvYmRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDk5MTUyMiwiZXhwIjoyMTA2NTY3NTIyfQ.7bs3iqyYKF_RN7mu3PunN9CtlEFedcKYP0qnEbh_vdw';
 const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api/, ''); 
  const search = url.search; 

  // 1. Photo Upload Endpoint
  if (path === '/photo-upload' && req.method === 'POST') {
    const { base64, filename } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ error: 'Missing data' });
    try {
      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/mi_inventory/${filename}`, {
        method: 'POST', 
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'x-upsert': 'true' }, 
        body: buffer
      });
      if (!up.ok) return res.status(500).json({ error: await up.text() });
      return res.status(200).json({ success: true, url: `/${filename}` });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // 2. Database Sync Pass-through
  try {
    const targetUrl = `${SUPABASE_URL}${path}${search}`;
    console.log("Proxying to:", targetUrl); // For Vercel logs

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 
        apikey: SERVICE_KEY, 
        Authorization: `Bearer ${SERVICE_KEY}`, 
        'Content-Type': 'application/json', 
        Prefer: req.headers['prefer'] || '' 
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });
    
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
}

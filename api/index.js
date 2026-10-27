export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  // 1. ALWAYS Set CORS Headers First
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  // 2. Instantly approve the CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🔴 YOUR MASTER INVENTORY SUPABASE URL (No trailing slash)
  const SUPABASE_URL = 'https://zbdhvfexyjocxqmkobdo.supabase.co';
  
  const path = req.url.replace(/^\/api/, '') || '/';

  // --- PHOTO UPLOAD HANDLER ---
  if (path === '/photo-upload' && req.method === 'POST') {
    try {
      const { base64, filename } = req.body || {};
      if (!base64 || !filename) return res.status(400).json({ error: 'Missing data' });

      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/mi_inventory/${filename}`, {
        method: 'POST', 
        headers: { 
          apikey: req.headers['apikey'], 
          Authorization: req.headers['authorization'], 
          'x-upsert': 'true' 
        }, 
        body: buffer
      });
      if (!up.ok) return res.status(500).json({ error: await up.text() });
      return res.status(200).json({ success: true });
    } catch (e) { 
      return res.status(500).json({ error: e.message }); 
    }
  }

  // --- DATABASE PASS-THROUGH ---
  const target = SUPABASE_URL + path;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'apikey': req.headers['apikey'] || '',
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
        'Prefer': req.headers['prefer'] || ''
      },
      body: (req.method !== 'GET' && req.method !== 'HEAD' && req.body)
        ? JSON.stringify(req.body)
        : undefined
    });
    
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ message: "Hello from Vercel Proxy!" });
}
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    // Even if Supabase fails, we return 500 WITH CORS headers
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zbdhvfexyjocxqmkobdo.supabase.co';
  const SERVICE_KEY =
    process.env.SUPABASE_SERVICE_KEY ||
    req.headers['apikey'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
    '';

  const path = req.url.replace(/^\/api/, '') || '/';
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  // ---- MI photo upload ----
  if (path === '/photo-upload') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const { path: filePath, base64, contentType = 'image/jpeg' } = req.body || {};
    if (!filePath || !base64) return res.status(400).json({ error: 'path and base64 required' });
    if (filePath.includes('..') || filePath.startsWith('/')) return res.status(400).json({ error: 'bad path' });
    try {
      const buffer = Buffer.from(base64, 'base64');
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/mi_inventory/${filePath}`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer,
      });
      if (!up.ok) return res.status(up.status).json({ error: await up.text() });
      return res.status(200).json({ success: true, path: filePath, size_bytes: buffer.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ---- safety: only mi_* tables + mi_sync_upsert_batch RPC ----
  if (path.startsWith('/rest/v1/rpc/')) {
    const fn = path.split('/')[4] || '';
    if (fn !== 'mi_sync_upsert_batch') return res.status(403).json({ error: 'rpc not allowed' });
  } else if (path.startsWith('/rest/v1/')) {
    const table = path.split('/')[3] || '';
    if (!table.startsWith('mi_')) return res.status(403).json({ error: 'table not allowed' });
  } else if (!path.startsWith('/storage/v1/')) {
    return res.status(404).json({ error: 'unknown route' });
  }

  // ---- passthrough ----
  const target = `${SUPABASE_URL}${path}${query}`;
  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' && req.body
      ? JSON.stringify(req.body)
      : undefined;

    const response = await fetch(target, {
      method: req.method,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: req.headers['prefer'] || '',
      },
      body,
    });

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

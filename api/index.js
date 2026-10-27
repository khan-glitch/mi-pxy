export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  // 1. Set CORS headers FIRST so they apply even if fetch fails
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'apikey, authorization, content-type, prefer, x-client-info, accept-profile, content-profile');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  // 2. Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = 'https://zbdhvfexyjocxqmkobdo.supabase.co';
  
  // 3. Safely parse the path. Keep query params intact.
  const path = req.url.replace(/^\/api/, '') || '/';
  const target = SUPABASE_URL + path;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'apikey': req.headers['apikey'] || '',
        'Authorization': req.headers['authorization'] || '',
        // Forward exact content-type, don't hardcode it
        'Content-Type': req.headers['content-type'] || 'application/json',
        // Forward Prefer exactly, don't default to ''
        'Prefer': req.headers['prefer'] || ''
      },
      // Prevent JSON.stringify if body is already a string
      body: (req.method !== 'GET' && req.method !== 'HEAD' && req.body)
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined
    });
    
    const buffer = await response.arrayBuffer();
    res.status(response.status);
    
    // 4. THE CRITICAL FIX: Copy response headers EXCEPT encoding
    response.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      if (lk !== 'content-encoding' && lk !== 'content-length' && lk !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}

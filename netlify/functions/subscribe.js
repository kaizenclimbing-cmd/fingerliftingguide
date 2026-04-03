const SEGMENT_MAP = {
  'qanda':      '69cff52042e769bc46485641',
  'hangboard':  '69cff521484beb8c25542f34',
  'underrated': '69cff522ab25a9605b04fa51',
  'instantly':  '69cff524f472154c8a26682a',
  'colombia':   '69cff525ab25a9605b04fa53',
  'instagram':  '69cff526484beb8c25542f36',
  'youtube':    '69cff527f472154c8a26682b',
};
const MAIN_SEGMENT = '69cff51ff472154c8a266828'; // FLG

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, attributes } = JSON.parse(event.body);
  const slug = (attributes && attributes.UTM_CONTENT) || '';

  const [flodeskResult, supabaseResult] = await Promise.allSettled([
    // Flodesk
    (async () => {
      const segmentIds = [MAIN_SEGMENT];
      if (SEGMENT_MAP[slug]) segmentIds.push(SEGMENT_MAP[slug]);
      const creds = Buffer.from(`${process.env.FLODESK_API_KEY}:`).toString('base64');
      return fetch('https://api.flodesk.com/v1/subscribers', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, segment_ids: segmentIds }),
      });
    })(),

    // Supabase
    fetch(`${process.env.SUPABASE_URL}/rest/v1/flg_signups`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ email, slug: slug || null }),
    }),
  ]);

  const flodeskOk = flodeskResult.status === 'fulfilled' && [200, 201].includes(flodeskResult.value.status);
  const supabaseOk = supabaseResult.status === 'fulfilled' && supabaseResult.value.status === 201;

  if (flodeskOk || supabaseOk) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } else {
    return { statusCode: 500, body: JSON.stringify({ error: 'All platforms failed' }) };
  }
};

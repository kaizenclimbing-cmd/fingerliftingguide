const FLODESK_SEGMENT_MAP = {
  'qanda':      '69cff52042e769bc46485641',
  'hangboard':  '69cff521484beb8c25542f34',
  'underrated': '69cff522ab25a9605b04fa51',
  'instantly':  '69cff524f472154c8a26682a',
  'colombia':   '69cff525ab25a9605b04fa53',
  'instagram':  '69cff526484beb8c25542f36',
  'youtube':    '69cff527f472154c8a26682b',
};
const FLODESK_MAIN_SEGMENT = '69cff51ff472154c8a266828'; // FLG

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, listIds, attributes } = JSON.parse(event.body);
  const slug = (attributes && attributes.UTM_CONTENT) || '';

  // Run both API calls in parallel
  const [brevoResult, flodeskResult] = await Promise.allSettled([
    // Brevo
    fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, listIds, updateEnabled: true, attributes }),
    }),

    // Flodesk
    (async () => {
      const segmentIds = [FLODESK_MAIN_SEGMENT];
      if (FLODESK_SEGMENT_MAP[slug]) segmentIds.push(FLODESK_SEGMENT_MAP[slug]);

      const creds = Buffer.from(`${process.env.FLODESK_API_KEY}:`).toString('base64');
      return fetch('https://api.flodesk.com/v1/subscribers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, segment_ids: segmentIds }),
      });
    })(),
  ]);

  const brevoOk = brevoResult.status === 'fulfilled' && [200, 201, 204].includes(brevoResult.value.status);
  const flodeskOk = flodeskResult.status === 'fulfilled' && [200, 201].includes(flodeskResult.value.status);

  if (brevoOk || flodeskOk) {
    return { statusCode: 200, body: JSON.stringify({ success: true, brevo: brevoOk, flodesk: flodeskOk }) };
  } else {
    return { statusCode: 500, body: JSON.stringify({ error: 'Both platforms failed' }) };
  }
};

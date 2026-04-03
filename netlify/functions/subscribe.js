exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, listIds, attributes } = JSON.parse(event.body);

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, listIds, updateEnabled: true, attributes }),
  });

  const status = res.status;
  if (status === 200 || status === 201 || status === 204) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } else {
    const text = await res.text();
    return { statusCode: 500, body: JSON.stringify({ error: text }) };
  }
};

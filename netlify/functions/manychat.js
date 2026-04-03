// ManyChat → Brevo webhook
// In ManyChat: add an "External Request" action, point it at:
// https://fingerliftingguide.kaizenclimbing.com/.netlify/functions/manychat
//
// Set method: POST, Content-Type: application/json
// Body: { "email": "{{user_email}}", "first_name": "{{first name}}", "last_name": "{{last name}}" }

const MAIN_LIST_ID = 5;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const email = data.email || data.Email || data.EMAIL;

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No email provided' }) };
    }

    const contact = {
      email,
      listIds: [MAIN_LIST_ID],
      updateEnabled: true,
      attributes: { SOURCE: 'manychat' },
    };

    if (data.first_name) contact.attributes.FIRSTNAME = data.first_name;
    if (data.last_name)  contact.attributes.LASTNAME  = data.last_name;

    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    const status = res.status;
    if (status === 200 || status === 201 || status === 204) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      const text = await res.text();
      return { statusCode: 500, body: JSON.stringify({ error: text }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

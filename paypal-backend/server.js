const express = require('express');
const fetch = require('node-fetch'); // node-fetch@2 installed
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // sandbox endpoint

async function generateAccessToken() {
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  console.log('Access Token Response:', data);
  if (!data.access_token) {
    throw new Error('No access token from PayPal');
  }
  return data.access_token;
}

async function createOrder(accessToken, price) {
  // Ensure price is a string representing a number
  const priceStr = String(price); 
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: priceStr
        }
      }],
      application_context: {
        return_url: 'https://your-server.com/success', 
        cancel_url: 'https://your-server.com/cancel'
      }
    })
  });

  const order = await response.json();
  console.log('Create Order Response:', JSON.stringify(order, null, 2));
  return order;
}

app.post('/create-order', async (req, res) => {
  const { price } = req.body;
  console.log('Received create-order request with price:', price);

  if (!price) {
    console.log('No price provided');
    return res.status(400).json({ error: 'Price is required' });
  }

  try {
    const accessToken = await generateAccessToken();
    console.log('Access Token Acquired:', accessToken);

    const order = await createOrder(accessToken, price);
    const approveLink = order.links?.find(link => link.rel === 'approve')?.href;
    if (!approveLink) {
      console.error('No approve link found in PayPal order response');
      return res.status(500).json({ error: 'No approve link found' });
    }

    console.log('Approve Link:', approveLink);
    res.json({ approveLink });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

app.listen(3002, () => console.log("PayPal backend server running on port 3002"));
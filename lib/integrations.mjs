import { GoogleAuth } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { money } from './catalog.mjs';

// The user's order tab has a title and subtitle above its header row. Keep its
// visual layout and map the app's data to the existing A:R columns.
export const HEADERS = [
  'Order ID',
  'Date & Time (Nepal)',
  'Customer Name',
  'Phone Number',
  'Email Address',
  'Exact Location',
  'Product Name / Options',
  'Quantity',
  'Price Per Piece (NPR)',
  'Total Price (NPR)',
  'Payment Method',
  'Order Status',
  'Notes',
  'Subtotal (NPR)',
  'Delivery (NPR)',
  'Delivery Area',
  'Business Email',
  'Customer Email',
  'Request Fingerprint',
];

export function findHeaderRow(rows) {
  return rows.findIndex((row) => HEADERS.every((header, index) => row[index] === header));
}

export function findSavedOrder(rows, id) {
  const headerRow = findHeaderRow(rows);
  if (headerRow < 0) throw new Error('Spreadsheet columns do not match the SastoKinBech Orders layout.');
  const index = rows.findIndex((row, rowIndex) => rowIndex > headerRow && row[0] === id);
  if (index < 0) return null;
  return {
    id,
    row: index + 1,
    fingerprint: rows[index][18],
    businessSent: ['yes', 'sent'].includes(String(rows[index][16] || '').trim().toLowerCase()),
    customerSent: ['yes', 'sent'].includes(String(rows[index][17] || '').trim().toLowerCase()),
  };
}

export function checkConfig() {
  const names = [
    'GOOGLE_SHEET_ID', 'GOOGLE_SHEET_TAB_NAME', 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY', 'BUSINESS_EMAIL', 'EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT',
    'SMTP_USER', 'SMTP_PASS',
  ];
  if (names.some((name) => !process.env[name])) {
    throw new Error('Order service is not configured yet. Please contact support or enable explicit local demo mode.');
  }
  if (![465, 587].includes(Number(process.env.SMTP_PORT))) {
    throw new Error('SMTP_PORT must be 465 or 587.');
  }
}

export function integrations() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheet = `'${process.env.GOOGLE_SHEET_TAB_NAME.replace(/'/g, "''")}'`;
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(process.env.GOOGLE_SHEET_ID)}/values/`;

  async function request(range, method = 'GET', data, query = '') {
    const client = await auth.getClient();
    const response = await client.request({
      url: `${base}${encodeURIComponent(range)}${query}`,
      method,
      data,
      timeout: 15000,
    });
    return response.data;
  }

  const store = {
    async find(id) {
      const response = await request(`${sheet}!A:S`);
      const rows = response.values || [];
      if (rows.length === 0) throw new Error('Create the order header row first.');
      return findSavedOrder(rows, id);
    },

    async save(order) {
      const dateSerial = (Date.parse(order.date) + 20700000) / 86400000 + 25569;
      const productAndOptions = order.preferences
        ? `${order.productName} / ${order.preferences}`
        : order.productName;
      const response = await request(`${sheet}!A:S`, 'POST', {
        values: [[
          order.id,
          dateSerial,
          order.name,
          order.phone,
          order.email,
          order.location,
          productAndOptions,
          order.quantity,
          order.price,
          order.total,
          order.payment,
          order.status,
          '',
          order.price * order.quantity,
          order.delivery,
          order.region === 'inside' ? 'Inside Kathmandu Valley' : 'Outside Kathmandu Valley',
          'Pending',
          'Pending',
          order.fingerprint,
        ]],
      }, ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS');
      const row = Number(response.updates.updatedRange.match(/![A-Z]+(\d+)/)[1]);
      return { id: order.id, row, fingerprint: order.fingerprint, businessSent: false, customerSent: false };
    },

    async mark(saved, field) {
      const current = await store.find(saved.id);
      if (!current) throw new Error('Saved order could not be located.');
      const column = field === 'businessSent' ? 'Q' : 'R';
      await request(`${sheet}!${column}${current.row}`, 'PUT', { values: [['Sent']] }, '?valueInputOption=RAW');
    },
  };

  const smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    requireTLS: Number(process.env.SMTP_PORT) === 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  const brand = process.env.BRAND_NAME || 'SastoKinBech';
  const reply = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);

  function template(order, business) {
    const rows = [
      ['Order ID', order.id],
      ['Date & Time', new Date(order.date).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' })],
      ...(business ? [
        ['Customer', order.name], ['Phone', order.phone], ['Email', order.email],
        ['Exact location', order.location], ['Preferences', order.preferences || 'Not specified'],
        ['Delivery area', order.region === 'inside' ? 'Inside Kathmandu Valley' : 'Outside Kathmandu Valley'],
      ] : []),
      ['Product', order.productName], ['Quantity', order.quantity],
      ['Price per piece', money(order.price)], ['Delivery', money(order.delivery)],
      ['Total price', money(order.total)], ['Payment method', order.payment],
    ];
    return '<!doctype html><html><body style="margin:0;background:#f8f5ee;font-family:Arial,sans-serif;color:#243a32"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff"><tr><td style="padding:28px;background:#183d32;color:white;font-size:24px">'
      + escape(brand)
      + '</td></tr><tr><td style="padding:28px"><h1 style="font-size:26px">'
      + (business ? 'New order received' : 'Thank you for your order!')
      + '</h1><p>Hi ' + escape(business ? 'team' : order.name)
      + ',</p><p>We have received ' + (business ? 'a new order' : 'your order successfully')
      + '.</p><span style="background:#e9eddf;padding:8px 12px;font-size:12px">New Order</span><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">'
      + rows.map(([key, value]) => '<tr><td style="padding:10px 5px;border-bottom:1px solid #eee;font-size:13px">'
        + escape(key) + '</td><td align="right" style="padding:10px 5px;border-bottom:1px solid #eee;font-size:13px;word-break:break-word">'
        + escape(value) + '</td></tr>').join('')
      + '</table><p style="background:#e9eddf;padding:18px">'
      + (business ? 'Please call the customer soon to confirm this order.' : 'Our sales representative will call you soon to confirm your order.')
      + '</p><p>Questions? Reply to ' + escape(reply) + '.</p><p>Thank you,<br/>' + escape(brand)
      + '</p></td></tr></table></td></tr></table></body></html>';
  }

  async function send(order, business) {
    await smtp.sendMail({
      from: { name: brand, address: process.env.EMAIL_FROM },
      replyTo: reply,
      to: business ? process.env.BUSINESS_EMAIL : order.email,
      subject: business ? `New Product Order Received - ${order.id}` : `Your Order Has Been Received - ${brand}`,
      html: template(order, business),
      text: `Order ${order.id} received. ${order.productName} × ${order.quantity}. Total: ${money(order.total)}. Cash On Delivery. Our sales representative will call you soon to confirm your order.`,
      messageId: `<${order.id}.${business ? 'business' : 'customer'}@sastokinbech.local>`,
    });
  }

  return { store, mailer: { business: (order) => send(order, true), customer: (order) => send(order, false) } };
}

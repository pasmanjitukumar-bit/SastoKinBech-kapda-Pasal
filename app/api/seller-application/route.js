import { checkEmailConfig, integrations } from '../../../lib/integrations.mjs';
import { SellerApplicationError, validateSellerApplication } from '../../../lib/seller.mjs';

export const runtime = 'nodejs';
export const maxDuration = 30;

const attempts = new Map();

function checkOrigin(request) {
  const origin = request.headers.get('origin');
  const allowed = process.env.FRONTEND_URL || new URL(request.url).origin;
  if (origin && origin !== new URL(allowed).origin) {
    throw new SellerApplicationError('This origin is not allowed.', 403);
  }
}

function rateLimit(request) {
  const now = Date.now();
  for (const [ip, entry] of attempts) if (entry.expires < now) attempts.delete(ip);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const entry = attempts.get(ip);
  if (entry && entry.count >= 4 && entry.expires > now) {
    throw new SellerApplicationError('Please wait a little before sending another application.', 429);
  }
  attempts.set(ip, { count: (entry?.count || 0) + 1, expires: now + 60 * 60 * 1000 });
}

export async function POST(request) {
  try {
    checkOrigin(request);
    rateLimit(request);
    const raw = await request.text();
    if (raw.length > 8192) throw new SellerApplicationError('The application is too large.', 413);
    const form = new URLSearchParams(raw);
    const application = validateSellerApplication(Object.fromEntries(form));
    checkEmailConfig();
    const { mailer } = integrations();
    await mailer.sellerApplication(application);
    return new Response(null, { status: 303, headers: { Location: '/sell/thanks' } });
  } catch (error) {
    const known = error instanceof SellerApplicationError;
    console.error('Seller application failed:', known ? error.message : error.name);
    const message = known ? error.message : error.message.startsWith('Email service')
      ? 'Seller applications are not configured yet. Please email pasmanjitukumar@gmail.com.'
      : 'We could not send your application. Please email pasmanjitukumar@gmail.com.';
    return new Response(null, { status: 303, headers: { Location: `/sell?error=${encodeURIComponent(message)}` } });
  }
}

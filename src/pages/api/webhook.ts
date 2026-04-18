import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY,
  ARTIST_EMAIL,
} from 'astro:env/server';
import { formatOrderEmail } from '../../lib/server/formatOrderEmail';

export const prerender = false;

/* ——— Constants ——— */

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/* ——— Endpoint ——— */

export const POST: APIRoute = async ({ request, locals }) => {
  /*
   * 1. Read the raw body and verify the Stripe signature.
   *    The raw body must be used for verification — parsing first
   *    then re-stringifying would break the signature check.
   */
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response('Webhook signature verification failed', {
      status: 400,
    });
  }

  /*
   * 2. Idempotency — check if this event was already processed.
   *    Stripe retries on failure (up to ~3 days). KV entries have
   *    a 7-day TTL, so they auto-clean after the retry window closes.
   */
  const kv = locals?.env?.KV ?? (locals as any)?.KV;
  const idempotencyKey = `webhook:${event.id}`;
  const alreadyProcessed = kv ? await kv.get(idempotencyKey) : null;

  if (alreadyProcessed) {
    return new Response('Already processed', { status: 200 });
  }

  /*
   * 3. Handle the checkout.session.completed event.
   */
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    /*
     * 3a. Fetch line items — they are NOT included in the webhook event.
     *     This is a separate API call that many tutorials skip.
     */
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    /*
     * 3b. Build the email data from the session and line items.
     */
    const emailData = {
      lineItems: lineItems.data.map((item) => ({
        description: item.description ?? 'Unknown item',
        quantity: item.quantity ?? 1,
        amount_total: item.amount_total ?? 0,
      })),
      orderMetadata: session.metadata?.order_items ?? 'See line items above',
      amountTotal: session.amount_total ?? 0,
      shippingName: session.collected_information?.shipping_details?.name ?? null,
      shippingAddress: session.collected_information?.shipping_details?.address ?? null,
      customerEmail: session.customer_details?.email ?? null,
    };

    /*
     * 3c. Send notification email to artist via Resend.
     *     Raw fetch — no SDK needed for a single POST request.
     */
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'orders@monochrome-photography.com',
        to: ARTIST_EMAIL,
        subject: `New order — £${(session.amount_total ?? 0) / 100}`,
        text: formatOrderEmail(emailData),
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      console.error('Resend email failed:', emailResponse.status, errorBody);
      /*
       * Return 500 so Stripe retries the webhook.
       * We haven't stored the idempotency key yet, so the retry
       * will attempt the email again.
       */
      return new Response('Email delivery failed', { status: 500 });
    }

    /*
     * 3d. Mark as processed AFTER the email succeeds.
     *     If the email fails, we return 500 above and Stripe retries.
     *     Only once the email is confirmed sent do we write to KV.
     */
    if (kv) {
      await kv.put(idempotencyKey, 'true', {
        expirationTtl: IDEMPOTENCY_TTL_SECONDS,
      });
    } else {
      console.warn('KV binding not available; skipping webhook idempotency tracking.');
    }
  }

  /*
   * 4. Always return 200 for event types we don't handle.
   *    Returning non-200 would cause Stripe to retry events we'll never process.
   */
  return new Response('OK', { status: 200 });
};
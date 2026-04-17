import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, SITE_URL } from 'astro:env/server';
import {
  STRIPE_PRICE_MAP,
  ALLOWED_SIZE_IDS,
  type SizeId,
} from '../../lib/server/stripePrices';
import { SHIPPING_COUNTRIES } from '../../lib/server/shippingCountires';

export const prerender = false;

/* ——— Constants ——— */

const MAX_QUANTITY_PER_ITEM = 5;
const MAX_CART_ITEMS = 10;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;

/* ——— Response helpers ——— */

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

/* ——— Validation ——— */

interface CartItem {
  productSlug: string;
  sizeId: string;
  quantity: number;
}

function validateCartItem(item: unknown): item is CartItem {
  if (typeof item !== 'object' || item === null) return false;

  const { productSlug, sizeId, quantity } = item as Record<string, unknown>;

  if (typeof productSlug !== 'string') return false;
  if (typeof sizeId !== 'string') return false;
  if (typeof quantity !== 'number') return false;

  return true;
}

/* ——— Endpoint ——— */

export const POST: APIRoute = async ({ request }) => {
  /*
   * 1. CSRF — reject requests originating from other domains.
   */
  const origin = request.headers.get('Origin');

  if (origin !== SITE_URL) {
    return errorResponse('Forbidden', 403);
  }

  /*
   * 2. Parse the request body.
   */
  let body: { items?: unknown };

  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const { items } = body;

  /*
   * 3. Validate the cart items array.
   */
  if (!Array.isArray(items) || items.length === 0) {
    return errorResponse('Cart is empty', 400);
  }

  if (items.length > MAX_CART_ITEMS) {
    return errorResponse(`Cart exceeds ${MAX_CART_ITEMS} items`, 400);
  }

  /*
   * 4. Validate each individual item.
   *    Shape check → sizeId → quantity → slug format.
   */
  for (const item of items) {
    if (!validateCartItem(item)) {
      return errorResponse('Malformed cart item', 400);
    }

    if (!ALLOWED_SIZE_IDS.includes(item.sizeId as SizeId)) {
      return errorResponse(`Invalid size: ${item.sizeId}`, 400);
    }

    const quantity = item.quantity;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
      return errorResponse(
        `Quantity must be 1–${MAX_QUANTITY_PER_ITEM}`,
        400,
      );
    }

    const slug = item.productSlug;
    if (!SLUG_PATTERN.test(slug) || slug.length > MAX_SLUG_LENGTH) {
      return errorResponse('Invalid product identifier', 400);
    }
  }

  /*
   * 5. Build Stripe line items.
   *    Price is derived server-side from sizeId — never from client data.
   */
  const validatedItems = items as CartItem[];

  const lineItems = validatedItems.map((item) => ({
    price: STRIPE_PRICE_MAP[item.sizeId as SizeId],
    quantity: item.quantity,
  }));

  /*
   * 6. Build metadata so the webhook knows which prints were ordered.
   *    Stripe caps metadata values at 500 characters.
   */
  const orderDescription = validatedItems
    .map((item) => `${item.productSlug} (${item.sizeId}) x${item.quantity}`)
    .join(', ')
    .slice(0, 500);

  /*
   * 7. Create the Stripe Checkout Session.
   */
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      metadata: {
        order_items: orderDescription,
      },
      shipping_address_collection: {
        allowed_countries: [...SHIPPING_COUNTRIES],
      },
      success_url: `${SITE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/order/cancelled`,
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation failed:', error);
    return errorResponse('Checkout session failed — please try again', 500);
  }
};
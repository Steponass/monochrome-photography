import { persistentJSON } from '@nanostores/persistent';
import { atom } from 'nanostores';

/**
 * Cart store — business logic for the shopping cart.
 *
 * Uses @nanostores/persistent to auto-sync with localStorage.
 * Cart survives browser close. Cross-tab sync is automatic.
 *
 * The store holds a plain object where:
 *   - Key: `${productSlug}-${sizeId}`
 *   - Value: cart item object
 *
 * Price is stored for display only — the server derives actual charges
 * from sizeId, never from client-supplied prices.
 */

const STORAGE_KEY = 'monochrome-cart';
const MAX_QUANTITY_PER_ITEM = 5;

export const cartItems = persistentJSON(STORAGE_KEY, {});

export const isCartOpen = atom(false);

export function openCart() {
  isCartOpen.set(true);
}

export function closeCart() {
  isCartOpen.set(false);
}

/* ——— Helpers ——— */

/**
 * Build the map key for a cart item.
 * Same product in different sizes = different cart entries.
 */
function buildCartKey(productSlug, sizeId) {
  return `${productSlug}-${sizeId}`;
}

/* ——— Cart operations ——— */

/**
 * Add an item to the cart.
 *
 * @param {Object} product - The product to add
 * @param {string} product.slug - Product slug
 * @param {string} product.title - Product title (display only)
 * @param {string} product.sizeId - Size tier ID ('small', 'medium', 'large')
 * @param {string} product.sizeLabel - Human-readable dimensions (display only)
 * @param {number} product.price - Display price (NOT sent to server)
 */
export function addItemToCart({ slug, title, sizeId, sizeLabel, price }) {
  const key = buildCartKey(slug, sizeId);
  const currentItems = cartItems.get();
  const existing = currentItems[key];

  if (existing) {
    const newQuantity = Math.min(existing.quantity + 1, MAX_QUANTITY_PER_ITEM);
    cartItems.set({
      ...currentItems,
      [key]: { ...existing, quantity: newQuantity },
    });
  } else {
    cartItems.set({
      ...currentItems,
      [key]: {
        productSlug: slug,
        title,
        sizeId,
        sizeLabel,
        price,
        quantity: 1,
      },
    });
  }
}

/**
 * Remove one unit of an item. Removes the entry entirely if quantity hits 0.
 */
export function decrementItem(productSlug, sizeId) {
  const key = buildCartKey(productSlug, sizeId);
  const currentItems = cartItems.get();
  const existing = currentItems[key];

  if (!existing) return;

  if (existing.quantity <= 1) {
    removeItem(productSlug, sizeId);
  } else {
    cartItems.set({
      ...currentItems,
      [key]: { ...existing, quantity: existing.quantity - 1 },
    });
  }
}

/**
 * Remove an item from the cart entirely, regardless of quantity.
 */
export function removeItem(productSlug, sizeId) {
  const key = buildCartKey(productSlug, sizeId);
  const { [key]: _removed, ...remainingItems } = cartItems.get();
  cartItems.set(remainingItems);
}

/**
 * Clear the entire cart.
 */
export function clearCart() {
  cartItems.set({});
}

/**
 * Get the total number of individual items in the cart.
 * Used by CartIcon for the badge count.
 */
export function getCartItemCount(items) {
  return Object.values(items).reduce(
    (total, item) => total + item.quantity,
    0
  );
}

/**
 * Get the display total price.
 * This is for UI only — the server calculates the real charge.
 */
export function getCartDisplayTotal(items) {
  return Object.values(items).reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

/**
 * Build the payload the checkout endpoint expects.
 * Strips display-only fields — sends only what the server needs.
 */
function buildCheckoutPayload(currentItems) {
  return Object.values(currentItems).map((item) => ({
    productSlug: item.productSlug,
    sizeId: item.sizeId,
    quantity: item.quantity,
  }));
}

/**
 * POST cart contents to the checkout endpoint.
 * Returns the Stripe Checkout URL on success.
 * Throws an Error with a user-facing message on failure.
 */
export async function createCheckoutSession() {
  const currentItems = cartItems.get();
  const payload = buildCheckoutPayload(currentItems);

  if (payload.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: payload }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }

  return data.url;
}
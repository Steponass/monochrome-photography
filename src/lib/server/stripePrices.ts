/**
 * Server-only.
 *
 * Maps internal sizeId → Stripe Price ID.
 * These are TEST MODE IDs. Live mode IDs will replace them at launch.
 */
export const STRIPE_PRICE_MAP = {
  small:  'price_1TNBdhE1PQnOKuXx8KE4jFeI',
  medium: 'price_1TNBesE1PQnOKuXxIWuXngPz',
  large:  'price_1TNBg1E1PQnOKuXxRAc7Hoo5',
} as const;

export type SizeId = keyof typeof STRIPE_PRICE_MAP;
export const ALLOWED_SIZE_IDS = Object.keys(STRIPE_PRICE_MAP) as SizeId[];
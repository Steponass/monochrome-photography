/**
 * Size tiers for print products.
 * Each tier has two dimension variants based on the photo's aspect ratio.
 *
 * Prices are display-only on the client.
 * Stripe Price IDs live server-side only (Phase 4).
 */
export const SIZE_TIERS = [
  {
    id: 'small',
    price: 600,
    dimensions: {
      '3:2': '45.0 × 30.0 cm',
      '4:3': '50.0 × 37.5 cm',
    },
  },
  {
    id: 'medium',
    price: 650,
    dimensions: {
      '3:2': '60.0 × 40.0 cm',
      '4:3': '60.0 × 45.0 cm',
    },
  },
  {
    id: 'large',
    price: 700,
    dimensions: {
      '3:2': '75.0 × 50.0 cm',
      '4:3': '70.0 × 52.5 cm',
    },
  },
];
/**
 * ISO 3166-1 alpha-2 codes for Stripe shipping address collection.
 * Stripe requires an explicit list — no wildcard option exists.
 *
 * Excluded: sanctioned territories, countries with severe postal
 * infrastructure limitations. Review and adjust before launch.
 */
export const SHIPPING_COUNTRIES = [
  // Europe
  'GB', 'DE', 'FR', 'NL', 'BE', 'AT', 'IT', 'ES', 'PT', 'IE',
  'DK', 'SE', 'NO', 'FI', 'CH', 'PL', 'CZ', 'RO', 'HU', 'HR',
  'BG', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY', 'GR',
  'IS',

  // North America
  'US', 'CA', 'MX',

  // Asia-Pacific
  'JP', 'KR', 'AU', 'NZ', 'SG', 'HK', 'TW', 'TH', 'MY', 'ID',
  'PH', 'IN',

  // Middle East
  'AE', 'IL', 'QA', 'BH', 'KW', 'OM', 'SA',

  // South America
  'BR', 'CL', 'CO', 'AR', 'PE', 'UY',

  // Africa
  'ZA', 'NG', 'KE', 'MA', 'EG',
] as const;
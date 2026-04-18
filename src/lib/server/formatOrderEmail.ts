interface LineItem {
  description: string;
  quantity: number;
  amount_total: number;
}

interface ShippingAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface OrderEmailData {
  lineItems: LineItem[];
  orderMetadata: string;
  amountTotal: number;
  shippingName: string | null;
  shippingAddress: ShippingAddress | null;
  customerEmail: string | null;
}

export function formatOrderEmail(data: OrderEmailData): string {
  const {
    lineItems,
    orderMetadata,
    amountTotal,
    shippingName,
    shippingAddress,
    customerEmail,
  } = data;

  const itemsList = lineItems
    .map(
      (item) =>
        `  ${item.description} × ${item.quantity} — £${item.amount_total / 100}`,
    )
    .join('\n');

  const formattedAddress = shippingAddress
    ? [
        shippingAddress.line1,
        shippingAddress.line2,
        `${shippingAddress.city}, ${shippingAddress.postal_code}`,
        shippingAddress.country,
      ]
        .filter(Boolean)
        .join('\n  ')
    : 'No shipping address provided';

  const lines = [
    'New order received!',
    '',
    'Items:',
    itemsList,
    '',
    `Prints ordered: ${orderMetadata}`,
    '',
    `Total: £${amountTotal / 100}`,
    '',
    'Ship to:',
    `  ${shippingName ?? 'No name provided'}`,
    `  ${formattedAddress}`,
    '',
    `Customer email: ${customerEmail ?? 'Not provided'}`,
  ];

  return lines.join('\n');
}
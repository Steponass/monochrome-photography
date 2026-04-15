<script>
  import {
    cartItems,
    isCartOpen,
    closeCart,
    removeItem,
    decrementItem,
    addItemToCart,
    getCartItemCount,
    getCartDisplayTotal,
  } from '../stores/cartStore.js';

  let dialog = $state(null);

  const items = $derived(Object.values($cartItems));
  const itemCount = $derived(getCartItemCount($cartItems));
  const displayTotal = $derived(getCartDisplayTotal($cartItems));
  const isEmpty = $derived(items.length === 0);

  /* ——— Open/close in sync with the store ——— */

  $effect(() => {
    if (!dialog) return;

    if ($isCartOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!$isCartOpen && dialog.open) {
      dialog.close();
    }
  });

  function handleClose() {
    closeCart();
  }

  function handleBackdropClick(event) {
    if (event.target === dialog) {
      handleClose();
    }
  }

  /**
   * Re-add the same item to increment quantity.
   * addItemToCart already handles the max-5 cap.
   */
  function handleIncrement(item) {
    addItemToCart({
      slug: item.productSlug,
      title: item.title,
      sizeId: item.sizeId,
      sizeLabel: item.sizeLabel,
      price: item.price,
    });
  }

  function handleDecrement(item) {
    decrementItem(item.productSlug, item.sizeId);
  }

  function handleRemove(item) {
    removeItem(item.productSlug, item.sizeId);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  class="cart-drawer"
  bind:this={dialog}
  aria-label="Shopping cart"
  onclick={handleBackdropClick}
  onclose={handleClose}
>
  <div class="cart-drawer-panel">
    <div class="cart-header">
      <h2>Your cart ({itemCount})</h2>
      <button
        class="cart-close"
        aria-label="Close cart"
        onclick={handleClose}
      >
        <strong>✕</strong>
      </button>
    </div>

    {#if isEmpty}
      <div class="cart-empty">
        <p>Your cart is empty</p>
      </div>
    {:else}
      <ul class="cart-items" role="list">
        {#each items as item (item.productSlug + '-' + item.sizeId)}
          <li class="cart-item">
            <div class="cart-item-info">
              <span>{item.title}</span>
              <span class="cart-item-size">{item.sizeLabel}</span>
            </div>

            <div class="cart-item-controls">
              <div class="cart-item-quantity">
                <button
                  class="quantity-button"
                  type="button"
                  aria-label="Decrease quantity of {item.title}"
                  onclick={() => handleDecrement(item)}
                >
                  −
                </button>
                <span class="quantity-value" aria-label="Quantity">
                  {item.quantity}
                </span>
                <button
                  class="quantity-button"
                  type="button"
                  aria-label="Increase quantity of {item.title}"
                  disabled={item.quantity >= 5}
                  onclick={() => handleIncrement(item)}
                >
                  +
                </button>
              </div>

              <span class="cart-item-price">
                €{item.price * item.quantity}
              </span>

              <button
                class="cart-item-remove"
                type="button"
                aria-label="Remove {item.title} from cart"
                onclick={() => handleRemove(item)}
              >
                Remove
              </button>
            </div>
          </li>
        {/each}
      </ul>

      <div class="cart-footer">
        <div class="cart-total">
          <span>Total</span>
          <span>€{displayTotal}</span>
        </div>

        <button
          class="checkout-button"
          type="button"
        >
          Checkout
        </button>

        <p class="checkout-note">
          Shipping included. You'll be redirected to Stripe.
        </p>
      </div>
    {/if}
  </div>
</dialog>

<style>
  /* ——— Drawer as dialog ——— */

  .cart-drawer {
    position: fixed;
    inset: 0;
    border: none;
    background: transparent;
    padding: 0;
    max-width: 100dvw;
    max-height: 100dvh;
    width: 100dvw;
    height: 100dvh;
    overflow: hidden;
  }

  .cart-drawer::backdrop {
    background: var(--clr-backdrop);
    opacity: 0;
    transition: var(--transition-2);
  }

  .cart-drawer[open]::backdrop {
    opacity: 1;

    @starting-style {
      opacity: 0;
    }
  }

  /* ——— Slide-in panel ——— */

  .cart-drawer-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: min(360px, 95dvw);
    height: 100dvh;
    background: var(--clr-bg);
    display: flex;
    flex-direction: column;
    transform: translateX(0);
    transition: transform var(--transition-1);
    @starting-style {
      width: 0;
    }
  }



  /* ——— Header ——— */

  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-16-24px);
    border-bottom: 1px solid var(--clr-stroke-weak);
    h2 {
      font-size: var(--fontsize-h5);
    }
  }

  .cart-close {
    background: none;
    border: none;
    color: var(--clr-white);
    transition: color var(--transition-2);
  }
  
  .cart-empty {
    flex: 1;
    display: grid;
    place-content: center;
  }

  /* ——— Items list ——— */

  .cart-items {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-16-24px);
    display: flex;
    flex-direction: column;
    gap: var(--space-12-16px);
  }

  .cart-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-8-12px);
    padding-bottom: var(--space-24-32px);
    border-bottom: 1px solid var(--clr-stroke-weak);
  }

.cart-items > * + * {
  padding-block-start: var(--space-8-12px);
}

  .cart-item-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-4px);
  }

  .cart-item-size {
    font-size: var(--fontsize-body-s);
  }

  .cart-item-controls {
    display: flex;
    align-items: center;
    gap: var(--space-12-16px);
  }

  /* ——— Quantity stepper ——— */

  .cart-item-quantity {
    display: flex;
    align-items: center;
    gap: var(--space-8px);
    border: 1px solid var(--clr-stroke-weak);
    border-radius: var(--radius-3px);
    padding: var(--space-4px) var(--space-8px);
  }

  .quantity-button {
    background: none;
    border: none;
    padding: var(--space-4px);
    line-height: 1;
    transition: color var(--transition-2);
  }

  .quantity-button:hover:not(:disabled) {
    color: var(--clr-primary);
  }

  .quantity-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .quantity-value {
    min-width: var(--space-16-24px);
    text-align: center;
  }

  .cart-item-price {
    margin-left: auto;
  }

  .cart-item-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.75em;
    padding: var(--space-4px);
    transition: color var(--transition-2);
  }

  .cart-item-remove:hover {
    color: var(--clr-error);
  }


  .cart-footer {
    padding: var(--space-16-24px);
    border-top: 1px solid var(--clr-stroke-weak);
    display: flex;
    flex-direction: column;
    gap: var(--space-12-16px);
  }

  .cart-total {
    display: flex;
    justify-content: space-between;
    font-size: var(--fontsize-h5);
  }

  .checkout-button {
    padding: var(--space-12-16px);
    border: none;
    border-radius: var(--radius-5px);
    background: var(--clr-primary);
    font-size: var(--fontsize-body);
    transition: opacity var(--transition-2);
  }

  .checkout-note {
    text-align: center;
  }
</style>
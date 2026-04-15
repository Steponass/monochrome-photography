<!-- src/islands/CartIcon.svelte -->
<script>
  import { cartItems, getCartItemCount } from '../stores/cartStore.js';

  const itemCount = $derived(getCartItemCount($cartItems));

  /** @type {{ slug: string, title: string, aspectRatio: '3:2' | '4:3' }} */
  const { slug, title, aspectRatio } = $props();

</script>

<button
  class="cart-icon-button"
  type="button"
  aria-label="Shopping cart, {itemCount} {itemCount === 1 ? 'item' : 'items'}"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>

  {#if itemCount > 0}
    <span class="cart-badge" aria-hidden="true">
      {itemCount}
    </span>
  {/if}
</button>

<style>
  .cart-icon-button {
    position: relative;
    background: none;
    border: none;
    color: var(--clr-white);
    padding: var(--space-4px);
    transition: color var(--transition-2);
  }

  .cart-icon-button:hover,
  .cart-icon-button:focus-visible {
    color: var(--clr-primary);
  }

  .cart-badge {
    position: absolute;
    top: -4px;
    right: -6px;
    background: var(--clr-primary);
    color: var(--clr-white);
    font-size: 0.7rem;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: grid;
    place-content: center;
    padding-inline: 4px;
    pointer-events: none;
  }
</style>
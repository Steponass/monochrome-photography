<script>
  import { addItemToCart } from '../stores/cartStore.js';
  import { SIZE_TIERS } from '../config/sizeTiers.js';

  /** @type {{ slug: string, title: string, aspectRatio: '3:2' | '4:3' }} */
  const { slug, title, aspectRatio } = $props();

  let selectedTier = $state(null);
  let justAdded = $state(false);
  let addedTimeout = $state(null);

  function handleSizeSelect(tier) {
    selectedTier = tier;
    justAdded = false;

    if (addedTimeout) {
      clearTimeout(addedTimeout);
      addedTimeout = null;
    }
  }

  function handleAddToCart() {
    if (!selectedTier) return;

    const sizeLabel = selectedTier.dimensions[aspectRatio];

    addItemToCart({
      slug,
      title,
      sizeId: selectedTier.id,
      sizeLabel,
      price: selectedTier.price,
    });

    justAdded = true;

    addedTimeout = setTimeout(() => {
      justAdded = false;
      addedTimeout = null;
    }, 2000);
  }
</script>

<div class="add-to-cart">
  <fieldset class="size-selector">
    <legend class="size-selector-legend">Select a size</legend>

    {#each SIZE_TIERS as tier (tier.id)}
      <button
        class="size-option"
        class:selected={selectedTier?.id === tier.id}
        type="button"
        onclick={() => handleSizeSelect(tier)}
        aria-pressed={selectedTier?.id === tier.id}
      >
        <span class="size-option-dimensions">
          {tier.dimensions[aspectRatio]}
        </span>
        <span class="size-option-price">£{tier.price}</span>
      </button>
    {/each}
  </fieldset>

  <button
    class="add-button"
    class:added={justAdded}
    type="button"
    disabled={!selectedTier}
    onclick={handleAddToCart}
  >
    {justAdded ? 'Added ✓' : 'Add to cart'}
  </button>
</div>

<style>
  .add-to-cart {
    display: flex;
    flex-direction: column;
    gap: var(--space-24-32px);
  }

  .size-selector {
    border: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-8px);
  }

  .size-selector-legend {
    font-size: var(--fontsize-h5);
    margin-block-end: var(--space-12-16px);
  }

  .size-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-12-16px);
    border: 1px solid var(--clr-stroke-weak);
    border-radius: var(--radius-5px);
    background: none;
    color: var(--clr-white);
    cursor: pointer;
    transition:
      border-color var(--transition-2),
      background-color var(--transition-2);
  }

  .size-option:hover {
    border-color: var(--clr-white);
  }

  .size-option.selected {
    border-color: var(--clr-primary);
    background: var(--clr-primary-transparent, rgba(255, 255, 255, 0.05));
  }

  .add-button {
    padding: var(--space-12-16px) var(--space-24-32px);
    border: none;
    border-radius: var(--radius-5px);
    background: var(--clr-primary);
    color: var(--clr-white);
    font-size: var(--fontsize-body);
    font-weight: 600;
    cursor: pointer;
    transition:
      opacity var(--transition-2),
      background-color var(--transition-2);
  }

  .add-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .add-button:not(:disabled):hover {
    opacity: 0.85;
  }

  .add-button.added {
    background: var(--clr-success, #15803d);
  }
</style>
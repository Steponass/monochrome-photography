<script>
  import { lightboxRequest, closeLightbox } from '../stores/lightboxStore.js';
  import AddToCart from './AddToCart.svelte';

  let dialog = $state(null);
  let currentIndex = $state(0);
  let products = $state([]);
  let isOpen = $state(false);
  let touchStartX = $state(0);

  const SWIPE_THRESHOLD_PX = 50;

  const currentProduct = $derived(products[currentIndex] ?? null);
  const hasPrevious = $derived(currentIndex > 0);
  const hasNext = $derived(currentIndex < products.length - 1);

  $effect(() => {
    const request = $lightboxRequest;

    if (request && dialog) {
      products = request.products;
      currentIndex = request.startIndex;
      isOpen = true;
      dialog.showModal();
    }
  });

  function goToPrevious() {
    if (hasPrevious) {
      currentIndex -= 1;
    }
  }

  function goToNext() {
    if (hasNext) {
      currentIndex += 1;
    }
  }

  function handleClose() {
    if (!dialog) return;
    dialog.close();
    isOpen = false;
    closeLightbox();
  }

  function handleBackdropClick(event) {
    /* Only close if clicking the dialog itself (the backdrop area),
     * not any child element */
    if (event.target === dialog) {
      handleClose();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  }

  function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    if (deltaX > 0) {
      goToPrevious();
    } else {
      goToNext();
    }
  }
</script>

<dialog
  class="lightbox"
  bind:this={dialog}
  aria-label="Product lightbox"
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  {#if isOpen && currentProduct}
    <div class="lightbox-layout">

      {#if hasPrevious}
        <button
          class="lightbox-nav lightbox-nav-prev"
          type="button"
          aria-label="Previous photo"
          onclick={goToPrevious}
        >
          ‹
        </button>
      {/if}

      <div class="lightbox-content">
        <div class="lightbox-media">
          {#key currentProduct.slug}
            <img
              class="lightbox-image"
              src={currentProduct.imageSrc}
              alt={currentProduct.alt}
            />
          {/key}
          <span class="lightbox-title">{currentProduct.title}</span>
        </div>

        <div class="lightbox-sidebar">
          {#key currentProduct.slug}
            <AddToCart
              slug={currentProduct.slug}
              title={currentProduct.title}
              aspectRatio={currentProduct.aspectRatio}
            />
          {/key}
        </div>
      </div>

      {#if hasNext}
        <button
          class="lightbox-nav lightbox-nav-next"
          type="button"
          aria-label="Next photo"
          onclick={goToNext}
        >
          ›
        </button>
      {/if}

      <button
        class="lightbox-close"
        type="button"
        aria-label="Close lightbox"
        onclick={handleClose}
      >
        ✕
      </button>

    </div>
  {/if}
</dialog>

<style>
  /* ——— Dialog base ——— */

  .lightbox {
    border: none;
    background: transparent;
    max-width: 100dvw;
    max-height: 100dvh;
    padding: 0;
    opacity: 0;
    transition:
      opacity var(--transition-2),
      display var(--transition-2) allow-discrete,
      overlay var(--transition-2) allow-discrete;
  }

  .lightbox[open] {
    opacity: 1;

    @starting-style {
      opacity: 0;
    }
  }

  .lightbox::backdrop {
    background: var(--clr-backdrop);
    opacity: 0;
    transition:
      opacity var(--transition-2),
      display var(--transition-2) allow-discrete,
      overlay var(--transition-2) allow-discrete;
  }

  .lightbox[open]::backdrop {
    opacity: 1;

    @starting-style {
      opacity: 0;
    }
  }

  /* ——— Layout ——— */

  .lightbox-layout {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100dvw;
    height: 100dvh;
  }

  .lightbox-content {
    display: flex;
    align-items: flex-start;
    gap: var(--space-24-32px);
    max-width: 95dvw;
    max-height: 90dvh;
  }

  @media (max-width: 768px) {
    .lightbox-content {
      flex-direction: column;
      align-items: center;
      max-height: 95dvh;
      overflow-y: auto;
    }
  }

  /* ——— Image ——— */

  .lightbox-media {
    position: relative;
    flex-shrink: 1;
    min-width: 0;
  }

  .lightbox-image {
    max-width: 100%;
    max-height: 80dvh;
    object-fit: contain;
    display: block;
  }

  @media (max-width: 768px) {
    .lightbox-image {
      max-height: 50dvh;
    }
  }

  .lightbox-title {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: var(--space-8px);
    font-size: var(--fontsize-h5);
    background: var(--clr-backdrop);
    text-align: center;
  }

  /* ——— Sidebar (AddToCart) ——— */

  .lightbox-sidebar {
    flex-shrink: 0;
    width: 280px;
  }

  @media (max-width: 768px) {
    .lightbox-sidebar {
      width: 100%;
      max-width: 400px;
    }
  }

  /* ——— Navigation ——— */

  .lightbox-nav {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    padding: var(--space-12-16px);
    line-height: 1;
    z-index: 1;
  }

  .lightbox-nav-prev {
    left: var(--space-12-16px);
  }

  .lightbox-nav-next {
    right: var(--space-12-16px);
  }

  .lightbox-close {
    position: fixed;
    top: var(--space-12-16px);
    right: var(--space-12-16px);
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: var(--space-8px);
    line-height: 1;
    z-index: 1;
  }

  /* ——— Crossfade on navigation ——— */

  .lightbox-image {
    animation: lightbox-fade-in 0.3s ease;
  }

  @keyframes lightbox-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
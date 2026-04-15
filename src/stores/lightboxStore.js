// src/stores/lightboxStore.js

import { atom } from 'nanostores';

/**
 * Lightbox store — bridge between the static gallery grid and
 * the Svelte ProductLightbox island.
 *
 * The gallery grid (static Astro + vanilla JS) writes to this store
 * when a thumbnail is clicked. The ProductLightbox island reads from
 * it and opens the dialog.
 *
 * This store is NOT persistent — lightbox state doesn't survive
 * page navigation, which is correct behavior.
 */

/**
 * When set to a non-null value, the lightbox should open.
 * When set to null, the lightbox should close.
 *
 * @type {import('nanostores').WritableAtom<{ products: Array, startIndex: number } | null>}
 */
export const lightboxRequest = atom(null);

/**
 * Called by the static gallery grid's vanilla JS to request
 * the lightbox to open.
 *
 * @param {Array<Object>} products - Full product data for the gallery
 * @param {number} startIndex - Which product to show first
 */
export function openLightbox(products, startIndex) {
  lightboxRequest.set({ products, startIndex });
}

/**
 * Called by the lightbox to signal it has closed.
 */
export function closeLightbox() {
  lightboxRequest.set(null);
}
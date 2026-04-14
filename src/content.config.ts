import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const productsCollection = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/products',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      category: z.enum(['nature', 'urban', 'industrial', 'monuments']),
      image: image(),
      aspectRatio: z.enum(['3:2', '4:3']),
      alt: z.string(),
      sortOrder: z.number().int().default(100),
    }),
});

export const collections = { products: productsCollection };
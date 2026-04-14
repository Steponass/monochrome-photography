/**
 * generate-products.mjs
 *
 * Scans src/assets/photos/{category}/ directories for image files,
 * parses each filename, and generates a markdown file per product
 * in src/content/products/.
 *
 * Usage:  node generate-products.mjs
 * Run from the project root.
 *
 * What it generates (per image):
 *   - title:     extracted from filename (underscores → spaces)
 *   - slug:      title lowercased, spaces → hyphens, special chars stripped
 *   - category:  derived from the 2-letter prefix code
 *   - image:     relative path from content/products/ to assets/photos/
 *   - alt:       placeholder — you fill this in manually
 *   - sortOrder: defaults to 100 — you set the display order manually
 *
 * The script will NOT overwrite existing markdown files.
 * It warns about slug collisions across categories.
 */

import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/* ——— Configuration ——— */

const PHOTOS_DIR = 'src/assets/photos';
const OUTPUT_DIR = 'src/content/products';
const IMAGE_EXTENSIONS = ['.avif', '.jpg', '.jpeg', '.png', '.webp'];

const CATEGORY_MAP = {
  NA: 'nature',
  UR: 'urban',
  IN: 'industrial',
  ME: 'monuments',
};

/**
 * Filename pattern:
 *   [PREFIX_CODE][DIGITS][LETTER]_[Large|Small]_[Title_With_Underscores].[ext]
 *
 * Examples:
 *   NA020d_Large_All_is_quiet_on_New_Years_Day.avif
 *   NA013b_Small_Remembrance_II.avif
 *   UR005a_Large_Urban_Geometry_No_12.avif
 */
const FILENAME_REGEX = /^([A-Z]{2})\d+[a-z]?\d*_(?:(?:Large|Small)_)?(.+)\.[a-z]+$/i;

/* ——— Helper functions ——— */

function extractTitleFromFilename(rawTitle) {
  // Replace underscores with spaces
  return rawTitle.replaceAll('_', ' ');
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replaceAll(/['']/g, '')           // Remove apostrophes/quotes
    .replaceAll(/[^a-z0-9\s-]/g, '')   // Strip non-alphanumeric chars
    .trim()
    .replaceAll(/\s+/g, '-')           // Spaces → hyphens
    .replaceAll(/-+/g, '-');           // Collapse multiple hyphens
}

function buildRelativeImagePath(category, filename) {
  // From src/content/products/ to src/assets/photos/{category}/{filename}
  return `../../assets/photos/${category}/${filename}`;
}

function buildMarkdownContent({ title, slug, category, imagePath }) {
  // YAML frontmatter — alt is a placeholder for manual editing
  const frontmatter = [
    '---',
    `title: "${title}"`,
    `slug: "${slug}"`,
    `category: "${category}"`,
    `image: "${imagePath}"`,
    `alt: "TODO: describe this image"`,
    `sortOrder: 100`,
    '---',
  ].join('\n');

  return frontmatter + '\n';
}


/* ——— Main script ——— */

function main() {
  // Track all slugs to detect collisions
  const slugRegistry = new Map(); // slug → [{ category, filename }]
  const generatedFiles = [];
  const skippedFiles = [];
  const parseErrors = [];

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  // Process each category directory
  for (const [prefixCode, category] of Object.entries(CATEGORY_MAP)) {
    const categoryDir = join(PHOTOS_DIR, category);

    if (!existsSync(categoryDir)) {
      console.warn(`⚠  Directory not found: ${categoryDir} — skipping`);
      continue;
    }

    const files = readdirSync(categoryDir);
    const imageFiles = files.filter((file) => {
      const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });

    console.log(`\nProcessing ${category}/ — ${imageFiles.length} images found`);

    for (const filename of imageFiles) {
      const match = filename.match(FILENAME_REGEX);

      if (!match) {
        parseErrors.push({ filename, category, reason: 'Does not match expected pattern' });
        continue;
      }

      const [, filePrefix, rawTitle] = match;

      // Verify the prefix matches the category directory it's in
      if (CATEGORY_MAP[filePrefix.toUpperCase()] !== category) {
        parseErrors.push({
          filename,
          category,
          reason: `Prefix "${filePrefix}" does not match category "${category}"`,
        });
        continue;
      }

      const title = extractTitleFromFilename(rawTitle);
      const slug = createSlug(title);
      const imagePath = buildRelativeImagePath(category, filename);

      // Track slug for collision detection
      if (!slugRegistry.has(slug)) {
        slugRegistry.set(slug, []);
      }
      slugRegistry.get(slug).push({ category, filename });

      // Build the markdown file
      const markdownContent = buildMarkdownContent({ title, slug, category, imagePath });
      const outputFilename = `${slug}.md`;
      const outputPath = join(OUTPUT_DIR, outputFilename);

      // Don't overwrite existing files
      if (existsSync(outputPath)) {
        skippedFiles.push({ outputFilename, reason: 'Already exists' });
        continue;
      }

      writeFileSync(outputPath, markdownContent, 'utf-8');
      generatedFiles.push(outputFilename);
    }
  }

  /* ——— Summary ——— */

  console.log('\n' + '='.repeat(50));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`\n✓  Generated: ${generatedFiles.length} files`);

  if (skippedFiles.length > 0) {
    console.log(`⊘  Skipped (already exist): ${skippedFiles.length}`);
    for (const { outputFilename } of skippedFiles) {
      console.log(`   - ${outputFilename}`);
    }
  }

  if (parseErrors.length > 0) {
    console.log(`\n✗  Parse errors: ${parseErrors.length}`);
    for (const { filename, category, reason } of parseErrors) {
      console.log(`   - ${category}/${filename}: ${reason}`);
    }
  }

  // Check for slug collisions
  const collisions = [...slugRegistry.entries()].filter(([, sources]) => sources.length > 1);
  if (collisions.length > 0) {
    console.log(`\n⚠  SLUG COLLISIONS DETECTED (${collisions.length}):`);
    for (const [slug, sources] of collisions) {
      console.log(`   "${slug}" used by:`);
      for (const { category, filename } of sources) {
        console.log(`     - ${category}/${filename}`);
      }
    }
    console.log('\n   Fix these manually — each product needs a unique slug.');
  }

  console.log('');
}

main();

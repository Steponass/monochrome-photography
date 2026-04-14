/**
 * patch-aspect-ratios.mjs
 *
 * Reads each product markdown file, resolves its image path,
 * gets the image dimensions, determines the aspect ratio (3:2 or 4:3),
 * and adds an `aspectRatio` field to the frontmatter.
 *
 * Requires: sharp (npm install sharp --save-dev)
 * Usage:    node patch-aspect-ratios.mjs
 * Run from the project root.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import sharp from 'sharp';

/* ——— Configuration ——— */

const PRODUCTS_DIR = 'src/content/products';

/**
 * Known aspect ratios and their expected values.
 *
 * 3:2 = 1.500
 * 4:3 = 1.333
 * Midpoint = 1.417
 *
 * Anything above the midpoint → 3:2
 * Anything below → 4:3
 * Anything too far from both → flagged for manual review
 */
const RATIO_3_2 = 3 / 2; // 1.500
const RATIO_4_3 = 4 / 3; // 1.333
const MIDPOINT = (RATIO_3_2 + RATIO_4_3) / 2; // ~1.417
const TOLERANCE = 0.15; // How far from either ratio before we flag it


/* ——— Helper functions ——— */

function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return match[1];
}

function extractFieldValue(frontmatter, fieldName) {
  const regex = new RegExp(`^${fieldName}:\\s*"?([^"\\n]*)"?`, 'm');
  const match = frontmatter.match(regex);
  return match ? match[1] : null;
}

function classifyRatio(width, height) {
  // Always use larger / smaller to normalize for portrait vs landscape
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const ratio = long / short;

  const distanceTo3_2 = Math.abs(ratio - RATIO_3_2);
  const distanceTo4_3 = Math.abs(ratio - RATIO_4_3);
  const closestDistance = Math.min(distanceTo3_2, distanceTo4_3);

  if (closestDistance > TOLERANCE) {
    return { classification: null, ratio };
  }

  return {
    classification: ratio >= MIDPOINT ? '3:2' : '4:3',
    ratio,
  };
}

function addAspectRatioToFrontmatter(fileContent, aspectRatio) {
  // Insert aspectRatio before the sortOrder line (last field before closing ---)
  // If sortOrder doesn't exist, insert before closing ---
  if (fileContent.includes('aspectRatio:')) {
    // Already has aspectRatio — replace it
    return fileContent.replace(
      /aspectRatio:\s*"[^"]*"/,
      `aspectRatio: "${aspectRatio}"`
    );
  }

  // Insert before sortOrder line
  if (fileContent.includes('sortOrder:')) {
    return fileContent.replace(
      /sortOrder:/,
      `aspectRatio: "${aspectRatio}"\nsortOrder:`
    );
  }

  // Fallback: insert before closing ---
  return fileContent.replace(
    /\n---\s*$/,
    `\naspectRatio: "${aspectRatio}"\n---`
  );
}


/* ——— Main script ——— */

async function main() {
  const mdFiles = readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} product files\n`);

  const results = { patched: 0, skipped: 0, flagged: [] };

  for (const mdFile of mdFiles) {
    const mdPath = join(PRODUCTS_DIR, mdFile);
    const fileContent = readFileSync(mdPath, 'utf-8');
    const frontmatter = parseFrontmatter(fileContent);

    if (!frontmatter) {
      results.flagged.push({ file: mdFile, reason: 'Could not parse frontmatter' });
      continue;
    }

    // Check if already has aspectRatio
    const existingRatio = extractFieldValue(frontmatter, 'aspectRatio');
    if (existingRatio) {
      results.skipped++;
      continue;
    }

    // Resolve the image path relative to the markdown file
    const imagePath = extractFieldValue(frontmatter, 'image');
    if (!imagePath) {
      results.flagged.push({ file: mdFile, reason: 'No image field found' });
      continue;
    }

    const absoluteImagePath = resolve(dirname(mdPath), imagePath);

    // Read image dimensions
    let metadata;
    try {
      metadata = await sharp(absoluteImagePath).metadata();
    } catch (error) {
      results.flagged.push({ file: mdFile, reason: `Cannot read image: ${error.message}` });
      continue;
    }

    const { width, height } = metadata;
    if (!width || !height) {
      results.flagged.push({ file: mdFile, reason: 'Image has no dimensions' });
      continue;
    }

    // Classify the aspect ratio
    const { classification, ratio } = classifyRatio(width, height);

    if (!classification) {
      results.flagged.push({
        file: mdFile,
        reason: `Unusual ratio ${ratio.toFixed(3)} (${width}×${height}) — not close to 3:2 or 4:3`,
      });
      continue;
    }

    // Patch the file
    const updatedContent = addAspectRatioToFrontmatter(fileContent, classification);
    writeFileSync(mdPath, updatedContent, 'utf-8');
    results.patched++;
  }

  /* ——— Summary ——— */

  console.log('='.repeat(50));
  console.log('PATCH COMPLETE');
  console.log('='.repeat(50));
  console.log(`\n✓  Patched: ${results.patched} files`);
  console.log(`⊘  Skipped (already has aspectRatio): ${results.skipped}`);

  if (results.flagged.length > 0) {
    console.log(`\n⚠  Needs manual review: ${results.flagged.length}`);
    for (const { file, reason } of results.flagged) {
      console.log(`   - ${file}: ${reason}`);
    }
  }

  console.log('');
}

main();

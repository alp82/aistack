/**
 * One-shot email screenshot processor.
 *
 * Run with:
 *   pnpm tsx scripts/process-email-screenshots.ts <projects.png> <share.png> <colors.png>
 *
 * Resizes the raw feature screenshots down to email-friendly widths and writes
 * them as PNGs into public/email/. Mirrors the sharp chain in
 * scripts/migrate-icons.ts (fit: "inside", withoutEnlargement) but outputs PNG
 * to disk instead of uploading to Convex.
 *
 * Idempotent-ish: re-running just regenerates the outputs from the sources.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_EMAIL_DIR = path.resolve(import.meta.dirname, '..', 'public', 'email');

const [projectsSrc, shareSrc, colorsSrc] = process.argv.slice(2);

if (!projectsSrc || !shareSrc || !colorsSrc) {
  console.error(
    'Usage: pnpm tsx scripts/process-email-screenshots.ts <projects.png> <share.png> <colors.png>',
  );
  process.exit(1);
}

const JOBS: { src: string; dest: string; targetWidth: number }[] = [
  {
    src: projectsSrc,
    dest: path.join(PUBLIC_EMAIL_DIR, 'feature-projects.png'),
    targetWidth: 1040,
  },
  {
    src: shareSrc,
    dest: path.join(PUBLIC_EMAIL_DIR, 'feature-share.png'),
    targetWidth: 1040,
  },
  {
    src: colorsSrc,
    dest: path.join(PUBLIC_EMAIL_DIR, 'feature-colors.png'),
    targetWidth: 360,
  },
];

async function main() {
  fs.mkdirSync(PUBLIC_EMAIL_DIR, { recursive: true });

  for (const job of JOBS) {
    if (!fs.existsSync(job.src)) {
      console.error(`✗ Source missing: ${job.src}`);
      continue;
    }

    const buf = await sharp(fs.readFileSync(job.src))
      .resize(job.targetWidth, null, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();

    fs.writeFileSync(job.dest, buf);

    const meta = await sharp(buf).metadata();
    console.log(
      `✓ ${job.src} -> ${job.dest} (${meta.width}x${meta.height}, ${buf.length} bytes)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

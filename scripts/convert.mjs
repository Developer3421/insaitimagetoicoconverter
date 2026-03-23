#!/usr/bin/env node
/**
 * Local JPEG/PNG → ICO converter.
 *
 * Usage:
 *   node scripts/convert.mjs <input.jpg|png> [output.ico]
 *   node scripts/convert.mjs file1.jpg file2.png ...   (batch – ICO saved next to each source)
 *
 * Or via npm:
 *   npm run convert -- photo.jpg
 *   npm run convert -- icon.png output.ico
 */

import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { extname, basename, dirname, join } from "path";

const { default: sharp } = await import("sharp");

const SUPPORTED = new Set([".jpg", ".jpeg", ".png"]);

// Standard ICO size sets
const ICO_SIZES = [16, 32, 48, 64, 128, 256];

function toIcoPath(inputPath) {
  const dir = dirname(inputPath);
  const name = basename(inputPath, extname(inputPath));
  return join(dir, `${name}.ico`);
}

/**
 * Assemble an array of { width, height, pngBuffer } entries into a valid ICO
 * binary Buffer using PNG-inside-ICO format (Windows Vista+).
 */
function buildIco(entries) {
  const count = entries.length;
  const HEADER_SIZE = 6;
  const DIR_ENTRY_SIZE = 16;
  const payloadStart = HEADER_SIZE + count * DIR_ENTRY_SIZE;

  let totalSize = payloadStart;
  const offsets = entries.map((e) => {
    const o = totalSize;
    totalSize += e.pngBuffer.length;
    return o;
  });

  const buf = Buffer.alloc(totalSize);

  // ICONDIR header
  buf.writeUInt16LE(0, 0);     // reserved
  buf.writeUInt16LE(1, 2);     // type: 1 = ICO
  buf.writeUInt16LE(count, 4); // image count

  // ICONDIRENTRY for each image
  entries.forEach((e, i) => {
    const base = HEADER_SIZE + i * DIR_ENTRY_SIZE;
    buf.writeUInt8(e.width >= 256 ? 0 : e.width, base);      // bWidth  (0 = 256)
    buf.writeUInt8(e.height >= 256 ? 0 : e.height, base + 1); // bHeight
    buf.writeUInt8(0, base + 2);  // bColorCount
    buf.writeUInt8(0, base + 3);  // bReserved
    buf.writeUInt16LE(1, base + 4);  // wPlanes
    buf.writeUInt16LE(32, base + 6); // wBitCount
    buf.writeUInt32LE(e.pngBuffer.length, base + 8);  // dwBytesInRes
    buf.writeUInt32LE(offsets[i], base + 12);          // dwImageOffset
  });

  // Image data
  entries.forEach((e, i) => {
    e.pngBuffer.copy(buf, offsets[i]);
  });

  return buf;
}

async function convertFile(inputPath, outputPath) {
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const ext = extname(inputPath).toLowerCase();
  if (!SUPPORTED.has(ext)) {
    throw new Error(
      `Unsupported file type "${ext}". Only .jpg/.jpeg/.png are accepted.`
    );
  }

  const dest = outputPath ?? toIcoPath(inputPath);

  // Render each ICO size as a PNG buffer using sharp
  const entries = await Promise.all(
    ICO_SIZES.map(async (s) => {
      const pngBuffer = await sharp(inputPath)
        .resize(s, s, { fit: "cover" })
        .png()
        .toBuffer();
      return { width: s, height: s, pngBuffer };
    })
  );

  const icoBuffer = buildIco(entries);
  await writeFile(dest, icoBuffer);
  return dest;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(
      [
        "Usage:",
        "  node scripts/convert.mjs <input.jpg|png> [output.ico]",
        "  node scripts/convert.mjs file1.jpg file2.png ...",
        "",
        "If output.ico is omitted the ICO is saved alongside the source file.",
        "",
        `ICO sizes included: ${ICO_SIZES.join(", ")} px`,
      ].join("\n")
    );
    process.exit(0);
  }

  // Two-argument form: node convert.mjs input.jpg output.ico
  if (
    args.length === 2 &&
    SUPPORTED.has(extname(args[0]).toLowerCase()) &&
    extname(args[1]).toLowerCase() === ".ico"
  ) {
    try {
      const dest = await convertFile(args[0], args[1]);
      console.log(`✓  ${args[0]}  →  ${dest}`);
    } catch (err) {
      console.error(`✗  ${err.message}`);
      process.exit(1);
    }
    return;
  }

  // Batch form: one or more input files, output next to each
  let hasError = false;
  for (const inputPath of args) {
    try {
      const dest = await convertFile(inputPath);
      console.log(`✓  ${inputPath}  →  ${dest}`);
    } catch (err) {
      console.error(`✗  ${inputPath}: ${err.message}`);
      hasError = true;
    }
  }
  if (hasError) process.exit(1);
}

main();

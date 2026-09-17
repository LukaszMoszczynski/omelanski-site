// One-off asset generator: builds the static office map from OpenStreetMap tiles.
// Run `npm run map` and commit src/assets/map-office.png.
// Tiles are fetched once here and served from our own server afterwards, so visitors
// never contact a third party. Attribution is rendered by MapLink.astro.
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

// Nominatim has no 1/4, but it knows number 1 of this street — same building.
const ADDRESS = 'Jedności Narodowej 1, Kamień Pomorski, Poland';
// Fallback: the same building, looked up once on 2026-09-17, in case geocoding is unavailable.
const FALLBACK = { lat: 53.9676797, lon: 14.7735813 };
const UA = 'omelanska.com static map builder (one-off, contact: biuro@omelanska.com)';
const ZOOM = 17;
const TILE = 256;
const COLS = 4;
const ROWS = 2;
const OUT = 'src/assets/map-office.png';

const lonToX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const latToY = (lat, z) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z;
};

async function geocode() {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(ADDRESS)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pl' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const [hit] = await res.json();
    if (!hit) throw new Error('no result');
    console.log(`geocoded: ${hit.display_name} → ${hit.lat}, ${hit.lon}`);
    return { lat: Number(hit.lat), lon: Number(hit.lon) };
  } catch (error) {
    console.warn(`geocoding failed (${error.message}); using town-centre fallback`);
    return FALLBACK;
  }
}

async function fetchTile(x, y) {
  const res = await fetch(`https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`tile ${x}/${y}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const { lat, lon } = await geocode();
const centreX = lonToX(lon, ZOOM);
const centreY = latToY(lat, ZOOM);
const width = COLS * TILE;
const height = ROWS * TILE;
// Stitch one tile more in each direction than we need, then crop so the marker
// lands exactly in the middle regardless of where it falls inside its own tile.
const gridCols = COLS + 1;
const gridRows = ROWS + 1;
const firstX = Math.floor(centreX) - Math.floor(gridCols / 2);
const firstY = Math.floor(centreY) - Math.floor(gridRows / 2);

const tiles = [];
for (let row = 0; row < gridRows; row++) {
  for (let col = 0; col < gridCols; col++) {
    const buffer = await fetchTile(firstX + col, firstY + row);
    tiles.push({ input: buffer, top: row * TILE, left: col * TILE });
    // Be gentle with the tile server.
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

const pinX = Math.round((centreX - firstX) * TILE);
const pinY = Math.round((centreY - firstY) * TILE);
const cropLeft = Math.max(0, Math.min(pinX - Math.round(width / 2), gridCols * TILE - width));
const cropTop = Math.max(0, Math.min(pinY - Math.round(height / 2), gridRows * TILE - height));
const pin = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 24 30">
  <path d="M12 1.5a8.5 8.5 0 0 0-8.5 8.5c0 6.2 8.5 18 8.5 18s8.5-11.8 8.5-18A8.5 8.5 0 0 0 12 1.5z"
        fill="#2a5db0" stroke="#ffffff" stroke-width="1.6"/>
  <circle cx="12" cy="10" r="3.1" fill="#ffffff"/>
</svg>`);

mkdirSync('src/assets', { recursive: true });
// Two passes: sharp would otherwise apply the crop before the overlays.
const stitched = await sharp({
  create: { width: gridCols * TILE, height: gridRows * TILE, channels: 3, background: '#e9e5dc' },
})
  .composite([...tiles, { input: pin, top: pinY - 54, left: pinX - 22 }])
  .png()
  .toBuffer();
const png = await sharp(stitched)
  .extract({ left: cropLeft, top: cropTop, width, height })
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(OUT, png);
console.log(`wrote ${OUT} (${width}x${height}, ${png.length} bytes) centred on ${lat}, ${lon}`);

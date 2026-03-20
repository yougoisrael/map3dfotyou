// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Geocoding Service — Nominatim / OpenStreetMap (free, no key)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const NOMINATIM = 'https://nominatim.openstreetmap.org';

let _lastCall = 0;
const RATE_LIMIT_MS = 1100; // Nominatim policy: max 1 req/sec

export async function geocode(query) {
  // Rate limit
  const now = Date.now();
  if (now - _lastCall < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - _lastCall)));
  }
  _lastCall = Date.now();

  // Check if input is coordinates "lat, lon"
  const coordMatch = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    return [{
      name: `${coordMatch[1]}, ${coordMatch[2]}`,
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2]),
      type: 'coordinates',
    }];
  }

  const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'Terra3D/1.0' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

  const data = await res.json();
  return data.map((r) => ({
    name: r.display_name.split(',').slice(0, 3).join(', '),
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    type: r.type || r.class,
    boundingBox: r.boundingbox?.map(Number),
  }));
}

/** Reverse geocode: lon/lat → place name */
export async function reverseGeocode(longitude, latitude) {
  const now = Date.now();
  if (now - _lastCall < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - _lastCall)));
  }
  _lastCall = Date.now();

  const url = `${NOMINATIM}/reverse?lat=${latitude}&lon=${longitude}&format=json`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'Terra3D/1.0' },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const a = data.address || {};
  return {
    city: a.city || a.town || a.village || a.hamlet || '',
    country: a.country || '',
    countryCode: a.country_code?.toUpperCase() || '',
  };
}

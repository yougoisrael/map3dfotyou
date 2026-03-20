// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Flight Service — OpenSky Network (free, no auth required)
// Docs: https://openskynetwork.github.io/opensky-api/rest.html
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OPENSKY_BASE = 'https://opensky-network.org/api';

// CORS proxy for browser requests (OpenSky blocks direct browser calls)
const PROXY = 'https://corsproxy.io/?';

/**
 * Fetch all current airborne flights from OpenSky Network.
 * Returns an array of normalised flight objects.
 */
export async function fetchFlights() {
  try {
    // Using a lightweight bounding box to limit data volume per request
    // Full globe: lamin=-90&lomin=-180&lamax=90&lomax=180
    const url = `${OPENSKY_BASE}/states/all?lamin=-70&lomin=-180&lamax=80&lomax=180`;

    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);

    const data = await res.json();
    if (!data?.states) return [];

    return data.states
      .filter((s) => s[5] != null && s[6] != null && !s[8]) // has position & airborne
      .map(normalise)
      .filter(Boolean);
  } catch (err) {
    console.warn('[FlightService] fetch failed:', err.message);
    return generateSimulatedFlights(); // graceful fallback
  }
}

function normalise(s) {
  const lon = s[5];
  const lat = s[6];
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;

  return {
    icao24: s[0],
    callsign: (s[1] || '').trim() || s[0],
    country: s[2] || '',
    longitude: lon,
    latitude: lat,
    altitude: s[13] ?? s[7] ?? 10000, // geo alt, fallback baro alt
    velocity: s[9] ?? 0,               // m/s
    heading: s[10] ?? 0,               // true track degrees
    verticalRate: s[11] ?? 0,
    onGround: s[8],
  };
}

// ── Simulated fallback when API is unavailable ──────────────────────
const ROUTES = [
  // [from_lon, from_lat, to_lon, to_lat, callsign, country]
  [-73.8, 40.6, 2.5, 49.0, 'AA100', 'United States'],
  [2.5, 49.0, 55.4, 25.2, 'EK007', 'United Arab Emirates'],
  [139.8, 35.6, -118.4, 33.9, 'JL061', 'Japan'],
  [-43.2, -22.9, -46.6, -23.6, 'LA3717', 'Brazil'],
  [18.6, 54.4, 37.9, 55.7, 'LO29', 'Poland'],
  [103.9, 1.3, 116.5, 39.9, 'SQ802', 'Singapore'],
  [-0.5, 51.5, -87.9, 41.9, 'VS001', 'United Kingdom'],
  [13.3, 52.5, 28.9, 41.0, 'TK1751', 'Turkey'],
  [151.2, -33.9, -43.2, -22.9, 'QF001', 'Australia'],
  [2.1, 41.3, -3.7, 40.4, 'VY1003', 'Spain'],
  [-122.4, 37.6, 144.8, -37.8, 'UA863', 'United States'],
  [72.9, 19.1, 103.9, 1.3, 'AI345', 'India'],
  [28.8, 41.0, -73.8, 40.6, 'TK0001', 'Turkey'],
  [30.9, 59.8, 13.3, 52.5, 'SU125', 'Russia'],
  [-3.6, 40.4, 2.5, 49.0, 'IB3163', 'Spain'],
];

let _simTime = 0;

export function generateSimulatedFlights() {
  _simTime += 1;
  return ROUTES.map((r, i) => {
    const t = ((_simTime * 0.003) + i * 0.37) % 1;
    return {
      icao24: `SIM${i.toString(16).padStart(6, '0')}`,
      callsign: r[4],
      country: r[5],
      longitude: r[0] + (r[2] - r[0]) * t,
      latitude: r[1] + (r[3] - r[1]) * t,
      altitude: 10000 + Math.sin(i * 1.3) * 3000,
      velocity: 240 + Math.sin(i) * 40,
      heading: Math.atan2(r[2] - r[0], r[3] - r[1]) * (180 / Math.PI),
      verticalRate: 0,
      onGround: false,
      simulated: true,
    };
  });
}

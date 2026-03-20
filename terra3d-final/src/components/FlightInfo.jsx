import React from 'react';
import { metersToFeet, msToKnots } from '../utils/cesiumHelpers.js';

const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪',
  'France': '🇫🇷', 'Japan': '🇯🇵', 'China': '🇨🇳', 'Australia': '🇦🇺',
  'Canada': '🇨🇦', 'Brazil': '🇧🇷', 'India': '🇮🇳', 'Russia': '🇷🇺',
  'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱',
  'United Arab Emirates': '🇦🇪', 'Singapore': '🇸🇬', 'Turkey': '🇹🇷',
  'South Korea': '🇰🇷', 'Mexico': '🇲🇽', 'Poland': '🇵🇱',
};

export default function FlightInfo({ flight, onClose }) {
  if (!flight) return null;

  const flag = COUNTRY_FLAGS[flight.country] || '✈';
  const alt = flight.altitude ? `${metersToFeet(flight.altitude)} ft` : 'N/A';
  const spd = flight.velocity ? `${msToKnots(flight.velocity)} kts` : 'N/A';
  const hdg = flight.heading != null ? `${Math.round(flight.heading)}°` : 'N/A';
  const vr = flight.verticalRate
    ? `${flight.verticalRate > 0 ? '▲' : '▼'} ${Math.abs(Math.round(flight.verticalRate))} m/s`
    : '—';

  return (
    <div style={s.panel} className="glass-panel">
      <div style={s.header}>
        <div style={s.flag}>{flag}</div>
        <div style={s.titles}>
          <div style={s.callsign}>{flight.callsign}</div>
          <div style={s.country}>{flight.country}</div>
        </div>
        <button style={s.close} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={s.divider} />

      <div style={s.grid}>
        <Stat icon="↑" label="Altitude" value={alt} accent="#00c8ff" />
        <Stat icon="→" label="Speed" value={spd} accent="#39ff8f" />
        <Stat icon="◎" label="Heading" value={hdg} accent="#ff6b35" />
        <Stat icon="⇅" label="V/S" value={vr} accent="#7ecfff" />
      </div>

      <div style={s.divider} />

      <div style={s.footer}>
        <span style={s.icao}>{flight.icao24?.toUpperCase()}</span>
        {flight.simulated && (
          <span style={s.simBadge}>SIMULATED</span>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }) {
  return (
    <div style={s.stat}>
      <span style={{ ...s.statIcon, color: accent }}>{icon}</span>
      <div>
        <div style={s.statLabel}>{label}</div>
        <div style={{ ...s.statValue, color: accent }}>{value}</div>
      </div>
    </div>
  );
}

const s = {
  panel: {
    width: 240,
    padding: '14px',
    animation: 'fadeUp 0.18s ease forwards',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  flag: { fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 },
  titles: { flex: 1 },
  callsign: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: '1.05rem',
    color: '#e8f4ff',
    letterSpacing: '-0.01em',
  },
  country: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.63rem',
    color: 'rgba(200,220,240,0.5)',
    marginTop: 1,
  },
  close: {
    width: 24, height: 24,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    cursor: 'pointer',
    color: 'rgba(200,220,240,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    background: 'rgba(0,200,255,0.1)',
    margin: '10px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 8px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 7,
  },
  statIcon: { fontSize: '0.9rem', flexShrink: 0 },
  statLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.58rem',
    color: 'rgba(200,220,240,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
    fontWeight: 500,
    marginTop: 1,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icao: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.62rem',
    color: 'rgba(200,220,240,0.3)',
    letterSpacing: '0.08em',
  },
  simBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.55rem',
    padding: '2px 6px',
    borderRadius: 4,
    background: 'rgba(255,107,53,0.15)',
    color: '#ff6b35',
    border: '1px solid rgba(255,107,53,0.3)',
    letterSpacing: '0.06em',
  },
};

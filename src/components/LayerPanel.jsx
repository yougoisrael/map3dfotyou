import React from 'react';

const LAYER_DEFS = [
  {
    key: 'flights',
    label: 'Flights',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
        <path d="M3 12l2-2 3 1 5-6 1 1-4 7-2-1-1 2-2-1-2 2V12z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
    color: '#00c8ff',
    type: 'toggle',
  },
  {
    key: 'cities',
    label: 'Cities',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
        <rect x="3" y="10" width="3" height="7" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8" y="6" width="4" height="11" stroke="currentColor" strokeWidth="1.3" />
        <rect x="14" y="8" width="3" height="9" stroke="currentColor" strokeWidth="1.3" />
        <line x1="2" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
    color: '#e8f4ff',
    type: 'toggle',
  },
  {
    key: 'weather',
    label: 'Weather',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
        <path d="M5 13a4 4 0 116.93-4H13a3 3 0 110 6H5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
    color: '#7ecfff',
    type: 'select',
    options: [
      { value: 'clouds', label: 'Clouds' },
      { value: 'wind', label: 'Wind' },
      { value: 'temp', label: 'Temp' },
    ],
  },
];

export default function LayerPanel({ layers, onToggle, flightCount, lastUpdated, flightLoading }) {
  return (
    <div style={s.panel} className="glass-panel">
      <div style={s.header}>
        <span style={s.headerLabel}>LAYERS</span>
        <span style={s.headerDot} />
      </div>

      {LAYER_DEFS.map((def) => (
        <div key={def.key} style={s.row}>
          <button
            style={{
              ...s.toggle,
              ...(layers[def.key] ? s.toggleOn : s.toggleOff),
              '--accent': def.color,
            }}
            onClick={() => onToggle(def.key, def.type === 'toggle' ? !layers[def.key] : layers[def.key] ? false : def.options[0].value)}
            title={`Toggle ${def.label}`}
          >
            <span style={{ color: layers[def.key] ? def.color : 'rgba(200,220,240,0.4)' }}>
              {def.icon}
            </span>
            <span style={{ ...s.toggleLabel, color: layers[def.key] ? '#e8f4ff' : 'rgba(200,220,240,0.45)' }}>
              {def.label}
            </span>
            <div style={{ ...s.pill, background: layers[def.key] ? def.color : 'rgba(255,255,255,0.08)' }} />
          </button>

          {/* Sub-options for weather */}
          {def.type === 'select' && layers[def.key] && (
            <div style={s.subOpts}>
              {def.options.map((opt) => (
                <button
                  key={opt.value}
                  style={{
                    ...s.subOpt,
                    ...(layers[def.key] === opt.value ? s.subOptActive : {}),
                  }}
                  onClick={() => onToggle(def.key, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Flight count badge */}
      {layers.flights && (
        <div style={s.statRow}>
          <span style={s.statLabel}>
            <span style={{ ...s.dot, background: flightLoading ? '#ff6b35' : '#39ff8f', animation: flightLoading ? 'none' : 'pulse-dot 2s infinite' }} />
            {flightLoading ? 'Updating…' : `${flightCount.toLocaleString()} aircraft`}
          </span>
          {lastUpdated && (
            <span style={s.statTime}>
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  panel: {
    width: 200,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(0,200,255,0.12)',
  },
  headerLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.62rem',
    letterSpacing: '0.14em',
    color: 'rgba(0,200,255,0.6)',
  },
  headerDot: {
    width: 6, height: 6,
    borderRadius: '50%',
    background: '#39ff8f',
    animation: 'pulse-dot 2s ease-in-out infinite',
  },
  row: { display: 'flex', flexDirection: 'column', gap: 4 },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.18s ease',
    background: 'transparent',
  },
  toggleOn: {
    background: 'rgba(0,200,255,0.06)',
    border: '1px solid rgba(0,200,255,0.18)',
  },
  toggleOff: {},
  toggleLabel: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '0.8rem',
    fontWeight: 500,
    flex: 1,
    textAlign: 'left',
  },
  pill: {
    width: 24, height: 12,
    borderRadius: 6,
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  subOpts: {
    display: 'flex',
    gap: 4,
    paddingLeft: 34,
    paddingBottom: 4,
  },
  subOpt: {
    padding: '3px 8px',
    borderRadius: 5,
    border: '1px solid rgba(0,200,255,0.15)',
    background: 'transparent',
    color: 'rgba(200,220,240,0.5)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'all 0.15s',
  },
  subOptActive: {
    background: 'rgba(126,207,255,0.15)',
    color: '#7ecfff',
    border: '1px solid rgba(126,207,255,0.35)',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTop: '1px solid rgba(0,200,255,0.08)',
  },
  statLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.65rem',
    color: 'rgba(200,220,240,0.6)',
  },
  statTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.6rem',
    color: 'rgba(200,220,240,0.35)',
  },
  dot: {
    display: 'inline-block',
    width: 6, height: 6,
    borderRadius: '50%',
  },
};

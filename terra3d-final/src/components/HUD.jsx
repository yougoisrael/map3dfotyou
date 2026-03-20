import React, { useState, useEffect } from 'react';

export default function HUD({ camera, cinematicMode, onToggleCinematic, onGoHome }) {
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtc(now.toUTCString().slice(17, 25) + ' UTC');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const lon = camera?.longitude?.toFixed(4) ?? '0.0000';
  const lat = camera?.latitude?.toFixed(4) ?? '0.0000';
  const alt = camera?.altitudeKm ?? '0';

  return (
    <>
      {/* Bottom-left coordinates */}
      <div style={s.coords} className="glass-panel">
        <Row label="LON" value={`${lon}°`} />
        <div style={s.divider} />
        <Row label="LAT" value={`${lat}°`} />
        <div style={s.divider} />
        <Row label="ALT" value={`${parseInt(alt, 10).toLocaleString()} km`} />
        <div style={s.divider} />
        <Row label="UTC" value={utc} />
      </div>

      {/* Bottom-right controls */}
      <div style={s.controls}>
        <HUDBtn
          title="Home"
          active={false}
          onClick={onGoHome}
          icon={
            <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
              <path d="M2 9l7-7 7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M4 7.5V15a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          }
        />
        <HUDBtn
          title="Cinematic mode"
          active={cinematicMode}
          onClick={onToggleCinematic}
          icon={
            <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.3" />
              {[0,60,120,180,240,300].map((deg) => (
                <line
                  key={deg}
                  x1={9 + 4.5 * Math.cos(deg * Math.PI / 180)}
                  y1={9 + 4.5 * Math.sin(deg * Math.PI / 180)}
                  x2={9 + 6.5 * Math.cos(deg * Math.PI / 180)}
                  y2={9 + 6.5 * Math.sin(deg * Math.PI / 180)}
                  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
                />
              ))}
            </svg>
          }
        />
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <span style={s.value}>{value}</span>
    </div>
  );
}

function HUDBtn({ title, active, onClick, icon }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        ...s.btn,
        ...(active ? s.btnActive : {}),
      }}
    >
      {icon}
    </button>
  );
}

const s = {
  coords: {
    position: 'fixed',
    bottom: 24,
    left: 24,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    zIndex: 200,
    minWidth: 190,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.6rem',
    letterSpacing: '0.12em',
    color: 'rgba(0,200,255,0.55)',
    userSelect: 'none',
  },
  value: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.72rem',
    color: '#e8f4ff',
    tabularNums: true,
    letterSpacing: '0.02em',
  },
  divider: {
    height: 1,
    background: 'rgba(0,200,255,0.08)',
  },
  controls: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    display: 'flex',
    gap: 8,
    zIndex: 200,
  },
  btn: {
    width: 40, height: 40,
    borderRadius: 10,
    background: 'rgba(4,12,24,0.8)',
    border: '1px solid rgba(0,200,255,0.2)',
    backdropFilter: 'blur(16px)',
    cursor: 'pointer',
    color: 'rgba(200,220,240,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.18s ease',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },
  btnActive: {
    background: 'rgba(0,200,255,0.12)',
    border: '1px solid rgba(0,200,255,0.45)',
    color: '#00c8ff',
    animation: 'glow-pulse 2s ease-in-out infinite',
  },
};

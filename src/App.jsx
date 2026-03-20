import React, { useState, useRef, useCallback, useEffect } from 'react';
import Globe from './components/Globe.jsx';
import SearchBar from './components/SearchBar.jsx';
import LayerPanel from './components/LayerPanel.jsx';
import HUD from './components/HUD.jsx';
import FlightInfo from './components/FlightInfo.jsx';
import { useFlights } from './hooks/useFlights.js';

const INITIAL_LAYERS = {
  flights: true,
  cities: true,
  weather: false, // false | 'clouds' | 'wind' | 'temp'
};

export default function App() {
  const globeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadStatus, setLoadStatus] = useState('Initialising renderer…');
  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [camera, setCamera] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [cinematicMode, setCinematicMode] = useState(false);

  // ── Flight data ────────────────────────────────────────────────────
  const { flights, loading: flightLoading, lastUpdated, count: flightCount } =
    useFlights(layers.flights);

  // ── Layer toggle handler ───────────────────────────────────────────
  const handleToggle = useCallback((key, value) => {
    setLayers((prev) => ({ ...prev, [key]: value }));
    if (key === 'flights' && !value) setSelectedFlight(null);
  }, []);

  // ── Fly-to handler ─────────────────────────────────────────────────
  const handleFlyTo = useCallback(({ longitude, latitude }) => {
    globeRef.current?.flyTo({ longitude, latitude, height: 300_000 });
  }, []);

  // ── Simulated load sequence ────────────────────────────────────────
  useEffect(() => {
    const steps = [
      [400,  'Loading Cesium terrain engine…'],
      [900,  'Fetching world imagery tiles…'],
      [1600, 'Configuring atmosphere shaders…'],
      [2200, 'Launching live data streams…'],
      [2800, 'Terra3D ready ✓'],
    ];

    steps.forEach(([ms, msg]) => {
      setTimeout(() => setLoadStatus(msg), ms);
    });

    setTimeout(() => setReady(true), 3200);
  }, []);

  return (
    <div style={s.root}>
      {/* ── 3D Globe ─────────────────────────────────────── */}
      <Globe
        ref={globeRef}
        flights={flights}
        layers={layers}
        onCameraChange={setCamera}
        onEntityClick={(e) => setSelectedFlight(e?.type === 'flight' ? e.data : null)}
        cinematicMode={cinematicMode}
      />

      {/* ── Loading screen ────────────────────────────────── */}
      {!ready && (
        <div className="loading-screen">
          <div style={s.loadLogo}>
            <span style={{ fontWeight: 800 }}>TERRA</span>
            <span style={{ color: '#00c8ff' }}>3D</span>
          </div>
          <div style={s.loadTagline}>Real-time Earth Intelligence Platform</div>
          <div className="loading-screen__ring" />
          <div className="loading-screen__status">{loadStatus}</div>

          {/* Decorative grid */}
          <div style={s.loadGrid}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ ...s.loadCell, animationDelay: `${i * 0.04}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Top toolbar ───────────────────────────────────── */}
      {ready && (
        <div style={s.topBar}>
          {/* Logo */}
          <div style={s.logo}>
            <div style={s.logoMark} />
            <span style={s.logoText}>TERRA<span style={s.logoAccent}>3D</span></span>
          </div>

          {/* Search */}
          <div style={s.searchWrap}>
            <SearchBar onFlyTo={handleFlyTo} />
          </div>

          {/* Status pill */}
          <div style={s.statusPill}>
            <span style={s.liveDot} />
            <span style={s.liveText}>LIVE</span>
          </div>
        </div>
      )}

      {/* ── Left panel: Layer controls ────────────────────── */}
      {ready && (
        <div style={s.leftPanel}>
          <LayerPanel
            layers={layers}
            onToggle={handleToggle}
            flightCount={flightCount}
            lastUpdated={lastUpdated}
            flightLoading={flightLoading}
          />
        </div>
      )}

      {/* ── Right panel: Flight info ──────────────────────── */}
      {ready && selectedFlight && (
        <div style={s.rightPanel}>
          <FlightInfo
            flight={selectedFlight}
            onClose={() => setSelectedFlight(null)}
          />
        </div>
      )}

      {/* ── HUD: Coordinates + controls ──────────────────── */}
      {ready && (
        <HUD
          camera={camera}
          cinematicMode={cinematicMode}
          onToggleCinematic={() => setCinematicMode((v) => !v)}
          onGoHome={() => globeRef.current?.goHome()}
        />
      )}

      {/* ── Cinematic mode overlay ────────────────────────── */}
      {ready && cinematicMode && (
        <div style={s.cinematicBadge}>
          <span style={s.cinematicDot} />
          CINEMATIC
        </div>
      )}

      {/* ── Attribution ──────────────────────────────────── */}
      {ready && (
        <div style={s.attribution}>
          Imagery © Esri · Terrain © Cesium Ion · Flights © OpenSky Network · Data © OpenStreetMap
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const s = {
  root: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#000509',
    fontFamily: "'Syne', sans-serif",
  },

  // Loading
  loadLogo: {
    fontSize: '3.2rem',
    fontWeight: 400,
    letterSpacing: '-0.02em',
    color: '#e8f4ff',
    lineHeight: 1,
    fontFamily: "'Syne', sans-serif",
  },
  loadTagline: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    color: 'rgba(0,200,255,0.5)',
    textTransform: 'uppercase',
    marginTop: -8,
  },
  loadGrid: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 3,
    opacity: 0.3,
  },
  loadCell: {
    width: 16, height: 16,
    background: 'rgba(0,200,255,0.4)',
    borderRadius: 2,
    animation: 'pulse-dot 1.5s ease-in-out infinite',
  },

  // Top bar
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: 16,
    background: 'linear-gradient(to bottom, rgba(0,5,9,0.85) 0%, transparent 100%)',
    zIndex: 300,
    pointerEvents: 'none',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    pointerEvents: 'auto',
  },
  logoMark: {
    width: 28, height: 28,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #00c8ff, #004080)',
    border: '1px solid rgba(0,200,255,0.4)',
    boxShadow: '0 0 12px rgba(0,200,255,0.4)',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '1.05rem',
    fontWeight: 800,
    letterSpacing: '0.04em',
    color: '#e8f4ff',
  },
  logoAccent: { color: '#00c8ff' },
  searchWrap: {
    flex: 1,
    maxWidth: 400,
    pointerEvents: 'auto',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    background: 'rgba(57,255,143,0.1)',
    border: '1px solid rgba(57,255,143,0.25)',
    borderRadius: 20,
    flexShrink: 0,
    pointerEvents: 'none',
  },
  liveDot: {
    display: 'inline-block',
    width: 7, height: 7,
    borderRadius: '50%',
    background: '#39ff8f',
    animation: 'pulse-dot 1.5s ease-in-out infinite',
  },
  liveText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.62rem',
    letterSpacing: '0.14em',
    color: '#39ff8f',
  },

  // Side panels
  leftPanel: {
    position: 'fixed',
    left: 24,
    top: 84,
    zIndex: 200,
    animation: 'fadeUp 0.4s ease 0.1s both',
  },
  rightPanel: {
    position: 'fixed',
    right: 24,
    top: 84,
    zIndex: 200,
    animation: 'fadeUp 0.25s ease both',
  },

  // Cinematic badge
  cinematicBadge: {
    position: 'fixed',
    top: 84,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 16px',
    background: 'rgba(0,200,255,0.08)',
    border: '1px solid rgba(0,200,255,0.3)',
    borderRadius: 20,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.14em',
    color: '#00c8ff',
    zIndex: 200,
    animation: 'fadeUp 0.2s ease both',
  },
  cinematicDot: {
    display: 'inline-block',
    width: 7, height: 7,
    borderRadius: '50%',
    background: '#00c8ff',
    animation: 'pulse-dot 1.5s ease-in-out infinite',
  },

  // Attribution
  attribution: {
    position: 'fixed',
    bottom: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.55rem',
    color: 'rgba(200,220,240,0.25)',
    whiteSpace: 'nowrap',
    zIndex: 100,
    letterSpacing: '0.04em',
    pointerEvents: 'none',
  },
};

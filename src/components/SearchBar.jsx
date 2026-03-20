import React, { useState, useRef, useEffect, useCallback } from 'react';
import { geocode } from '../services/geocodingService.js';

const QUICK_PLACES = [
  { name: 'New York', lon: -74.006, lat: 40.714 },
  { name: 'Tokyo', lon: 139.691, lat: 35.689 },
  { name: 'Dubai', lon: 55.296, lat: 25.276 },
  { name: 'Sydney', lon: 151.209, lat: -33.868 },
  { name: 'London', lon: -0.127, lat: 51.507 },
  { name: 'Cairo', lon: 31.235, lat: 30.044 },
];

export default function SearchBar({ onFlyTo }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await geocode(q);
      setResults(res.slice(0, 5));
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    setShowQuick(v.trim() === '');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 500);
  };

  const handleFocus = () => {
    setOpen(true);
    if (query.trim() === '') setShowQuick(true);
  };

  const select = (item) => {
    setQuery(item.name);
    setOpen(false);
    setResults([]);
    onFlyTo({ longitude: item.longitude ?? item.lon, latitude: item.latitude ?? item.lat });
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    if (e.key === 'Enter' && results[0]) select(results[0]);
  };

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('.search-bar')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="search-bar" style={styles.container}>
      <div style={styles.inputWrap}>
        <svg style={styles.icon} viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <line x1="14" y1="14" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKey}
          placeholder="Search city, country, coordinates…"
          style={styles.input}
          spellCheck={false}
          autoComplete="off"
        />
        {loading && <div style={styles.spinner} />}
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setShowQuick(false); }} style={styles.clearBtn} aria-label="Clear">
            ×
          </button>
        )}
      </div>

      {open && (showQuick || results.length > 0) && (
        <div style={styles.dropdown}>
          {showQuick && results.length === 0 && (
            <>
              <div style={styles.dropSection}>Quick jump</div>
              {QUICK_PLACES.map((p) => (
                <button key={p.name} style={styles.resultItem} onClick={() => select(p)}>
                  <svg style={styles.resultIcon} viewBox="0 0 16 16" fill="none">
                    <path d="M8 1C5.24 1 3 3.24 3 6c0 3.86 5 9 5 9s5-5.14 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  <span>{p.name}</span>
                </button>
              ))}
            </>
          )}
          {results.map((r, i) => (
            <button key={i} style={styles.resultItem} onClick={() => select(r)}>
              <svg style={styles.resultIcon} viewBox="0 0 16 16" fill="none">
                <path d="M8 1C5.24 1 3 3.24 3 6c0 3.86 5 9 5 9s5-5.14 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span style={styles.resultName}>{r.name}</span>
              {r.type && <span style={styles.resultType}>{r.type}</span>}
            </button>
          ))}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div style={styles.noResults}>No results for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: 380,
    zIndex: 100,
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(4, 12, 24, 0.82)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 200, 255, 0.22)',
    borderRadius: 10,
    padding: '0 12px',
    height: 44,
    gap: 8,
    boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,200,255,0.05)',
    transition: 'border-color 0.2s',
  },
  icon: {
    width: 16, height: 16,
    color: 'rgba(0, 200, 255, 0.6)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#e8f4ff',
    fontFamily: "'Syne', sans-serif",
    fontSize: '0.84rem',
    fontWeight: 400,
    '::placeholder': { color: 'rgba(200,220,240,0.4)' },
  },
  spinner: {
    width: 14, height: 14,
    border: '1.5px solid rgba(0,200,255,0.2)',
    borderTopColor: '#00c8ff',
    borderRadius: '50%',
    flexShrink: 0,
    animation: 'spin-slow 0.8s linear infinite',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(200,220,240,0.5)',
    fontSize: '1.1rem',
    lineHeight: 1,
    padding: '2px 4px',
    borderRadius: 4,
    ':hover': { color: '#e8f4ff' },
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    background: 'rgba(4, 12, 24, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,200,255,0.18)',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
    animation: 'fadeUp 0.15s ease forwards',
  },
  dropSection: {
    padding: '8px 14px 4px',
    fontSize: '0.65rem',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(0,200,255,0.5)',
  },
  resultItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#e8f4ff',
    fontFamily: "'Syne', sans-serif",
    fontSize: '0.82rem',
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  resultIcon: {
    width: 13, height: 13,
    color: 'rgba(0,200,255,0.5)',
    flexShrink: 0,
  },
  resultName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  resultType: {
    fontSize: '0.68rem',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'rgba(200,220,240,0.4)',
    textTransform: 'capitalize',
  },
  noResults: {
    padding: '12px 14px',
    fontSize: '0.78rem',
    color: 'rgba(200,220,240,0.4)',
    fontStyle: 'italic',
  },
};

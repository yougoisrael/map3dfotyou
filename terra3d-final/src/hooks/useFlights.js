import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFlights } from '../services/flightService.js';
import { FLIGHT_POLL_INTERVAL } from '../config.js';

export function useFlights(enabled) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const data = await fetchFlights();
      if (mountedRef.current) {
        setFlights(data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setFlights([]);
      return;
    }
    poll();
    timerRef.current = setInterval(poll, FLIGHT_POLL_INTERVAL);
    return () => {
      clearInterval(timerRef.current);
    };
  }, [enabled, poll]);

  useEffect(() => () => { mountedRef.current = false; }, []);

  return { flights, loading, error, lastUpdated, count: flights.length };
}

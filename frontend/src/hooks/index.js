import { useState, useEffect, useRef } from 'react';
import { fetchSnapshot, fetchAlerts, fetchFullPrediction } from '../api';

// Polls metric tree snapshot every 30s
export function useMetricTree(pollInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await fetchSnapshot();
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return { data, loading, error, refetch: load };
}

// WebSocket-based real-time alert subscription
export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

  useEffect(() => {
    // Also load initial alerts via HTTP
    fetchAlerts().then(res => {
      setAlerts(res.data.alerts || []);
    }).catch(() => {});

    // WebSocket for live updates
    const ws = new WebSocket(`${WS_URL}/ws/alerts`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data);
        setAlerts(prev => [alert, ...prev.slice(0, 19)]);
      } catch {}
    };

    ws.onerror = () => {};
    return () => ws.close();
  }, [WS_URL]);

  return { alerts };
}

// Fetches all 3 ML predictions
export function usePredictions() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFullPrediction()
      .then(res => setPredictions(res.data))
      .catch(() => setPredictions(null))
      .finally(() => setLoading(false));
  }, []);

  return { predictions, loading };
}

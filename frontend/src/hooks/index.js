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
      console.error('Metric tree fetch error:', e);
      setError(e.message || 'Failed to load metric tree');
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

// WebSocket-based real-time alert subscription (optional - graceful fallback)
export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

  useEffect(() => {
    // Load initial alerts via HTTP
    fetchAlerts().then(res => {
      setAlerts(res.data?.alerts || []);
    }).catch(err => {
      console.warn('Could not load alerts:', err);
      setAlerts([]);
    });

    // Attempt WebSocket connection (graceful degradation)
    try {
      const ws = new WebSocket(`${WS_URL}/ws/alerts`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data);
          setAlerts(prev => [alert, ...prev.slice(0, 19)]);
        } catch (e) {
          console.warn('Could not parse alert:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (e) {
      console.warn('WebSocket not available:', e);
      return () => {};
    }
  }, [WS_URL]);

  return { alerts };
}

// Fetches all 3 ML predictions with comprehensive error handling and console debugging
export function usePredictions() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log('usePredictions: Fetching from /api/predict/full...');
        
        const res = await fetchFullPrediction();
        console.log('usePredictions: Raw API response:', res);
        console.log('usePredictions: Response data:', res?.data);
        
        // CRITICAL FIX: Check for actual data and set it properly
        if (res?.data) {
          console.log('usePredictions: Setting predictions with data:', res.data);
          setPredictions(res.data);
          setError(null);
        } else {
          console.warn('usePredictions: No data in response');
          throw new Error('Invalid prediction data structure: ' + JSON.stringify(res));
        }
      } catch (e) {
        console.error('usePredictions: FETCH ERROR:', e);
        console.error('usePredictions: Error message:', e.message);
        console.error('usePredictions: Error stack:', e.stack);
        
        // Set empty structure as fallback
        console.log('usePredictions: Setting fallback prediction structure (empty)');
        setPredictions({
          summary: {
            predicted_delay_days: null,
            predicted_resolution_days: null,
            oem_impact_days: null,
            disruption_type: 'unknown',
            severity: 'unknown',
          },
        });
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();

    // Refresh predictions every 60s
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return { predictions, loading, error };
}


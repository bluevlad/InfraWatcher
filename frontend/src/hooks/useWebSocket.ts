import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketService } from '../services/websocket';
import type { DashboardSnapshot } from '../types';

export function useWebSocket() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const serviceRef = useRef<WebSocketService | null>(null);

  const handleStatusChange = useCallback((status: boolean) => {
    setConnected(status);
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/infra/ws`;

    const service = new WebSocketService(
      wsUrl,
      (msg) => {
        if (msg.type === 'snapshot') {
          setSnapshot(msg.data);
        }
      },
      handleStatusChange,
    );

    serviceRef.current = service;
    service.connect();

    return () => {
      service.disconnect();
    };
  }, [handleStatusChange]);

  return { snapshot, connected };
}

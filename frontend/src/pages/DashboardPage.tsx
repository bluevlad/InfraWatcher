import React, { useEffect, useState } from 'react';
import { Space, Spin, Typography } from 'antd';
import SystemSummary from '../components/dashboard/SystemSummary';
import ContainerCardGrid from '../components/dashboard/ContainerCardGrid';
import HealthCheckPanel from '../components/dashboard/HealthCheckPanel';
import { fetchContainers, fetchSystemMetrics, fetchHealthChecks } from '../services/api';
import type { ContainerInfo, SystemMetrics, HealthCheckResult, DashboardSnapshot, DashboardSummary } from '../types';

const { Text } = Typography;

interface DashboardPageProps {
  snapshot: DashboardSnapshot | null;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ snapshot }) => {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [system, setSystem] = useState<SystemMetrics | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Initial load via REST
  useEffect(() => {
    async function loadInitial() {
      try {
        const [c, s, h] = await Promise.all([
          fetchContainers(),
          fetchSystemMetrics(),
          fetchHealthChecks(),
        ]);
        setContainers(c);
        setSystem(s);
        setHealthChecks(h);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Update from WebSocket snapshot
  useEffect(() => {
    if (snapshot) {
      setContainers(snapshot.containers);
      setSystem(snapshot.system);
      setHealthChecks(snapshot.health_checks);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    }
  }, [snapshot]);

  const summary: DashboardSummary | null = snapshot?.summary ?? (system ? {
    total_containers: containers.length,
    running_containers: containers.filter(c => c.status === 'running').length,
    stopped_containers: containers.filter(c => c.status !== 'running').length,
    healthy_services: healthChecks.filter(h => h.status === 'healthy').length,
    unhealthy_services: healthChecks.filter(h => h.status === 'unhealthy').length,
    unknown_services: healthChecks.filter(h => h.status === 'unknown').length,
    total_cpu_percent: containers.reduce((s, c) => s + c.cpu_percent, 0),
    total_memory_percent: containers.length > 0
      ? containers.reduce((s, c) => s + c.memory_usage, 0) /
        Math.max(containers.reduce((s, c) => s + c.memory_limit, 0), 1) * 100
      : 0,
  } : null);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading dashboard...</Text>
        </div>
      </div>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ textAlign: 'right' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {lastUpdate}
        </Text>
      </div>
      <SystemSummary system={system} summary={summary} />
      <ContainerCardGrid containers={containers} />
      <HealthCheckPanel healthChecks={healthChecks} />
    </Space>
  );
};

export default DashboardPage;

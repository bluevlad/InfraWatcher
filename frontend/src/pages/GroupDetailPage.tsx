import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Col,
  Row,
  Statistic,
  Tag,
  Typography,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import type {
  DashboardSnapshot,
  ContainerMetricPoint,
  GroupSummary,
} from '../types';
import { fetchGroupSummary, fetchGroupMetrics } from '../services/api';
import { groupColors } from '../constants/colors';
import TimeRangeSelector, {
  type TimeRange,
  getIntervalForRange,
  getRangeStartISO,
} from '../components/common/TimeRangeSelector';
import MetricChart from '../components/charts/MetricChart';
import ContainerTable from '../components/dashboard/ContainerTable';
import HealthCheckPanel from '../components/dashboard/HealthCheckPanel';

const { Title } = Typography;

interface GroupDetailPageProps {
  snapshot: DashboardSnapshot | null;
}

const GroupDetailPage: React.FC<GroupDetailPageProps> = ({ snapshot }) => {
  const { groupName } = useParams<{ groupName: string }>();
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [metricsData, setMetricsData] = useState<ContainerMetricPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!groupName) return;
    try {
      const [summaryResult, metricsResult] = await Promise.all([
        fetchGroupSummary(groupName),
        fetchGroupMetrics(groupName, {
          start: getRangeStartISO(timeRange),
          interval: getIntervalForRange(timeRange),
        }),
      ]);
      setSummary(summaryResult);
      setMetricsData(metricsResult.data);
    } catch {
      // ignore
    }
  }, [groupName, timeRange]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Update summary from live snapshot
  useEffect(() => {
    if (!snapshot || !groupName) return;
    const groupContainers = snapshot.containers.filter((c) => c.group === groupName);
    const groupHealth = snapshot.health_checks.filter((h) => h.group === groupName);
    const running = groupContainers.filter((c) => c.status === 'running').length;
    const healthy = groupHealth.filter((h) => h.status === 'healthy').length;
    const unhealthy = groupHealth.filter((h) => h.status === 'unhealthy').length;
    const totalCpu = groupContainers.reduce((s, c) => s + c.cpu_percent, 0);
    const totalMemUsage = groupContainers.reduce((s, c) => s + c.memory_usage, 0);
    const totalMemLimit = groupContainers.reduce((s, c) => s + (c.memory_limit > 0 ? c.memory_limit : 0), 0);

    setSummary({
      group: groupName,
      container_count: groupContainers.length,
      running_count: running,
      stopped_count: groupContainers.length - running,
      healthy_count: healthy,
      unhealthy_count: unhealthy,
      total_cpu_percent: Math.round(totalCpu * 100) / 100,
      total_memory_percent: totalMemLimit > 0 ? Math.round((totalMemUsage / totalMemLimit) * 10000) / 100 : 0,
    });
  }, [snapshot, groupName]);

  if (!groupName) return null;

  const groupContainers = snapshot?.containers.filter((c) => c.group === groupName) ?? [];
  const groupHealthChecks = snapshot?.health_checks.filter((h) => h.group === groupName) ?? [];
  const color = groupColors[groupName] || '#8c8c8c';

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <Tag color={color} style={{ fontSize: 16, padding: '2px 12px' }}>{groupName}</Tag>
      </Title>

      {/* Group Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Containers"
              value={summary?.container_count ?? 0}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Running"
              value={summary?.running_count ?? 0}
              suffix={summary?.stopped_count ? <span style={{ fontSize: 14, color: '#ff4d4f' }}> / {summary.stopped_count} stopped</span> : undefined}
              valueStyle={{ color: '#52c41a' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Healthy"
              value={summary?.healthy_count ?? 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
              suffix={summary?.unhealthy_count ? <span style={{ fontSize: 14, color: '#ff4d4f' }}> / {summary.unhealthy_count} <CloseCircleOutlined /></span> : undefined}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="CPU / Memory"
              value={`${(summary?.total_cpu_percent ?? 0).toFixed(1)}%`}
              suffix={<span style={{ fontSize: 14, color: '#999' }}> / {(summary?.total_memory_percent ?? 0).toFixed(1)}%</span>}
              prefix={<PauseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Container List */}
      <div style={{ marginBottom: 16 }}>
        <ContainerTable containers={groupContainers} />
      </div>

      {/* Group Resource Trends */}
      <Card size="small" title="Group Resource Trends" style={{ marginBottom: 16 }}>
        <Spin spinning={loading}>
          <div style={{ marginBottom: 12 }}>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card size="small" title="Combined CPU">
                <MetricChart data={metricsData} type="cpu" />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card size="small" title="Combined Memory">
                <MetricChart data={metricsData} type="memory" />
              </Card>
            </Col>
          </Row>
        </Spin>
      </Card>

      {/* Health Check Status Grid */}
      {groupHealthChecks.length > 0 && (
        <HealthCheckPanel healthChecks={groupHealthChecks} />
      )}
    </div>
  );
};

export default GroupDetailPage;

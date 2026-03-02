import React from 'react';
import { Card, Col, Progress, Row, Statistic, Typography } from 'antd';
import {
  DashboardOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { SystemMetrics, DashboardSummary } from '../../types';

const { Text } = Typography;

interface SystemSummaryProps {
  system: SystemMetrics | null;
  summary: DashboardSummary | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return '#ff4d4f';
  if (percent >= 70) return '#faad14';
  return '#52c41a';
}

const SystemSummary: React.FC<SystemSummaryProps> = ({ system, summary }) => {
  if (!system) {
    return (
      <Card loading className="dashboard-card" />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {/* CPU */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="dashboard-card" size="small">
          <div style={{ textAlign: 'center' }}>
            <DashboardOutlined style={{ fontSize: 20, color: '#1890ff', marginBottom: 8 }} />
            <Progress
              type="dashboard"
              percent={system.cpu_percent}
              size={100}
              strokeColor={getProgressColor(system.cpu_percent)}
              format={(p) => `${p}%`}
            />
            <div className="metric-label">CPU ({system.cpu_count} cores)</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Load: {system.load_avg_1} / {system.load_avg_5} / {system.load_avg_15}
            </Text>
          </div>
        </Card>
      </Col>

      {/* Memory */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="dashboard-card" size="small">
          <div style={{ textAlign: 'center' }}>
            <CloudServerOutlined style={{ fontSize: 20, color: '#722ed1', marginBottom: 8 }} />
            <Progress
              type="dashboard"
              percent={system.memory_percent}
              size={100}
              strokeColor={getProgressColor(system.memory_percent)}
              format={(p) => `${p}%`}
            />
            <div className="metric-label">Memory</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatBytes(system.memory_used)} / {formatBytes(system.memory_total)}
            </Text>
          </div>
        </Card>
      </Col>

      {/* Disk */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="dashboard-card" size="small">
          <div style={{ textAlign: 'center' }}>
            <DatabaseOutlined style={{ fontSize: 20, color: '#fa8c16', marginBottom: 8 }} />
            <Progress
              type="dashboard"
              percent={system.disk_percent}
              size={100}
              strokeColor={getProgressColor(system.disk_percent)}
              format={(p) => `${p}%`}
            />
            <div className="metric-label">Disk</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatBytes(system.disk_used)} / {formatBytes(system.disk_total)}
            </Text>
          </div>
        </Card>
      </Col>

      {/* Containers Summary */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="dashboard-card" size="small">
          <Row gutter={[8, 16]}>
            <Col span={12}>
              <Statistic
                title="Running"
                value={summary?.running_containers ?? 0}
                suffix={`/ ${summary?.total_containers ?? 0}`}
                valueStyle={{ color: '#52c41a', fontSize: 22 }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Stopped"
                value={summary?.stopped_containers ?? 0}
                valueStyle={{ color: summary?.stopped_containers ? '#ff4d4f' : '#8c8c8c', fontSize: 22 }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Healthy"
                value={summary?.healthy_services ?? 0}
                valueStyle={{ color: '#52c41a', fontSize: 18 }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Unhealthy"
                value={summary?.unhealthy_services ?? 0}
                valueStyle={{ color: summary?.unhealthy_services ? '#ff4d4f' : '#8c8c8c', fontSize: 18 }}
              />
            </Col>
          </Row>
          <div className="metric-label" style={{ textAlign: 'center', marginTop: 4 }}>
            Uptime: {system.uptime}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default SystemSummary;

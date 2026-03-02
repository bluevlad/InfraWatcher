import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Col,
  Row,
  Tag,
  Progress,
  Typography,
  Tabs,
  Table,
  Select,
  Space,
  Descriptions,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type {
  DashboardSnapshot,
  ContainerInfo,
  ContainerMetricPoint,
  HealthCheckHistoryItem,
} from '../types';
import {
  fetchContainerMetrics,
  fetchContainerHealthchecks,
} from '../services/api';
import TimeRangeSelector, {
  type TimeRange,
  getIntervalForRange,
  getRangeStartISO,
} from '../components/common/TimeRangeSelector';
import MetricChart from '../components/charts/MetricChart';

const { Title, Text } = Typography;

interface ContainerDetailPageProps {
  snapshot: DashboardSnapshot | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const healthCheckColumns: ColumnsType<HealthCheckHistoryItem> = [
  {
    title: 'Time',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 170,
    render: (ts: string) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => (
      <Tag color={status === 'healthy' ? 'green' : status === 'unhealthy' ? 'red' : 'default'}>
        {status}
      </Tag>
    ),
  },
  {
    title: 'Type',
    dataIndex: 'health_type',
    key: 'health_type',
    width: 80,
  },
  {
    title: 'Response',
    dataIndex: 'response_time_ms',
    key: 'response_time_ms',
    width: 100,
    render: (v: number | null) => (v != null ? `${v}ms` : '-'),
  },
  {
    title: 'Status Code',
    dataIndex: 'status_code',
    key: 'status_code',
    width: 100,
    render: (v: number | null) => v ?? '-',
  },
  {
    title: 'Error',
    dataIndex: 'error',
    key: 'error',
    ellipsis: true,
    render: (v: string | null) => v ? <Text type="danger">{v}</Text> : '-',
  },
];

const ContainerDetailPage: React.FC<ContainerDetailPageProps> = ({ snapshot }) => {
  const { containerName } = useParams<{ containerName: string }>();
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [metricsData, setMetricsData] = useState<ContainerMetricPoint[]>([]);
  const [healthItems, setHealthItems] = useState<HealthCheckHistoryItem[]>([]);
  const [healthTotal, setHealthTotal] = useState(0);
  const [healthPage, setHealthPage] = useState(1);
  const [healthFilter, setHealthFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const container: ContainerInfo | undefined = snapshot?.containers.find(
    (c) => c.name === containerName,
  );

  const loadMetrics = useCallback(async () => {
    if (!containerName) return;
    try {
      const start = getRangeStartISO(timeRange);
      const interval = getIntervalForRange(timeRange);
      const result = await fetchContainerMetrics(containerName, { start, interval });
      setMetricsData(result.data);
    } catch {
      // ignore
    }
  }, [containerName, timeRange]);

  const loadHealthchecks = useCallback(async () => {
    if (!containerName) return;
    try {
      const result = await fetchContainerHealthchecks(containerName, {
        page: healthPage,
        size: 20,
        status: healthFilter,
      });
      setHealthItems(result.items);
      setHealthTotal(result.total);
    } catch {
      // ignore
    }
  }, [containerName, healthPage, healthFilter]);

  useEffect(() => {
    setLoading(true);
    loadMetrics().finally(() => setLoading(false));
  }, [loadMetrics]);

  useEffect(() => {
    loadHealthchecks();
  }, [loadHealthchecks]);

  if (!containerName) return null;

  const cpuColor = (container?.cpu_percent ?? 0) > 80 ? '#ff4d4f' : (container?.cpu_percent ?? 0) > 50 ? '#faad14' : '#52c41a';
  const memColor = (container?.memory_percent ?? 0) > 80 ? '#ff4d4f' : (container?.memory_percent ?? 0) > 50 ? '#faad14' : '#52c41a';

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>{containerName}</Title>

      {/* Basic Info + Realtime Gauges */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card size="small" title="Container Info">
            {container ? (
              <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Status">
                  <Tag color={container.status === 'running' ? 'green' : 'red'}>{container.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Group">
                  <Tag>{container.group}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Image">{container.image}</Descriptions.Item>
                <Descriptions.Item label="Uptime">{container.uptime}</Descriptions.Item>
                <Descriptions.Item label="Ports">{container.ports.length > 0 ? container.ports.join(', ') : '-'}</Descriptions.Item>
                <Descriptions.Item label="PIDs">{container.pids || '-'}</Descriptions.Item>
                <Descriptions.Item label="Network I/O">
                  Rx: {formatBytes(container.network_rx)} / Tx: {formatBytes(container.network_tx)}
                </Descriptions.Item>
                <Descriptions.Item label="Block I/O">
                  R: {formatBytes(container.block_read)} / W: {formatBytes(container.block_write)}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">Waiting for data...</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small" title="Current Usage">
            <Row gutter={16}>
              <Col span={12} style={{ textAlign: 'center' }}>
                <Progress
                  type="dashboard"
                  percent={Math.min(container?.cpu_percent ?? 0, 100)}
                  format={() => `${(container?.cpu_percent ?? 0).toFixed(1)}%`}
                  strokeColor={cpuColor}
                  size={100}
                />
                <div><Text type="secondary">CPU</Text></div>
              </Col>
              <Col span={12} style={{ textAlign: 'center' }}>
                <Progress
                  type="dashboard"
                  percent={Math.min(container?.memory_percent ?? 0, 100)}
                  format={() => `${(container?.memory_percent ?? 0).toFixed(1)}%`}
                  strokeColor={memColor}
                  size={100}
                />
                <div>
                  <Text type="secondary">Memory</Text>
                  {container && (
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {formatBytes(container.memory_usage)} / {formatBytes(container.memory_limit)}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Tabs: Metrics History / Health Check Log */}
      <Card size="small">
        <Tabs
          defaultActiveKey="metrics"
          items={[
            {
              key: 'metrics',
              label: 'Metrics History',
              children: (
                <Spin spinning={loading}>
                  <div style={{ marginBottom: 12 }}>
                    <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                  </div>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card size="small" title="CPU Usage">
                        <MetricChart data={metricsData} type="cpu" />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card size="small" title="Memory Usage">
                        <MetricChart data={metricsData} type="memory" />
                      </Card>
                    </Col>
                    <Col xs={24}>
                      <Card size="small" title="Network I/O">
                        <MetricChart data={metricsData} type="network" />
                      </Card>
                    </Col>
                  </Row>
                </Spin>
              ),
            },
            {
              key: 'healthchecks',
              label: 'Health Check Log',
              children: (
                <div>
                  <Space style={{ marginBottom: 12 }}>
                    <Select
                      placeholder="Filter by status"
                      allowClear
                      style={{ width: 150 }}
                      value={healthFilter}
                      onChange={(val) => {
                        setHealthFilter(val);
                        setHealthPage(1);
                      }}
                      options={[
                        { label: 'Healthy', value: 'healthy' },
                        { label: 'Unhealthy', value: 'unhealthy' },
                        { label: 'Unknown', value: 'unknown' },
                      ]}
                    />
                  </Space>
                  <Table<HealthCheckHistoryItem>
                    dataSource={healthItems}
                    columns={healthCheckColumns}
                    rowKey="id"
                    size="small"
                    pagination={{
                      current: healthPage,
                      total: healthTotal,
                      pageSize: 20,
                      onChange: setHealthPage,
                      showTotal: (total) => `Total ${total}`,
                      showSizeChanger: false,
                    }}
                    rowClassName={(record) => record.status === 'unhealthy' ? 'ant-table-row-warning' : ''}
                    scroll={{ x: 700 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ContainerDetailPage;

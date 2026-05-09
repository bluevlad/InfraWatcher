import React, { useEffect, useState, useCallback } from 'react';
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
} from '../../types';
import {
  fetchContainerMetrics,
  fetchContainerHealthchecks,
} from '../../services/api';
import {
  fetchContainerErrors,
  type ContainerErrorItem,
} from '../../services/loganalyzerApi';
import TimeRangeSelector, {
  type TimeRange,
  getIntervalForRange,
  getRangeStartISO,
} from '../common/TimeRangeSelector';
import MetricChart from '../charts/MetricChart';
import ContainerActionButtons from './ContainerActionButtons';

const { Text } = Typography;

interface ContainerDetailContentProps {
  containerName: string;
  snapshot: DashboardSnapshot | null;
  /** Drawer 등에 임베드 시 외부 헤더에 이름이 노출되므로 내부 타이틀 생략 가능 */
  showTitle?: boolean;
  /** 대시보드 연결 시각(ISO) — LogAnalyzer 에러 since 필터 기준 */
  connectedAt?: string;
}

const errorColumns: ColumnsType<ContainerErrorItem> = [
  {
    title: 'Time',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 170,
    render: (ts: string) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: 'Severity',
    dataIndex: 'severity',
    key: 'severity',
    width: 100,
    render: (sev: string) => {
      const color =
        sev === 'CRITICAL' ? 'red' : sev === 'HIGH' ? 'orange' : sev === 'MEDIUM' ? 'gold' : 'default';
      return <Tag color={color}>{sev}</Tag>;
    },
  },
  {
    title: 'Type',
    dataIndex: 'error_type',
    key: 'error_type',
    width: 140,
    render: (t: string | null) => t || '-',
  },
  {
    title: 'Message',
    dataIndex: 'message',
    key: 'message',
    ellipsis: true,
    render: (m: string) => <Text type="danger">{m}</Text>,
  },
];

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
  { title: 'Type', dataIndex: 'health_type', key: 'health_type', width: 80 },
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
    render: (v: string | null) => (v ? <Text type="danger">{v}</Text> : '-'),
  },
];

const ContainerDetailContent: React.FC<ContainerDetailContentProps> = ({
  containerName,
  snapshot,
  showTitle = false,
  connectedAt,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [metricsData, setMetricsData] = useState<ContainerMetricPoint[]>([]);
  const [healthItems, setHealthItems] = useState<HealthCheckHistoryItem[]>([]);
  const [healthTotal, setHealthTotal] = useState(0);
  const [healthPage, setHealthPage] = useState(1);
  const [healthFilter, setHealthFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [errorItems, setErrorItems] = useState<ContainerErrorItem[]>([]);
  const [errorTotal, setErrorTotal] = useState(0);
  const [errorLoading, setErrorLoading] = useState(false);
  const [errorUnavailable, setErrorUnavailable] = useState(false);

  const container: ContainerInfo | undefined = snapshot?.containers.find(
    (c) => c.name === containerName,
  );

  const loadMetrics = useCallback(async () => {
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

  const loadErrors = useCallback(async () => {
    setErrorLoading(true);
    setErrorUnavailable(false);
    try {
      const r = await fetchContainerErrors(containerName, connectedAt, 100);
      setErrorItems(r.items);
      setErrorTotal(r.total);
    } catch {
      setErrorUnavailable(true);
    } finally {
      setErrorLoading(false);
    }
  }, [containerName, connectedAt]);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  const cpuColor =
    (container?.cpu_percent ?? 0) > 80
      ? '#ff4d4f'
      : (container?.cpu_percent ?? 0) > 50
        ? '#faad14'
        : '#52c41a';
  const memColor =
    (container?.memory_percent ?? 0) > 80
      ? '#ff4d4f'
      : (container?.memory_percent ?? 0) > 50
        ? '#faad14'
        : '#52c41a';

  return (
    <div>
      {showTitle && (
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          {containerName}
        </Typography.Title>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            size="small"
            title="Container Info"
            extra={<ContainerActionButtons containerName={containerName} status={container?.status} />}
          >
            {container ? (
              <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Status">
                  <Tag color={container.status === 'running' ? 'green' : 'red'}>
                    {container.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Group">
                  <Tag>{container.group}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Image">{container.image}</Descriptions.Item>
                <Descriptions.Item label="Uptime">{container.uptime}</Descriptions.Item>
                <Descriptions.Item label="Ports">
                  {container.ports.length > 0 ? container.ports.join(', ') : '-'}
                </Descriptions.Item>
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
                <div>
                  <Text type="secondary">CPU</Text>
                </div>
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
                    rowClassName={(record) =>
                      record.status === 'unhealthy' ? 'ant-table-row-warning' : ''
                    }
                    scroll={{ x: 700 }}
                  />
                </div>
              ),
            },
            {
              key: 'errors',
              label: (
                <span>
                  Error Log{errorTotal > 0 ? ` (${errorTotal})` : ''}
                </span>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      기준: {connectedAt
                        ? `대시보드 연결 시각 (${dayjs(connectedAt).format('HH:mm:ss')})`
                        : '최근 24시간'}
                    </Text>
                  </Space>
                  {errorUnavailable ? (
                    <Text type="warning">
                      LogAnalyzer 백엔드 응답이 없어 에러 로그를 표시할 수 없습니다.
                    </Text>
                  ) : (
                    <Spin spinning={errorLoading}>
                      <Table<ContainerErrorItem>
                        dataSource={errorItems}
                        columns={errorColumns}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 20, showSizeChanger: false }}
                        scroll={{ x: 700 }}
                        locale={{
                          emptyText: '연결 시각 이후 수집된 에러가 없습니다.',
                        }}
                        expandable={{
                          rowExpandable: (r) => !!r.stack_trace,
                          expandedRowRender: (r) => (
                            <pre style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap' }}>
                              {r.stack_trace}
                            </pre>
                          ),
                        }}
                      />
                    </Spin>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ContainerDetailContent;

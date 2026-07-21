import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Card, Empty, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { AlertOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
  fetchLiveErrors,
  type ContainerErrorItem,
  type LiveErrorsResponse,
} from '../../services/loganalyzerApi';
import { groupColors } from '../../constants/colors';

const { Text } = Typography;

const POLL_INTERVAL_MS = 15_000;

const severityColors: Record<string, string> = {
  critical: 'red',
  high: 'volcano',
  medium: 'gold',
  low: 'blue',
};

interface RealtimeErrorFeedProps {
  onContainerClick?: (name: string) => void;
}

const RealtimeErrorFeed: React.FC<RealtimeErrorFeedProps> = ({ onContainerClick }) => {
  const [data, setData] = useState<LiveErrorsResponse | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const res = await fetchLiveErrors();
      setData(res);
      setUnavailable(false);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [load]);

  if (unavailable) {
    return (
      <Alert
        type="warning"
        showIcon
        message="LogAnalyzer 연결 실패"
        description="LogAnalyzer 백엔드(9092) 응답이 없어 실시간 에러 피드를 표시할 수 없습니다. 잠시 후 자동 재시도합니다."
      />
    );
  }

  const counts = data?.severity_counts;
  const hasErrors = (data?.total ?? 0) > 0;

  const columns = [
    {
      title: '시각',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (ts: string) => (
        <Text style={{ fontSize: 12 }}>{new Date(ts).toLocaleTimeString()}</Text>
      ),
    },
    {
      title: '컨테이너',
      dataIndex: 'container_name',
      key: 'container_name',
      width: 200,
      render: (name: string, record: ContainerErrorItem) => (
        <Tag
          color={groupColors[record.service_group] || 'default'}
          style={{ cursor: onContainerClick ? 'pointer' : 'default' }}
          onClick={() => onContainerClick?.(name)}
        >
          {name}
        </Tag>
      ),
    },
    {
      title: '심각도',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (sev: string) => (
        <Tag color={severityColors[(sev || '').toLowerCase()] || 'default'}>
          {(sev || 'unknown').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '메시지',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (msg: string, record: ContainerErrorItem) => (
        <Tooltip title={msg}>
          <Text style={{ fontSize: 12 }}>
            {record.error_type ? `[${record.error_type}] ` : ''}
            {msg}
          </Text>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <Space>
          <AlertOutlined />
          실시간 에러 피드
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
            최근 1시간 · 15초 자동 갱신
          </Text>
        </Space>
      }
      extra={
        <Space size={12}>
          {counts && (
            <Space size={8}>
              <Badge color="red" text={<Text style={{ fontSize: 12 }}>C {counts.critical}</Text>} />
              <Badge color="volcano" text={<Text style={{ fontSize: 12 }}>H {counts.high}</Text>} />
              <Badge color="gold" text={<Text style={{ fontSize: 12 }}>M {counts.medium}</Text>} />
              <Badge color="blue" text={<Text style={{ fontSize: 12 }}>L {counts.low}</Text>} />
            </Space>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            {lastRefresh}
          </Text>
        </Space>
      }
    >
      {hasErrors ? (
        <Table<ContainerErrorItem>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={loading}
          pagination={false}
          scroll={{ y: 240 }}
        />
      ) : (
        <Empty
          image={<CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />}
          imageStyle={{ height: 40 }}
          description={
            <Text type="secondary">
              {loading ? '에러 피드 로딩 중...' : '최근 1시간 내 관제 대상 서비스 에러 없음'}
            </Text>
          }
        />
      )}
    </Card>
  );
};

export default RealtimeErrorFeed;

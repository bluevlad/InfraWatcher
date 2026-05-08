import React, { useMemo } from 'react';
import { Row, Col, Card, Tag, Progress, Typography, Empty } from 'antd';
import { Link } from 'react-router-dom';
import { ClockCircleOutlined, RightOutlined } from '@ant-design/icons';
import type { ContainerInfo } from '../../types';
import { groupColors, groupOrder, getTier, tierOrder, tierMeta, type Tier } from '../../constants/colors';

const { Text } = Typography;

const formatStartedAt = (isoStr: string): string => {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '-';
  }
};

interface ContainerCardGridProps {
  containers: ContainerInfo[];
}

const statusColors: Record<string, string> = {
  running: 'green',
  exited: 'red',
  stopped: 'red',
  paused: 'orange',
  restarting: 'blue',
  created: 'default',
};

const strokeColor = (val: number) =>
  val > 80 ? '#ff4d4f' : val > 50 ? '#faad14' : '#52c41a';

const ContainerCard: React.FC<{ c: ContainerInfo }> = ({ c }) => (
  <Card
    size="small"
    style={c.status !== 'running' ? { borderLeft: '3px solid #ff4d4f' } : undefined}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <Tag
          color={statusColors[c.status] || 'default'}
          style={{ margin: 0, minWidth: 8, width: 8, height: 8, borderRadius: '50%', padding: 0, flexShrink: 0 }}
        />
        <Link to={`/container/${c.name}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Text strong style={{ fontSize: 13 }}>{c.name}</Text>
        </Link>
      </div>
      <Link to={`/container/${c.name}`}>
        <RightOutlined style={{ color: '#999', fontSize: 11 }} />
      </Link>
    </div>

    <div style={{ marginBottom: 8 }}>
      <Link to={`/group/${c.group}`}>
        <Tag color={groupColors[c.group] || 'default'} style={{ fontSize: 10, cursor: 'pointer' }}>
          {c.group}
        </Tag>
      </Link>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <Text type="secondary" style={{ fontSize: 11, width: 30, flexShrink: 0 }}>CPU</Text>
      <Progress
        percent={Math.min(c.cpu_percent, 100)}
        size="small"
        format={() => `${c.cpu_percent.toFixed(1)}%`}
        strokeColor={strokeColor(c.cpu_percent)}
        style={{ flex: 1, marginBottom: 0 }}
      />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 11, width: 30, flexShrink: 0 }}>MEM</Text>
      <Progress
        percent={Math.min(c.memory_percent, 100)}
        size="small"
        format={() => `${c.memory_percent.toFixed(1)}%`}
        strokeColor={strokeColor(c.memory_percent)}
        style={{ flex: 1, marginBottom: 0 }}
      />
    </div>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Tag color={statusColors[c.status] || 'default'}>{c.status}</Tag>
      <Text type="secondary" style={{ fontSize: 10 }}>
        <ClockCircleOutlined style={{ marginRight: 3 }} />
        {formatStartedAt(c.started_at)}
      </Text>
    </div>
  </Card>
);

const TierSection: React.FC<{ tier: Tier; containers: ContainerInfo[] }> = ({ tier, containers }) => {
  const meta = tierMeta[tier];
  const running = containers.filter((c) => c.status === 'running').length;
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 4px 10px',
          borderBottom: `2px solid ${meta.accent}`,
          marginBottom: 12,
        }}
      >
        <Text strong style={{ color: meta.accent, fontSize: 13, letterSpacing: 0.3 }}>
          {meta.label.toUpperCase()}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {meta.desc}
        </Text>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
          {running}/{containers.length} running
        </Text>
      </div>
      {containers.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="컨테이너 없음" />
      ) : (
        <Row gutter={[16, 16]}>
          {containers.map((c) => (
            <Col xs={24} sm={12} md={8} lg={6} key={c.name}>
              <ContainerCard c={c} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

const ContainerCardGrid: React.FC<ContainerCardGridProps> = ({ containers }) => {
  const byTier = useMemo(() => {
    const sorted = [...containers].sort((a, b) => {
      const gi = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
      if (gi !== 0) return gi;
      return a.name.localeCompare(b.name);
    });
    const buckets: Record<Tier, ContainerInfo[]> = { service: [], platform: [] };
    for (const c of sorted) buckets[getTier(c.group)].push(c);
    return buckets;
  }, [containers]);

  return (
    <Card className="dashboard-card" title="Containers" size="small">
      {tierOrder.map((tier) => (
        <TierSection key={tier} tier={tier} containers={byTier[tier]} />
      ))}
    </Card>
  );
};

export default ContainerCardGrid;

import React, { useMemo } from 'react';
import { Row, Col, Card, Tag, Progress, Typography, Empty } from 'antd';
import { Link } from 'react-router-dom';
import { ClockCircleOutlined, RightOutlined } from '@ant-design/icons';
import type { ContainerInfo } from '../../types';
import { groupColors, groupOrder, getTier, tierOrder, tierMeta, type Tier } from '../../constants/colors';

const UNKNOWN_GROUP_COLOR = '#8c8c8c';

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

    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, marginTop: 8 }}>
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

const GroupSubSection: React.FC<{ group: string; containers: ContainerInfo[] }> = ({ group, containers }) => {
  const color = groupColors[group] || UNKNOWN_GROUP_COLOR;
  const running = containers.filter((c) => c.status === 'running').length;
  return (
    <div style={{ marginBottom: 16, paddingLeft: 12, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Link to={`/group/${group}`} style={{ color }}>
          <Text strong style={{ fontSize: 13, color }}>{group}</Text>
        </Link>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
          {running}/{containers.length} running
        </Text>
      </div>
      <Row gutter={[16, 16]}>
        {containers.map((c) => (
          <Col xs={24} sm={12} md={8} lg={6} key={c.name}>
            <ContainerCard c={c} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

const TierSection: React.FC<{ tier: Tier; groups: string[]; byGroup: Record<string, ContainerInfo[]> }> = ({
  tier,
  groups,
  byGroup,
}) => {
  const meta = tierMeta[tier];
  const all = groups.flatMap((g) => byGroup[g] ?? []);
  const running = all.filter((c) => c.status === 'running').length;
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
          {running}/{all.length} running
        </Text>
      </div>
      {all.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="컨테이너 없음" />
      ) : (
        groups
          .filter((g) => (byGroup[g]?.length ?? 0) > 0)
          .map((g) => <GroupSubSection key={g} group={g} containers={byGroup[g]} />)
      )}
    </div>
  );
};

const ContainerCardGrid: React.FC<ContainerCardGridProps> = ({ containers }) => {
  const { byGroup, groupsByTier } = useMemo(() => {
    const byGroup: Record<string, ContainerInfo[]> = {};
    for (const c of containers) {
      (byGroup[c.group] ??= []).push(c);
    }
    for (const g of Object.keys(byGroup)) {
      byGroup[g].sort((a, b) => a.name.localeCompare(b.name));
    }

    const seen = new Set<string>();
    const orderedGroups: string[] = [];
    for (const g of groupOrder) {
      if (byGroup[g]) { orderedGroups.push(g); seen.add(g); }
    }
    for (const g of Object.keys(byGroup)) {
      if (!seen.has(g)) orderedGroups.push(g);
    }

    const groupsByTier: Record<Tier, string[]> = { service: [], platform: [] };
    for (const g of orderedGroups) groupsByTier[getTier(g)].push(g);

    return { byGroup, groupsByTier };
  }, [containers]);

  return (
    <Card className="dashboard-card" title="Containers" size="small">
      {tierOrder.map((tier) => (
        <TierSection key={tier} tier={tier} groups={groupsByTier[tier]} byGroup={byGroup} />
      ))}
    </Card>
  );
};

export default ContainerCardGrid;

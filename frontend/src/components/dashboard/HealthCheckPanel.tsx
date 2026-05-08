import React, { useMemo } from 'react';
import { Card, Col, Row, Tag, Tooltip, Typography, Empty } from 'antd';
import { Link } from 'react-router-dom';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  QuestionCircleFilled,
} from '@ant-design/icons';
import type { HealthCheckResult } from '../../types';
import { groupColors, groupOrder, getTier, tierOrder, tierMeta, type Tier } from '../../constants/colors';

const { Text } = Typography;

interface HealthCheckPanelProps {
  healthChecks: HealthCheckResult[];
}

const statusIcons: Record<string, React.ReactNode> = {
  healthy: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />,
  unhealthy: <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />,
  unknown: <QuestionCircleFilled style={{ color: '#d9d9d9', fontSize: 18 }} />,
};

const GroupCard: React.FC<{ group: string; checks: HealthCheckResult[] }> = ({ group, checks }) => (
  <Card
    size="small"
    title={
      <Link to={`/group/${group}`}>
        <Tag color={groupColors[group] || 'default'} style={{ cursor: 'pointer' }}>{group}</Tag>
      </Link>
    }
    style={{ borderRadius: 6 }}
  >
    {checks.map((hc) => (
      <Tooltip
        key={hc.container_name}
        title={
          <div>
            <div>Type: {hc.health_type}</div>
            {hc.port && <div>Port: {hc.port}</div>}
            {hc.path && <div>Path: {hc.path}</div>}
            {hc.response_time_ms != null && (
              <div>Response: {hc.response_time_ms}ms</div>
            )}
            {hc.status_code && <div>Status: {hc.status_code}</div>}
            {hc.error && <div>Error: {hc.error}</div>}
          </div>
        }
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
            borderBottom: '1px solid #f5f5f5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {statusIcons[hc.status] || statusIcons.unknown}
            <Link to={`/container/${hc.container_name}`}>
              <Text style={{ fontSize: 12 }}>{hc.container_name}</Text>
            </Link>
          </div>
          {hc.response_time_ms != null && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {hc.response_time_ms}ms
            </Text>
          )}
        </div>
      </Tooltip>
    ))}
  </Card>
);

const TierSection: React.FC<{ tier: Tier; grouped: Record<string, HealthCheckResult[]> }> = ({ tier, grouped }) => {
  const meta = tierMeta[tier];
  const orderedGroups = groupOrder.filter((g) => grouped[g] && getTier(g) === tier);
  const totalChecks = orderedGroups.reduce((s, g) => s + grouped[g].length, 0);
  const healthy = orderedGroups.reduce(
    (s, g) => s + grouped[g].filter((hc) => hc.status === 'healthy').length,
    0,
  );

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
          {healthy}/{totalChecks} healthy
        </Text>
      </div>
      {orderedGroups.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="헬스체크 대상 없음" />
      ) : (
        <Row gutter={[12, 12]}>
          {orderedGroups.map((group) => (
            <Col key={group} xs={24} sm={12} lg={8} xl={6}>
              <GroupCard group={group} checks={grouped[group]} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

const HealthCheckPanel: React.FC<HealthCheckPanelProps> = ({ healthChecks }) => {
  const grouped = useMemo(() => {
    return healthChecks.reduce<Record<string, HealthCheckResult[]>>((acc, hc) => {
      if (!acc[hc.group]) acc[hc.group] = [];
      acc[hc.group].push(hc);
      return acc;
    }, {});
  }, [healthChecks]);

  return (
    <Card className="dashboard-card" title="Health Checks" size="small">
      {tierOrder.map((tier) => (
        <TierSection key={tier} tier={tier} grouped={grouped} />
      ))}
    </Card>
  );
};

export default HealthCheckPanel;

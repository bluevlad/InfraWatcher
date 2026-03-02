import React from 'react';
import { Card, Col, Row, Tag, Tooltip, Typography } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  QuestionCircleFilled,
} from '@ant-design/icons';
import type { HealthCheckResult } from '../../types';

const { Text } = Typography;

interface HealthCheckPanelProps {
  healthChecks: HealthCheckResult[];
}

const statusIcons: Record<string, React.ReactNode> = {
  healthy: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />,
  unhealthy: <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />,
  unknown: <QuestionCircleFilled style={{ color: '#d9d9d9', fontSize: 18 }} />,
};

const groupColors: Record<string, string> = {
  Academy: '#1890ff',
  AllergyInsight: '#722ed1',
  CompanyAnalyzer: '#13c2c2',
  EduFit: '#52c41a',
  Tools: '#fa8c16',
  HopenVision: '#eb2f96',
  unmong: '#2f54eb',
  'DB/Infra': '#8c8c8c',
};

const HealthCheckPanel: React.FC<HealthCheckPanelProps> = ({ healthChecks }) => {
  // Group by group name
  const grouped = healthChecks.reduce<Record<string, HealthCheckResult[]>>((acc, hc) => {
    if (!acc[hc.group]) acc[hc.group] = [];
    acc[hc.group].push(hc);
    return acc;
  }, {});

  return (
    <Card className="dashboard-card" title="Health Checks" size="small">
      <Row gutter={[12, 12]}>
        {Object.entries(grouped).map(([group, checks]) => (
          <Col key={group} xs={24} sm={12} lg={8} xl={6}>
            <Card
              size="small"
              title={
                <Tag color={groupColors[group] || 'default'}>{group}</Tag>
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
                      <Text style={{ fontSize: 12 }}>{hc.container_name}</Text>
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
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default HealthCheckPanel;

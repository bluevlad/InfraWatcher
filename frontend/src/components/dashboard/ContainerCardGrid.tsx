import React from 'react';
import { Row, Col, Card, Tag, Progress, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import type { ContainerInfo } from '../../types';
import { groupColors, groupOrder } from '../../constants/colors';

const { Text } = Typography;

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

const ContainerCardGrid: React.FC<ContainerCardGridProps> = ({ containers }) => {
  const sorted = [...containers].sort((a, b) => {
    const gi = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
    if (gi !== 0) return gi;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card className="dashboard-card" title="Containers" size="small">
      <Row gutter={[16, 16]}>
        {sorted.map((c) => (
          <Col xs={24} sm={12} md={8} lg={6} key={c.name}>
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

              <div style={{ textAlign: 'center' }}>
                <Tag color={statusColors[c.status] || 'default'}>{c.status}</Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default ContainerCardGrid;

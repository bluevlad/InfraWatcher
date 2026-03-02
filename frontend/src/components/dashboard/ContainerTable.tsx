import React from 'react';
import { Card, Table, Tag, Progress, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ContainerInfo } from '../../types';
import { groupColors, groupOrder } from '../../constants/colors';

const { Text } = Typography;

interface ContainerTableProps {
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

const columns: ColumnsType<ContainerInfo> = [
  {
    title: 'Container',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, record) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag color={statusColors[record.status] || 'default'} style={{ margin: 0, minWidth: 10, width: 10, height: 10, borderRadius: '50%', padding: 0 }} />
        <div>
          <Link to={`/container/${name}`}>
            <Text strong style={{ fontSize: 13 }}>{name}</Text>
          </Link>
          <br />
          <Link to={`/group/${record.group}`}>
            <Tag color={groupColors[record.group] || 'default'} style={{ fontSize: 10, marginTop: 1, cursor: 'pointer' }}>
              {record.group}
            </Tag>
          </Link>
        </div>
      </div>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 90,
    render: (status: string) => (
      <Tag color={statusColors[status] || 'default'}>{status}</Tag>
    ),
  },
  {
    title: 'CPU',
    dataIndex: 'cpu_percent',
    key: 'cpu',
    width: 130,
    sorter: (a, b) => a.cpu_percent - b.cpu_percent,
    render: (val: number) => (
      <Progress
        percent={Math.min(val, 100)}
        size="small"
        format={() => `${val.toFixed(1)}%`}
        strokeColor={val > 80 ? '#ff4d4f' : val > 50 ? '#faad14' : '#52c41a'}
      />
    ),
  },
  {
    title: 'Memory',
    dataIndex: 'memory_percent',
    key: 'memory',
    width: 130,
    sorter: (a, b) => a.memory_percent - b.memory_percent,
    render: (val: number) => (
      <Progress
        percent={Math.min(val, 100)}
        size="small"
        format={() => `${val.toFixed(1)}%`}
        strokeColor={val > 80 ? '#ff4d4f' : val > 50 ? '#faad14' : '#52c41a'}
      />
    ),
  },
  {
    title: '',
    key: 'action',
    width: 40,
    render: (_: unknown, record) => (
      <Link to={`/container/${record.name}`}>
        <RightOutlined style={{ color: '#999' }} />
      </Link>
    ),
  },
];

const ContainerTable: React.FC<ContainerTableProps> = ({ containers }) => {
  const sorted = [...containers].sort((a, b) => {
    const gi = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
    if (gi !== 0) return gi;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card
      className="dashboard-card"
      title="Containers"
      size="small"
      styles={{ body: { padding: 0 } }}
    >
      <Table<ContainerInfo>
        dataSource={sorted}
        columns={columns}
        rowKey="name"
        size="small"
        pagination={false}
        scroll={{ x: 500 }}
        rowClassName={(record) => record.status !== 'running' ? 'ant-table-row-warning' : ''}
      />
    </Card>
  );
};

export default ContainerTable;

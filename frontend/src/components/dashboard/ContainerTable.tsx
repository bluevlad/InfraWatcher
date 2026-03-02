import React from 'react';
import { Card, Table, Tag, Progress, Typography } from 'antd';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { ContainerInfo } from '../../types';
import { groupColors, groupOrder } from '../../constants/colors';

const { Text } = Typography;

interface ContainerTableProps {
  containers: ContainerInfo[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
    fixed: 'left',
    width: 220,
    render: (name: string, record) => (
      <div>
        <Link to={`/container/${name}`}>
          <Text strong style={{ fontSize: 13 }}>{name}</Text>
        </Link>
        <br />
        <Link to={`/group/${record.group}`}>
          <Tag color={groupColors[record.group] || 'default'} style={{ fontSize: 11, marginTop: 2, cursor: 'pointer' }}>
            {record.group}
          </Tag>
        </Link>
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
    title: 'Uptime',
    dataIndex: 'uptime',
    key: 'uptime',
    width: 90,
    render: (val: string) => <Text type="secondary">{val}</Text>,
  },
  {
    title: 'CPU',
    dataIndex: 'cpu_percent',
    key: 'cpu',
    width: 120,
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
    key: 'memory',
    width: 150,
    sorter: (a, b) => a.memory_percent - b.memory_percent,
    render: (_: unknown, record) => (
      <div>
        <Progress
          percent={Math.min(record.memory_percent, 100)}
          size="small"
          format={() => `${record.memory_percent.toFixed(1)}%`}
          strokeColor={record.memory_percent > 80 ? '#ff4d4f' : record.memory_percent > 50 ? '#faad14' : '#52c41a'}
        />
        <Text type="secondary" style={{ fontSize: 11 }}>
          {formatBytes(record.memory_usage)} / {formatBytes(record.memory_limit)}
        </Text>
      </div>
    ),
  },
  {
    title: 'Network I/O',
    key: 'network',
    width: 130,
    render: (_: unknown, record) => (
      <Text type="secondary" style={{ fontSize: 12 }}>
        Rx: {formatBytes(record.network_rx)}<br />
        Tx: {formatBytes(record.network_tx)}
      </Text>
    ),
  },
  {
    title: 'PIDs',
    dataIndex: 'pids',
    key: 'pids',
    width: 60,
    render: (val: number) => val || '-',
  },
  {
    title: 'Ports',
    dataIndex: 'ports',
    key: 'ports',
    width: 150,
    render: (ports: string[]) => (
      <span style={{ fontSize: 11 }}>
        {ports.length > 0 ? ports.join(', ') : '-'}
      </span>
    ),
  },
];

const ContainerTable: React.FC<ContainerTableProps> = ({ containers }) => {
  // Sort by group, then by name within group
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
        scroll={{ x: 1000 }}
        rowClassName={(record) => record.status !== 'running' ? 'ant-table-row-warning' : ''}
      />
    </Card>
  );
};

export default ContainerTable;

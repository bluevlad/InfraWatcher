import React from 'react';
import {
  AreaChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import type { ContainerMetricPoint } from '../../types';

interface MetricChartProps {
  data: ContainerMetricPoint[];
  type: 'cpu' | 'memory' | 'network';
  height?: number;
}

function formatTime(ts: string): string {
  const d = dayjs(ts);
  return d.format('HH:mm');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const MetricChart: React.FC<MetricChartProps> = ({ data, type, height = 250 }) => {
  if (type === 'network') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} fontSize={11} />
          <YAxis tickFormatter={formatBytes} fontSize={11} />
          <Tooltip
            labelFormatter={(label) => dayjs(label).format('YYYY-MM-DD HH:mm')}
            formatter={(value: number, name: string) => [formatBytes(value), name === 'network_rx' ? 'RX' : 'TX']}
          />
          <Line type="monotone" dataKey="network_rx" stroke="#1890ff" name="network_rx" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="network_tx" stroke="#52c41a" name="network_tx" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const dataKey = type === 'cpu' ? 'cpu_percent' : 'memory_percent';
  const color = type === 'cpu' ? '#1890ff' : '#722ed1';
  const threshold = type === 'cpu' ? 90 : 85;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} fontSize={11} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
        <Tooltip
          labelFormatter={(label) => dayjs(label).format('YYYY-MM-DD HH:mm')}
          formatter={(value: number) => [`${value.toFixed(1)}%`, type === 'cpu' ? 'CPU' : 'Memory']}
        />
        <ReferenceLine y={threshold} stroke="#ff4d4f" strokeDasharray="3 3" label={{ value: `${threshold}%`, position: 'right', fontSize: 10, fill: '#ff4d4f' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} dot={false} strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MetricChart;

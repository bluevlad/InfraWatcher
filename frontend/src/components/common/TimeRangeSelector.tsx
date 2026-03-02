import React from 'react';
import { Radio, Space } from 'antd';
import dayjs from 'dayjs';

export type TimeRange = '1h' | '6h' | '24h' | '7d';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const options: { label: string; value: TimeRange }[] = [
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
];

export function getIntervalForRange(range: TimeRange): string {
  switch (range) {
    case '1h': return '1m';
    case '6h': return '5m';
    case '24h': return '15m';
    case '7d': return '1h';
  }
}

export function getRangeStartISO(range: TimeRange): string {
  const now = dayjs();
  switch (range) {
    case '1h': return now.subtract(1, 'hour').toISOString();
    case '6h': return now.subtract(6, 'hour').toISOString();
    case '24h': return now.subtract(24, 'hour').toISOString();
    case '7d': return now.subtract(7, 'day').toISOString();
  }
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  return (
    <Space>
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
        options={options}
      />
    </Space>
  );
};

export default TimeRangeSelector;

import React from 'react';
import { Badge, Typography } from 'antd';

const { Text } = Typography;

interface ConnectionStatusProps {
  connected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connected }) => {
  return (
    <Badge
      status={connected ? 'success' : 'error'}
      text={
        <Text style={{ color: '#ffffffd9', fontSize: 13 }}>
          {connected ? 'Live' : 'Disconnected'}
        </Text>
      }
    />
  );
};

export default ConnectionStatus;

import React from 'react';
import { Layout, Space, Typography } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import ConnectionStatus from '../dashboard/ConnectionStatus';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

interface HeaderProps {
  connected: boolean;
}

const Header: React.FC<HeaderProps> = ({ connected }) => {
  return (
    <AntHeader
      style={{
        background: '#001529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
      }}
    >
      <Space>
        <DesktopOutlined style={{ color: '#fff', fontSize: 20 }} />
        <Title level={4} style={{ color: '#fff', margin: 0, lineHeight: '56px' }}>
          InfraWatcher
        </Title>
      </Space>
      <ConnectionStatus connected={connected} />
    </AntHeader>
  );
};

export default Header;

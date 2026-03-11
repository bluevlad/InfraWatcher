import React from 'react';
import { Layout, Space, Typography, Button, Tooltip } from 'antd';
import { DesktopOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import ConnectionStatus from '../dashboard/ConnectionStatus';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

interface HeaderProps {
  connected: boolean;
}

const openWidget = () => {
  window.open(
    '/widget',
    'infrawatcher-widget',
    'width=380,height=820,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes',
  );
};

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
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Space>
          <DesktopOutlined style={{ color: '#fff', fontSize: 20 }} />
          <Title level={4} style={{ color: '#fff', margin: 0, lineHeight: '56px' }}>
            InfraWatcher
          </Title>
        </Space>
      </Link>
      <Space size={12}>
        <Tooltip title="Open monitoring widget">
          <Button
            type="text"
            icon={<AppstoreOutlined style={{ color: '#fff', fontSize: 16 }} />}
            onClick={openWidget}
            style={{ color: '#fff' }}
            size="small"
          />
        </Tooltip>
        <ConnectionStatus connected={connected} />
      </Space>
    </AntHeader>
  );
};

export default Header;

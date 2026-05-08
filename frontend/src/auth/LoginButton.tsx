import React from 'react';
import { Button, Dropdown, message, Spin, Typography } from 'antd';
import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';

const { Text } = Typography;

const LoginButton: React.FC = () => {
  const { user, loading, isAdmin, openLoginModal, logout } = useAuth();

  if (loading) {
    return <Spin size="small" style={{ color: '#fff' }} />;
  }

  if (user && isAdmin) {
    return (
      <Dropdown
        menu={{
          items: [
            { key: 'email', label: <Text type="secondary">{user.email}</Text>, disabled: true },
            { type: 'divider' },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Logout',
              onClick: () => {
                logout();
                message.info('Logged out');
              },
            },
          ],
        }}
        placement="bottomRight"
      >
        <Button type="text" icon={<UserOutlined />} style={{ color: '#fff' }} size="small">
          {user.name || 'Admin'}
        </Button>
      </Dropdown>
    );
  }

  return (
    <Button
      type="text"
      icon={<LoginOutlined />}
      onClick={() => openLoginModal()}
      style={{ color: '#fff' }}
      size="small"
    >
      Admin Login
    </Button>
  );
};

export default LoginButton;

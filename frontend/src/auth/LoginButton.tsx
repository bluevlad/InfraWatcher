import React, { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, message, Modal, Spin, Typography } from 'antd';
import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { fetchAuthConfig } from './api';

const { Text } = Typography;

const LoginButton: React.FC = () => {
  const { user, loading, isAdmin, loginWithGoogle, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modalOpen || clientId) return;
    fetchAuthConfig()
      .then((c) => setClientId(c.google_client_id || ''))
      .catch(() => setClientId(''));
  }, [modalOpen, clientId]);

  useEffect(() => {
    if (!modalOpen || !clientId || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        try {
          await loginWithGoogle(credential);
          setModalOpen(false);
          message.success('Admin login successful');
        } catch (e: unknown) {
          const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          message.error(detail || 'Login failed');
        }
      },
      auto_select: false,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 280,
    });
  }, [modalOpen, clientId, loginWithGoogle]);

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
    <>
      <Button
        type="text"
        icon={<LoginOutlined />}
        onClick={() => setModalOpen(true)}
        style={{ color: '#fff' }}
        size="small"
      >
        Admin Login
      </Button>
      <Modal
        title="Admin Login"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={360}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          {clientId === null && <Spin />}
          {clientId === '' && <Text type="danger">Auth not configured (GOOGLE_CLIENT_ID missing)</Text>}
          {clientId && <div ref={buttonRef} />}
          <Text type="secondary" style={{ fontSize: 11 }}>
            Authorized Google accounts only
          </Text>
        </div>
      </Modal>
    </>
  );
};

export default LoginButton;

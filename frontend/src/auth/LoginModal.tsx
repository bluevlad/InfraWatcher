import React, { useEffect, useRef, useState } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { useAuth } from './AuthContext';
import { fetchAuthConfig } from './api';

const { Text } = Typography;

const LoginModal: React.FC = () => {
  const { loginModalOpen, closeLoginModal, loginWithGoogle } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loginModalOpen || clientId !== null) return;
    fetchAuthConfig()
      .then((c) => setClientId(c.google_client_id || ''))
      .catch(() => setClientId(''));
  }, [loginModalOpen, clientId]);

  useEffect(() => {
    if (!loginModalOpen || !clientId || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        try {
          await loginWithGoogle(credential);
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
  }, [loginModalOpen, clientId, loginWithGoogle]);

  return (
    <Modal
      title="Admin Login"
      open={loginModalOpen}
      onCancel={closeLoginModal}
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
  );
};

export default LoginModal;

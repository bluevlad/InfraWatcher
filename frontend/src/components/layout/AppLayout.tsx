import React from 'react';
import { Layout } from 'antd';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  connected: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, connected }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header connected={connected} />
      <Content style={{ padding: '16px 24px', background: '#f0f2f5' }}>
        <Breadcrumbs />
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;

import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { Routes, Route, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ContainerDetailPage from './pages/ContainerDetailPage';
import GroupDetailPage from './pages/GroupDetailPage';
import WidgetPage from './pages/WidgetPage';
import GatewayLanding from './pages/gateway-landing/GatewayLanding';
import RequireAdmin from './auth/RequireAdmin';
import { useWebSocket } from './hooks/useWebSocket';

const App: React.FC = () => {
  const { snapshot, connected } = useWebSocket();
  const location = useLocation();

  // Widget page renders without AppLayout
  if (location.pathname === '/widget') {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: { borderRadius: 6 },
        }}
      >
        <WidgetPage snapshot={snapshot} connected={connected} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
        },
      }}
    >
      <Routes>
        <Route path="/" element={<GatewayLanding />} />
        <Route
          path="/dashboard"
          element={
            <AppLayout connected={connected}>
              <DashboardPage snapshot={snapshot} />
            </AppLayout>
          }
        />
        <Route
          path="/container/:containerName"
          element={
            <AppLayout connected={connected}>
              <RequireAdmin>
                <ContainerDetailPage snapshot={snapshot} />
              </RequireAdmin>
            </AppLayout>
          }
        />
        <Route
          path="/group/:groupName"
          element={
            <AppLayout connected={connected}>
              <RequireAdmin>
                <GroupDetailPage snapshot={snapshot} />
              </RequireAdmin>
            </AppLayout>
          }
        />
      </Routes>
    </ConfigProvider>
  );
};

export default App;

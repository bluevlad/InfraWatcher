import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { Routes, Route, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ContainerDetailPage from './pages/ContainerDetailPage';
import GroupDetailPage from './pages/GroupDetailPage';
import WidgetPage from './pages/WidgetPage';
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
      <AppLayout connected={connected}>
        <Routes>
          <Route path="/" element={<DashboardPage snapshot={snapshot} />} />
          <Route path="/container/:containerName" element={<ContainerDetailPage snapshot={snapshot} />} />
          <Route path="/group/:groupName" element={<GroupDetailPage snapshot={snapshot} />} />
        </Routes>
      </AppLayout>
    </ConfigProvider>
  );
};

export default App;

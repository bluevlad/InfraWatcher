import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ContainerDetailPage from './pages/ContainerDetailPage';
import GroupDetailPage from './pages/GroupDetailPage';
import { useWebSocket } from './hooks/useWebSocket';

const App: React.FC = () => {
  const { snapshot, connected } = useWebSocket();

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

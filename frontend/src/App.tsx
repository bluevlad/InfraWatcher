import React from 'react';
import { ConfigProvider, theme } from 'antd';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
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
        <DashboardPage snapshot={snapshot} />
      </AppLayout>
    </ConfigProvider>
  );
};

export default App;

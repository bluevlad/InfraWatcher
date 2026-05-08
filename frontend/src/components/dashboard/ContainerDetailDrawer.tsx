import React from 'react';
import { Drawer, Tag, Typography } from 'antd';
import type { DashboardSnapshot } from '../../types';
import ContainerDetailContent from './ContainerDetailContent';

const { Text } = Typography;

interface ContainerDetailDrawerProps {
  containerName: string | null;
  snapshot: DashboardSnapshot | null;
  onClose: () => void;
}

const ContainerDetailDrawer: React.FC<ContainerDetailDrawerProps> = ({
  containerName,
  snapshot,
  onClose,
}) => {
  const container = containerName
    ? snapshot?.containers.find((c) => c.name === containerName)
    : undefined;

  return (
    <Drawer
      title={
        containerName ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {container && (
              <Tag color={container.status === 'running' ? 'green' : 'red'}>
                {container.status}
              </Tag>
            )}
            <Text strong>{containerName}</Text>
            {container && <Tag>{container.group}</Tag>}
          </span>
        ) : (
          ''
        )
      }
      placement="right"
      width="70%"
      open={!!containerName}
      onClose={onClose}
      destroyOnClose
    >
      {containerName && (
        <ContainerDetailContent containerName={containerName} snapshot={snapshot} />
      )}
    </Drawer>
  );
};

export default ContainerDetailDrawer;

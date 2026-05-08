import React from 'react';
import { Drawer, Tag, Typography } from 'antd';
import type { DashboardSnapshot } from '../../types';
import { groupColors } from '../../constants/colors';
import GroupDetailContent from './GroupDetailContent';

const { Text } = Typography;

interface GroupDetailDrawerProps {
  groupName: string | null;
  snapshot: DashboardSnapshot | null;
  onClose: () => void;
  onContainerClick: (name: string) => void;
}

const GroupDetailDrawer: React.FC<GroupDetailDrawerProps> = ({
  groupName,
  snapshot,
  onClose,
  onContainerClick,
}) => {
  const color = groupName ? groupColors[groupName] || '#8c8c8c' : '#8c8c8c';

  return (
    <Drawer
      title={
        groupName ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag color={color} style={{ fontSize: 14, padding: '2px 12px' }}>
              <Text strong style={{ color: '#fff' }}>{groupName}</Text>
            </Tag>
          </span>
        ) : (
          ''
        )
      }
      placement="right"
      width="70%"
      open={!!groupName}
      onClose={onClose}
      destroyOnClose
    >
      {groupName && (
        <GroupDetailContent
          groupName={groupName}
          snapshot={snapshot}
          onContainerClick={onContainerClick}
        />
      )}
    </Drawer>
  );
};

export default GroupDetailDrawer;

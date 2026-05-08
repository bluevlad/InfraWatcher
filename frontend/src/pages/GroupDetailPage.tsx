import React from 'react';
import { useParams } from 'react-router-dom';
import type { DashboardSnapshot } from '../types';
import GroupDetailContent from '../components/dashboard/GroupDetailContent';

interface GroupDetailPageProps {
  snapshot: DashboardSnapshot | null;
}

const GroupDetailPage: React.FC<GroupDetailPageProps> = ({ snapshot }) => {
  const { groupName } = useParams<{ groupName: string }>();
  if (!groupName) return null;
  return <GroupDetailContent groupName={groupName} snapshot={snapshot} showTitle />;
};

export default GroupDetailPage;

import React from 'react';
import { useParams } from 'react-router-dom';
import type { DashboardSnapshot } from '../types';
import ContainerDetailContent from '../components/dashboard/ContainerDetailContent';

interface ContainerDetailPageProps {
  snapshot: DashboardSnapshot | null;
}

const ContainerDetailPage: React.FC<ContainerDetailPageProps> = ({ snapshot }) => {
  const { containerName } = useParams<{ containerName: string }>();
  if (!containerName) return null;
  return <ContainerDetailContent containerName={containerName} snapshot={snapshot} showTitle />;
};

export default ContainerDetailPage;

import React from 'react';
import { Breadcrumb } from 'antd';
import { Link, useLocation, useParams } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const params = useParams();

  if (location.pathname === '/') return null;

  const items: { title: React.ReactNode }[] = [
    {
      title: <Link to="/"><HomeOutlined /> Dashboard</Link>,
    },
  ];

  if (params.containerName) {
    items.push({ title: `Container: ${params.containerName}` });
  } else if (params.groupName) {
    items.push({ title: `Group: ${params.groupName}` });
  }

  return (
    <Breadcrumb style={{ marginBottom: 12 }} items={items} />
  );
};

export default Breadcrumbs;

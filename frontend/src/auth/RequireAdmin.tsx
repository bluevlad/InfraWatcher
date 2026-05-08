import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * 라우트 가드 — 비관리자가 직접 URL로 진입한 경우 로그인 유도.
 * - 로딩 중: spinner
 * - 비관리자: /dashboard로 리다이렉트하면서 search param에 원래 path 정보 보존,
 *   로그인 모달 열기. 로그인 성공 시 원래 path로 복귀.
 * - 관리자: children 그대로 렌더
 */
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || isAdmin) return;
    const target = location.pathname + location.search;
    openLoginModal(() => {
      navigate(target, { replace: true });
    });
    navigate('/dashboard', { replace: true });
  }, [loading, isAdmin, location.pathname, location.search, navigate, openLoginModal]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!isAdmin) return null;
  return <>{children}</>;
};

export default RequireAdmin;

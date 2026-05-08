import { useCallback } from 'react';
import { useAuth } from './AuthContext';

/**
 * 관리자 전용 액션 래퍼.
 * - 관리자: action 즉시 실행
 * - 비관리자: 로그인 모달 열기 → 로그인 성공 시 action 실행
 */
export function useAdminAction() {
  const { isAdmin, openLoginModal } = useAuth();
  return useCallback(
    (action: () => void) => {
      if (isAdmin) action();
      else openLoginModal(action);
    },
    [isAdmin, openLoginModal],
  );
}

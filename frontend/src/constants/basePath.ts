/**
 * Vite base URL에서 trailing slash를 제거한 base path.
 * - 서브도메인 배포 (infrawatcher.unmong.com): ''
 * - 서브패스 배포 (admin.unmong.com/infra/): '/infra'
 *
 * VITE_BASE_PATH 환경변수로 빌드 시 결정됨 (기본값: '/')
 */
const raw = import.meta.env.BASE_URL;
export const basePath = raw === '/' ? '' : raw.replace(/\/$/, '');

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './GatewayLanding.css';

type Level = 'public' | 'member' | 'admin';
type AccessState = 'granted' | 'member-locked' | 'admin-locked';

interface Feature {
  icon: string;
  name: string;
  desc: string;
  level: Level;
  to: string;
  external?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: '📡',
    name: '실시간 대시보드',
    desc: '전체 컨테이너 상태·CPU/메모리 사용량을 WebSocket 실시간 스트림으로 모니터링',
    level: 'public',
    to: '/dashboard',
  },
  {
    icon: '🟢',
    name: '헬스체크',
    desc: '컨테이너별 헬스 상태 자동 점검과 이상 감지 — 그룹/개별 단위 추적',
    level: 'public',
    to: '/dashboard',
  },
  {
    icon: '📂',
    name: '그룹 관리',
    desc: '서비스 그룹별 컨테이너 묶음 보기 — 의존 관계와 영향 범위 시각화',
    level: 'public',
    to: '/dashboard',
  },
  {
    icon: '🔌',
    name: 'API Docs',
    desc: 'Swagger UI 기반 OpenAPI 명세 — 컨테이너 상태 조회 REST API',
    level: 'public',
    to: '/api/docs',
    external: true,
  },
];

interface Tech { name: string; dot: string; }
const TECH_STACK: Tech[] = [
  { name: 'React 18 + Vite', dot: '#61dafb' },
  { name: 'TypeScript', dot: '#3178c6' },
  { name: 'Ant Design 5', dot: '#1677ff' },
  { name: 'FastAPI', dot: '#009688' },
  { name: 'WebSocket', dot: '#7c3aed' },
  { name: 'Docker Engine API', dot: '#2496ed' },
  { name: 'APScheduler', dot: '#10b981' },
  { name: 'psutil', dot: '#eab308' },
  { name: 'SQLite (WAL)', dot: '#003b57' },
  { name: 'Recharts', dot: '#ff6f61' },
  { name: 'Nginx', dot: '#f97316' },
];

interface Connected { name: string; role: string; href: string; dot: string; }
const CONNECTED_SERVICES: Connected[] = [
  { name: 'AllergyInsight', role: '모니터링 대상', href: 'https://allergy.unmong.com/', dot: '#f43f5e' },
  { name: 'NewsLetterPlatform', role: '모니터링 대상', href: 'https://newsletter.unmong.com/', dot: '#ec4899' },
  { name: 'EduFit', role: '모니터링 대상', href: 'https://edufit.unmong.com/', dot: '#22c55e' },
  { name: 'HopenVision', role: '모니터링 대상', href: 'https://hopenvision.unmong.com/', dot: '#3b82f6' },
  { name: 'StandUp', role: '모니터링 대상', href: 'https://standup.unmong.com/', dot: '#14b8a6' },
  { name: 'QA-Agent', role: '품질 자동 테스트', href: 'https://qadashboard.unmong.com/', dot: '#8b5cf6' },
  { name: 'LogAnalyzer', role: '로그 연계', href: 'https://loganalyzer.unmong.com/', dot: '#f59e0b' },
];

interface AuthState { isAuthenticated: boolean; isAdmin: boolean; }

function accessFor(level: Level, { isAuthenticated, isAdmin }: AuthState): AccessState {
  if (level === 'public') return 'granted';
  if (level === 'member') return isAuthenticated ? 'granted' : 'member-locked';
  if (level === 'admin') return isAdmin ? 'granted' : 'admin-locked';
  return 'granted';
}

interface TagInfo { label: string; variant: string; }
function tagInfo(state: AccessState, level: Level): TagInfo {
  if (state === 'granted' && level === 'public') return { label: '🌐 공개', variant: 'public' };
  if (state === 'granted') return { label: '✓ 사용 가능', variant: 'granted' };
  if (state === 'member-locked') return { label: '🔒 회원전용', variant: 'member-locked' };
  if (state === 'admin-locked') return { label: '🔐 관리자 전용', variant: 'admin-locked' };
  return { label: '', variant: '' };
}

interface ToastModel { icon: string; message: string; actionLabel: string; actionTo: string; }
function lockedToastFor(state: AccessState): ToastModel | null {
  if (state === 'member-locked') {
    return { icon: '🔒', message: '회원전용 서비스입니다', actionLabel: '로그인', actionTo: '/login' };
  }
  if (state === 'admin-locked') {
    return { icon: '🔐', message: '관리자 전용입니다', actionLabel: '관리자 로그인', actionTo: '/admin/login' };
  }
  return null;
}

interface FeatureCardProps {
  feature: Feature;
  accessState: AccessState;
  onLocked: (state: AccessState) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, accessState, onLocked }) => {
  const locked = accessState !== 'granted';
  const { label, variant } = tagInfo(accessState, feature.level);

  const handleClick = (e: React.MouseEvent) => {
    if (locked) {
      e.preventDefault();
      onLocked(accessState);
    }
  };

  const inner = (
    <>
      {locked && <span className="sl-feature-lock" aria-hidden="true">🔒</span>}
      <span className="sl-feature-icon" aria-hidden="true">{feature.icon}</span>
      <div className="sl-feature-name">{feature.name}</div>
      <div className="sl-feature-desc">{feature.desc}</div>
      <span className={`sl-feature-tag sl-feature-tag--${variant}`}>{label}</span>
    </>
  );

  const commonProps = {
    className: 'sl-feature',
    'data-locked': locked ? 'true' : 'false',
    onClick: handleClick,
  };

  if (feature.external) {
    return (
      <a {...commonProps} href={feature.to} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  if (locked) {
    return (
      <a {...commonProps} href={feature.to}>
        {inner}
      </a>
    );
  }
  return (
    <Link {...commonProps} to={feature.to}>
      {inner}
    </Link>
  );
};

interface ToastProps { toast: ToastModel | null; onClose: () => void; }
const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className="sl-toast" role="status" aria-live="polite">
      <span className="sl-toast-icon" aria-hidden="true">{toast.icon}</span>
      <span className="sl-toast-msg">{toast.message}</span>
      <Link className="sl-toast-action" to={toast.actionTo} onClick={onClose}>
        {toast.actionLabel} →
      </Link>
      <button type="button" className="sl-toast-close" onClick={onClose} aria-label="닫기">×</button>
    </div>
  );
};

const GatewayLanding: React.FC = () => {
  const [toast, setToast] = useState<ToastModel | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLocked = useCallback((accessState: AccessState) => {
    const next = lockedToastFor(accessState);
    if (next) setToast(next);
  }, []);

  const authState: AuthState = { isAuthenticated: false, isAdmin: false };

  return (
    <div className="gateway-landing-root">
      <div className="sl-container">
        <section className="sl-hero">
          <h1>InfraWatcher</h1>
          <p className="tagline">Docker Container Monitoring · Real-time Dashboard</p>
          <p className="desc">
            Docker 컨테이너의 실시간 상태를 WebSocket 으로 스트리밍하고, 이상 감지 시 알림을 제공하는 인프라 관제 시스템 — 전체 서비스 헬스 상태를 한 화면에서 확인
          </p>
        </section>

        <section className="sl-section">
          <div className="sl-section-title">Features</div>
          <div className="sl-features">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.name}
                feature={feature}
                accessState={accessFor(feature.level, authState)}
                onLocked={handleLocked}
              />
            ))}
          </div>
        </section>

        <section className="sl-section sl-arch">
          <div className="sl-section-title">Architecture</div>
          <div className="sl-arch-diagram">
            <div className="sl-arch-node">
              <div className="sl-arch-node-label">Docker Engine</div>
              <div className="sl-arch-node-tech">Socket API<br /><span className="sl-arch-node-tech-sub">컨테이너 메트릭</span></div>
            </div>
            <div className="sl-arch-arrow">→</div>
            <div className="sl-arch-node highlight">
              <div className="sl-arch-node-label">Backend</div>
              <div className="sl-arch-node-tech">FastAPI<br /><span className="sl-arch-node-tech-sub">+ WebSocket</span></div>
            </div>
            <div className="sl-arch-arrow">→</div>
            <div className="sl-arch-node">
              <div className="sl-arch-node-label">Storage</div>
              <div className="sl-arch-node-tech">SQLite<br /><span className="sl-arch-node-tech-sub">상태 이력</span></div>
            </div>
            <div className="sl-arch-arrow">←</div>
            <div className="sl-arch-node">
              <div className="sl-arch-node-label">Frontend</div>
              <div className="sl-arch-node-tech">React + AntD<br /><span className="sl-arch-node-tech-sub">실시간 시각화</span></div>
            </div>
          </div>
        </section>

        <section className="sl-section sl-flow">
          <div className="sl-section-title">Service Flow</div>
          <div className="sl-flow-steps">
            <div className="sl-flow-step">
              <div className="sl-flow-step-num">1</div>
              <div className="sl-flow-step-label">Docker 연결</div>
              <div className="sl-flow-step-desc">Socket API 접근</div>
            </div>
            <div className="sl-flow-arrow">→</div>
            <div className="sl-flow-step">
              <div className="sl-flow-step-num">2</div>
              <div className="sl-flow-step-label">상태 수집</div>
              <div className="sl-flow-step-desc">컨테이너 메트릭</div>
            </div>
            <div className="sl-flow-arrow">→</div>
            <div className="sl-flow-step">
              <div className="sl-flow-step-num">3</div>
              <div className="sl-flow-step-label">이상 감지</div>
              <div className="sl-flow-step-desc">헬스체크 분석</div>
            </div>
            <div className="sl-flow-arrow">→</div>
            <div className="sl-flow-step">
              <div className="sl-flow-step-num">4</div>
              <div className="sl-flow-step-label">대시보드</div>
              <div className="sl-flow-step-desc">실시간 스트림</div>
            </div>
          </div>
        </section>

        <section className="sl-section sl-tech">
          <div className="sl-section-title">Tech Stack</div>
          <div className="sl-tech-list">
            {TECH_STACK.map((tech) => (
              <span className="sl-tech-badge" key={tech.name}>
                <span className="sl-tech-dot" style={{ background: tech.dot }} />
                {tech.name}
              </span>
            ))}
          </div>
        </section>

        <section className="sl-section sl-connected">
          <div className="sl-section-title">Connected Services</div>
          <div className="sl-connected-grid">
            {CONNECTED_SERVICES.map((svc) => (
              <a
                key={svc.name}
                href={svc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="sl-connected-card"
              >
                <span className="sl-connected-dot" style={{ background: svc.dot }} />
                <div className="sl-connected-info">
                  <div className="sl-connected-name">{svc.name}</div>
                  <div className="sl-connected-role">{svc.role}</div>
                </div>
                <span className="sl-connected-arrow">→</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default GatewayLanding;

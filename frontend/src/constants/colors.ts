export const groupColors: Record<string, string> = {
  AllergyInsight: '#722ed1',
  NewsletterPlatform: '#fa8c16',
  HopenVision: '#eb2f96',
  unmong: '#2f54eb',
  Standup: '#13c2c2',
  'DB/Infra': '#8c8c8c',
  'Host Services': '#d4380d',
};

export const groupOrder = [
  'AllergyInsight',
  'NewsletterPlatform',
  'HopenVision',
  'unmong',
  'Standup',
  'DB/Infra',
  'Host Services',
];

export type Tier = 'service' | 'platform';

export const groupTier: Record<string, Tier> = {
  AllergyInsight: 'service',
  NewsletterPlatform: 'service',
  HopenVision: 'service',
  unmong: 'service',
  Standup: 'service',
  'DB/Infra': 'platform',
  'Host Services': 'platform',
};

export const tierOrder: Tier[] = ['service', 'platform'];

export const tierMeta: Record<Tier, { label: string; desc: string; accent: string }> = {
  service: {
    label: 'Services',
    desc: '사용자 서비스 그룹 — 장애 시 비즈니스 영향 직결',
    accent: '#1677ff',
  },
  platform: {
    label: 'Platform',
    desc: '공유 인프라 — DB · Local LLM · Host · Agents',
    accent: '#8c8c8c',
  },
};

export const getTier = (group: string): Tier => groupTier[group] ?? 'service';

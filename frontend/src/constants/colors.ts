export const groupColors: Record<string, string> = {
  AllergyInsight: '#722ed1',
  SkillRadar: '#52c41a',
  NewsletterPlatform: '#fa8c16',
  unmong: '#2f54eb',
  DB: '#8c8c8c',
  LLM: '#d4380d',
};

export const groupOrder = [
  'AllergyInsight',
  'SkillRadar',
  'NewsletterPlatform',
  'unmong',
  'DB',
  'LLM',
];

export type Tier = 'service' | 'platform';

export const groupTier: Record<string, Tier> = {
  AllergyInsight: 'service',
  SkillRadar: 'service',
  NewsletterPlatform: 'service',
  unmong: 'service',
  DB: 'platform',
  LLM: 'platform',
};

export const tierOrder: Tier[] = ['service', 'platform'];

export const tierMeta: Record<Tier, { label: string; desc: string; accent: string }> = {
  service: {
    label: 'Services',
    desc: '실시간 관제 대상 서비스 — 장애 시 비즈니스 영향 직결',
    accent: '#1677ff',
  },
  platform: {
    label: 'Platform',
    desc: '공유 인프라 — DB · LLM',
    accent: '#8c8c8c',
  },
};

export const getTier = (group: string): Tier => groupTier[group] ?? 'service';

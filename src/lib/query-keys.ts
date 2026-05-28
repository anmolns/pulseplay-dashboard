export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  targetGroups: (pid: string) => ['projects', pid, 'target-groups'] as const,
  targetGroup: (pid: string, tgId: string) =>
    ['projects', pid, 'target-groups', tgId] as const,
  fillRate: (pid: string, tgId: string) =>
    ['projects', pid, 'target-groups', tgId, 'fill-rate'] as const,
  changelog: (pid: string, tgId: string) =>
    ['projects', pid, 'target-groups', tgId, 'changelog'] as const,
  sessions: (pid: string, tgId: string, filters?: Record<string, string>) =>
    ['projects', pid, 'target-groups', tgId, 'sessions', filters] as const,
  profiles: (pid: string, tgId: string) =>
    ['projects', pid, 'target-groups', tgId, 'profiles'] as const,
  profileLibrary: (category?: string, search?: string) =>
    ['profile-library', { category, search }] as const,
  profileAttribute: (id: string) => ['profile-library', id] as const,
  reports: ['reports'] as const,
  me: ['me'] as const,
}

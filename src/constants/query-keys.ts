/**
 * Khoá của TanStack Query. Khoá chi tiết là con của khoá danh sách (`['cvs', 1]` nằm dưới
 * `['cvs']`) nên invalidate danh sách cũng làm mới mọi bản chi tiết.
 */
export const QUERY_KEYS = {
  cvDocuments: ['cvs'] as const,
  profiles: ['profiles'] as const,
  profile: (profileId: number) => ['profiles', profileId] as const,
  jobDescriptions: ['job-descriptions'] as const,
  jobDescription: (id: number) => ['job-descriptions', id] as const,
  interviewTemplates: (scope = 'mine', page = 0, size = 20) =>
    ['interview-templates', scope, page, size] as const,
  interviewTemplate: (id: number) => ['interview-templates', id] as const,
  sessions: ['sessions'] as const,
  sessionList: (scope: string, page: number, size: number) =>
    ['sessions', 'list', scope, page, size] as const,
  session: (id: number) => ['sessions', id] as const,
  sessionReport: (id: number) => ['session-reports', id] as const,
}

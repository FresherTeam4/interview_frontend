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
  templateList: (params?: unknown) => ['interview-templates', 'list', params] as const,
  sessions: ['sessions'] as const,
  sessionList: (userId: number | string | null | undefined, scope: string, page: number, size: number) =>
    ['sessions', 'list', userId ?? 'anonymous', scope, page, size] as const,
  sessionHistory: (params?: unknown) => ['sessions', 'history', params] as const,
  sessionProgress: (days = 30) => ['sessions', 'progress', days] as const,
  session: (id: number) => ['sessions', id] as const,
  sessionFeedback: (sessionId: number) => ['sessions', sessionId, 'feedback'] as const,
  sessionReport: (id: number) => ['session-reports', id] as const,
  // User Account & Lifecycle
  userAccount: ['account', 'me'] as const,
  userSessions: ['account', 'sessions'] as const,
  userDeletionRequest: ['account', 'deletion-request'] as const,
  // Notifications
  notifications: (unreadOnly = false, page = 0, size = 20) =>
    ['notifications', unreadOnly, page, size] as const,
  unreadNotificationCount: ['notifications', 'unread-count'] as const,
  // Support tickets
  supportTickets: (page = 0, size = 20) => ['support-tickets', page, size] as const,
  supportTicketDetail: (id: number) => ['support-tickets', id] as const,
  // Admin Portal
  adminOverview: (days: number) => ['admin', 'overview', days] as const,
  adminUsers: (params?: unknown) => ['admin', 'users', params] as const,
  adminUserDetail: (userId: number) => ['admin', 'users', 'detail', userId] as const,
  adminSessions: (params?: unknown) => ['admin', 'sessions', params] as const,
  adminSessionDetail: (sessionId: number) => ['admin', 'sessions', 'detail', sessionId] as const,
  adminStaleSessions: (params?: unknown) => ['admin', 'sessions', 'stale', params] as const,
  adminSessionDiagnostics: (sessionId: number) => ['admin', 'sessions', 'diagnostics', sessionId] as const,
  adminTemplates: (params?: unknown) => ['admin', 'templates', params] as const,
  adminTemplateDetail: (templateId: number) => ['admin', 'templates', 'detail', templateId] as const,
}


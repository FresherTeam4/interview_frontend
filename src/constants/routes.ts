export const ROUTES = {
  home: '/dashboard',
  dashboard: '/dashboard',
  cv: '/cv',
  profile: '/profile',
  /** Mẫu route cho react-router; dùng {@link profileDetailPath} để dựng link thật. */
  profileDetail: '/profile/:profileId',
  roles: '/roles',
  jd: '/jd',
  jdCreate: '/jd/create',
  /** Mẫu route cho react-router; dùng {@link jdDetailPath} để dựng link thật. */
  jdDetail: '/jd/:jobDescriptionId',
  sessionList: '/sessions',
  sessionCreate: '/session/create',
  sessionDetail: '/session/:sessionId',
  login: '/login',
  register: '/register',
} as const

export function profileDetailPath(profileId: number): string {
  return `/profile/${profileId}`
}

export function jdDetailPath(jobDescriptionId: number): string {
  return `/jd/${jobDescriptionId}`
}

export function sessionDetailPath(sessionId: number): string {
  return `/session/${sessionId}`
}

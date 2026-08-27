export const ROUTES = {
  home: '/',
  cv: '/cv',
  profile: '/profile',
  /** Mẫu route cho react-router; dùng {@link profileDetailPath} để dựng link thật. */
  profileDetail: '/profile/:profileId',
  login: '/login',
  register: '/register',
} as const

export function profileDetailPath(profileId: number): string {
  return `/profile/${profileId}`
}

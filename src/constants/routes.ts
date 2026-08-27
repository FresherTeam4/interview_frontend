export const ROUTES = {
  home: '/',
  about: '/about',
  login: '/login',
  register: '/register',
  cvs: '/cvs',
  profiles: '/profiles',
  profileDetail: (profileId: number | string) => `/profiles/${profileId}`,
} as const

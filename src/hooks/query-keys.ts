export const cvKeys = {
  all: ['cvs'] as const,
  detail: (id: number) => ['cvs', id] as const,
  file: (id: number) => ['cvs', id, 'file'] as const,
}

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (id: number) => ['profiles', id] as const,
}

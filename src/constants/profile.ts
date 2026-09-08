/**
 * Backend nhận `seniorityLevel` là chuỗi tự do tối đa 30 ký tự, không phải enum — đây chỉ là
 * danh sách gợi ý, đúng bằng enum mà prompt trích xuất yêu cầu AI trả về
 * (ai/cv-parse-schema-v1.json). Người dùng vẫn nhập được giá trị khác.
 */
export const SENIORITY_LEVEL_SUGGESTIONS = [
  { value: 'INTERN', label: 'Thực tập' },
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MIDDLE', label: 'Middle' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
] as const

/** Cũng là chuỗi tự do (tối đa 50 ký tự) — xem {@link SENIORITY_LEVEL_SUGGESTIONS}. */
export const SKILL_CATEGORY_SUGGESTIONS = [
  { value: 'LANGUAGE', label: 'Ngôn ngữ' },
  { value: 'FRAMEWORK', label: 'Framework' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'TOOL', label: 'Công cụ' },
  { value: 'CLOUD', label: 'Cloud' },
  { value: 'TESTING', label: 'Testing' },
  { value: 'SOFT_SKILL', label: 'Kỹ năng mềm' },
  { value: 'OTHER', label: 'Khác' },
] as const

export type ProfileSource = 'AUTO_PARSED' | 'USER_EDITED'

export const PROFILE_SOURCE_LABEL: Record<ProfileSource, string> = {
  AUTO_PARSED: 'AI trích xuất',
  USER_EDITED: 'Bạn đã sửa',
}

// Giới hạn của ProfileUpdateRequest + 3 DTO con ở backend — dùng cho cả zod schema và UI.
export const PROFILE_LIMITS = {
  headline: 255,
  targetPosition: 150,
  seniorityLevel: 30,
  yearsExperienceMax: 99.9,
  educations: 20,
  school: 255,
  degree: 150,
  fieldOfStudy: 150,
  yearMin: 1900,
  yearMax: 2100,
  skills: 100,
  skillName: 80,
  skillCategory: 50,
  projects: 50,
  projectName: 255,
  description: 5000,
  roleInProject: 150,
  techStack: 500,
} as const

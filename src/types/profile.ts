import type { ProfileSource } from '@/constants/profile'

export interface ProfileEducation {
  id: number
  school: string
  degree: string | null
  fieldOfStudy: string | null
  startYear: number | null
  endYear: number | null
  userEdited: boolean
}

export interface ProfileSkill {
  id: number
  name: string
  /** Chuỗi tự do; xem SKILL_CATEGORY_SUGGESTIONS về các giá trị AI thường trả về. */
  category: string | null
  userEdited: boolean
}

export interface ProfileProject {
  id: number
  name: string
  description: string | null
  roleInProject: string | null
  /** Nguyên chuỗi nối bằng dấu phẩy, đúng như trong DB. */
  techStack: string | null
  startDate: string | null
  endDate: string | null
  userEdited: boolean
}

/** `GET /api/profiles/{id}`, `PUT /api/profiles/{id}`, `POST /api/profiles/{id}/confirm`. */
export interface CandidateProfile {
  id: number
  cvDocumentId: number | null
  /** Thứ duy nhất giúp người dùng nhận ra hồ sơ nào của CV nào. */
  cvOriginalFilename: string | null
  headline: string | null
  yearsExperience: number | null
  targetPosition: string | null
  seniorityLevel: string | null
  source: ProfileSource
  /** null = chưa xác nhận "thông tin đã đúng" → chưa được bắt đầu phỏng vấn. */
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
  educations: ProfileEducation[]
  skills: ProfileSkill[]
  projects: ProfileProject[]
}

/** Một dòng của `GET /api/profiles` — không kèm 3 danh sách con, chỉ kèm số lượng. */
export interface ProfileSummary {
  id: number
  cvDocumentId: number | null
  cvOriginalFilename: string | null
  headline: string | null
  targetPosition: string | null
  seniorityLevel: string | null
  source: ProfileSource
  confirmedAt: string | null
  educationCount: number
  skillCount: number
  projectCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Body của `PUT /api/profiles/{id}` — thay toàn bộ hồ sơ, luôn gửi đủ cả 3 danh sách (thiếu
 * một danh sách là 400, không phải "giữ nguyên").
 *
 * `id` của từng phần tử là bắt buộc về mặt ngữ nghĩa: có id thì backend UPDATE hàng đó, null thì
 * INSERT, và hàng trong DB mà payload không nhắc tới thì DELETE. Bỏ id đi là xóa rồi chèn lại
 * toàn bộ, làm mất liên kết FK "câu hỏi này sinh ra từ kỹ năng / dự án nào".
 */
export interface UpdateProfileRequest {
  headline: string | null
  yearsExperience: number | null
  targetPosition: string | null
  seniorityLevel: string | null
  educations: Array<{
    id: number | null
    school: string
    degree: string | null
    fieldOfStudy: string | null
    startYear: number | null
    endYear: number | null
  }>
  skills: Array<{
    id: number | null
    name: string
    category: string | null
  }>
  projects: Array<{
    id: number | null
    name: string
    description: string | null
    roleInProject: string | null
    techStack: string | null
    startDate: string | null
    endDate: string | null
  }>
}

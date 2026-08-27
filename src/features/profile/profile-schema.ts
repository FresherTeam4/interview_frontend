import { z } from 'zod'
import { PROFILE_LIMITS } from '@/constants/profile'
import type { CandidateProfile, UpdateProfileRequest } from '@/types/profile'

const requiredText = (max: number, requiredMessage: string, label: string) =>
  z.string().trim().min(1, requiredMessage).max(max, `${label} tối đa ${max} ký tự`)

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} tối đa ${max} ký tự`)

/**
 * `null` = hàng mới, backend sẽ INSERT. Không có input nào cho trường này: useFieldArray giữ
 * nguyên các thuộc tính không register trong giá trị form, và `id` phải theo được tới payload
 * để backend UPDATE đúng hàng thay vì xóa rồi chèn lại.
 */
const rowId = z.number().nullable()

const yearText = z
  .string()
  .refine((value) => value === '' || /^\d{4}$/.test(value), 'Năm phải gồm 4 chữ số')
  .refine(
    (value) =>
      value === '' ||
      (Number(value) >= PROFILE_LIMITS.yearMin && Number(value) <= PROFILE_LIMITS.yearMax),
    `Năm phải trong khoảng ${PROFILE_LIMITS.yearMin}–${PROFILE_LIMITS.yearMax}`,
  )

const dateText = z
  .string()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Ngày không hợp lệ')

const educationSchema = z
  .object({
    id: rowId,
    school: requiredText(PROFILE_LIMITS.school, 'Tên trường không được để trống', 'Tên trường'),
    degree: optionalText(PROFILE_LIMITS.degree, 'Bằng cấp'),
    fieldOfStudy: optionalText(PROFILE_LIMITS.fieldOfStudy, 'Chuyên ngành'),
    startYear: yearText,
    endYear: yearText,
  })
  .refine(
    (education) =>
      education.startYear === '' ||
      education.endYear === '' ||
      Number(education.endYear) >= Number(education.startYear),
    { message: 'Năm kết thúc phải từ năm bắt đầu trở đi', path: ['endYear'] },
  )

const skillSchema = z.object({
  id: rowId,
  name: requiredText(PROFILE_LIMITS.skillName, 'Tên kỹ năng không được để trống', 'Tên kỹ năng'),
  // Chuỗi tự do ở backend, nên form cũng để tự do — giữ nguyên được nhóm mà AI trả về.
  category: optionalText(PROFILE_LIMITS.skillCategory, 'Nhóm kỹ năng'),
})

const projectSchema = z
  .object({
    id: rowId,
    name: requiredText(PROFILE_LIMITS.projectName, 'Tên dự án không được để trống', 'Tên dự án'),
    description: optionalText(PROFILE_LIMITS.description, 'Mô tả'),
    roleInProject: optionalText(PROFILE_LIMITS.roleInProject, 'Vai trò'),
    techStack: optionalText(PROFILE_LIMITS.techStack, 'Công nghệ'),
    startDate: dateText,
    endDate: dateText,
  })
  .refine(
    (project) =>
      project.startDate === '' || project.endDate === '' || project.endDate >= project.startDate,
    { message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi', path: ['endDate'] },
  )

export const profileSchema = z.object({
  headline: optionalText(PROFILE_LIMITS.headline, 'Tiêu đề'),
  yearsExperience: z.string().refine((value) => {
    if (value.trim() === '') return true
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= PROFILE_LIMITS.yearsExperienceMax
  }, `Số năm kinh nghiệm phải từ 0 đến ${PROFILE_LIMITS.yearsExperienceMax}`),
  targetPosition: optionalText(PROFILE_LIMITS.targetPosition, 'Vị trí mong muốn'),
  seniorityLevel: optionalText(PROFILE_LIMITS.seniorityLevel, 'Cấp độ'),
  educations: z
    .array(educationSchema)
    .max(PROFILE_LIMITS.educations, `Tối đa ${PROFILE_LIMITS.educations} mục học vấn`),
  // Backend trả 409 DUPLICATE_SKILL_NAME khi có 2 kỹ năng trùng tên (không phân biệt hoa
  // thường) trong cùng payload → chặn ở đây để chỉ đúng dòng bị trùng.
  skills: z
    .array(skillSchema)
    .max(PROFILE_LIMITS.skills, `Tối đa ${PROFILE_LIMITS.skills} kỹ năng`)
    .superRefine((skills, ctx) => {
      const seen = new Set<string>()
      skills.forEach((skill, index) => {
        const key = skill.name.trim().toLowerCase()
        if (!key) return
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Kỹ năng này đã có trong danh sách',
            path: [index, 'name'],
          })
        }
        seen.add(key)
      })
    }),
  projects: z
    .array(projectSchema)
    .max(PROFILE_LIMITS.projects, `Tối đa ${PROFILE_LIMITS.projects} dự án`),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
export type EducationFormValues = ProfileFormValues['educations'][number]
export type SkillFormValues = ProfileFormValues['skills'][number]
export type ProjectFormValues = ProfileFormValues['projects'][number]

export const EMPTY_EDUCATION: EducationFormValues = {
  id: null,
  school: '',
  degree: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
}

export const EMPTY_SKILL: SkillFormValues = { id: null, name: '', category: '' }

export const EMPTY_PROJECT: ProjectFormValues = {
  id: null,
  name: '',
  description: '',
  roleInProject: '',
  techStack: '',
  startDate: '',
  endDate: '',
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : Number(trimmed.replace(',', '.'))
}

export function toFormValues(profile: CandidateProfile): ProfileFormValues {
  return {
    headline: profile.headline ?? '',
    yearsExperience: profile.yearsExperience === null ? '' : String(profile.yearsExperience),
    targetPosition: profile.targetPosition ?? '',
    seniorityLevel: profile.seniorityLevel ?? '',
    educations: profile.educations.map((education) => ({
      id: education.id,
      school: education.school,
      degree: education.degree ?? '',
      fieldOfStudy: education.fieldOfStudy ?? '',
      startYear: education.startYear === null ? '' : String(education.startYear),
      endYear: education.endYear === null ? '' : String(education.endYear),
    })),
    skills: profile.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category ?? '',
    })),
    projects: profile.projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description ?? '',
      roleInProject: project.roleInProject ?? '',
      techStack: project.techStack ?? '',
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
    })),
  }
}

export function toUpdateRequest(values: ProfileFormValues): UpdateProfileRequest {
  return {
    headline: emptyToNull(values.headline),
    yearsExperience: toNumberOrNull(values.yearsExperience),
    targetPosition: emptyToNull(values.targetPosition),
    seniorityLevel: emptyToNull(values.seniorityLevel),
    educations: values.educations.map((education) => ({
      id: education.id,
      school: education.school.trim(),
      degree: emptyToNull(education.degree),
      fieldOfStudy: emptyToNull(education.fieldOfStudy),
      startYear: toNumberOrNull(education.startYear),
      endYear: toNumberOrNull(education.endYear),
    })),
    skills: values.skills.map((skill) => ({
      id: skill.id,
      name: skill.name.trim(),
      category: emptyToNull(skill.category),
    })),
    projects: values.projects.map((project) => ({
      id: project.id,
      name: project.name.trim(),
      description: emptyToNull(project.description),
      roleInProject: emptyToNull(project.roleInProject),
      techStack: emptyToNull(project.techStack),
      startDate: emptyToNull(project.startDate),
      endDate: emptyToNull(project.endDate),
    })),
  }
}

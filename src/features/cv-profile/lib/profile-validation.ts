import type { ProfileDraft } from '@/features/cv-profile/lib/profile-payload'

export type ProfileFieldErrors = Record<string, string>

export function normalizeSkillName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
}

function validateOptionalLength(
  errors: ProfileFieldErrors,
  field: string,
  value: string | null,
  maxLength: number,
  label: string,
) {
  if ((value?.length ?? 0) > maxLength) {
    errors[field] = `${label} không được vượt quá ${maxLength.toLocaleString('vi-VN')} ký tự.`
  }
}

export function validateProfileDraft(draft: ProfileDraft): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {}

  validateOptionalLength(errors, 'headline', draft.headline, 255, 'Tiêu đề hồ sơ')
  validateOptionalLength(errors, 'targetPosition', draft.targetPosition, 150, 'Vị trí mục tiêu')
  validateOptionalLength(errors, 'seniorityLevel', draft.seniorityLevel, 30, 'Cấp độ')

  if (
    draft.yearsExperience !== null &&
    (draft.yearsExperience < 0 ||
      draft.yearsExperience > 99.9 ||
      !Number.isInteger(draft.yearsExperience * 10))
  ) {
    errors.yearsExperience = 'Số năm kinh nghiệm phải từ 0 đến 99,9 và có tối đa 1 chữ số thập phân.'
  }

  if (draft.educations.length > 20) {
    errors.educations = 'Hồ sơ chỉ được có tối đa 20 mục học vấn.'
  }
  draft.educations.forEach((education, index) => {
    const prefix = `educations[${index}]`
    if (!education.school.trim()) errors[`${prefix}.school`] = 'Vui lòng nhập tên trường.'
    validateOptionalLength(errors, `${prefix}.school`, education.school, 255, 'Tên trường')
    validateOptionalLength(errors, `${prefix}.degree`, education.degree, 150, 'Bằng cấp')
    validateOptionalLength(
      errors,
      `${prefix}.fieldOfStudy`,
      education.fieldOfStudy,
      150,
      'Chuyên ngành',
    )
    if (
      education.startYear !== null &&
      (!Number.isInteger(education.startYear) ||
        education.startYear < 1900 ||
        education.startYear > 2100)
    ) {
      errors[`${prefix}.startYear`] = 'Năm bắt đầu phải từ 1900 đến 2100.'
    }
    if (
      education.endYear !== null &&
      (!Number.isInteger(education.endYear) || education.endYear < 1900 || education.endYear > 2100)
    ) {
      errors[`${prefix}.endYear`] = 'Năm kết thúc phải từ 1900 đến 2100.'
    } else if (
      education.startYear !== null &&
      education.endYear !== null &&
      education.endYear < education.startYear
    ) {
      errors[`${prefix}.endYear`] = 'Năm kết thúc không được trước năm bắt đầu.'
    }
  })

  if (draft.skills.length > 100) {
    errors.skills = 'Hồ sơ chỉ được có tối đa 100 kỹ năng.'
  }
  const skillIndexes = new Map<string, number>()
  draft.skills.forEach((skill, index) => {
    const prefix = `skills[${index}]`
    const normalizedName = normalizeSkillName(skill.name)
    if (!normalizedName) {
      errors[`${prefix}.name`] = 'Vui lòng nhập tên kỹ năng.'
    } else {
      const duplicateIndex = skillIndexes.get(normalizedName)
      if (duplicateIndex !== undefined) {
        errors[`${prefix}.name`] = 'Kỹ năng này đang bị trùng.'
        errors[`skills[${duplicateIndex}].name`] = 'Kỹ năng này đang bị trùng.'
      } else {
        skillIndexes.set(normalizedName, index)
      }
    }
    validateOptionalLength(errors, `${prefix}.name`, skill.name, 80, 'Tên kỹ năng')
    validateOptionalLength(errors, `${prefix}.category`, skill.category, 50, 'Nhóm kỹ năng')
  })

  if (draft.projects.length > 50) {
    errors.projects = 'Hồ sơ chỉ được có tối đa 50 dự án.'
  }
  draft.projects.forEach((project, index) => {
    const prefix = `projects[${index}]`
    if (!project.name.trim()) errors[`${prefix}.name`] = 'Vui lòng nhập tên dự án.'
    validateOptionalLength(errors, `${prefix}.name`, project.name, 255, 'Tên dự án')
    validateOptionalLength(errors, `${prefix}.description`, project.description, 5_000, 'Mô tả')
    validateOptionalLength(errors, `${prefix}.roleInProject`, project.roleInProject, 150, 'Vai trò')
    validateOptionalLength(errors, `${prefix}.techStack`, project.techStack, 500, 'Công nghệ')
    if (project.startDate && project.endDate && project.endDate < project.startDate) {
      errors[`${prefix}.endDate`] = 'Ngày kết thúc không được trước ngày bắt đầu.'
    }
  })

  return errors
}

export function mapServerFieldErrors(
  fieldErrors: Record<string, string> | undefined,
): ProfileFieldErrors {
  if (!fieldErrors) return {}

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, message]) => [
      field.replace(/\.yearOrderValid$/, '.endYear').replace(/\.dateOrderValid$/, '.endDate'),
      message,
    ]),
  )
}

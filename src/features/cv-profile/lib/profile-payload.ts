import type {
  CandidateProfile,
  ProfileEducationInput,
  ProfileProjectInput,
  ProfileSkillInput,
  ProfileUpdatePayload,
} from '@/types/cv-profile'

export type ProfileDraft = ProfileUpdatePayload

function optionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

export function createProfileDraft(profile: CandidateProfile): ProfileDraft {
  return {
    headline: profile.headline,
    yearsExperience: profile.yearsExperience,
    targetPosition: profile.targetPosition,
    seniorityLevel: profile.seniorityLevel,
    educations: profile.educations.map((education) => ({
      ...(education.id !== null ? { id: education.id } : {}),
      school: education.school,
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy,
      startYear: education.startYear,
      endYear: education.endYear,
    })),
    skills: profile.skills.map((skill) => ({
      ...(skill.id !== null ? { id: skill.id } : {}),
      name: skill.name,
      category: skill.category,
    })),
    projects: profile.projects.map((project) => ({
      ...(project.id !== null ? { id: project.id } : {}),
      name: project.name,
      description: project.description,
      roleInProject: project.roleInProject,
      techStack: project.techStack,
      startDate: project.startDate,
      endDate: project.endDate,
    })),
  }
}

function prepareEducation(education: ProfileEducationInput): ProfileEducationInput {
  return {
    ...(education.id !== undefined ? { id: education.id } : {}),
    school: education.school.trim(),
    degree: optionalText(education.degree),
    fieldOfStudy: optionalText(education.fieldOfStudy),
    startYear: education.startYear,
    endYear: education.endYear,
  }
}

function prepareSkill(skill: ProfileSkillInput): ProfileSkillInput {
  return {
    ...(skill.id !== undefined ? { id: skill.id } : {}),
    name: skill.name.trim().replace(/\s+/g, ' '),
    category: optionalText(skill.category),
  }
}

function prepareProject(project: ProfileProjectInput): ProfileProjectInput {
  return {
    ...(project.id !== undefined ? { id: project.id } : {}),
    name: project.name.trim(),
    description: optionalText(project.description),
    roleInProject: optionalText(project.roleInProject),
    techStack: optionalText(project.techStack),
    startDate: optionalText(project.startDate),
    endDate: optionalText(project.endDate),
  }
}

export function prepareProfilePayload(draft: ProfileDraft): ProfileUpdatePayload {
  return {
    headline: optionalText(draft.headline),
    yearsExperience: draft.yearsExperience,
    targetPosition: optionalText(draft.targetPosition),
    seniorityLevel: optionalText(draft.seniorityLevel),
    educations: draft.educations.map(prepareEducation),
    skills: draft.skills.map(prepareSkill),
    projects: draft.projects.map(prepareProject),
  }
}

export function areProfileDraftsEqual(
  current: ProfileDraft | null,
  saved: ProfileDraft | null,
): boolean {
  return JSON.stringify(current) === JSON.stringify(saved)
}

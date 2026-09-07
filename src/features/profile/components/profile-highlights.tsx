import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FolderGit2,
  Lightbulb,
  PencilLine,
  ShieldAlert,
  Compass,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CandidateProfile } from '@/types/profile'

interface ProfileHighlightsProps {
  profile: CandidateProfile
  onEditClick: () => void
  onOpenCv?: () => void
}

const COMMON_LANGUAGES = new Set([
  'java',
  'c#',
  'c++',
  'c',
  'javascript',
  'typescript',
  'python',
  'go',
  'golang',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'rust',
  'sql',
  'html',
  'css',
])

const COMMON_FRAMEWORKS = new Set([
  'spring',
  'spring boot',
  'react',
  'reactjs',
  'vue',
  'vuejs',
  'angular',
  'next.js',
  'nextjs',
  '.net',
  'asp.net',
  'express',
  'expressjs',
  'node.js',
  'nodejs',
  'nest.js',
  'nestjs',
  'django',
  'flask',
  'fastapi',
  'laravel',
  'tailwind',
  'tailwindcss',
  'bootstrap',
])

const COMMON_DATABASES = new Set([
  'mysql',
  'postgresql',
  'postgres',
  'mongodb',
  'redis',
  'sqlite',
  'sql server',
  'oracle',
  'elasticsearch',
  'mariadb',
])

export default function ProfileHighlights({
  profile,
  onEditClick,
  onOpenCv,
}: ProfileHighlightsProps) {
  // Phân loại kỹ năng để làm nổi bật các mảng chuyên môn cốt lõi
  const categorizedSkills = {
    languages: [] as string[],
    frameworks: [] as string[],
    databases: [] as string[],
    tools: [] as string[],
  }

  for (const skill of profile.skills) {
    const nameLower = skill.name.trim().toLowerCase()
    const catLower = (skill.category || '').toLowerCase()

    if (
      catLower.includes('language') ||
      catLower.includes('ngôn ngữ') ||
      COMMON_LANGUAGES.has(nameLower)
    ) {
      categorizedSkills.languages.push(skill.name)
    } else if (
      catLower.includes('framework') ||
      catLower.includes('thư viện') ||
      COMMON_FRAMEWORKS.has(nameLower)
    ) {
      categorizedSkills.frameworks.push(skill.name)
    } else if (
      catLower.includes('database') ||
      catLower.includes('cơ sở dữ liệu') ||
      COMMON_DATABASES.has(nameLower)
    ) {
      categorizedSkills.databases.push(skill.name)
    } else {
      categorizedSkills.tools.push(skill.name)
    }
  }

  const seniority = profile.seniorityLevel?.toUpperCase() || 'JUNIOR'
  const isInternOrFresher = seniority.includes('INTERN') || seniority.includes('FRESHER')

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Executive Summary & Stature Banner */}
      <Card className="border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {profile.targetPosition || profile.headline || 'Ứng viên Lập trình viên'}
                </span>
                <Badge
                  variant="outline"
                  className="font-semibold text-xs border-primary/40 text-primary bg-primary/10"
                >
                  {profile.seniorityLevel || 'FRESHER / JUNIOR'}
                </Badge>
                {profile.confirmedAt ? (
                  <Badge variant="secondary" className="gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                    <CheckCircle2 className="size-3" />
                    Đã sẵn sàng phỏng vấn
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
                    <ShieldAlert className="size-3" />
                    Chờ xác nhận hồ sơ
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                {profile.cvOriginalFilename && (
                  <span>Tệp nguồn: <strong className="text-foreground">{profile.cvOriginalFilename}</strong></span>
                )}
                <span>•</span>
                <span>Kinh nghiệm: <strong className="text-foreground">{profile.yearsExperience ? `${profile.yearsExperience} năm` : '0 năm (Mới tốt nghiệp)'}</strong></span>
                <span>•</span>
                <span>Cập nhật: <strong className="text-foreground">{new Date(profile.updatedAt).toLocaleDateString('vi-VN')}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={onEditClick} className="gap-1.5 text-xs font-medium">
                <PencilLine className="size-3.5" />
                <span>Chỉnh sửa thông tin</span>
              </Button>
              {onOpenCv && (
                <Button size="sm" variant="ghost" onClick={onOpenCv} className="gap-1.5 text-xs text-muted-foreground">
                  <span>Mở CV gốc</span>
                  <ExternalLink className="size-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 mb-1">
              <Briefcase className="size-3.5 text-primary" />
              <span>Vị trí mục tiêu</span>
            </div>
            <div className="text-sm font-semibold truncate text-foreground">
              {profile.targetPosition || 'Full-stack Dev'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 mb-1">
              <Clock className="size-3.5 text-emerald-500" />
              <span>Thời gian KN</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {profile.yearsExperience ? `${profile.yearsExperience} năm` : '0 năm'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 mb-1">
              <Code2 className="size-3.5 text-blue-500" />
              <span>Tổng kỹ năng</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {profile.skills.length} công nghệ
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 mb-1">
              <FolderGit2 className="size-3.5 text-purple-500" />
              <span>Dự án thực tế</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {profile.projects.length} dự án
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Trọng tâm kỹ thuật & Ma trận kỹ năng (Core Stack Highlight) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                <span>Trọng tâm kỹ thuật & Hệ sinh thái công nghệ</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Các kỹ năng bóc tách được phân nhóm để đánh giá độ rộng và chiều sâu công nghệ.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {profile.skills.length} kỹ năng
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ngôn ngữ cốt lõi */}
          {categorizedSkills.languages.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="size-3.5 text-primary" />
                Ngôn ngữ lập trình cốt lõi
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categorizedSkills.languages.map((skill) => (
                  <Badge
                    key={skill}
                    variant="default"
                    className="text-xs font-medium px-2.5 py-0.5 shadow-xs"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Frameworks */}
          {categorizedSkills.frameworks.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="size-3.5 text-blue-500" />
                Frameworks & Thư viện chuyên sâu
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categorizedSkills.frameworks.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="text-xs font-medium px-2.5 py-0.5 border border-primary/20 text-foreground bg-primary/5"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Database & Cloud */}
          {categorizedSkills.databases.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Database className="size-3.5 text-emerald-500" />
                Cơ sở dữ liệu & Lưu trữ
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categorizedSkills.databases.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-xs font-medium px-2.5 py-0.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tools & DevOps */}
          {categorizedSkills.tools.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="size-3.5 text-purple-500" />
                Công cụ, DevOps & Kỹ năng bổ trợ
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categorizedSkills.tools.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-xs font-normal px-2.5 py-0.5 text-muted-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Dự án thực tế tiêu biểu (Project Highlights) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderGit2 className="size-4 text-primary" />
                <span>Dự án thực tế & Điểm nhấn kinh nghiệm</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Phần lớn các câu hỏi kỹ thuật chuyên sâu sẽ được AI đào sâu từ các dự án này.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {profile.projects.length} dự án
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.projects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Chưa có dự án nào được ghi nhận trong hồ sơ.</p>
          ) : (
            profile.projects.map((proj, idx) => (
              <div
                key={proj.id || idx}
                className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{proj.name}</span>
                    {proj.roleInProject && (
                      <Badge variant="secondary" className="text-[11px] font-medium">
                        {proj.roleInProject}
                      </Badge>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-[11px] text-muted-foreground">
                      {proj.startDate || '...'} – {proj.endDate || 'Hiện tại'}
                    </span>
                  )}
                </div>

                {proj.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {proj.techStack && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[11px] font-medium text-foreground">Công nghệ:</span>
                    {proj.techStack.split(',').map((tech) => {
                      const t = tech.trim()
                      if (!t) return null
                      return (
                        <span
                          key={t}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-background border border-border/80 text-foreground font-mono"
                        >
                          {t}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 4. Học vấn & Nền tảng học thuật */}
      {profile.educations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <span>Học vấn & Nền tảng chuyên môn</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            {profile.educations.map((edu, idx) => (
              <div
                key={edu.id || idx}
                className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1"
              >
                <div className="font-semibold text-xs text-foreground">{edu.school}</div>
                <div className="text-xs text-muted-foreground">
                  {edu.degree || 'Bằng cấp'} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}
                </div>
                {(edu.startYear || edu.endYear) && (
                  <div className="text-[11px] text-muted-foreground/80">
                    Niên khóa: {edu.startYear ?? '...'} – {edu.endYear ?? 'Hiện tại'}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 5. Khuyến nghị trọng tâm phỏng vấn từ AI (AI Interview Focus & Watchouts) */}
      <Card className="border-primary/30 bg-primary/5 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-primary">
            <Compass className="size-4" />
            <span>Định hướng trọng tâm đối thoại từ AI</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Dựa trên hồ sơ kỹ thuật của bạn, buổi phỏng vấn sẽ tập trung khai thác các khía cạnh sau:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs leading-relaxed text-foreground">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Đào sâu nền tảng & công nghệ cốt lõi: </strong>
              <span>
                Với kỹ năng chính ({categorizedSkills.languages.slice(0, 3).join(', ') || 'lập trình'}),
                phỏng vấn viên sẽ tập trung kiểm tra tư duy hướng đối tượng (OOP), quản lý bộ nhớ, cấu trúc dữ liệu và xử lý bất đồng bộ.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <FolderGit2 className="size-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Khai thác thực tế dự án: </strong>
              <span>
                Các câu hỏi tình huống sẽ xoay quanh các dự án{' '}
                <em>{profile.projects.map((p) => `"${p.name}"`).slice(0, 2).join(' và ') || 'trong CV'}</em>.
                Hãy chuẩn bị kỹ về kiến trúc, cách tổ chức database, và các vấn đề hóc búa bạn từng giải quyết.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Award className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">
                Lưu ý theo cấp độ ({profile.seniorityLevel || 'JUNIOR'}):{' '}
              </strong>
              <span>
                {isInternOrFresher
                  ? 'Với vị trí Intern/Fresher, AI sẽ đánh giá cao sự vững vàng ở kiến thức nền tảng, tính trung thực trong CV, và khả năng phản xạ khi đối mặt bài toán mới.'
                  : 'Với vị trí đã có kinh nghiệm, AI sẽ đào sâu vào thiết kế hệ thống, khả năng tối ưu hiệu năng (indexing, caching) và bảo mật API.'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

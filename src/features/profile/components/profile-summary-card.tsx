import { BadgeCheck, PencilLine, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { profileDetailPath } from '@/constants/routes'
import { formatDateTime } from '@/lib/format'
import type { ProfileSummary } from '@/types/profile'

interface ProfileSummaryCardProps {
  profile: ProfileSummary
}

/** Một dòng của `GET /api/profiles`; bấm vào là sang trang sửa hồ sơ đó. */
export default function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  const position = [profile.targetPosition, profile.seniorityLevel].filter(Boolean).join(' · ')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{profile.headline ?? 'Hồ sơ chưa có tiêu đề'}</CardTitle>
        <CardDescription className="truncate">
          {profile.cvOriginalFilename ? `Từ CV ${profile.cvOriginalFilename}` : 'Nhập tay'}
        </CardDescription>
        <CardAction>
          {profile.confirmedAt ? (
            <Badge variant="outline">
              <BadgeCheck className="text-success" />
              Đã xác nhận
            </Badge>
          ) : (
            <Badge variant="outline">
              <TriangleAlert />
              Chưa xác nhận
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="gap-2">
        {position ? <p className="text-sm">{position}</p> : null}
        <p className="text-xs text-muted-foreground">
          {profile.educationCount} học vấn · {profile.skillCount} kỹ năng ·{' '}
          {profile.projectCount} dự án
        </p>
      </CardContent>

      <CardFooter className="flex-wrap items-center gap-3">
        <Button size="sm" asChild>
          <Link to={profileDetailPath(profile.id)}>
            <PencilLine className="size-4" />
            Xem và sửa
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Cập nhật {formatDateTime(profile.updatedAt)}
        </span>
      </CardFooter>
    </Card>
  )
}

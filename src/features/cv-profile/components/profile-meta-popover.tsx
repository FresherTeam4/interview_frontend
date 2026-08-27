import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDateTime } from '@/features/cv-profile/lib/formatters'
import type { CandidateProfile } from '@/types/cv-profile'

interface ProfileMetaPopoverProps {
  profile: CandidateProfile
}

/**
 * Dồn phần thông tin phụ (tên file, nguồn dữ liệu, thời điểm cập nhật) vào popover: header chỉ còn
 * một hàng nên khung CV được thêm chiều cao để đọc.
 */
export default function ProfileMetaPopover({ profile }: ProfileMetaPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Thông tin file CV và lần cập nhật"
          title="Thông tin file CV"
        >
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="gap-3">
        <PopoverHeader>
          <PopoverTitle>Đối chiếu dữ liệu AI với file</PopoverTitle>
          {/* Tên file do người dùng tải lên, chỉ render như text thuần. */}
          <PopoverDescription className="break-all">
            {profile.cvOriginalFilename}
          </PopoverDescription>
        </PopoverHeader>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Nguồn</dt>
          <dd>{profile.source === 'USER_EDITED' ? 'Đã chỉnh sửa bởi bạn' : 'Do AI bóc tách'}</dd>
          <dt className="text-muted-foreground">Cập nhật</dt>
          <dd>{formatDateTime(profile.updatedAt)}</dd>
        </dl>
      </PopoverContent>
    </Popover>
  )
}

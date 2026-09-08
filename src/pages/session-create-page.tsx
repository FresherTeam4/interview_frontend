import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/page-header'
import CreateInterviewWizard from '@/features/session/components/wizard/create-interview-wizard'
import { ROUTES } from '@/constants/routes'

export default function SessionCreatePage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-12">
      <PageHeader
        title="Tạo phiên phỏng vấn mới"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.home}>
              <ArrowLeft className="size-4" />
              Tổng quan
            </Link>
          </Button>
        }
      />
      <CreateInterviewWizard />
    </div>
  )
}

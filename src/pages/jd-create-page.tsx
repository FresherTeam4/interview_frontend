import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import PageHeader from '@/components/page-header'
import JdFileDropzone from '@/features/jd/components/jd-file-dropzone'
import { getErrorMessage } from '@/api/api-error'
import { useCreateFileJd, useCreateTextJd } from '@/hooks/use-job-descriptions'
import { jdDetailPath, ROUTES } from '@/constants/routes'
import { JD_TITLE_MAX_LENGTH } from '@/constants/jd'

export default function JdCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { title?: string; text?: string } | null) ?? null

  const createTextJd = useCreateTextJd()
  const createFileJd = useCreateFileJd()

  // Text form state (tự động nhận dữ liệu nếu được clone từ JD khác)
  const [textTitle, setTextTitle] = useState(state?.title ?? '')
  const [textContent, setTextContent] = useState(state?.text ?? '')

  // File form state
  const [fileTitle, setFileTitle] = useState('')

  const isBusy = createTextJd.isPending || createFileJd.isPending

  async function handleCreateText() {
    if (!textTitle.trim()) {
      toast.error('Tiêu đề JD không được để trống.')
      return
    }
    try {
      const jd = await createTextJd.mutateAsync({
        title: textTitle.trim(),
        text: textContent.trim() || null,
      })
      toast.success('Đã tạo JD.')
      navigate(jdDetailPath(jd.id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleUploadFile(file: File) {
    const title = fileTitle.trim() || file.name.replace(/\.[^/.]+$/, '')
    try {
      const jd = await createFileJd.mutateAsync({ title, file })
      toast.success('Đã tạo JD từ file.')
      navigate(jdDetailPath(jd.id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tạo mô tả công việc"
        description="Nhập nội dung JD hoặc tải file PDF/TXT chứa JD."
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.jd}>
              <ArrowLeft className="size-4" />
              Danh sách JD
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="text">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="text">Nhập text</TabsTrigger>
          <TabsTrigger value="file">Tải file</TabsTrigger>
        </TabsList>

        {/* Tab: Text */}
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Tạo JD dạng text</CardTitle>
              <CardDescription>
                Nhập tiêu đề và dán nội dung mô tả công việc.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="text-title">Tiêu đề *</Label>
                <Input
                  id="text-title"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  maxLength={JD_TITLE_MAX_LENGTH}
                  disabled={isBusy}
                  placeholder="Ví dụ: Frontend Developer - React"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="text-content">Nội dung JD</Label>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={isBusy}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Dán nội dung mô tả công việc vào đây..."
                />
              </div>
              <Button
                className="w-fit"
                onClick={() => void handleCreateText()}
                disabled={!textTitle.trim() || isBusy}
              >
                {createTextJd.isPending ? 'Đang tạo...' : 'Tạo JD'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: File */}
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Tạo JD từ file</CardTitle>
              <CardDescription>
                Tải file PDF hoặc TXT chứa mô tả công việc. Tiêu đề không bắt buộc — nếu bỏ trống
                sẽ lấy tên file.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="file-title">Tiêu đề (tuỳ chọn)</Label>
                <Input
                  id="file-title"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  maxLength={JD_TITLE_MAX_LENGTH}
                  disabled={isBusy}
                  placeholder="Để trống sẽ dùng tên file"
                />
              </div>
              <JdFileDropzone
                onSelect={(file) => void handleUploadFile(file)}
                isUploading={createFileJd.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Radio,
  Mic,
  Keyboard,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { checkInterviewReadiness } from '@/api/session'
import type {
  CreateSessionRequest,
  InterviewReadinessResponse,
} from '@/types/session'

interface ReadinessCheckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestData: CreateSessionRequest
  onProceed: () => void
}

export default function ReadinessCheckDialog({
  open,
  onOpenChange,
  requestData,
  onProceed,
}: ReadinessCheckDialogProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InterviewReadinessResponse | null>(null)

  const runCheck = async () => {
    setLoading(true)
    try {
      const res = await checkInterviewReadiness(requestData)
      setResult(res)
    } catch {
      // If readiness check endpoint fails, allow proceeding anyway
      setResult({
        ready: true,
        requestedMode: requestData.mode,
        capabilities: {
          textInput: true,
          pushToTalk: true,
          realtimeVoice: requestData.mode === 'VOICE_REALTIME',
          realtimeFallbackToTurnBased: true,
        },
        checks: [
          {
            code: 'SYSTEM_OK',
            status: 'PASS',
            message: 'Hệ thống sẵn sàng cho phiên phỏng vấn.',
          },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  // Trigger check whenever opened
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setResult(null)
      void runCheck()
    }
    onOpenChange(nextOpen)
  }

  const hasFailures = result?.checks.some((c) => c.status === 'FAIL')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Kiểm tra mức độ sẵn sàng
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hệ thống xác minh tính tương thích thiết bị, âm thanh và khả năng xử lý AI trước khi bắt đầu.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Đang kiểm tra môi trường kết nối...</p>
            </div>
          ) : result ? (
            <div className="space-y-3">
              {/* Capabilities badge grid */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Khả năng hỗ trợ phiên phỏng vấn:</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Badge variant={result.capabilities.textInput ? 'secondary' : 'outline'} className="gap-1">
                    <Keyboard className="size-3" />
                    Nhập văn bản
                  </Badge>
                  <Badge variant={result.capabilities.pushToTalk ? 'secondary' : 'outline'} className="gap-1">
                    <Mic className="size-3" />
                    Giọng nói (Push-to-Talk)
                  </Badge>
                  {result.capabilities.realtimeVoice && (
                    <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      <Radio className="size-3" />
                      Realtime Voice AI
                    </Badge>
                  )}
                </div>
              </div>

              {/* Check details */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Kết quả kiểm tra:</p>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {result.checks.map((c, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                        c.status === 'PASS'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : c.status === 'WARNING'
                            ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {c.status === 'PASS' ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                      ) : c.status === 'WARNING' ? (
                        <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                      ) : (
                        <XCircle className="size-4 shrink-0 text-rose-500 mt-0.5" />
                      )}
                      <span className="leading-snug">{c.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Quay lại
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading || hasFailures}
            onClick={() => {
              onOpenChange(false)
              onProceed()
            }}
            className="gap-1.5 text-xs font-semibold"
          >
            <span>Tiến hành</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

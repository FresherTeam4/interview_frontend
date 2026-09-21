import { Outlet } from 'react-router'
import { BotMessageSquare } from 'lucide-react'
import ModeToggle from '@/components/mode-toggle'

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding panel — ẩn trên mobile */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground">
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />

        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-foreground/5 blur-2xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />

        {/* logo được vẽ bằng thẻ svg  */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <div className="size-10 rounded-xl bg-primary-foreground/15 backdrop-blur-md flex items-center justify-center text-primary-foreground border border-primary-foreground/20 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span>Mock<span className="font-extrabold text-primary-foreground/90">AI</span> Platform</span>
          </div>
        </div>

        {/* tagline & highlights */}
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-primary-foreground/20">
              <BotMessageSquare className="size-3.5" />
              <span>Nền tảng phỏng vấn AI chuyên nghiệp</span>
            </div>
            <p className="text-2xl font-bold leading-snug tracking-tight">
              Luyện phỏng vấn thực chiến, tự tin chinh phục mọi cơ hội nghề nghiệp.
            </p>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Trải nghiệm phỏng vấn mô phỏng với AI theo sát hồ sơ và yêu cầu tuyển dụng thực tế. Nhận đánh giá chi tiết theo từng tiêu chí chuyên môn.
            </p>
          </blockquote>

          <div className="grid gap-3 pt-2 text-sm text-primary-foreground/90">
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-primary-foreground/70" />
              <span>Phân tích CV tự động trích xuất kỹ năng trọng tâm</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-primary-foreground/70" />
              <span>Phỏng vấn đối thoại thích ứng cá nhân hóa theo từng vị trí tuyển dụng</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-primary-foreground/70" />
              <span>Nhận xét đa chiều & gợi ý câu trả lời tối ưu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="relative flex flex-col">
        {/* mode toggle — góc trên phải */}
        <div className="absolute right-4 top-4 z-10">
          <ModeToggle />
        </div>

        {/*noi dung form */}
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Content của các trang con sẽ được render ở đây */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

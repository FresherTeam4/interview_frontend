export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TourStep {
  /** Selector của phần tử được highlight. Bỏ trống thì bước đó hiện giữa màn hình như lời mở đầu. */
  target?: string
  title: string
  body: string
  /** Ưu tiên đặt thẻ ghi chú ở phía này; tự lật sang phía đối diện nếu không đủ chỗ. */
  placement?: TourPlacement
}

const SEEN_KEY_PREFIX = 'cv-profile:tour-seen:'

/** Chỉ ghi nhớ một cờ boolean "đã xem hướng dẫn", không lưu bất kỳ dữ liệu hồ sơ hay đường dẫn nào. */
export function hasSeenTour(tourId: string): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY_PREFIX + tourId) === '1'
  } catch {
    // Trình duyệt chặn localStorage: coi như đã xem để không tự mở lại mỗi lần vào trang.
    return true
  }
}

export function markTourSeen(tourId: string) {
  try {
    window.localStorage.setItem(SEEN_KEY_PREFIX + tourId, '1')
  } catch {
    // Không lưu được thì bỏ qua, hướng dẫn vẫn mở lại được bằng nút "?".
  }
}

/** Bỏ những bước trỏ tới phần tử chưa hiển thị, ví dụ chưa có CV nào nên chưa có danh sách để chỉ. */
export function resolveTourSteps(steps: TourStep[]): TourStep[] {
  return steps.filter((step) => {
    if (!step.target) return true
    const element = document.querySelector(step.target)
    if (!element) return false
    const rect = element.getBoundingClientRect()
    return rect.width > 0 || rect.height > 0
  })
}

export const CV_LIST_TOUR_ID = 'cv-list-v1'

export const cvListTourSteps: TourStep[] = [
  {
    title: 'Hướng dẫn nhanh: CV & hồ sơ',
    body: '5 bước ngắn để bạn biết cách tải CV lên, kiểm tra dữ liệu AI bóc tách và xác nhận hồ sơ dùng cho phỏng vấn.',
  },
  {
    target: '[data-tour="cv-upload"]',
    title: 'Bước 1 — Tải CV lên',
    body: 'Kéo thả hoặc chọn một file PDF (tối đa 5 MB, 10 trang). Sau khi tải xong, AI tự bóc tách thông tin thành hồ sơ ứng viên, bạn không cần nhập tay.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="cv-stats"]',
    title: 'Theo dõi tình trạng',
    body: 'Mỗi tài khoản lưu tối đa 10 CV. Các ô còn lại cho biết số CV đang xử lý, số hồ sơ đã bóc tách xong và số hồ sơ bạn đã xác nhận.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="cv-list"]',
    title: 'Bước 2 — Chờ bóc tách xong',
    body: 'Mỗi CV là một dòng kèm trạng thái. Khi trạng thái chuyển sang "Thành công", nút "Kiểm tra hồ sơ" sẽ mở trang đối chiếu. Nút "Mở PDF" luôn mở file ở tab mới.',
    placement: 'top',
  },
  {
    target: '[data-tour="cv-profiles-link"]',
    title: 'Bước 3 — Xem lại toàn bộ hồ sơ',
    body: 'Danh sách hồ sơ tập hợp mọi hồ sơ đã bóc tách, lọc theo đã xác nhận hoặc chờ xác nhận để bạn không bỏ sót hồ sơ nào.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="cv-guide"]',
    title: 'Cần xem lại?',
    body: 'Bấm dấu "?" ở đây bất cứ lúc nào để mở lại hướng dẫn này.',
    placement: 'bottom',
  },
]

export const PROFILE_EDITOR_TOUR_ID = 'profile-editor-v1'

export const profileEditorTourSteps: TourStep[] = [
  {
    title: 'Hướng dẫn nhanh: kiểm tra hồ sơ',
    body: 'Trang này để bạn đối chiếu từng thông tin AI bóc tách với chính file CV gốc, sửa lại chỗ sai rồi xác nhận.',
  },
  {
    target: '[data-tour="profile-pdf"]',
    title: 'CV gốc luôn ở bên trái',
    body: 'Khung này được ghim cố định, không trôi khi bạn cuộn form. Lăn chuột trong khung để cuộn nội dung PDF, lăn ở cột phải để cuộn form.',
    placement: 'right',
  },
  {
    target: '[data-tour="profile-layout"]',
    title: 'Đổi tỉ lệ hai cột',
    body: 'Chọn "Ưu tiên CV" khi cần đọc file cho rõ, "Chia đôi" để vừa đọc vừa sửa, "Ẩn CV" khi chỉ muốn tập trung nhập liệu. Lựa chọn được ghi nhớ cho lần sau.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="profile-form"]',
    title: 'Sửa trực tiếp trên form',
    body: 'Thông tin chung, học vấn, kỹ năng và dự án đều sửa được. Chỗ nào AI đọc sai hoặc thiếu, bạn chỉnh lại theo CV rồi thêm/xóa mục tùy ý.',
    placement: 'left',
  },
  {
    target: '[data-tour="profile-actions"]',
    title: 'Lưu hoặc xác nhận',
    body: '"Lưu thay đổi" giữ lại bản nháp; "Xác nhận thông tin chính xác" vừa lưu vừa đánh dấu hồ sơ đã kiểm tra. Cả hai sẽ đưa bạn về danh sách CV & hồ sơ.',
    placement: 'top',
  },
]

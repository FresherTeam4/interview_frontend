# AGENTS.md — Quy ước làm việc cho team frontend & AI Assistant

## Lệnh cần chạy

- Dev server: `npm run dev`
- Kiểm tra lint: `npm run lint`
- Kiểm tra build: `npm run build`

**Luôn chạy `npm run lint` và `npm run build` trước khi push/PR hoặc kết thúc phiên code.**

## Nguyên tắc: Ưu tiên SDK & Thư viện chuyên dụng (Library-First Principle)

**Quy tắc bất biến cho AI và lập trình viên:**
1. **Kiểm tra `package.json` trước khi code:**
   - Luôn đọc `package.json` để kiểm tra các thư viện/SDK đã có sẵn trong dự án trước khi triển khai bất kỳ logic hay component mới nào.
   - **Tuyệt đối không tự viết code thủ công (reinvent the wheel)** cho các bài toán đã có giải pháp/thư viện chuẩn ngành xử lý.

2. **Tiêu chuẩn thư viện theo từng bài toán cụ thể:**
   - **Form & Validation:** Sử dụng `react-hook-form` kết hợp `zod` và `@hookform/resolvers/zod`. Định nghĩa schema Zod trong `src/lib/validation.ts`. Không tự viết regex, state quản lý lỗi thủ công.
   - **Xử lý Thời gian & Ngày tháng:** Sử dụng `date-fns` (với locale Tiếng Việt `vi` từ `date-fns/locale`) thông qua các hàm tiện ích tập trung tại `src/lib/format.ts` (`formatDate`, `formatTime`, `formatDateTime`, `formatRelativeTime`, `formatDurationSeconds`). Không gọi `new Date().toLocaleDateString()` hay viết hàm định dạng giờ rải rác.
   - **Xác thực & Token:** Dùng `jwt-decode` trong `src/api/token-storage.ts`. Không tự parse base64 / `atob`.
   - **Giao diện & UI/UX:**
     - Ưu tiên tối đa các component từ `shadcn/ui` tại `src/components/ui/` (`Button`, `Dialog`, `Badge`, `Card`, `Tabs`, `Skeleton`, `DropdownMenu`...).
     - Biểu tượng: Dùng `lucide-react`.
     - Thông báo Toast: Dùng `sonner` (`toast.success()`, `toast.error()`).
     - Quản lý CSS Class: Luôn dùng `cn()` từ `@/lib/utils`.
   - **Data Fetching & Cache State:** Luôn dùng `@tanstack/react-query` (`useQuery`, `useMutation`). Không tự dùng `useState` + `useEffect` để fetch API nếu không có lý do đặc thù.
   - **Realtime / Media / Audio:** Sử dụng Web Audio API chuẩn (`AudioContext`, `AudioWorkletProcessor`), Observer Pattern (`src/lib/audio-bus.ts`), và WebSocket protocol bảo mật từ backend grant.

3. **Khi cần tính năng mới chưa có thư viện:**
   - Đề xuất và cài đặt package npm phổ biến, type-safe, bảo mật tốt thay vì tự code hàng trăm dòng code nghiệp vụ dễ lỗi.

## Cấu trúc thư mục

```
src/
  api/               # Toàn bộ API layer (client, error, token, endpoint theo resource)
  components/ui/     # Chỉ chứa component shadcn — KHÔNG sửa tay
  components/        # Component dùng chung toàn app
  constants/         # Hằng số dùng chung (routes, storage-keys...)
  contexts/          # React Context/Provider dùng chung (vd: AuthContext)
  features/<tên>/    # Component & logic riêng của từng tính năng
  hooks/             # Custom hooks dùng chung
  lib/               # Utils thuần (không gọi API)
  pages/             # Component ứng với từng route
  routes/            # Định nghĩa route/layout
  types/             # Type dùng chung (đặc biệt API response)
```

## Quy tắc component

- Tên file **kebab-case**: `user-list.tsx`. Tên component **PascalCase**: `UserList`.
- Mỗi file = 1 component, export default.
- **3 ngăn component**:
  - `components/ui/` → chỉ do `npx shadcn@latest add ...` tạo ra. Không tự sửa tay. Muốn đổi style: ưu tiên dùng `variant` hoặc truyền `className` từ ngoài.
  - `components/` → component dùng ở nhiều nơi (>= 2 chỗ).
  - `features/<tên>/` → component chỉ dùng cho tính năng đó.
- Chỉ tạo component mới khi dùng ở **>= 2 nơi**. Lần đầu viết inline, sau đó mới rút ra.
- Component có nhiều biến thể → dùng `cva` (tham khảo `src/components/ui/button.tsx`), không dùng if/else đổi class.

## Style (Tailwind)

- Chỉ dùng **token theme**: `bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`...
- **Cấm** màu cứng (hex/rgb) trong code UI: `bg-[#3b82f6]`, `text-black`, `text-white`.
- Muốn màu mới → thêm token vào `src/index.css` (`@theme` + `:root` + `.dark`).
- Gộp class bằng `cn()` từ `@/lib/utils`, không nối chuỗi thủ công.
- Luôn kiểm tra giao diện ở cả **light và dark mode**.

## API & data

- Mọi gọi API đi qua `src/api/client.ts`. Component **không** gọi axios trực tiếp.
- Hàm gọi endpoint theo resource đặt trong `src/api/` (vd: `auth.ts`, `user.ts`), đặt tên `getXxx`/`createXxx`/`updateXxx`.
- Hook lấy dữ liệu đặt trong `src/hooks/`, đặt tên `useTênChứcNăng` (vd: `useProfile`).
- Type response → khai báo trong `src/types/api.ts`. Không khai báo type lặp lại trong từng file.
- Lỗi từ API → dùng `normalizeError` (đã có trong `src/api/api-error.ts`), không tự viết xử lý lỗi riêng.
- Trạng thái loading/error bắt buộc có giao diện tương ứng (không để màn hình trắng).

## Import order

```ts
1. React (nếu cần)
2. Thư viện ngoài (react-router, axios, lucide-react...)
3. shadcn (@/components/ui/...)
4. Component nội bộ (@/components/..., @/features/...)
5. Hook / util (@/hooks, @/lib)
6. Type (@/types)
```

## Code style

- Viết code không bắt buộc comment, nhưng comment phải có nghĩa (giải thích "tại sao", không giải thích "làm gì").
- Không để `any` lan ra ngoài — nếu không biết type thì hỏi, đừng thêm `any` tạm bợ.
- File dài quá ~300 dòng → cân nhắc tách nhỏ.
- Tên biến/hàm rõ nghĩa bằng tiếng Anh.

## Git

- Mỗi PR = 1 tính năng/công việc nhỏ, commit nhỏ và có ý nghĩa.
- Chia việc theo **feature/screen** (mỗi người 1 luồng), tránh 2 người sửa chung 1 file.
- Trước khi push: chạy `npm run lint`. Trước khi tạo PR: kiểm tra `npm run build`.

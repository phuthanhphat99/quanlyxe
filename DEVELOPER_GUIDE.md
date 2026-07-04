# TÀI LIỆU PHÁT TRIỂN DỰ ÁN - HỆ THỐNG QUẢN LÝ VẬN TẢI (PHÚ AN)

Tài liệu này được lập ra để cập nhật toàn bộ tiến trình code hiện tại của hệ thống. Bất kỳ lập trình viên (AI hoặc Human) nào khi tiếp nhận dự án đều có thể đọc tài liệu này để nắm bắt nhanh kiến trúc, các tính năng đã hoàn thiện và những công việc còn dang dở.

---

## 1. Công nghệ sử dụng (Tech Stack)

Dự án là một hệ thống Web Application Fullstack chạy trên nền tảng Cloudflare:
- **Frontend:** React 18, Vite, TypeScript.
- **Styling & UI:** TailwindCSS, Shadcn UI, Lucide React (Icons).
- **State Management & Data Fetching:** TanStack React Query (`@tanstack/react-query`).
- **Backend (Serverless):** Cloudflare Pages Functions / Workers (sử dụng file `functions/api/[[route]].ts`).
- **Database:** Cloudflare D1 (Serverless SQLite).
- **Testing:** Playwright (cho E2E testing).

---

## 2. Cấu trúc thư mục cốt lõi (Folder Structure)

- `/functions/api/[[route]].ts`: Nơi chứa toàn bộ logic Backend API. Giao tiếp trực tiếp với D1 Database. Xử lý các HTTP Methods (GET, POST, PUT, DELETE).
- `/src/pages/`: Các trang giao diện chính.
  - `Vehicles.tsx`, `Drivers.tsx`: Nhóm Danh Mục.
  - `Dispatch.tsx`: Điều hành xe (Kanban board).
  - `Maintenance.tsx`: Bảo trì xe.
  - `/inventory/`: Chứa các trang Quản lý Kho (Vật tư, Lốp, Nhiên liệu, CCDC).
- `/src/components/`:
  - `/ui/`: Các component cơ bản (Button, Input, Card...) từ Shadcn UI.
  - `/shared/`: Các component tái sử dụng cao (`DataTable.tsx`, `PageHeader.tsx`, `StatusBadge.tsx`).
  - `/vehicles/`: Chứa các component đặc thù như `ColumnChooser.tsx`, `ExcelFilter.tsx`.
- `/src/hooks/`: Các Custom Hooks kết nối với React Query (ví dụ: `useVehicles`, `useInventory`, `useDispatchOrders`).
- `/scripts/`: Các script tiện ích (ví dụ: `google-apps-script.js` dùng để đồng bộ Google Sheets).

---

## 3. Tiến độ hiện tại (Current Progress)

### ✅ Đã hoàn thiện (Completed)
1. **Module Danh Mục (Xe, Tài Xế):** 
   - Đã tối ưu UI/UX cực tốt với `DataTable`.
   - Có tính năng tuỳ chỉnh ẩn/hiện cột (`ColumnChooser`), lọc dữ liệu kiểu Excel (`ExcelFilter`).
2. **Module Điều Hành (Dispatch):** 
   - Giao diện Kanban kéo thả trực quan. Quản lý lệnh điều xe.
3. **Đồng bộ Google Sheets (2-way Sync):**
   - Đã viết xong webhook trong `[[route]].ts`.
   - Đã cung cấp `scripts/google-apps-script.js` để gắn vào Google Sheet. Giao diện cấu hình đã nằm ở menu `Cài đặt` (Settings).
4. **Tối ưu Layout Mobile (Nhóm Kỹ Thuật):**
   - Đã fix lỗi tràn màn hình, mất chữ ở các thanh Tabs (`TabsList`) trên thiết bị Mobile cho 5 trang Kỹ Thuật (Bảo trì, Vật tư, CCDC, Lốp, Nhiên liệu). Dùng `PageHeader` để tối ưu diện tích.

### ⏳ Đang thực hiện (In Progress)
1. **Nâng cấp Bảng dữ liệu Nhóm Kỹ Thuật:**
   - Các trang Quản lý kho (Vật tư, Nhiên liệu...) hiện đang dùng thẻ `<Table>` HTML cơ bản.
   - **Đang chuẩn bị:** Chuyển đổi toàn bộ sang component `<DataTable>` để có tính năng "Ẩn/Hiện cột như Excel" đồng nhất với màn hình Quản lý Xe (Giai đoạn 2).
2. **Kiểm thử Thực chiến (Audit Playwright A-Z):**
   - Đã có kịch bản chạy test nhập liệu từ A-Z như người dùng thật để kiểm tra luật vận tải (Thông tư 99, NĐ 10) nhưng đang chờ tài nguyên hệ thống (Browser Agent).

---

## 4. Hướng dẫn chạy và phát triển (Developer Guidelines)

### Môi trường Local
Vì D1 Database chạy trên Cloudflare, việc test API local thông qua Wrangler có thể gặp lỗi cổng (port) với Vite.
Dự án đã thiết lập một **API Mocker Middleware** bên trong `vite.config.ts`. Middleware này sẽ chặn các request đến `/api/*` và xử lý trực tiếp bằng Node.js script để giả lập DB local trong lúc code giao diện.
- Lệnh chạy dev: `npm run dev`
- Truy cập: `http://localhost:5173`

### Nguyên tắc Code UI/UX
- **Mobile First:** Mọi tính năng mới (đặc biệt là Bảng/Table và Tab) đều phải ưu tiên kiểm tra giao diện trên Mobile để không bị bể khung hoặc cắt chữ.
- **Tái sử dụng Component:** Nếu cần một danh sách dữ liệu, HÃY DÙNG `src/components/shared/DataTable.tsx` thay vì tự viết lại `<table>`. Đi kèm với đó là `ColumnChooser` nếu có nhiều hơn 5 cột.
- **Màu sắc & Icon:** Sử dụng thư viện `lucide-react` cho icon. Dùng badge màu sắc (Shadcn `Badge`) để biểu thị trạng thái (ví dụ: Xanh lá = Hoàn thành, Đỏ = Sắp hết tồn kho/Hủy).

---

## 5. Nhật ký cập nhật (Changelog gần nhất)
- **[2026-07-04]:** Sửa lỗi hiển thị Tabs trên Mobile cho 4 trang quản lý Kho thành dạng Grid 2 cột (`grid-cols-2`). Thay thế Header cũ bằng `<PageHeader>` chuẩn.
- **[2026-07-03]:** Hoàn thiện Webhook Google Sheets 2 chiều. Xây dựng Data Mocking cho Local.

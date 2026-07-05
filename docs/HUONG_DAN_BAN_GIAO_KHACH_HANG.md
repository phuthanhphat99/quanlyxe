# 🚀 TÀI LIỆU HƯỚNG DẪN NGHIỆM THU & BÀN GIAO HỆ THỐNG FLEETPRO V3 ONLINE
**Giải pháp Số hóa Quản lý Vận tải & Kho Lốp/Vật tư Toàn diện cho Doanh nghiệp Vận tải Việt Nam**

---

## 🌟 1. TỔNG QUAN GIẢI PHÁP & KIẾN TRÚC ĐỘC QUYỀN

**FleetPro V3 Online** được thiết kế chuyên biệt cho ngành vận tải hàng hóa, container và xe tải nặng tại Việt Nam. Hệ thống giải quyết triệt dể bài toán phân mảnh dữ liệu giữa bộ phận Điều phối (Dispatch), Kế toán (Accounting) và Tài xế (Drivers) thông qua kiến trúc độc quyền:

> **⚡ Đồng bộ song song Siêu tốc Edge Cloud (Cloudflare D1) & Google Sheets**
> *   **Tốc độ xử lý tức thì (Real-time Cloud App)**: Ứng dụng Web hoạt động mượt mà, phản hồi dưới 100ms, hỗ trợ phân quyền chặt chẽ từng vai trò.
> *   **Lưu trữ & Báo cáo quen thuộc (Google Sheets Sync)**: Toàn bộ dữ liệu nghiệp vụ (Xe, Tài xế, Chuyến xe, Chi phí, Đơn hàng...) tự động đẩy song song sang bảng tính Google Sheets. Kế toán có thể lọc, vẽ biểu đồ, xuất Excel theo thói quen mà không cần học phần mềm mới!

---

## 📋 2. QUY TRÌNH 5 BƯỚC NGHIỆM THU TRẢI NGHIỆM THỰC TẾ (LIVE ACCEPTANCE CHECKLIST)

Khi tiếp nhận hệ thống, Quý Khách hàng (Chủ doanh nghiệp, Kế toán trưởng, Quản lý đội xe) chỉ cần thực hiện 5 bước kiểm chứng trực tiếp trên trình duyệt để xác nhận hệ thống hoạt động hoàn hảo 100%:

### 🟢 Bước 1: Kiểm thử Dữ Liệu Chuẩn Ngành (Data Readiness Test)
*   **Thao tác**: Mở ứng dụng FleetPro V3 trên trình duyệt, lướt qua các menu chính: *Danh mục xe, Tài xế, Khách hàng, Tuyến đường, Chuyến vận chuyển, Kho lốp, Kho vật tư*.
*   **Tiêu chí đạt (PASS)**:
    *   Hệ thống hiển thị mượt mà **36 dữ liệu mẫu chuẩn ngành vận tải Việt Nam** (Biển số xe tải 79C/79H, số điện thoại định dạng VN, các tuyến đường thực tế Nha Trang - TP.HCM, Đà Nẵng, Buôn Ma Thuột...).
    *   Không có bất kỳ lỗi trắng trang, lỗi tải dữ liệu hay treo trình duyệt.

### 🟡 Bước 2: Kiểm thử Luồng Nghiệp vụ Cốt lõi A-Z (Core Workflows Test)
*   **Thao tác**:
    1.  **Tạo mới Danh mục**: Thêm 1 Khách hàng mới và 1 Tài xế mới vào hệ thống.
    2.  **Lập Chuyến Vận chuyển**: Tạo 1 chuyến xe mới (Chọn xe tải 8 tấn, tài xế Nguyễn Văn A, chạy tuyến Nha Trang - TP.HCM, giá cước 18,000,000 VNĐ).
    3.  **Ghi nhận Chi phí dọc đường**: Vào menu Chi phí, lập 1 phiếu chi đổ dầu/cầu đường 3,500,000 VNĐ gắn với chuyến xe vừa tạo.
    4.  **Chuyển đổi Trạng thái**: Thay đổi trạng thái chuyến xe theo chu trình thực tế: `Mới` ➔ `Đã xác nhận` ➔ `Đang vận chuyển` ➔ `Đã hoàn thành`.
*   **Tiêu chí đạt (PASS)**:
    *   Dữ liệu lưu tức thì, tự động tính toán lại tổng cước, tổng chi phí và lợi nhuận ròng của chuyến xe.
    *   Các bảng biểu cập nhật ngay lập tức mà không cần tải lại trang (No page reload required).

### 🔴 Bước 3: Kiểm thử Kiểm Toán & Bảo Mật Phân Quyền (Audit Log & RBAC Test)
*   **Thao tác**: Vào menu **Kiểm toán (Audit Log)** trên thanh điều hướng bên trái.
*   **Tiêu chí đạt (PASS)**:
    *   Hệ thống ghi nhận 100% lịch sử thao tác ở Bước 2: *Ai là người vừa lập chuyến, vào thời gian nào, địa chỉ IP nào, dữ liệu trước và sau khi chỉnh sửa là gì*.
    *   Đây là tính năng bảo mật cao cấp giúp Chủ doanh nghiệp kiểm soát tuyệt đối, chống thất thoát, gian lận cước phí hay sửa xóa số liệu trái phép.

### ⚡ Bước 4: Kiểm thử Đồng Bộ Song Song Google Sheets (Real-time & Batch Sync Test)
*   **Thao tác**:
    1.  Vào menu **Cài đặt ➔ Dữ liệu**.
    2.  Bấm nút **"⚡ Đồng bộ toàn bộ dữ liệu ngay"**.
    3.  Mở bảng tính Google Sheets Master của doanh nghiệp ra kiểm tra.
*   **Tiêu chí đạt (PASS)**:
    *   Ứng dụng báo "Đồng bộ thành công".
    *   Tại Google Sheets, toàn bộ 10-12 tab dữ liệu (*Danh Muc Xe, Tai Xe, Khach Hang, Tuyen Duong, Chuyen Van Chuyen, Chi Phi, Bao Tri...*) tự động nạp đầy đủ số liệu mới nhất với tiêu đề phân màu Xanh/Vàng sang trọng, sẵn sàng cho Kế toán làm báo cáo thuế/nội bộ.

### 📱 Bước 5: Kiểm thử Giao diện Di động & Đa thiết bị (Mobile & Responsive Test)
*   **Thao tác**: Mở ứng dụng trên điện thoại di động, máy tính bảng hoặc thu nhỏ cửa sổ trình duyệt máy tính.
*   **Tiêu chí đạt (PASS)**:
    *   Giao diện tự động co giãn thông minh, thanh menu bên trái thu gọn thành nút Hamburger tiện lợi.
    *   Tài xế có thể thao tác bằng 1 tay trên điện thoại để báo cáo sự cố, gửi ảnh hóa đơn chi phí dọc đường về cho công ty cực kỳ đơn giản.

---

## 🚀 3. HƯỚNG DẪN 3 BƯỚC KHỞI ĐỘNG VẬN HÀNH THỰC TẾ CHO KHÁCH HÀNG

Sau khi nghiệm thu thành công, Quý Khách hàng có thể ngay lập tức đưa hệ thống vào vận hành thực tế chỉ với 3 bước vàng:

### 🛠️ Bước 1: Quản trị Bảng tính Google Sheets (Setup PRO Control Panel)
Hệ thống được tích hợp sẵn bộ công cụ **Setup PRO** ngay trên thanh Menu của Google Sheets Master:
*   **Để xem dữ liệu mẫu**: Chọn Menu **`🚀 FleetPro V3 Setup PRO` ➔ `⚡ 1. Cấu hình & Seed Data Mẫu`**. Hệ thống tự động tạo 36 dòng dữ liệu chuẩn Việt Nam để nhân viên làm quen.
*   **Để bắt đầu chạy thực tế (Xóa data mẫu)**: Chọn Menu **`🚀 FleetPro V3 Setup PRO` ➔ `🧹 2. Xóa Data Mẫu (Giữ Header)`**. Toàn bộ số liệu mẫu sẽ được làm sạch chỉ trong 2 giây, giữ nguyên cấu trúc cột tiêu đề để bắt đầu nhập liệu thật của công ty.
*   **Mở Bảng điều khiển Card PRO**: Chọn **`🌟 Mở Giao Diện Setup PRO (HTML Sidebar)`** hoặc **`💻 Mở Giao Diện Setup PRO (Cửa sổ lớn)`** để quản lý Spreadsheet ID và kết nối Webhook trực quan bằng nút bấm.

### 👥 Bước 2: Đăng nhập theo Phân quyền Bộ phận (RBAC Profiles)
Hệ thống chia sẵn 4 vai trò cốt lõi, đảm bảo "đúng người - đúng việc":
1.  **Quản trị viên (Admin)** (`admin@...` / Token: `REPLACE_ADMIN_TENANT_TOKEN`):
    *   Quyền cao nhất: Xem toàn bộ báo cáo doanh thu/lợi nhuận, quản lý tài khoản nhân viên, cấu hình hệ thống, xóa lịch sử.
2.  **Quản lý / Điều phối (Manager / Dispatcher)** (`manager@...` / Token: `REPLACE_MANAGER_TOKEN`):
    *   Chuyên trách điều xe: Tạo chuyến vận chuyển, phân công xe & tài xế, theo dõi trạng thái đơn hàng, lên lịch bảo trì đội xe.
3.  **Kế toán vận tải (Accountant)** (`accountant@...` / Token: `REPLACE_ACCOUNTANT_TOKEN`):
    *   Chuyên trách thu chi: Duyệt chi phí dọc đường, chốt cước vận chuyển, theo dõi kho lốp/vật tư, xuất báo cáo Excel/Google Sheets.
4.  **Tài xế (Driver)** (`driver@...` / Token: `REPLACE_DRIVER_TOKEN`):
    *   Giao diện tối giản trên điện thoại: Xem lịch chạy được phân công, bấm xác nhận nhận chuyến, chụp ảnh hóa đơn gửi yêu cầu hoàn ứng chi phí nhiên liệu/cầu đường.

### 🚛 Bước 3: Chu trình Lập & Hoàn tất 1 Chuyến xe Chuẩn (1-Minute Workflow)
1.  **Điều xe**: Quản lý vào **Chuyến xe ➔ Thêm mới**, chọn Xe, Tài xế, Khách hàng, Tuyến đường và bấm **Lưu**. Trạng thái chuyến là `Mới`.
2.  **Chạy chuyến**: Tài xế nhận thông báo, chạy xe trên tuyến. Khi đổ xăng hoặc qua trạm thu phí, tài xế vào menu **Chi phí**, chọn chuyến xe và nhập số tiền chi.
3.  **Duyệt & Chốt**: Kế toán vào kiểm tra chứng từ chi phí, đổi trạng thái chi phí thành `Đã duyệt`. Khi chuyến xe hoàn tất, Quản lý đổi trạng thái chuyến sang `Đã hoàn thành`. Toàn bộ số liệu lập tức cập nhật sang Google Sheets!

---

## 🛡️ 4. CAM KẾT CHẤT LƯỢNG & BẢO HÀNH KỸ THUẬT

*   **Chất lượng Mã nguồn**: Toàn bộ codebase đã vượt qua kiểm tra đóng gói tự động (`npm run build`), đạt chuẩn TypeScript strict-mode, không có lỗi rò rỉ bộ nhớ hay xung đột dữ liệu.
*   **An toàn Dữ liệu**: Với cơ chế sao lưu song song Edge Cloud D1 và Google Sheets, dữ liệu doanh nghiệp được bảo vệ kép, không bao giờ lo mất mát do sự cố phần cứng.

📞 **Hỗ trợ Kỹ thuật & Tư vấn Vận hành**:
*   **Email hỗ trợ**: contact@tnc.io.vn
*   **Zalo Group Hỗ trợ 24/7**: [https://zalo.me/g/tdhmtu261](https://zalo.me/g/tdhmtu261)
*   **Hotline Admin**: 0989.890.022

---
*Xin chân thành cảm ơn Quý Khách hàng đã tin tưởng và đồng hành cùng FleetPro V3 Online. Chúc Quý Công ty kinh doanh phát đạt, những chuyến xe luôn thượng lộ bình an!* 🚛💨

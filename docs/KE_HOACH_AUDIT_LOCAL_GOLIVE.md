# 📋 KẾ HOẠCH AUDIT LOCAL CHUẨN GO-LIVE & BÀN GIAO KHÁCH HÀNG (FLEETPRO V3 ONLINE)

**Đối tượng bàn giao:** Công ty TNHH Phú An (Phú An Logistics)  
**Tên dự án:** Hệ Thống Quản Lý Vận Tải & Kho Lốp/Vật Tư FleetPro V3 Online  
**Mục tiêu:** Kiểm chứng 100% độ ổn định mã nguồn, cấu trúc dữ liệu theo Chuẩn V5, luồng nghiệp vụ E2E A-Z, bảo mật RBAC và đồng bộ thời gian thực sang Google Sheets Master trước khi đóng gói phát hành (`Go-Live`) và bàn giao nghiệm thu.

---

## 🌟 1. TIÊU CHÍ HOÀN THÀNH (DEFINITION OF DONE - GO-LIVE GATE)

| Tiêu chí | Mô tả Yêu cầu | Phương pháp Kiểm chứng | Yêu cầu PASS |
| :--- | :--- | :--- | :--- |
| **1. Mã Nguồn & Tĩnh** | Codebase sạch 100%, không xung đột TypeScript, không lỗi linter, đóng gói thành công. | Chạy bộ lệnh static typing & bundle CLI. | `0 errors` cho `typecheck`, `lint` và `build`. |
| **2. Chuẩn Dữ Liệu V5** | Tất cả ID bản ghi nghiệp vụ tuân thủ tiền tố ngành logistics và cấu trúc cột đầy đủ. | Chạy script kiểm toán định danh & trường dữ liệu. | `100% docs` đúng prefix (`XE-`, `TX-`, `DH-`, `TD-`...). |
| **3. Nghiệp Vụ E2E A-Z** | Luồng tạo Đơn hàng ➔ Điều phối chuyến xe ➔ Duyệt chi phí ➔ Tính lợi nhuận ròng hoạt động trơn tru. | Chạy Playwright E2E automation & thao tác UI thủ công. | Không crash UI, tự động tính toán Net Profit tức thì. |
| **4. Phân Quyền RBAC** | Đúng người đúng việc 4 vai trò: Admin, Manager, Accountant, Driver; ghi nhận Audit Log. | Kiểm thử chéo quyền các tài khoản & kiểm tra tab Nhật ký. | Driver bị chặn Admin, Accountant bị chặn xóa tài khoản, 100% thao tác được log lại. |
| **5. Mobile UI & PWA** | Giao diện tự động co giãn trên di động, hỗ trợ chạy offline qua Service Worker / IndexedDB. | Chạy QA Mobile UI audit & test chế độ Offline Network. | Hamburger menu mượt mà, đồng bộ thành công khi có mạng lại. |
| **6. Đồng Bộ Google Sheets**| Dữ liệu đẩy song song thời gian thực & batch sync về Spreadsheet Master chuẩn màu sắc header. | Kích hoạt Webhook sync & kiểm tra tab Google Sheets. | Dữ liệu cập nhật đầy đủ tại Google Sheets Master, không lệch cột. |

---

## 📋 2. BỘ LỆNH AUDIT LOCAL TỰ ĐỘNG HÓA (LOCAL AUTOMATION COMMANDS)

### Giai Đoạn 1: Kiểm Toán Mã Nguồn & Tĩnh
```bash
# 1.1. Kiểm tra toàn bộ kiểu dữ liệu TypeScript strict-mode
npm run typecheck

# 1.2. Kiểm tra quy chuẩn viết mã (ESLint React Hooks)
npm run lint

# 1.3. Thử nghiệm bundle đóng gói sản phẩm Go-Live
npm run build
```

### Giai Đoạn 2: Kiểm Toán Định Danh & Cấu Trúc Dữ Liệu
```bash
# 2.1. Kiểm chứng định dạng ID Chuẩn V5 Ngành Logistics
node scripts/verify-v5-standard.mjs

# 2.2. Kiểm toán cấu trúc cột dữ liệu bắt buộc (Final Data Audit)
node scripts/final-audit.mjs
```

### Giai Đoạn 3 & 5: Kiểm Thử Tự Động Nghiệp Vụ E2E & Mobile UI
```bash
# 3.1. Chạy trình duyệt tự động Playwright (Bơm 36 data mẫu chuẩn VN & test luồng A-Z)
node scripts/dom-seed-and-test-a2z.mjs

# 5.1. Kiểm thử giao diện di động & Menu coverage
npm run qa:release-mobile-pro
```

### Giai Đoạn 4 & 6: Kiểm Toán Phân Quyền RBAC & Google Sheets Sync
```bash
# 6.1. Kích hoạt đồng bộ toàn bộ dữ liệu sang Google Sheets Master
node scripts/trigger-webhook-sync.mjs
```

---

## 🚀 3. QUY TRÌNH BÀN GIAO & KHỞI ĐỘNG VẬN HÀNH CHO KHÁCH HÀNG PHÚ AN

Sau khi hoàn tất Audit Local đạt 100% tiêu chí, thực hiện quy trình bàn giao 3 bước:
1. **Bước 1 (Làm sạch Dữ liệu Mẫu):** Hướng dẫn Kế toán trưởng / Admin Công ty Phú An truy cập bảng tính Google Sheets Master ➔ Menu **`🚀 FleetPro V3 Setup PRO`** ➔ Chọn **`🧹 2. Xóa Data Mẫu (Giữ Header)`**. Toàn bộ số liệu test sẽ được làm sạch, sẵn sàng nhập liệu thực tế.
2. **Bước 2 (Bàn giao Tài khoản Core):** Cung cấp danh sách 4 tài khoản chuẩn được phân quyền sẵn sàng:
   - Quản trị viên: `admin@phuan.vn`
   - Quản lý / Điều phối: `manager@phuan.vn`
   - Kế toán vận tải: `accountant@phuan.vn`
   - Tài xế di động: `driver@phuan.vn`
3. **Bước 3 (Ký biên bản Nghiệm thu):** Đính kèm **Báo Cáo Kết Quả Audit (Audit Evidence Report)** xuất từ các bước chạy tự động trên Local cùng tài liệu hướng dẫn nghiệm thu (`HUONG_DAN_BAN_GIAO_KHACH_HANG.md`).

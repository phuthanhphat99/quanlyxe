# 🚀 ĐỀ XUẤT KẾ HOẠCH GO-LIVE CHUẨN RIÊNG CHO KHÁCH HÀNG PHÚ AN

**Khách hàng:** Công ty TNHH Phú An (Phú An Logistics)  
**Mã Tenant ID:** `internal-tenant-phuan` | **Mã Dự án:** `quanlyxe-phuan`  
**Kiến trúc:** Tenant Workspace Isolation (Độc lập cấu hình & dữ liệu — Không can thiệp Code Chung)  
**Ngày đề xuất:** 06/07/2026  

---

## 🏗️ 1. KIẾN TRÚC CÔ LẬP DỮ LIỆU TENANT (WORKSPACE ISOLATION)

Theo đúng yêu cầu của Ban Giám Đốc, toàn bộ mã nguồn lõi của ứng dụng FleetPro V3 (`src/`, `functions/`, `components/`) được **GIỮ NGUYÊN 100% (CODE CHUNG)**. Toàn bộ cấu hình chuyên biệt, bộ định mức ngành, danh mục tài sản và kịch bản vận hành của Công ty TNHH Phú An được đóng gói độc lập tại thư mục riêng biệt:

```text
tenants/phuan/
├── config.json                 # Cấu hình riêng: Tenant ID, Logo, MST, Danh sách Admin, Quy tắc nghiệp vụ
├── data/
│   └── initial-assets.json     # Bộ dữ liệu thực tế Phú An: Xe tải, Tài xế, Đối tác CP Thép Phú An, Tuyến Cái Mép
├── scripts/
│   ├── onboarding-seed.mjs     # Kịch bản tự động bơm dữ liệu chuẩn Phú An (không chạm code chung)
│   └── verify-phuan-golive.mjs # Kịch bản kiểm toán an toàn Go-Live riêng cho Phú An
└── GO_LIVE_PROPOSAL.md         # Tài liệu đề xuất Go-Live & Bàn giao
```

---

## 📋 2. ĐỀ XUẤT LỘ TRÌNH GO-LIVE CHÍNH THỨC 4 BƯỚC CHO PHÚ AN

### Bước 1: Khởi tạo Bộ Dữ Liệu Chuẩn Phú An (Zero-Interference Seeding)
- **Thực hiện:** Đội ngũ Kỹ thuật chạy lệnh thao tác riêng cho tenant Phú An:
  ```bash
  npm run tenant:phuan:seed
  ```
- **Kết quả:** Hệ thống đọc tự động từ `tenants/phuan/config.json` và `tenants/phuan/data/initial-assets.json`, khởi tạo ngay lập tức danh mục xe đầu kéo Hyundai HD320 (`XE-PA01`), xe tải Hino (`XE-PA02`), tài xế bằng FC/C, đối tác chiến lược Công ty CP Thép Phú An (`KH-THEP01`) và tuyến đường huyết mạch TP.HCM ➔ Cảng Cái Mép (`TD-HCMCM`).

### Bước 2: Kiểm Toán An Toàn Nghiệp Vụ & Lợi Nhuận Ròng (Go-Live Audit)
- **Thực hiện:** Chạy lệnh kiểm chứng tự động:
  ```bash
  npm run tenant:phuan:verify
  ```
- **Kết quả:** Xác nhận 100% xe và tài xế ở trạng thái `Active`, kiểm tra rào chắn điều vận (Guards B1, B2, B3) và khớp lệnh chính xác Lợi nhuận ròng Chuyến xe mẫu Phú An đạt chuẩn **2.760.000 VNĐ**.

### Bước 3: Đồng Bộ Thời Gian Thực Sang Google Sheets Kế Toán
- **Thực hiện:** Khách hàng mở Google Sheets Master của Phú An, vào menu **`🚀 FleetPro V3 Setup PRO` ➔ `Cấu hình Webhook`**.
- **Cấu hình:** Sử dụng Khóa bảo mật riêng của Phú An (`PHUAN_SECRET_KEY_123`). Toàn bộ phiếu chi dọc đường (Dầu, BOT, Bồi dưỡng) sẽ tự động đẩy sang Spreadsheet theo tiêu đề tiếng Việt chuẩn NĐ10.

### Bước 4: Phân Quyền & Bàn Giao 3 Tài Khoản Chính Thức Phú An
Hệ thống đã thiết lập sẵn 3 tài khoản quản trị cốt lõi theo đúng sơ đồ tổ chức của Công ty TNHH Phú An:

| Tài Khoản | Email Đăng Nhập | Vai Trò (Role) | Phạm Vi Quyền Hạn |
| :--- | :--- | :---: | :--- |
| **Giám Đốc Phú An** | `admin@phuancr.vn` | `Admin` | Quản trị toàn diện, cấu hình hệ thống, theo dõi báo cáo lãi gộp toàn công ty. |
| **Trưởng Phòng Vận Tải** | `quanly@phuancr.vn` | `Manager` | Điều vận chuyến xe, quản lý kho lốp/nhiên liệu, giám sát GPS đội xe thời gian thực. |
| **Kế Toán Trưởng** | `ketoan@phuancr.vn` | `Accountant` | Duyệt/hủy phiếu chi, hạch toán công nợ khách hàng, xuất báo cáo thuế Excel/PDF. |

---

## 🛠️ 3. BỘ LỆNH VẬN HÀNH DÀNH RIÊNG CHO ĐỘI KỸ THUẬT PHÚ AN

Để quản lý riêng khách hàng Phú An mà không gây ảnh hưởng đến bất kỳ khách hàng nào khác trên hệ thống, Đội kỹ thuật sử dụng 3 lệnh chuẩn trong `package.json`:

```bash
# 1. Khởi tạo / Bơm lại số liệu chuẩn của Phú An vào database
npm run tenant:phuan:seed

# 2. Kiểm chứng nghiệm thu Go-Live riêng cho Phú An
npm run tenant:phuan:verify

# 3. Chạy liên hoàn toàn bộ quy trình Onboarding + Kiểm toán Go-Live Phú An
npm run tenant:phuan:golive
```

---

## 🏁 4. CAM KẾT KỸ THUẬT & BẢO TRÌ

1. **Tính Cô Lập Tuyệt Đối (Multi-Tenant Isolation):** Mọi thao tác sửa đổi định mức hay thêm mới tài sản trong thư mục `tenants/phuan/` không bao giờ làm ảnh hưởng đến cấu trúc code hay dữ liệu của các tenant khác.
2. **Sẵn Sàng Mở Rộng:** Khi Phú An mở rộng quy mô đội xe lên 100+ xe tải hoặc mở thêm chi nhánh mới, chỉ cần khai báo thêm vào `tenants/phuan/data/initial-assets.json` và thực hiện đồng bộ nhanh.

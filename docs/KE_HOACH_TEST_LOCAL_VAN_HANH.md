# 📋 KẾ HOẠCH TEST LOCAL THỰC TẾ & DIỄN TẬP VẬN HÀNH (OPERATIONAL DRY-RUN HANDBOOK)

**Đối tượng sử dụng:** Đội ngũ Vận hành / Kỹ thuật Triển khai / Quản lý Dự án  
**Mục đích:** Diễn tập toàn bộ các bước làm sạch dữ liệu mẫu trên Google Sheets Master, khởi tạo tài sản thật của **Công ty TNHH Phú An**, thử nghiệm chu trình phối hợp Điều phối - Kế toán 1 phút và xác nhận đồng bộ số liệu sang bảng tính trước khi hướng dẫn trực tiếp cho Khách hàng.

---

## 🟢 BƯỚC 1: DIỄN TẬP LÀM SẠCH DỮ LIỆU MẪU TRÊN GOOGLE SHEETS (SETUP PRO CLEAN SWEEP)

### 1.1. Mục tiêu
Xác nhận cụm tính năng **Setup PRO** trên Google Sheets Master xóa sạch số liệu test trong 2 giây nhưng **bảo toàn tuyệt đối 100% định dạng dòng tiêu đề (Header Row 1)** màu Xanh/Vàng chuẩn.

### 1.2. Thao tác Diễn tập trên Google Sheets
1. Mở Bảng tính Google Sheets Master của doanh nghiệp (Spreadsheet ID: `1SFXH7xwlMAGxjh-Y5PCglkadgxVVe5xRaEZZeewJv_o` hoặc bản sao local).
2. Kiểm tra sự xuất hiện của Menu **`🚀 FleetPro V3 Setup PRO`** trên thanh Menu trên cùng.
3. Bấm chọn **`🚀 FleetPro V3 Setup PRO` ➔ `🧹 2. Xóa Data Mẫu (Giữ Header)`**.
4. Khi hộp thoại xác nhận an toàn hiện lên, bấm **Đồng ý (Yes/OK)**.

### 1.3. Tiêu chí Đạt (PASS Criteria)
- [ ] Toàn bộ 12 tab dữ liệu (`Danh Muc Xe`, `Tai Xe`, `Khach Hang`, `Tuyen Duong`, `Chuyen Van Chuyen`, `Chi Phi`...) được làm sạch dòng dữ liệu bên dưới trong thời gian dưới 3 giây.
- [ ] **Tiêu chí sống còn**: Dòng tiêu đề 1 (Row 1) của mọi tab giữ nguyên màu nền Xanh/Vàng sang trọng, tên cột tiếng Việt chính xác (`Mã xe`, `Biển số`, `Tải trọng`, `Tồn kho`...), không mất định dạng hay công thức tổng kết.

---

## 🟡 BƯỚC 2: DIỄN TẬP KHỞI TẠO DỮ LIỆU THỰC TẾ ĐẦU TIÊN (REAL DATA ONBOARDING DRY-RUN)

### 2.1. Mục tiêu
Giả lập thao tác của bộ phận Điều phối Phú An nhập các tài sản thật của doanh nghiệp trên Local Web App (`http://localhost:5175`).

### 2.2. Kịch bản Dữ liệu Thực tế Phú An cần Nhập
Có thể nhập thủ công trên giao diện Web hoặc chạy script tự động hóa `node scripts/test-phuan-real-onboarding.mjs`:

#### A. Danh mục Xe tải chính thức (2 Xe)
1. **Xe Đầu kéo Tải nặng**: Biển số `50H-123.88` | Mã `XE-PA01` | Hiệu xe `Hyundai HD320` | Tải trọng `30 tấn` | Nhiên liệu `Diesel` | Định mức `35L/100km` | Trạng thái `Hoạt động`.
2. **Xe Tải thùng Thường**: Biển số `51D-999.99` | Mã `XE-PA02` | Hiệu xe `Hino 500 FG` | Tải trọng `8.5 tấn` | Nhiên liệu `Diesel` | Định mức `22L/100km` | Trạng thái `Hoạt động`.

#### B. Danh mục Tài xế chính thức (2 Tài xế)
1. **Tài xế 1 (Đầu kéo)**: Họ tên `Trần Văn Phú` | Mã `TX-PHU01` | SĐT `0988111222` | CCCD `079085001111` | GPLX Hạng `FC` | Lương cơ bản `16,000,000 VNĐ`.
2. **Tài xế 2 (Xe thùng)**: Họ tên `Nguyễn Đức An` | Mã `TX-AN02` | SĐT `0977333444` | CCCD `079090002222` | GPLX Hạng `C` | Lương cơ bản `13,000,000 VNĐ`.

#### C. Đối tác & Tuyến đường Huyết mạch
1. **Khách hàng lớn**: Tên `Công ty CP Thép Phú An` | Mã `KH-THEP01` | MST `0312345678` | Hạn mức nợ `500,000,000 VNĐ`.
2. **Tuyến đường**: Tên `TP.HCM ➔ Cảng Cái Mép (Vũng Tàu)` | Mã `TD-HCMCM` | Cự ly `85 km` | Giá cước cơ bản `4,500,000 VNĐ` | Phí cầu đường `240,000 VNĐ` | Phụ cấp tài xế `300,000 VNĐ`.

---

## 🔴 BƯỚC 3: DIỄN TẬP CHU TRÌNH LẬP CHUYẾN & CHỐT LỢI NHUẬN 1-PHÚT (1-MINUTE WORKFLOW)

### 3.1. Mục tiêu
Kiểm chứng sự phối hợp mượt mà giữa Điều phối viên (Manager) và Kế toán viên (Accountant) trên số liệu thực tế vừa khởi tạo.

### 3.2. Thao tác Diễn tập trên Web App
1. **Điều phối tạo Đơn hàng & Xếp chuyến**:
   - Vào menu **Đơn hàng ➔ Thêm mới**: Chọn Khách hàng `CP Thép Phú An`, Tuyến `TP.HCM ➔ Cái Mép`, Hàng hóa `Thép cuộn xây dựng 25 tấn`, Doanh thu `4,500,000 VNĐ`.
   - Vào menu **Chuyến xe ➔ Thêm mới**: Gán Đơn hàng trên cho Xe đầu kéo `50H-123.88` và Tài xế `Trần Văn Phú`. Trạng thái ban đầu: `Mới`.
2. **Ghi nhận Chi phí Dọc đường thực tế**:
   - Vào menu **Chi phí ➔ Thêm phiếu chi**:
     - *Phiếu 1*: Chuyến xe Cái Mép | Hạng mục `Nhiên liệu (Dầu Diesel)` | Số tiền `1,200,000 VNĐ` | Thanh toán `Chuyển khoản` | Ghi chú `Đổ 58L DO @ 20,500đ`.
     - *Phiếu 2*: Chuyến xe Cái Mép | Hạng mục `Phí cầu đường` | Số tiền `240,000 VNĐ` | Thanh toán `Tiền mặt` | Ghi chú `Phí BOT Cao tốc Long Thành`.
3. **Kế toán Duyệt chứng từ & Chốt chuyến**:
   - Kế toán vào kiểm tra, đổi trạng thái 2 phiếu chi thành `Đã duyệt`.
   - Khi xe giao hàng hoàn tất, Quản lý đổi trạng thái Chuyến xe sang `Đã hoàn thành`.

### 3.3. Tiêu chí Đạt (PASS Criteria)
- [ ] Bảng theo dõi Chuyến xe tự động tính toán tức thì Lợi nhuận ròng (`Net Profit`) không cần tải lại trang:
  $$\text{Net Profit} = 4,500,000 \text{ (Cước)} - [1,200,000 \text{ (Dầu)} + 240,000 \text{ (BOT)} + 300,000 \text{ (Phụ cấp)}] = \mathbf{2,760,000 \text{ VNĐ}}$$

---

## ⚡ BƯỚC 4: KIỂM CHỨNG ĐỒNG BỘ NGƯỢC VỀ GOOGLE SHEETS MASTER

### 4.1. Thao tác Kiểm chứng
1. Trên Web App, vào menu **Cài đặt ➔ Dữ liệu** ➔ Bấm nút **"⚡ Đồng bộ toàn bộ dữ liệu ngay"**.
2. Mở bảng tính Google Sheets Master của Phú An để kiểm tra.

### 4.2. Tiêu chí Đạt (PASS Criteria tại Google Sheets)
- [ ] Tab `Danh Muc Xe`: Xuất hiện xe `50H-123.88` và `51D-999.99` chuẩn tên cột tiếng Việt.
- [ ] Tab `Tai Xe`: Xuất hiện tài xế `Trần Văn Phú` và `Nguyễn Đức An`.
- [ ] Tab `Chuyen Van Chuyen` & `Chi Phi`: Xuất hiện chuyến xe Cái Mép cùng 2 khoản chi dầu/cầu đường, sẵn sàng cho Kế toán in báo cáo nội bộ/báo cáo thuế.

---

## 🛠️ CÔNG CỤ DIỄN TẬP TỰ ĐỘNG HÓA
Đội ngũ vận hành có thể tự động hóa toàn bộ Bước 2 và Bước 3 bằng cách chạy lệnh CLI trên máy tính Local:
```bash
node scripts/test-phuan-real-onboarding.mjs
```
Script sẽ tự động kết nối cổng `5175`, bơm đúng số liệu thật của Phú An, thực hiện xếp chuyến, tạo phiếu chi và xác nhận con số Lợi nhuận ròng `2,760,000 VNĐ` chỉ trong 10 giây!

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PhuAnDocs() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-[Inter]">
      <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
        
        {/* Header */}
        <header className="bg-blue-900 rounded-3xl p-8 text-white shadow-xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
          <div className="relative z-10">
            <Link to="/auth" className="inline-flex items-center text-blue-200 hover:text-white mb-6 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại Đăng nhập
            </Link>
            <br/>
            <div className="inline-block px-4 py-1.5 bg-blue-800/80 rounded-full text-sm font-semibold mb-4 border border-blue-500/50">
              Sổ Tay Vận Hành Phú An Thực Chiến
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Hướng Dẫn Vận Hành Hệ Thống<br/><span className="text-yellow-400">Công ty TNHH Phú An</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl leading-relaxed">
              Tài liệu siêu đơn giản dành cho người dùng không rành công nghệ thao tác nhanh trên phần mềm.
            </p>
            
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 inline-block">
              <p className="text-sm uppercase tracking-wider text-blue-200 font-semibold mb-1">Mật Khẩu Chung Cho Mọi Tài Khoản</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-yellow-300">Demo@1234</p>
            </div>
          </div>
          {/* Decorative circle */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        </header>

        {/* TOC */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a href="#taixe" className="bg-white p-4 rounded-xl shadow border-l-4 border-emerald-500 text-center font-medium hover:bg-emerald-50 transition">1. Dành cho TÀI XẾ</a>
          <a href="#quanly" className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500 text-center font-medium hover:bg-blue-50 transition">2. Dành cho ĐIỀU PHỐI</a>
          <a href="#ketoan" className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500 text-center font-medium hover:bg-purple-50 transition">3. Dành cho KẾ TOÁN</a>
          <a href="#admin" className="bg-white p-4 rounded-xl shadow border-l-4 border-rose-500 text-center font-medium hover:bg-rose-50 transition">4. Dành cho GIÁM ĐỐC</a>
        </div>

        {/* 1. TÀI XẾ */}
        <section id="taixe" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-6">
          <div className="bg-emerald-50 p-6 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/30">🚛</div>
              <div>
                <h2 className="text-2xl font-bold text-emerald-900">1. Quy Trình Cho TÀI XẾ (Driver)</h2>
                <p className="text-emerald-700">Người lái xe, báo cáo lộ trình và xác nhận đã trả hàng.</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2">TÀI KHOẢN ĐĂNG NHẬP:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-mono text-emerald-700 font-bold">
                <div className="bg-white p-2 border rounded shadow-sm text-center">taixe@phuancr.vn</div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Mỗi tài khoản tương ứng với 1 xe trong đội xe Phú An.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Thao Tác Thực Tế:</h3>
              
              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">B0</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Gắn Xe (Nếu chưa có xe)</h4>
                    <p className="text-slate-600 mt-1">Lần đầu đăng nhập ➔ Dashboard sẽ hiện thông báo <b className="text-amber-600">"Chưa gắn xe"</b> ➔ Bấm vào nút <b className="text-emerald-700">"Nhận Xe"</b> ➔ Chọn biển số xe bạn đang cầm lái.</p>
                  </div>
                </div>
              </div>

              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">B1</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Tự Lập Lệnh Chạy Mới (Nếu Đang Rảnh)</h4>
                    <p className="text-slate-600 mt-1">Đăng nhập bằng điện thoại ➔ Màn hình chính (Dashboard) ➔ Bấm vào nút màu xanh lam góc dưới tên <b className="text-blue-600">"+ Khởi tạo lệnh điều xe"</b>.</p>
                    <p className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded">💡 VÍ DỤ: <br/>- Chọn đầu kéo bạn đang lái.<br/>- Nhập điểm đến: <b>"Cảng Ninh Hòa đi Kho Phú Yên"</b>.<br/>- Nhập hàng: <b>"Máy móc thiết bị"</b>.</p>
                  </div>
                </div>
              </div>

              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">B2</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Nhận và Xác Nhận Lệnh Điều Xe từ Quản Lý</h4>
                    <p className="text-slate-600 mt-1">Vào Menu <b>"Chuyến Đi ("Trips")</b> ➔ Thấy lệnh <b>Đã Điều Xe (Màu cam)</b> ➔ Bấm vào lệnh ➔ Trượt nút xanh <b className="text-emerald-600">"Chấp nhận Bắt đầu Lộ trình"</b>.</p>
                  </div>
                </div>
              </div>

              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">B3</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Trả Hàng Xong - Báo Hoàn Thành</h4>
                    <p className="text-slate-600 mt-1">Giao hàng thành công ➔ Mở lại ứng dụng ➔ Bấm vào Trip đang chạy ➔ Bấm nút <b className="text-blue-600">"Check-in Điểm Đến"</b> ➔ Ghi chú (nếu có: ví dụ "đã giao nộp đủ biên nhận cho kho") ➔ Bấm nút xanh lá <b className="text-green-600">"Hoàn Thành Chuyến"</b>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. QUẢN LÝ */}
        <section id="quanly" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-6">
          <div className="bg-blue-50 p-6 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/30">👨‍💻</div>
              <div>
                <h2 className="text-2xl font-bold text-blue-900">2. Quy Trình Cho QUẢN LÝ (Điều phối viên)</h2>
                <p className="text-blue-700">Người duyệt lệnh, ghép chuyến và bao quát trạng thái xe bãi.</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2">TÀI KHOẢN ĐĂNG NHẬP:</h3>
              <div className="inline-block bg-white px-4 py-2 border rounded shadow-sm text-lg font-mono text-blue-700 font-bold">
                quanly@phuancr.vn
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Thao Tác Thực Tế:</h3>
              
              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">B1</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Duyệt lệnh Nháp do Tài xế tự lập</h4>
                    <p className="text-slate-600 mt-1">Vào menu <b>"Lịch Trình / Điều Phối" (Dispatch)</b> ➔ Bạn sẽ thấy khung các lệnh Vận tải báo trạng thái Nháp (Màu Xám) ➔ Bấm vào tên Lệnh ➔ Điền thêm Tuyến Đường Khách Hàng thật vào để App tính Giá và km ➔ Đổi trạng thái thành <b className="bg-amber-100 text-amber-800 px-2 rounded">Đã Điều Xe (Dispatched)</b>.</p>
                  </div>
                </div>
              </div>

              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">B2</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Lập Tuyến Có Sẵn & Chọn Tài Xế (Nếu Công ty giao)</h4>
                    <p className="text-slate-600 mt-1">Ở màn hình Lịch Trình, bấm nút <b className="border font-bold px-2 py-1 bg-slate-50">+ Tạo Chuyến Nhanh</b> (Góc phải trên) ➔ Chọn Xe, Tuyến Đường ví dụ <b>"Ninh Hòa đi Phú Yên"</b>, Khách hàng <b>"Nha Trang Seafood"</b> ➔ App sẽ Tự hiện số km và giá trị (ví dụ Tuyến Khứ Hồi đó &gt; 150km, tài xế sẽ nhận 1 Triệu VNĐ) ➔ Tạo Lệnh.</p>
                  </div>
                </div>
              </div>

              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">B3</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Tính năng Phân Tích Kích Bản Chạy Rỗng</h4>
                    <p className="text-slate-600 mt-1">Bấm nút <b className="text-indigo-600 font-bold">"Lọc Tuyến Tối Ưu"</b> có chữ AI ➔ Hệ thống sẽ xem xét các xe có thể gom chung tải hoặc xe trả hàng có thể bốc hàng chiều về, gợi ý để bạn Duyệt giúp Công ty tiết kiệm chi phí nhiên liệu!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. KẾ TOÁN */}
        <section id="ketoan" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-6">
          <div className="bg-purple-50 p-6 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/30">💰</div>
              <div>
                <h2 className="text-2xl font-bold text-purple-900">3. Quy Trình Cho KẾ TOÁN</h2>
                <p className="text-purple-700">Người nhập khoản chi trên đường, đối chiếu, và chốt doanh thu.</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2">TÀI KHOẢN ĐĂNG NHẬP:</h3>
              <div className="inline-block bg-white px-4 py-2 border rounded shadow-sm text-lg font-mono text-purple-700 font-bold">
                ketoan@phuancr.vn
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Thao Tác Thực Tế:</h3>
              
              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center shrink-0">B1</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Nhập Liệu Phiếu Chi Trên Đường (Đổ Dầu, Vé Cầu Đường VETC)</h4>
                    <p className="text-slate-600 mt-1">Vào menu <b>"Chi Phí & Xăng Dầu" (Expenses)</b> ➔ Bấm <b className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm">+ Thêm Phiếu Chi</b>.</p>
                    <p className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded">💡 VÍ DỤ: <br/>- Nhập Hạng Mục: Xăng Dầu.<br/>- Chọn biển số Xe và Tài Xế.<br/>- Nhập số tiền đúng với hóa đơn giấy mang về.<br/>- <b>Đảm bảo độ tin cậy của sổ sách 100%.</b></p>
                  </div>
                </div>
              </div>

              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center shrink-0">B2</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Kết toán lương khoán Tài xế cuối chuyến</h4>
                    <p className="text-slate-600 mt-1">Khi Tài Xế bấm nút hoàn thành, phần mềm đã <b className="text-green-600">tự tính Lương Mặc Định khoán:</b> 1,000,000đ cho tuyến đường khứ hồi dài qua 150km. Kế toán chỉ vào Duyệt <b>(Closed)</b> lệnh vận chuyển là xong!</p>
                  </div>
                </div>
              </div>
              
              <div className="transition-transform duration-200 hover:-translate-y-1 bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center shrink-0">B3</div>
                  <div>
                    <h4 className="font-bold text-slate-800">Xuất Báo Cáo 1 Click Ký Tên Dấu</h4>
                    <p className="text-slate-600 mt-1">Kế toán vào menu <b>"Báo cáo"</b> ở dưới cùng ➔ Bấm nút <b className="text-red-500 border border-red-500 px-2 py-0.5 rounded">Tải PDF Tổng Hợp</b> của Tháng. Báo cáo ra đủ: Biểu đồ Lãi Lỗ, Chi tiết chạy của từng biển số xe, và liệt kê từng vé dầu mua vào ngày nào ra File A4 để Mộc trình Giám Đốc đỏ!</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. ADMIN / GIÁM ĐỐC */}
        <section id="admin" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-6">
          <div className="bg-rose-50 p-6 border-b border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-500/30">👑</div>
              <div>
                <h2 className="text-2xl font-bold text-rose-900">4. Quy Trình Cho BAN GIÁM ĐỐC (Admin)</h2>
                <p className="text-rose-700">Người Nắm Quyền Sát Sinh Toàn Hệ Thống - Xem Toàn Số Tổng.</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2">TÀI KHOẢN ĐĂNG NHẬP:</h3>
              <div className="inline-block bg-white px-4 py-2 border rounded shadow-sm text-lg font-mono text-rose-700 font-bold">
                admin@phuancr.vn
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Đặc quyền của Admin:</h3>
              
              <ul className="list-disc list-inside space-y-3 text-slate-700">
                <li><b className="text-rose-600">Thấy hết mọi ngóc ngách:</b> Mở web lên ở Trình Duyệt máy tính để xem tối ưu nhất.</li>
                <li><b>Màn Hình Dashboard "Thực Chiến":</b> Xem trực tiếp số liệu từ hàng trăm chuyến đi trải dài trong tháng, giúp phân tích Tỉ suất lợi tức Gross Margin tức thì.</li>
                <li><b>Quản Lý Data Phú An:</b> Chỉ người được gọi là Admin (Giám Đốc / Điều Hành) mới có thể vào tạo danh sách các đầu Xe mới, và Khai báo Tuyến Đường mới khi kí hợp đồng thêm cho công ty Phú An. (Menu: Danh Mục).</li>
                <li><b className="text-blue-600 italic">Tính năng Elite:</b> AI gợi ý cắt giảm chi phí nhiên liệu dựa trên lịch sử chạy của các tài xế trong tháng qua.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 p-8 text-center rounded-2xl">
          <p className="font-medium text-white mb-2">Chúc Quý Công ty Phú An triển khai hệ thống thành công!</p>
          <p className="text-sm">Tài liệu trực quan được thiết kế để thao tác phần mềm Phú An dễ dàng nhất.</p>
        </footer>
      </div>
    </div>
  );
}

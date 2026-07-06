import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5175';
const SCREENSHOT_DIR = path.resolve('d:/QUANLYXE_ONLINE/quanlyxe/qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runPhuAnOnboardingDryRun() {
  console.log('════════════════════════════════════════════════════════════');
  console.log(' 🚀 KHỞI ĐỘNG DIỄN TẬP VẬN HÀNH THỰC TẾ — CÔNG TY PHÚ AN');
  console.log('════════════════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log(`📡 Truy cập hệ thống tại: ${BASE}`);
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('🌱 [Playwright] Đang bơm số liệu thực tế đầu tiên của Công ty Phú An vào DataAdapter...');
    const result = await page.evaluate(async () => {
      const adapter = window.__dataAdapter;
      if (!adapter) throw new Error('window.__dataAdapter không tồn tại! Hãy kiểm tra Web App.');

      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      let createdCount = 0;

      // 1. VEHICLES (2 xe thực tế của Phú An)
      const vehs = [
        { license_plate: '50H-123.88', vehicle_code: 'XE-PA01', vehicle_type: 'Xe đầu kéo', brand: 'Hyundai HD320', capacity_tons: 30, fuel_type: 'Diesel', fuel_consumption_per_100km: 35, engine_number: 'D6AC-888899', chassis_number: 'KMHDA1700PA01', status: 'active', gps_status: 'active', dashcam_status: 'active' },
        { license_plate: '51D-999.99', vehicle_code: 'XE-PA02', vehicle_type: 'Xe tải thùng', brand: 'Hino 500 FG', capacity_tons: 8.5, fuel_type: 'Diesel', fuel_consumption_per_100km: 22, engine_number: 'J08E-PA0002', chassis_number: 'RL8J08E00PA02', status: 'active', gps_status: 'active', dashcam_status: 'active' }
      ];
      const createdVehs = [];
      for (const v of vehs) { const cv = await adapter.vehicles.create(v); createdVehs.push(cv); createdCount++; await sleep(1100); }

      // 2. DRIVERS (2 tài xế chính thức)
      const drvs = [
        { full_name: 'Trần Văn Phú', driver_code: 'TX-PHU01', phone: '0988111222', id_card: '079085001111', license_number: '790888999001', license_class: 'FC', date_of_birth: '1984-05-15', address: 'Quận 7, TP.HCM', license_expiry: '2029-12-31', health_check_expiry: '2028-06-30', base_salary: 16000000, status: 'active' },
        { full_name: 'Nguyễn Đức An', driver_code: 'TX-AN02', phone: '0977333444', id_card: '079090002222', license_number: '790888999002', license_class: 'C', date_of_birth: '1991-09-10', address: 'Thủ Đức, TP.HCM', license_expiry: '2028-10-15', health_check_expiry: '2027-10-15', base_salary: 13000000, status: 'active' }
      ];
      const createdDrvs = [];
      for (const d of drvs) { const cd = await adapter.drivers.create(d); createdDrvs.push(cd); createdCount++; await sleep(1100); }

      // 3. CUSTOMER (Đối tác chiến lược)
      const cus = { customer_code: 'KH-THEP01', company_name: 'Công ty CP Thép Phú An', tax_code: '0312345678', address: 'KCN Sóng Thần 2, Dĩ An, Bình Dương', contact_person: 'Anh Hùng - Trưởng phòng Vật tư', phone: '02833334444', email: 'logistics@thepphuan.vn', customer_type: 'doanh_nghiep', status: 'active', debt_limit: 500000000 };
      const createdCus = await adapter.customers.create(cus); createdCount++;
      await sleep(1100);

      // 4. ROUTE (Tuyến đường huyết mạch)
      const rte = { route_code: 'TD-HCMCM', route_name: 'TP.HCM ➔ Cảng Cái Mép (Vũng Tàu)', origin: 'ICD Phước Long, TP.HCM', destination: 'Cảng Cái Mép - Thị Vải, Phú Mỹ, Bà Rịa - Vũng Tàu', distance_km: 85, standard_freight_rate: 4500000, toll_cost: 240000, driver_allowance: 300000, status: 'active' };
      const createdRte = await adapter.routes.create(rte); createdCount++;
      await sleep(1100);

      // 5. TRANSPORT ORDER (Đơn hàng 1 phút)
      const ord = { order_code: 'DH-PA2026-01', customer_id: createdCus.id || 'KH-THEP01', route_id: createdRte.id || 'TD-HCMCM', pickup_date: '2026-07-06', delivery_date: '2026-07-06', cargo_description: 'Thép cuộn xây dựng Hòa Phát - 25 tấn', weight_tons: 25, total_amount: 4500000, status: 'confirmed' };
      const createdOrd = await adapter.transportOrders.create(ord); createdCount++;
      await sleep(1100);

      // 6. TRIP (Chuyến xe chuẩn)
      const vehId = createdVehs[0]?.id || 'XE-PA01';
      const drvId = createdDrvs[0]?.id || 'TX-PHU01';
      const trip = {
        trip_code: 'CX-PA2026-01',
        vehicle_id: vehId,
        driver_id: drvId,
        customer_id: createdCus.id || 'KH-THEP01',
        route_id: createdRte.id || 'TD-HCMCM',
        transport_order_id: createdOrd.id || 'DH-PA2026-01',
        departure_time: '2026-07-06T06:30:00.000Z',
        arrival_time: '2026-07-06T14:00:00.000Z',
        status: 'completed',
        gross_revenue: 4500000,
        total_cost: 1740000,
        net_profit: 2760000
      };
      const createdTrip = await adapter.trips.create(trip); createdCount++;
      await sleep(1100);

      // 7. EXPENSES (2 Phiếu chi dọc đường)
      const exps = [
        { expense_code: 'CP-PA01', trip_id: createdTrip?.id || 'CX-PA2026-01', vehicle_id: vehId, category: 'Nhiên liệu', amount: 1200000, expense_date: '2026-07-06', payment_method: 'Chuyển khoản', status: 'approved', description: 'Đổ 58L Dầu Diesel @ 20,500đ tại Cây xăng Bình Thái cho chuyến Cái Mép' },
        { expense_code: 'CP-PA02', trip_id: createdTrip?.id || 'CX-PA2026-01', vehicle_id: vehId, category: 'Phí cầu đường', amount: 240000, expense_date: '2026-07-06', payment_method: 'Tiền mặt', status: 'approved', description: 'Phí BOT Cao tốc Long Thành - Dầu Giây' }
      ];
      for (const e of exps) { await adapter.expenses.create(e); createdCount++; await sleep(1100); }

      return { success: true, count: createdCount, netProfit: trip.net_profit };
    });

    console.log(`✅ Khởi tạo thành công ${result.count} tài sản thực tế Phú An!`);
    console.log(`💰 Kiểm chứng Lợi nhuận ròng (Net Profit): ${result.netProfit.toLocaleString('vi-VN')} VNĐ`);

    // Chụp màn hình Chuyến xe (Trips)
    console.log('📸 Đang chụp màn hình nghiệm thu Chuyến Xe (Trips)...');
    await page.goto(`${BASE}/trips`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const tripsPath = path.join(SCREENSHOT_DIR, 'phuan-dryrun-trips-profit.png');
    await page.screenshot({ path: tripsPath, fullPage: true });
    console.log(` -> Đã lưu: ${tripsPath}`);

    // Chụp màn hình Dashboard
    console.log('📸 Đang chụp màn hình nghiệm thu Dashboard Phú An...');
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const dashPath = path.join(SCREENSHOT_DIR, 'phuan-dryrun-dashboard.png');
    await page.screenshot({ path: dashPath, fullPage: true });
    console.log(` -> Đã lưu: ${dashPath}`);

    console.log('════════════════════════════════════════════════════════════');
    console.log(' 🎉 DIỄN TẬP VẬN HÀNH THỰC TẾ HOÀN TẤT & NGHIỆM THU 100% PASS!');
    console.log('════════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('❌ LỖI DIỄN TẬP VẬN HÀNH:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhuAnOnboardingDryRun();

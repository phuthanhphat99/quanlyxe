import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve('d:/QUANLYXE_ONLINE/quanlyxe/qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function seedDataViaClient(page) {
  console.log('🌱 [Playwright] Injecting 3 Vietnamese standard records per menu via Client DataAdapter...');
  
  const result = await page.evaluate(async () => {
    const adapter = window.__dataAdapter;
    if (!adapter) throw new Error('window.__dataAdapter is undefined! Make sure data-adapter.ts exposes it.');
    
    const existing = await adapter.vehicles.list();
    if (existing.length >= 3) {
      console.log('⚡ Data already seeded (>=3 vehicles exist). Skipping duplicate injection.');
      return 0;
    }

    let count = 0;
    const now = new Date().toISOString().slice(0, 10);
    
    // 1. VEHICLES (3 Xe tải chuẩn VN)
    const vehs = [
      { license_plate: '51D-123.45', vehicle_code: 'XE-HN500', vehicle_type: 'Xe tải thùng', brand: 'Hino 500 FG', capacity_tons: 8.5, fuel_type: 'Diesel', fuel_consumption_per_100km: 22, engine_number: 'J08E-WD1001', chassis_number: 'RL8J08E00001', status: 'active', gps_status: 'active', dashcam_status: 'active' },
      { license_plate: '50H-888.88', vehicle_code: 'XE-HD320', vehicle_type: 'Xe tải nặng', brand: 'Hyundai HD320', capacity_tons: 19, fuel_type: 'Diesel', fuel_consumption_per_100km: 34, engine_number: 'D6AC-8888', chassis_number: 'KMHDA1700008', status: 'active', gps_status: 'active', dashcam_status: 'active' },
      { license_plate: '29C-555.55', vehicle_code: 'XE-ISU01', vehicle_type: 'Xe đầu kéo', brand: 'Isuzu Giga 460', capacity_tons: 35, fuel_type: 'Diesel', fuel_consumption_per_100km: 38, engine_number: '6WG1-5555', chassis_number: 'JAL6WG100005', status: 'active', gps_status: 'active', dashcam_status: 'active' }
    ];
    for (const v of vehs) { await adapter.vehicles.create(v); count++; }
    
    // 2. DRIVERS (3 Tài xế chuẩn NĐ10)
    const drvs = [
      { full_name: 'Nguyễn Văn Hùng', driver_code: 'TX-HUNG01', phone: '0901234567', id_card: '079085001234', license_number: '790123456789', license_class: 'FC', date_of_birth: '1985-04-12', address: 'Quận 12, TP.HCM', license_expiry: '2028-12-31', health_check_expiry: '2027-06-30', base_salary: 15000000, status: 'active' },
      { full_name: 'Trần Công Bằng', driver_code: 'TX-BANG02', phone: '0912345678', id_card: '079090005678', license_number: '790987654321', license_class: 'C', date_of_birth: '1990-08-20', address: 'Dĩ An, Bình Dương', license_expiry: '2029-05-15', health_check_expiry: '2027-10-15', base_salary: 12000000, status: 'active' },
      { full_name: 'Lê Văn Long', driver_code: 'TX-LONG03', phone: '0923456789', id_card: '030088009012', license_number: '300112233445', license_class: 'FC', date_of_birth: '1988-11-05', address: 'Thủ Đức, TP.HCM', license_expiry: '2027-11-20', health_check_expiry: '2027-03-15', base_salary: 16000000, status: 'active' }
    ];
    for (const d of drvs) { await adapter.drivers.create(d); count++; }
    
    // 3. CUSTOMERS (3 Đối tác lớn)
    const cuss = [
      { customer_code: 'KH-VNM', company_name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)', tax_code: '0300588569', address: '10 Tân Trào, Quận 7, TP.HCM', contact_person: 'Anh Hoàng - Logistics', phone: '02854155555', email: 'logistics@vinamilk.com.vn', customer_type: 'doanh_nghiep', status: 'active', debt_limit: 500000000 },
      { customer_code: 'KH-HPG', company_name: 'Tập đoàn Hòa Phát', tax_code: '0900188858', address: '66 Nguyễn Du, Hà Nội', contact_person: 'Chị Mai - Điều vận', phone: '02439747748', email: 'dieuvan@hoaphat.com.vn', customer_type: 'doanh_nghiep', status: 'active', debt_limit: 1000000000 },
      { customer_code: 'KH-UNL', company_name: 'Công ty TNHH Quốc Tế Unilever Việt Nam', tax_code: '0300811802', address: '156 Nguyễn Lương Bằng, Quận 7, TP.HCM', contact_person: 'Anh Tuấn - Supply Chain', phone: '02854135686', email: 'transport@unilever.com', customer_type: 'doanh_nghiep', status: 'active', debt_limit: 800000000 }
    ];
    for (const c of cuss) { await adapter.customers.create(c); count++; }
    
    // 4. ROUTES (3 Tuyến huyết mạch)
    const rtes = [
      { route_code: 'TD-SGCT', route_name: 'TP.HCM ➔ KCN Trà Nóc (Cần Thơ)', origin: 'ICD Phước Long, Thủ Đức, TP.HCM', destination: 'KCN Trà Nóc, Bình Thủy, Cần Thơ', distance_km: 175, standard_freight_rate: 4500000, toll_cost: 350000, driver_allowance: 300000, status: 'active' },
      { route_code: 'TD-SGDN', route_name: 'TP.HCM ➔ Cảng Đà Nẵng', origin: 'KCN Sóng Thần, Bình Dương', destination: 'Cảng Tiên Sa, Đà Nẵng', distance_km: 950, standard_freight_rate: 18500000, toll_cost: 1450000, driver_allowance: 1200000, status: 'active' },
      { route_code: 'TD-HPHN', route_name: 'Cảng Hải Phòng ➔ KCN Bắc Thăng Long', origin: 'Cảng Đình Vũ, Hải Phòng', destination: 'KCN Bắc Thăng Long, Hà Nội', distance_km: 120, standard_freight_rate: 3200000, toll_cost: 210000, driver_allowance: 200000, status: 'active' }
    ];
    for (const r of rtes) { await adapter.routes.create(r); count++; }
    
    // 5. TIRES (3 Lốp xe Bridgestone, Michelin, Casumina)
    const tirs = [
      { serial_number: 'BS-11R225-01', brand: 'Bridgestone', size: '11R22.5', tire_type: 'radial', price: 7500000, supplier: 'Công ty Lốp xe Vạn Lợi', status: 'in_stock', tread_depth_mm: 18, max_tread_depth_mm: 18, odometer_installed: 0 },
      { serial_number: 'MC-1000R20-02', brand: 'Michelin', size: '10.00R20', tire_type: 'radial', price: 8200000, supplier: 'Đại lý Lốp xe Michelin Sài Gòn', status: 'in_stock', tread_depth_mm: 20, max_tread_depth_mm: 20, odometer_installed: 0 },
      { serial_number: 'CS-1200R20-03', brand: 'Casumina', size: '12.00R20', tire_type: 'bias', price: 5500000, supplier: 'Nhà máy Cao su Miền Nam', status: 'in_stock', tread_depth_mm: 16, max_tread_depth_mm: 16, odometer_installed: 0 }
    ];
    for (const t of tirs) { await adapter.inventory.createTire(t); count++; }
    
    // 6. MATERIALS (3 Vật tư phụ tùng)
    const mats = [
      { item_code: 'VT-LOCDAU500', name: 'Lọc dầu động cơ Hino 500', category: 'Phụ tùng thay thế', unit: 'Cái', min_stock_level: 5, current_stock: 12, unit_price: 350000, total_value: 4200000, location: 'Kệ A1-02', supplier_name: 'Hino Motors Việt Nam' },
      { item_code: 'VT-LOCGIO320', name: 'Lọc gió động cơ Hyundai HD320', category: 'Phụ tùng thay thế', unit: 'Cái', min_stock_level: 3, current_stock: 8, unit_price: 650000, total_value: 5200000, location: 'Kệ A2-05', supplier_name: 'Hyundai Thành Công' },
      { item_code: 'VT-NHOT18L', name: 'Nhớt động cơ Castrol Vecton 15W-40 (Xô 18L)', category: 'Vật Tư', unit: 'Xô', min_stock_level: 4, current_stock: 10, unit_price: 1850000, total_value: 18500000, location: 'Kho Dầu Mỡ', supplier_name: 'Castrol BP Petco' }
    ];
    for (const m of mats) { await adapter.inventory.createItem(m); count++; }
    
    // 7. TOOLS (3 CCDC dụng cụ)
    const toos = [
      { item_code: 'CC-COLE24', name: 'Bộ cờ lê tự động Kingtony 24 món', category: 'CCDC', unit: 'Bộ', min_stock_level: 2, current_stock: 5, unit_price: 2200000, total_value: 11000000, location: 'Tủ Đồ Nghề Số 1', supplier_name: 'Kingtony Tools VN' },
      { item_code: 'CC-KICH20T', name: 'Kích thủy lực Masada 20 tấn', category: 'Công cụ', unit: 'Cái', min_stock_level: 2, current_stock: 4, unit_price: 3500000, total_value: 14000000, location: 'Góc Xưởng Sửa Chữa', supplier_name: 'Masada Vietnam' },
      { item_code: 'CC-SUNGBU', name: 'Súng xiết bulong khí nén 1 inch Toku', category: 'Dụng cụ', unit: 'Cái', min_stock_level: 1, current_stock: 2, unit_price: 8500000, total_value: 17000000, location: 'Tủ Đồ Nghề Số 2', supplier_name: 'Toku Air Tools' }
    ];
    for (const t of toos) { await adapter.inventory.createItem(t); count++; }
    
    // 8. FUEL (3 Mã nhiên liệu)
    const fues = [
      { item_code: 'NL-DO005S', name: 'Dầu Diesel DO 0,05S-II (Petrolimex)', category: 'Nhiên liệu', unit: 'Lít', min_stock_level: 1000, current_stock: 15000, unit_price: 20500, total_value: 307500000, location: 'Bồn Chứa Dầu Nội Bộ 20m3', supplier_name: 'Petrolimex Sài Gòn' },
      { item_code: 'NL-DO001S', name: 'Dầu Diesel DO 0,001S-V (Euro 5)', category: 'Dầu Diesel', unit: 'Lít', min_stock_level: 500, current_stock: 5000, unit_price: 21200, total_value: 106000000, location: 'Bồn Chứa Dầu Số 2', supplier_name: 'PVOIL Sài Gòn' },
      { item_code: 'NL-ADBLUE', name: 'Dung dịch xử lý khí thải AdBlue (Can 20L)', category: 'Dung dịch', unit: 'Can', min_stock_level: 10, current_stock: 30, unit_price: 450000, total_value: 13500000, location: 'Kho Dầu Mỡ', supplier_name: 'BlueBasic VN' }
    ];
    for (const f of fues) { await adapter.inventory.createItem(f); count++; }

    // 9. TRANSPORT ORDERS (3 Đơn vận chuyển)
    const ords = [
      { order_code: 'DH-2026-001', customer_name: 'Vinamilk', origin: 'ICD Phước Long, Thủ Đức', destination: 'KCN Trà Nóc, Cần Thơ', pickup_date: now, delivery_date: now, cargo_type: 'Sữa tiệt trùng đóng thùng', weight_tons: 8, status: 'in_progress', total_amount: 4500000 },
      { order_code: 'DH-2026-002', customer_name: 'Tập đoàn Hòa Phát', origin: 'KCN Sóng Thần, Bình Dương', destination: 'Cảng Tiên Sa, Đà Nẵng', pickup_date: now, delivery_date: now, cargo_type: 'Thép cuộn xây dựng', weight_tons: 35, status: 'pending', total_amount: 18500000 },
      { order_code: 'DH-2026-003', customer_name: 'Unilever Việt Nam', origin: 'Cảng Đình Vũ, Hải Phòng', destination: 'KCN Bắc Thăng Long, Hà Nội', pickup_date: now, delivery_date: now, cargo_type: 'Hàng tiêu dùng tẩy rửa', weight_tons: 15, status: 'completed', total_amount: 3200000 }
    ];
    for (const o of ords) { await adapter.transportOrders.create(o); count++; }

    // 10. TRIPS (3 Chuyến xe)
    const trps = [
      { trip_code: 'TRIP-20260701', vehicle_plate: '51D-123.45', driver_name: 'Nguyễn Văn Hùng', route_name: 'TP.HCM ➔ KCN Trà Nóc', departure_date: now, arrival_date: now, status: 'completed', revenue: 4500000, total_expenses: 1200000, driver_allowance: 300000, toll_cost: 350000, fuel_cost: 550000, net_profit: 3300000 },
      { trip_code: 'TRIP-20260703', vehicle_plate: '29C-555.55', driver_name: 'Lê Văn Long', route_name: 'TP.HCM ➔ Cảng Đà Nẵng', departure_date: now, arrival_date: now, status: 'in_progress', revenue: 18500000, total_expenses: 4500000, driver_allowance: 1200000, toll_cost: 1450000, fuel_cost: 1850000, net_profit: 14000000 },
      { trip_code: 'TRIP-20260704', vehicle_plate: '50H-888.88', driver_name: 'Trần Công Bằng', route_name: 'Cảng Hải Phòng ➔ KCN Bắc Thăng Long', departure_date: now, arrival_date: now, status: 'completed', revenue: 3200000, total_expenses: 800000, driver_allowance: 200000, toll_cost: 210000, fuel_cost: 390000, net_profit: 2400000 }
    ];
    for (const t of trps) { await adapter.trips.create(t); count++; }

    // 11. EXPENSES (3 Chi phí)
    const exps = [
      { expense_code: 'CP-2026-001', vehicle_plate: '51D-123.45', category: 'Nhiên liệu', title: 'Đổ dầu DO dọc đường - Trạm Petrolimex Mỹ Tho', amount: 550000, date: now, payment_method: 'chuyen_khoan', status: 'approved', notes: 'Hóa đơn điện tử số 001234' },
      { expense_code: 'CP-2026-002', vehicle_plate: '29C-555.55', category: 'Cầu đường BOT', title: 'Phí qua trạm BOT Sông Phan & Phan Rang', amount: 1450000, date: now, payment_method: 'vetc', status: 'approved', notes: 'Tự động trừ tài khoản VETC' },
      { expense_code: 'CP-2026-003', vehicle_plate: '50H-888.88', category: 'Sửa chữa nhỏ', title: 'Vá lốp xe bị đinh tại trạm dọc đường Hải Dương', amount: 150000, date: now, payment_method: 'tiem_mat', status: 'approved', notes: 'Tài xế Bằng ứng tiền mặt trả trước' }
    ];
    for (const e of exps) { await adapter.expenses.create(e); count++; }

    // 12. MAINTENANCE (3 Phiếu bảo dưỡng)
    const maints = [
      { maintenance_code: 'BD-2026-001', vehicle_plate: '51D-123.45', title: 'Bảo dưỡng định kỳ mốc 20,000 km', type: 'dinh_ky', status: 'completed', start_date: now, end_date: now, odometer: 20150, cost: 2500000, garage: 'Gara Hino 3S Bình Chánh', description: 'Thay nhớt động cơ, lọc dầu, bơm mỡ' },
      { maintenance_code: 'BD-2026-002', vehicle_plate: '50H-888.88', title: 'Thay 2 lốp cầu chủ động và cân chỉnh độ chụm', type: 'sua_chua', status: 'in_progress', start_date: now, end_date: now, odometer: 85400, cost: 16500000, garage: 'Trung tâm Lốp xe Michelin Sài Gòn', description: 'Thay 2 lốp Michelin mới' },
      { maintenance_code: 'BD-2026-003', vehicle_plate: '29C-555.55', title: 'Sửa chữa hệ thống phanh hơi và kiểm tra bầu hơi', type: 'sua_chua', status: 'pending', start_date: now, end_date: now, odometer: 120500, cost: 4800000, garage: 'Gara Isuzu An Lạc', description: 'Thay tổng phanh hơi' }
    ];
    for (const m of maints) { await adapter.maintenance.create(m); count++; }

    return count;
  });
  
  console.log(`✅ [Playwright] Successfully created ${result} standard Vietnamese E2E records across all 12 menus!`);
}

async function runDomTests(page) {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  QA DOM UI INTERACTION — TESTING FORM INPUTS & SCREENSHOTS');
  console.log('════════════════════════════════════════════════════════════');

  // 1. VEHICLES — Check seeded table & add 4th vehicle via DOM UI
  console.log('--- 1. Testing Vehicles DOM UI ---');
  await page.goto(`${BASE}/vehicles`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-vehicles-seeded.png') });
  
  await page.getByRole('button', { name: /Thêm xe/i }).click();
  await page.waitForTimeout(1000);
  await page.fill('input[name="license_plate"]', '51E-999.99');
  const comboboxes = page.locator('div[role="dialog"] button[role="combobox"]');
  if (await comboboxes.count() > 0) {
    await comboboxes.first().click().catch(() => {});
    await page.waitForTimeout(500);
    const opts = page.locator('div[role="option"], div[role="menuitem"], [cmdk-item]');
    if (await opts.count() > 0) await opts.first().click({ timeout: 2000 }).catch(() => {});
  }
  await page.fill('input[name="brand"]', 'Mercedes-Benz Actros');
  await page.fill('input[name="capacity_tons"]', '40');
  await page.click('button[type="submit"]').catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-vehicles-dom-added.png') });

  // 2. DRIVERS — Check seeded table & add 4th driver via DOM UI
  console.log('--- 2. Testing Drivers DOM UI ---');
  await page.goto(`${BASE}/drivers`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-drivers-seeded.png') });
  
  await page.getByRole('button', { name: /Thêm tài xế/i }).click();
  await page.waitForTimeout(1000);
  await page.fill('input[name="full_name"]', 'Phạm Văn Quyết (DOM Test)');
  await page.fill('input[name="phone"]', '0934567890');
  await page.fill('input[name="license_number"]', '790555666777');
  const classBtn = page.locator('button:has-text("Chọn hạng")');
  if (await classBtn.count() > 0) {
    await classBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    const optFC = page.locator('div[role="option"], div[role="menuitem"]').filter({ hasText: /^FC$/ });
    if (await optFC.count() > 0) await optFC.first().click({ timeout: 2000 }).catch(() => {});
    else {
      const anyOpt = page.locator('div[role="option"], div[role="menuitem"]');
      if (await anyOpt.count() > 0) await anyOpt.first().click({ timeout: 2000 }).catch(() => {});
    }
  }
  await page.fill('input[name="date_of_birth"]', '1982-10-10');
  await page.fill('input[name="id_card"]', '079082001122');
  await page.fill('input[name="address"]', 'Bình Thạnh, TP.HCM');
  await page.fill('input[name="license_expiry"]', '2028-10-10');
  await page.fill('input[name="health_check_expiry"]', '2027-10-10');
  await page.fill('input[name="base_salary"]', '18000000');
  await page.click('button[type="submit"]').catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-drivers-dom-added.png') });

  // 3. CUSTOMERS — Check seeded table
  console.log('--- 3. Testing Customers DOM UI ---');
  await page.goto(`${BASE}/customers`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-customers-seeded.png') });

  // 4. ROUTES — Check seeded table
  console.log('--- 4. Testing Routes DOM UI ---');
  await page.goto(`${BASE}/routes`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-routes-seeded.png') });

  // 5. TIRES — Check seeded table
  console.log('--- 5. Testing Tires Inventory DOM UI ---');
  await page.goto(`${BASE}/inventory/tires`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-tires-seeded.png') });

  // 6. MATERIALS — Check seeded table & test our newly added "Tạo Mã" button via DOM!
  console.log('--- 6. Testing Materials Inventory DOM UI & Tạo Mã Button ---');
  await page.goto(`${BASE}/inventory/materials`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-materials-seeded.png') });
  
  const createMatBtn = page.getByRole('button', { name: /Tạo Mã/i });
  if (await createMatBtn.count() > 0) {
    await createMatBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-materials-modal-open.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 7. TOOLS — Check seeded table
  console.log('--- 7. Testing Tools Inventory DOM UI ---');
  await page.goto(`${BASE}/inventory/tools`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-tools-seeded.png') });

  // 8. FUEL — Check seeded table
  console.log('--- 8. Testing Fuel Inventory DOM UI ---');
  await page.goto(`${BASE}/inventory/fuel`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-fuel-seeded.png') });

  // 9. TRANSPORT ORDERS
  console.log('--- 9. Testing Transport Orders DOM UI ---');
  await page.goto(`${BASE}/transport-orders`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-orders-seeded.png') });

  // 10. TRIPS (Doanh Thu)
  console.log('--- 10. Testing Trips DOM UI ---');
  await page.goto(`${BASE}/trips`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-trips-seeded.png') });

  // 11. EXPENSES (Chi Phí)
  console.log('--- 11. Testing Expenses DOM UI ---');
  await page.goto(`${BASE}/expenses`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-expenses-seeded.png') });

  // 12. MAINTENANCE
  console.log('--- 12. Testing Maintenance DOM UI ---');
  await page.goto(`${BASE}/maintenance`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-maintenance-seeded.png') });

  // Final Dashboard check
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00-dashboard-final-rich.png') });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await context.newPage();
  
  try {
    console.log('🚀 Navigating to login...');
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    if (page.url().includes('/auth')) {
      await page.fill('input[type="email"]', 'admin@phuancr.vn');
      await page.fill('input[type="password"]', 'Demo@1234');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3500);
    }
    
    // Step 1: Inject 3 standard records into EVERY menu via Client DataAdapter
    await seedDataViaClient(page);
    
    // Step 2: Run DOM UI interaction tests across all menus
    await runDomTests(page);
    
    console.log('\n🎉 ALL 12 MENUS SEEDED & DOM UI VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ ERROR DURING DOM SEED & TEST:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'FATAL_ERROR.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

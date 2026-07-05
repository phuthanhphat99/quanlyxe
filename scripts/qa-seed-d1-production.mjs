/**
 * Script QA Seed - Nhập dữ liệu mẫu chuẩn ngành Vận Tải Việt Nam
 * Gọi trực tiếp API Production tại https://phuan.tnc.io.vn/api/...
 */

const API_BASE = 'https://phuan.tnc.io.vn/api';
const TENANT_ID = 'phuan_tnc'; // tenant_id mặc định

async function apiPost(table, data) {
    const res = await fetch(`${API_BASE}/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT_ID },
        body: JSON.stringify(data)
    });
    const resText = await res.text();
    let json;
    try {
        json = JSON.parse(resText);
    } catch (e) {
        console.error(`❌ [${table}] Lỗi parse JSON. Status: ${res.status} ${res.statusText}. Response:`, resText);
        return null;
    }
    if (!res.ok) {
        console.error(`❌ [${table}] Lỗi ${res.status}:`, json);
        return null;
    }
    console.log(`✅ [${table}] Thêm thành công: ${json.id}`);
    return json;
}

async function seedAll() {
    console.log('🚀 Bắt đầu Seed dữ liệu QA...\n');

    // ========== PHASE 1: DANH MỤC ==========
    console.log('=== PHASE 1: DANH MỤC ===');

    // --- XE ---
    const vehicles = [
        { license_plate: '51C-234.56', vehicle_code: 'XE-001', vehicle_type: 'Xe tải thùng', brand: 'Hino 500 FG', capacity_tons: 8, fuel_type: 'Diesel', fuel_consumption_per_100km: 25, engine_number: 'E13CTK40012', chassis_number: 'VNXFC8JJKM0012345', status: 'active' },
        { license_plate: '51C-345.67', vehicle_code: 'XE-002', vehicle_type: 'Xe đầu kéo', brand: 'Hyundai HD1000', capacity_tons: 20, fuel_type: 'Diesel', fuel_consumption_per_100km: 35, engine_number: 'D6GA45001', chassis_number: 'KMFGA17BPYC123456', status: 'active' },
        { license_plate: '62C-456.78', vehicle_code: 'XE-003', vehicle_type: 'Xe ben', brand: 'Dongfeng Hoàng Huy', capacity_tons: 13, fuel_type: 'Diesel', fuel_consumption_per_100km: 30, engine_number: 'ISB6.7E5300', chassis_number: 'LGAX4C159M0054321', status: 'active' },
    ];
    for (const v of vehicles) await apiPost('vehicles', v);

    // --- TÀI XẾ ---
    const drivers = [
        { full_name: 'Nguyễn Văn Hùng', driver_code: 'TX-001', phone: '0901234567', id_card: '079088001234', license_number: 'B2-079001234', license_class: 'FC', license_expiry_date: '2027-12-25', status: 'active' },
        { full_name: 'Trần Minh Tuấn', driver_code: 'TX-002', phone: '0912345678', id_card: '079092005678', license_number: 'B2-079005678', license_class: 'FC', license_expiry_date: '2028-06-15', status: 'active' },
        { full_name: 'Lê Hoàng Nam', driver_code: 'TX-003', phone: '0923456789', id_card: '052090009012', license_number: 'C-052009012', license_class: 'C', license_expiry_date: '2026-09-30', status: 'active' },
    ];
    for (const d of drivers) await apiPost('drivers', d);

    // --- TUYẾN ĐƯỜNG ---
    const routes = [
        { route_name: 'Cát Lái - Trà Nóc (Cần Thơ)', route_code: 'TD-001', origin: 'Cảng Cát Lái, TP.HCM', destination: 'KCN Trà Nóc, Cần Thơ', distance_km: 180, estimated_days: 1, status: 'active' },
        { route_name: 'Cát Lái - KCN Long Hậu', route_code: 'TD-002', origin: 'Cảng Cát Lái, TP.HCM', destination: 'KCN Long Hậu, Long An', distance_km: 45, estimated_days: 0.5, status: 'active' },
        { route_name: 'ICD Phước Long - Cảng Hiệp Phước', route_code: 'TD-003', origin: 'ICD Phước Long, Thủ Đức', destination: 'Cảng Hiệp Phước, Nhà Bè', distance_km: 35, estimated_days: 0.5, status: 'active' },
    ];
    for (const r of routes) await apiPost('routes', r);

    // --- KHÁCH HÀNG ---
    const customers = [
        { customer_name: 'Công ty TNHH ABC Logistics', customer_code: 'KH-001', tax_code: '0301234567', phone: '02812345678', address: '123 Nguyễn Văn Linh, Q.7, TP.HCM', status: 'active' },
        { customer_name: 'Công ty CP Thép Việt Nhật', customer_code: 'KH-002', tax_code: '0309876543', phone: '02898765432', address: '456 Đại lộ Bình Dương, TX. Dĩ An, Bình Dương', status: 'active' },
        { customer_name: 'Công ty TNHH Gạo Phương Nam', customer_code: 'KH-003', tax_code: '1801112233', phone: '02923456789', address: '789 Trần Hưng Đạo, Ninh Kiều, Cần Thơ', status: 'active' },
    ];
    for (const c of customers) await apiPost('customers', c);

    // ========== PHASE 2: VẬN HÀNH ==========
    console.log('\n=== PHASE 2: VẬN HÀNH ===');

    const orders = [
        { order_code: 'DH-2026-001', customer_id: 'KH-001', route_id: 'TD-001', pickup_date: '2026-07-05', delivery_date: '2026-07-06', goods_description: 'Container 20ft - Linh kiện điện tử', weight_tons: 18, total_revenue: 15000000, status: 'confirmed' },
        { order_code: 'DH-2026-002', customer_id: 'KH-003', route_id: 'TD-001', pickup_date: '2026-07-07', delivery_date: '2026-07-08', goods_description: 'Gạo ST25 xuất khẩu - 20 tấn', weight_tons: 20, total_revenue: 12000000, status: 'pending' },
    ];
    for (const o of orders) await apiPost('transport_orders', o);

    const trips = [
        { trip_code: 'CX-2026-001', vehicle_id: 'XE-001', driver_id: 'TX-001', route_id: 'TD-001', customer_id: 'KH-001', transport_order_id: 'DH-2026-001', departure_date: '2026-07-05T06:00:00', arrival_date: '2026-07-05T14:30:00', status: 'completed', gross_revenue: 15000000, total_cost: 8500000, gross_profit: 6500000 },
        { trip_code: 'CX-2026-002', vehicle_id: 'XE-002', driver_id: 'TX-002', route_id: 'TD-002', customer_id: 'KH-002', departure_date: '2026-07-06T07:00:00', status: 'in_progress', gross_revenue: 8000000, total_cost: 0, gross_profit: 0 },
    ];
    for (const t of trips) await apiPost('trips', t);

    // ========== PHASE 3: TÀI CHÍNH ==========
    console.log('\n=== PHASE 3: TÀI CHÍNH ===');

    const expenses = [
        { expense_code: 'CP-001', category: 'Nhiên liệu', amount: 3500000, expense_date: '2026-07-05', payment_method: 'Chuyển khoản', notes: 'Đổ dầu Diesel xe 51C-234.56' },
        { expense_code: 'CP-002', category: 'Phí cầu đường', amount: 520000, expense_date: '2026-07-05', payment_method: 'Tiền mặt', notes: 'Phí BOT tuyến Cát Lái - Cần Thơ' },
        { expense_code: 'CP-003', category: 'Lương tài xế', amount: 12000000, expense_date: '2026-07-01', payment_method: 'Chuyển khoản', notes: 'Lương tháng 7/2026 - Nguyễn Văn Hùng' },
    ];
    for (const e of expenses) await apiPost('expenses', e);

    const tripExpenses = [
        { trip_id: 'CX-2026-001', expense_type: 'Xăng dầu', amount: 3500000, notes: 'Đổ 140 lít Diesel @ 25.000đ/lít' },
        { trip_id: 'CX-2026-001', expense_type: 'Phí cầu đường', amount: 520000, notes: 'BOT An Sương, BOT Trung Lương' },
        { trip_id: 'CX-2026-001', expense_type: 'Phụ cấp tài xế', amount: 500000, notes: 'Phụ cấp chuyến Cát Lái - Cần Thơ' },
    ];
    for (const te of tripExpenses) await apiPost('trip_expenses', te);

    // ========== PHASE 4: KỸ THUẬT ==========
    console.log('\n=== PHASE 4: KỸ THUẬT ===');

    const maintenance = [
        { vehicle_id: 'XE-001', maintenance_date: '2026-06-15', description: 'Thay nhớt động cơ + lọc dầu', cost: 1200000, next_maintenance_date: '2026-09-15', next_maintenance_km: 180000, status: 'completed' },
        { vehicle_id: 'XE-002', maintenance_date: '2026-07-01', description: 'Kiểm tra hệ thống phanh + thay má phanh trước', cost: 3500000, next_maintenance_date: '2027-01-01', status: 'completed' },
    ];
    for (const m of maintenance) await apiPost('maintenance', m);

    const tires = [
        { tire_code: 'LOP-001', brand: 'Bridgestone 11R22.5', purchase_date: '2026-01-15', price: 8500000, vehicle_id: 'XE-001', position: 'Trước-Trái', current_wear_percent: 25, status: 'mounted' },
        { tire_code: 'LOP-002', brand: 'Bridgestone 11R22.5', purchase_date: '2026-01-15', price: 8500000, vehicle_id: 'XE-001', position: 'Trước-Phải', current_wear_percent: 30, status: 'mounted' },
        { tire_code: 'LOP-003', brand: 'Casumina 11R22.5', purchase_date: '2026-03-20', price: 5200000, status: 'inventory', current_wear_percent: 0 },
    ];
    for (const t of tires) await apiPost('tires', t);

    const inventory = [
        { item_code: 'VT-001', item_name: 'Lọc dầu Hino 500', item_type: 'material', unit: 'Cái', quantity_in_stock: 20, unit_price: 185000, min_stock_level: 5, status: 'active' },
        { item_code: 'NL-001', item_name: 'Dầu Diesel DO 0.05S', item_type: 'fuel', unit: 'Lít', quantity_in_stock: 500, unit_price: 25000, min_stock_level: 100, status: 'active' },
        { item_code: 'CC-001', item_name: 'Bộ kích nâng thuỷ lực 5 tấn', item_type: 'tools', unit: 'Bộ', quantity_in_stock: 3, unit_price: 2500000, min_stock_level: 1, status: 'active' },
        { item_code: 'VT-002', item_name: 'Dầu nhớt Shell Rimula R4 15W40', item_type: 'material', unit: 'Lít', quantity_in_stock: 80, unit_price: 95000, min_stock_level: 20, status: 'active' },
    ];
    for (const i of inventory) await apiPost('inventory', i);

    // ========== PHASE 5: HỆ THỐNG ==========
    console.log('\n=== PHASE 5: HỆ THỐNG ===');

    const alerts = [
        { type: 'license_expiry', title: 'GPLX sắp hết hạn', message: 'GPLX của tài xế Lê Hoàng Nam (TX-003) sẽ hết hạn vào 30/09/2026', severity: 'warning', related_id: 'TX-003' },
        { type: 'maintenance_due', title: 'Xe cần bảo trì', message: 'Xe 51C-234.56 (XE-001) đã đến hạn thay nhớt lần tiếp theo vào 15/09/2026', severity: 'info', related_id: 'XE-001' },
        { type: 'low_stock', title: 'Tồn kho thấp', message: 'Lọc dầu Hino 500 (VT-001) còn 20 cái, gần mức tối thiểu (5)', severity: 'info', related_id: 'VT-001' },
    ];
    for (const a of alerts) await apiPost('alerts', a);

    const logs = [
        { user_id: 'admin', action: 'CREATE', entity_type: 'vehicles', entity_id: 'XE-001', details: 'Thêm xe mới 51C-234.56 Hino 500 FG' },
        { user_id: 'admin', action: 'CREATE', entity_type: 'trips', entity_id: 'CX-2026-001', details: 'Tạo chuyến xe Cát Lái - Cần Thơ' },
    ];
    for (const l of logs) await apiPost('activity_logs', l);

    console.log('\n🎉 SEED HOÀN TẤT! Tất cả dữ liệu mẫu đã được nhập thành công.');
    console.log('📊 Tổng kết:');
    console.log(`   - Xe: ${vehicles.length}`);
    console.log(`   - Tài xế: ${drivers.length}`);
    console.log(`   - Tuyến đường: ${routes.length}`);
    console.log(`   - Khách hàng: ${customers.length}`);
    console.log(`   - Đơn hàng: ${orders.length}`);
    console.log(`   - Chuyến xe: ${trips.length}`);
    console.log(`   - Chi phí: ${expenses.length}`);
    console.log(`   - Chi phí chuyến: ${tripExpenses.length}`);
    console.log(`   - Bảo trì: ${maintenance.length}`);
    console.log(`   - Lốp xe: ${tires.length}`);
    console.log(`   - Kho vật tư: ${inventory.length}`);
    console.log(`   - Cảnh báo: ${alerts.length}`);
    console.log(`   - Nhật ký: ${logs.length}`);
}

seedAll().catch(console.error);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz7Qp_z5AaIX1gvlboRtwGgwwNvtUxRylhckcJ4j_L2V6CwJnv9gMrRUrm7l7Sb1bq3ng/exec';

const SHEET_MAP = {
    'vehicles': 'Danh Muc Xe',
    'drivers': 'Tai Xe',
    'customers': 'Khach Hang',
    'routes': 'Tuyen Duong',
    'trips': 'Chuyen Van Chuyen',
    'expenses': 'Chi Phi',
    'transportOrders': 'Don Hang',
    'tires': 'Kho Lop',
    'inventory': 'Kho Vat Tu',
    'maintenance': 'Bao Tri'
};

const HEADER_MAP = {
    id: 'Mã hệ thống',
    tenant_id: 'tenant_id',
    vehicle_code: 'Mã xe',
    license_plate: 'Biển số',
    vehicle_type: 'Loại xe',
    brand: 'Hiệu xe',
    capacity_tons: 'Tải trọng',
    fuel_type: 'Loại nhiên liệu',
    usage_limit_years: 'Niên hạn',
    engine_number: 'Số máy',
    chassis_number: 'Số khung',
    insurance_purchase_date: 'Ngày mua BH',
    insurance_expiry_date: 'Hạn bảo hiểm',
    insurance_civil_expiry: 'Hạn BH Dân sự',
    insurance_body_expiry: 'Hạn BH Thân vỏ',
    insurance_cost: 'Phí bảo hiểm',
    registration_cycle: 'Chu kỳ ĐK',
    registration_date: 'Ngày đăng kiểm',
    registration_expiry_date: 'Hạn đăng kiểm',
    registration_cost: 'Phí đăng kiểm',
    current_location: 'Vị trí hiện tại',
    notes: 'Ghi chú',
    status: 'Trạng thái',
    default_driver_id: 'Tài xế mặc định',
    current_odometer: 'Số KM hiện tại',
    fuel_consumption_per_100km: 'Định mức nhiên liệu',
    purchase_date: 'Ngày mua',
    purchase_price: 'Giá mua',
    assignment_type: 'Loại phân bổ',
    driver_code: 'Mã tài xế',
    full_name: 'Họ tên',
    phone: 'Điện thoại',
    id_card: 'CMND/CCCD',
    license_class: 'Hạng bằng',
    license_number: 'Số GPLX',
    license_expiry: 'Hạn GPLX',
    salary_base: 'Lương cơ bản',
    customer_code: 'Mã KH',
    name: 'Tên',
    email: 'Email',
    address: 'Địa chỉ',
    tax_code: 'Mã số thuế',
    contact_person: 'Người liên hệ',
    route_code: 'Mã tuyến',
    route_name: 'Tên tuyến',
    origin: 'Điểm đi',
    destination: 'Điểm đến',
    distance_km: 'Cự ly (km)',
    estimated_duration_hours: 'T/g dự kiến (h)',
    base_price: 'Giá cơ bản',
    toll_cost: 'Phí cầu đường',
    trip_code: 'Mã chuyến',
    vehicle_id: 'Mã xe (ID)',
    driver_id: 'Mã tài xế (ID)',
    customer_id: 'Mã KH (ID)',
    route_id: 'Mã tuyến (ID)',
    start_time: 'Giờ đi',
    end_time: 'Giờ đến',
    revenue: 'Doanh thu',
    expense: 'Chi phí',
    expense_code: 'Mã phiếu',
    expense_date: 'Ngày chi',
    amount: 'Số tiền',
    category: 'Loại chi phí / Danh mục',
    payment_method: 'P.thức T/toán',
    description: 'Diễn giải',
    item_code: 'Mã vật tư/CCDC',
    unit: 'ĐVT',
    quantity: 'Số lượng',
    current_stock: 'Tồn kho',
    average_cost: 'Giá TB',
    total_value: 'Tổng giá trị',
    location: 'Vị trí',
    min_stock_level: 'Tồn tối thiểu',
    supplier: 'Nhà cung cấp',
    created_at: 'Ngày tạo',
    updated_at: 'Ngày cập nhật',
    is_deleted: 'Đã xóa'
};

const mapHeaders = (data) => {
    return data.map(row => {
        const newRow = {};
        if (row.tenant_id) newRow['tenant_id'] = row.tenant_id;
        for (const key of Object.keys(row)) {
            if (key === 'tenant_id') continue;
            const vietnameseHeader = HEADER_MAP[key] || key;
            newRow[vietnameseHeader] = row[key];
        }
        return newRow;
    });
};

async function syncAll() {
    console.log('🔄 Bắt đầu đẩy dữ liệu có chuẩn hóa tiếng Việt...');
    
    const seedPath = path.join(__dirname, 'tenantDemoSeed.json');
    if (!fs.existsSync(seedPath)) return;

    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    const collections = seedData.collections || {};
    let successCount = 0;

    for (const [collectionName, dataRows] of Object.entries(collections)) {
        if (collectionName === 'inventory') {
            const FUEL_CATEGORIES = ['Nhiên liệu', 'Dầu Diesel', 'Nhớt', 'Mỡ bôi trơn', 'Dung dịch', 'AdBlue'];
            const TOOL_CATEGORIES = ['Công cụ', 'Dụng cụ', 'Thiết bị', 'CCDC', 'Đồ nghề'];
            
            const fuelItems = dataRows.filter(i => i.category && FUEL_CATEGORIES.some(c => i.category.toLowerCase().includes(c.toLowerCase())));
            const toolItems = dataRows.filter(i => i.category && TOOL_CATEGORIES.some(c => i.category.toLowerCase().includes(c.toLowerCase())));
            const materialItems = dataRows.filter(i => !fuelItems.includes(i) && !toolItems.includes(i));

            const invSplits = [
                { sheet: 'Kho Vat Tu', data: materialItems, label: 'Kho Vật tư' },
                { sheet: 'Kho Nhien Lieu', data: fuelItems, label: 'Kho Nhiên liệu' },
                { sheet: 'Kho CCDC', data: toolItems, label: 'Kho CCDC' }
            ];

            for (const split of invSplits) {
                if (split.data.length === 0) continue;
                console.log(`\n⏳ Đang đẩy ${split.data.length} dòng lên tab [${split.sheet}]...`);
                try {
                    const mappedRows = mapHeaders(split.data);
                    const response = await fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'batch_sync', sheet: split.sheet, collection: 'inventory', data: mappedRows })
                    });
                    const text = await response.text();
                    if (response.ok) {
                        console.log(`✅ Thành công: Đã đẩy ${split.data.length} dòng vào ${split.sheet}`);
                        successCount++;
                    } else console.error(`❌ Lỗi đẩy ${split.sheet}:`, text);
                } catch (e) { console.error(e); }
            }
            continue;
        }

        if (!SHEET_MAP[collectionName]) continue;
        const targetSheet = SHEET_MAP[collectionName];
        console.log(`\n⏳ Đang đẩy ${dataRows.length} dòng lên tab [${targetSheet}]...`);
        
        try {
            const mappedRows = mapHeaders(dataRows);
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'batch_sync',
                    sheet: targetSheet,
                    collection: collectionName,
                    data: mappedRows
                })
            });

            const text = await response.text();
            if (response.ok) {
                console.log(`✅ Thành công: Đã đẩy ${dataRows.length} dòng vào ${targetSheet}`);
                successCount++;
            } else {
                console.error(`❌ Lỗi đẩy ${targetSheet}:`, text);
            }
        } catch (err) {
            console.error(err);
        }
    }
    console.log(`\n🎉 HOÀN TẤT! Đã đồng bộ thành công ${successCount} danh mục lên Google Sheets.`);
}

syncAll();

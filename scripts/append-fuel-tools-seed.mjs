import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedPath = path.join(__dirname, 'tenantDemoSeed.json');
const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

if (!seedData.collections.inventory) {
    seedData.collections.inventory = [];
}

const newItems = [
    {
        "id": "VT001",
        "item_code": "NL001",
        "name": "Dầu Diesel 0.05S",
        "category": "Nhiên liệu",
        "unit": "Lít",
        "quantity": 5000,
        "current_stock": 5000,
        "average_cost": 21500,
        "total_value": 107500000,
        "location": "Bồn chứa Bãi xe Bình Dương",
        "min_stock_level": 1000,
        "supplier": "Petrolimex",
        "status": "active"
    },
    {
        "id": "VT002",
        "item_code": "NL002",
        "name": "Nhớt động cơ Castrol 15W-40",
        "category": "Nhớt",
        "unit": "Lít",
        "quantity": 200,
        "current_stock": 200,
        "average_cost": 85000,
        "total_value": 17000000,
        "location": "Kho vật tư trạm bảo dưỡng",
        "min_stock_level": 50,
        "supplier": "Castrol VN",
        "status": "active"
    },
    {
        "id": "VT003",
        "item_code": "NL003",
        "name": "Dung dịch xử lý khí thải AdBlue",
        "category": "Dung dịch",
        "unit": "Lít",
        "quantity": 1000,
        "current_stock": 1000,
        "average_cost": 15000,
        "total_value": 15000000,
        "location": "Bãi xe Đồng Nai",
        "min_stock_level": 200,
        "status": "active"
    },
    {
        "id": "VT004",
        "item_code": "CC001",
        "name": "Bộ tuýp vặn ốc lốp xe tải 1 inch",
        "category": "CCDC",
        "unit": "Bộ",
        "quantity": 5,
        "current_stock": 5,
        "average_cost": 1250000,
        "total_value": 6250000,
        "location": "Trạm bảo dưỡng Bình Dương",
        "min_stock_level": 1,
        "status": "active"
    },
    {
        "id": "VT005",
        "item_code": "CC002",
        "name": "Kích thủy lực cá sấu 10 tấn",
        "category": "Thiết bị",
        "unit": "Cái",
        "quantity": 2,
        "current_stock": 2,
        "average_cost": 4500000,
        "total_value": 9000000,
        "location": "Trạm bảo dưỡng Đồng Nai",
        "min_stock_level": 1,
        "status": "active"
    },
    {
        "id": "VT006",
        "item_code": "CC003",
        "name": "Súng xiết bu lông dùng khí nén 1 inch",
        "category": "Công cụ",
        "unit": "Cái",
        "quantity": 3,
        "current_stock": 3,
        "average_cost": 3200000,
        "total_value": 9600000,
        "location": "Trạm bảo dưỡng Bình Dương",
        "min_stock_level": 1,
        "status": "active"
    }
];

// Lọc để không thêm trùng
const existingIds = seedData.collections.inventory.map(i => i.id);
const itemsToAdd = newItems.filter(i => !existingIds.includes(i.id));

if (itemsToAdd.length > 0) {
    seedData.collections.inventory.push(...itemsToAdd);
    seedData.metadata.counts.inventory = seedData.collections.inventory.length;
    fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), 'utf8');
    console.log(`Đã thêm ${itemsToAdd.length} bản ghi Kho nhiên liệu và CCDC vào tenantDemoSeed.json!`);
} else {
    console.log('Các bản ghi đã tồn tại trong tenantDemoSeed.json');
}

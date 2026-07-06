/**
 * 🚀 KỊCH BẢN ONBOARDING THỰC TẾ RIÊNG CHO KHÁCH HÀNG PHÚ AN
 * Thư mục: tenants/phuan/scripts/onboarding-seed.mjs
 * Nguyên tắc: Độc lập hoàn toàn, đọc cấu hình từ config.json và data/initial-assets.json
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc cấu hình riêng của tenant Phú An
const configPath = path.join(__dirname, '../config.json');
const dataPath = path.join(__dirname, '../data/initial-assets.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const assets = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const TARGET_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5175';

async function seedPhuAnTenant() {
  console.log('════════════════════════════════════════════════════════════');
  console.log(` 🏢 KHỞI TẠO DỮ LIỆU CHUẨN HÓA RIÊNG: ${config.company_info.company_name.toUpperCase()}`);
  console.log(` 🆔 Tenant ID: ${config.tenant_id} | MST: ${config.company_info.tax_code}`);
  console.log('════════════════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`📡 Truy cập hệ thống tại: ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate((tid) => { localStorage.setItem('fleetpro_tenant_id', tid); }, config.tenant_id);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('🌱 Đang bơm bộ số liệu chuẩn riêng của Phú An từ tenants/phuan/data/initial-assets.json...');

    const result = await page.evaluate(async ({ configData, assetsData }) => {
      const adapter = window.__dataAdapter;
      if (!adapter) throw new Error('window.__dataAdapter không tồn tại! Hãy chắc chắn dev server đang chạy.');

      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      let createdCount = 0;

      // 1. VEHICLES
      const vehMap = {};
      for (const v of assetsData.vehicles) {
        const res = await adapter.vehicles.create(v);
        vehMap[v.vehicle_code] = res;
        createdCount++;
        await sleep(1050);
      }

      // 2. DRIVERS
      const drvMap = {};
      for (const d of assetsData.drivers) {
        const res = await adapter.drivers.create(d);
        drvMap[d.driver_code] = res;
        createdCount++;
        await sleep(1050);
      }

      // 3. CUSTOMERS
      const cusMap = {};
      for (const c of assetsData.customers) {
        const res = await adapter.customers.create(c);
        cusMap[c.customer_code] = res;
        createdCount++;
        await sleep(1050);
      }

      // 4. ROUTES
      const rteMap = {};
      for (const r of assetsData.routes) {
        const res = await adapter.routes.create(r);
        rteMap[r.route_code] = res;
        createdCount++;
        await sleep(1050);
      }

      // 5. SAMPLE ORDERS & TRIPS
      for (const ord of assetsData.sample_orders) {
        const cObj = cusMap[ord.customer_code] || Object.values(cusMap)[0];
        const rObj = rteMap[ord.route_code] || Object.values(rteMap)[0];
        const ordPayload = {
          ...ord,
          customer_id: cObj?.id || ord.customer_code,
          route_id: rObj?.id || ord.route_code,
          pickup_date: new Date().toISOString().slice(0, 10),
          delivery_date: new Date().toISOString().slice(0, 10),
        };
        const resOrd = await adapter.transportOrders.create(ordPayload);
        createdCount++;
        await sleep(1050);

        // Create matching Trip for the first order
        if (ord.order_code === 'DH-PA2026-01') {
          const vObj = vehMap['XE-PA01'] || Object.values(vehMap)[0];
          const dObj = drvMap['TX-PHU01'] || Object.values(drvMap)[0];
          const tripPayload = {
            trip_code: 'CX-PA2026-01',
            vehicle_id: vObj?.id || 'XE-PA01',
            driver_id: dObj?.id || 'TX-PHU01',
            customer_id: cObj?.id || 'KH-THEP01',
            route_id: rObj?.id || 'TD-HCMCM',
            transport_order_id: resOrd?.id || 'DH-PA2026-01',
            departure_time: new Date().toISOString(),
            arrival_time: new Date().toISOString(),
            status: 'completed',
            gross_revenue: ord.total_amount,
            total_cost: 1740000,
            net_profit: ord.total_amount - 1740000
          };
          const resTrip = await adapter.trips.create(tripPayload);
          createdCount++;
          await sleep(1050);

          // Expenses for trip
          const exps = [
            { expense_code: 'CP-PA01', trip_id: resTrip?.id || 'CX-PA2026-01', vehicle_id: vObj?.id, category: 'Nhiên liệu', amount: 1200000, expense_date: new Date().toISOString().slice(0, 10), payment_method: 'Chuyển khoản', status: 'approved', description: 'Đổ 58L Dầu Diesel @ 20,500đ tại Cây xăng Bình Thái' },
            { expense_code: 'CP-PA02', trip_id: resTrip?.id || 'CX-PA2026-01', vehicle_id: vObj?.id, category: 'Phí cầu đường', amount: 240000, expense_date: new Date().toISOString().slice(0, 10), payment_method: 'Tiền mặt', status: 'approved', description: 'Phí BOT Cao tốc Long Thành - Dầu Giây' }
          ];
          for (const e of exps) {
            await adapter.expenses.create(e);
            createdCount++;
            await sleep(1050);
          }
        }
      }

      return { success: true, count: createdCount, company: configData.company_info.company_name };
    }, { configData: config, assetsData: assets });

    console.log(`✅ Khởi tạo thành công ${result.count} tài sản thực tế cho ${result.company}!`);
    console.log('════════════════════════════════════════════════════════════');
    console.log(' 🎉 ONBOARDING DỮ LIỆU RIÊNG PHÚ AN HOÀN TẤT 100%!');
    console.log('════════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('❌ LỖI ONBOARDING PHÚ AN:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

seedPhuAnTenant();

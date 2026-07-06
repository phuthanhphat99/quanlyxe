/**
 * 🚀 KỊCH BẢN KIỂM CHỨNG CHẤT LƯỢNG GO-LIVE RIÊNG CHO PHÚ AN
 * Thư mục: tenants/phuan/scripts/verify-phuan-golive.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const TARGET_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5175';

async function verifyPhuAnGoLive() {
  console.log('════════════════════════════════════════════════════════════');
  console.log(` 🛡️ KIỂM TOÁN CHUẨN GO-LIVE RIÊNG: ${config.company_info.company_name.toUpperCase()}`);
  console.log('════════════════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate((tid) => { localStorage.setItem('fleetpro_tenant_id', tid); }, config.tenant_id);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const auditRes = await page.evaluate(async () => {
      const adapter = window.__dataAdapter;
      if (!adapter) throw new Error('window.__dataAdapter không tồn tại!');

      const vehs = await adapter.vehicles.list();
      const drvs = await adapter.drivers.list();
      const cuss = await adapter.customers.list();
      const rtes = await adapter.routes.list();
      const trps = await adapter.trips.list();

      // Kiểm tra tiêu chuẩn V5 trên tài sản Phú An
      const phuanVehs = vehs.filter(v => v.vehicle_code?.startsWith('XE-PA'));
      const phuanDrvs = drvs.filter(d => d.driver_code?.startsWith('TX-PHU') || d.driver_code?.startsWith('TX-AN') || d.driver_code?.startsWith('TX-HUNG'));
      const allVehActive = phuanVehs.length >= 3 && phuanVehs.every(v => v.status === 'active');
      const allDrvActive = phuanDrvs.length >= 3 && phuanDrvs.every(d => d.status === 'active');
      const tripProfitCheck = trps.find(t => t.trip_code === 'CX-PA2026-01');

      return {
        vehicleCount: vehs.length,
        driverCount: drvs.length,
        customerCount: cuss.length,
        routeCount: rtes.length,
        phuanVehCount: phuanVehs.length,
        phuanDrvCount: phuanDrvs.length,
        tripCount: trps.length,
        allVehActive,
        allDrvActive,
        tripNetProfit: tripProfitCheck?.net_profit || 0
      };
    });

    console.log(`🚚 Tổng Xe hệ thống: ${auditRes.vehicleCount} (Xe Phú An active: ${auditRes.phuanVehCount}/3)`);
    console.log(`👨‍✈️ Tổng Tài xế hệ thống: ${auditRes.driverCount} (Tài xế Phú An active: ${auditRes.phuanDrvCount}/3)`);
    console.log(`🏢 Khách hàng chiến lược: ${auditRes.customerCount} | 🛣️ Tuyến đường huyết mạch: ${auditRes.routeCount}`);
    console.log(`💰 Kiểm chứng Lợi nhuận ròng Chuyến xe Phú An: ${auditRes.tripNetProfit.toLocaleString('vi-VN')} VNĐ`);
    
    if (auditRes.tripNetProfit === 2760000 && auditRes.allVehActive && auditRes.allDrvActive) {
      console.log('════════════════════════════════════════════════════════════');
      console.log(' 🟢 PHÚ AN TENANT AUDIT PASSED 100% — SẴN SÀNG GO-LIVE CHÍNH THỨC!');
      console.log('════════════════════════════════════════════════════════════');
    } else {
      console.warn('⚠️ Cảnh báo: Số liệu chưa đạt khớp lệnh 100%, hãy chạy `npm run tenant:phuan:seed` trước.');
    }

  } catch (err) {
    console.error('❌ LỖI KIỂM TOÁN PHÚ AN:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyPhuAnGoLive();

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Khởi động Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: 'videos/' },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // 1. Đăng nhập
    console.log('1. Truy cập trang đăng nhập...');
    await page.goto('https://phuan.tnc.io.vn/auth');
    await page.waitForLoadState('networkidle');
    
    console.log('Click Đăng nhập Demo...');
    // Click any button that contains Demo
    const demoBtn = page.locator('button', { hasText: /Demo|Thử nghiệm/i }).first();
    if (await demoBtn.isVisible()) {
        await demoBtn.click();
    } else {
        await page.fill('input[type="email"]', 'demo@phuan.vn');
        await page.fill('input[type="password"]', 'demo123');
        await page.click('button[type="submit"]');
    }
    
    console.log('Chờ đăng nhập thành công...');
    // Cập nhật để chờ trang chính thay vì đúng auth
    await page.waitForTimeout(5000); // Đợi 5 giây cho chắc ăn
    await page.waitForLoadState('networkidle');

    // 2. Tạo Đơn Hàng
    console.log('2. Tạo Đơn Hàng...');
    await page.goto('https://phuan.tnc.io.vn/transport-orders');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Tạo mới")');
    await page.waitForTimeout(1000);
    
    // Điền form đơn hàng
    console.log('Điền form đơn hàng...');
    await page.click('button[role="combobox"]:has-text("Khách hàng")');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    await page.click('button[role="combobox"]:has-text("Tuyến đường")');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.fill('input[placeholder="Tên hàng, loại hàng..."]', 'Tôn cuộn 15 tấn - A-Z Pipeline Test');
    await page.fill('input[placeholder="Trọng lượng (tấn)"]', '15');
    await page.fill('input[placeholder="Doanh thu dự kiến..."]', '12000000');
    
    await page.click('button:has-text("Lưu")');
    await page.waitForTimeout(2000);

    // 3. Điều phối (Xếp chuyến)
    console.log('3. Xếp chuyến xe (Điều phối)...');
    await page.goto('https://phuan.tnc.io.vn/dispatch');
    await page.waitForTimeout(3000);
    
    await page.click('button:has-text("Tạo chuyến xe")');
    await page.waitForTimeout(1000);

    // Chọn xe, tài xế
    await page.click('button[role="combobox"]:has-text("Chọn xe")');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.click('button[role="combobox"]:has-text("Chọn tài xế")');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.click('button:has-text("Lưu")');
    await page.waitForTimeout(2000);

    // 4. Vào trang Chuyến Xe để cập nhật trạng thái
    console.log('4. Cập nhật trạng thái chuyến xe...');
    await page.goto('https://phuan.tnc.io.vn/trips');
    await page.waitForTimeout(3000);

    console.log('Hoàn tất A-Z pipeline testing!');
  } catch (error) {
    console.error('Lỗi trong quá trình chạy DOM A-Z:', error);
  } finally {
    console.log('Đang lưu video...');
    await context.close();
    await browser.close();
    
    // Tìm file video vừa tạo
    const videoDir = path.join(process.cwd(), 'videos');
    if (fs.existsSync(videoDir)) {
      const files = fs.readdirSync(videoDir);
      const videoFile = files.find(f => f.endsWith('.webm'));
      if (videoFile) {
        console.log(`Video saved at: ${path.join(videoDir, videoFile)}`);
      }
    }
  }
})();

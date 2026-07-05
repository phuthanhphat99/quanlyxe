import { test, expect } from '@playwright/test';

test.describe('A-Z Logistics Pipeline', () => {
  test('Audit NĐ10/TT99 Pipeline', async ({ page }) => {
    // --- MOCK API FOR LOCAL D1 EMULATOR FAILURE ---
    const mockDB: Record<string, any[]> = {};
    
    await page.route('/api/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const collection = url.pathname.split('/')[2]; // /api/vehicles -> vehicles
      
      if (!mockDB[collection]) mockDB[collection] = [];
      
      // Default Mock Route so QuickTripModal doesn't fail
      if (collection === 'routes' && mockDB['routes'].length === 0) {
          mockDB['routes'] = [{ id: 'route-1', origin: 'Hà Nội', destination: 'Hải Phòng', route_name: 'Hà Nội - Hải Phòng' }];
      }
      
      if (request.method() === 'GET') {
        await route.fulfill({ status: 200, json: mockDB[collection] });
      } else if (request.method() === 'POST' || request.method() === 'PUT') {
        const payload = request.postDataJSON() || {};
        const newItem = { ...payload, id: 'mock-' + Date.now() };
        mockDB[collection] = [newItem, ...mockDB[collection]]; // Prepend
        await route.fulfill({ status: 200, json: newItem });
      } else {
        await route.continue();
      }
    });

    // 1. Go to application
    await page.goto('/');
    
    // Check if redirect to login, then login
    if (page.url().includes('/auth')) {
        await page.fill('input[type="email"]', 'admin@phuancr.vn');
        await page.fill('input[type="password"]', 'Demo@1234');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');
    }

    // 2. Vehicles: Create new vehicle with GPS and Dashcam
    await page.click('a[href="/vehicles"]');
    await page.waitForURL('**/vehicles');
    await page.waitForTimeout(2000); // Wait for UI to render
    await page.screenshot({ path: 'C:/Users/Sao Vang/.gemini/antigravity-ide/brain/3315ead6-c260-4fd1-8003-d7c01d1277c3/scratch/vehicles-page.png' });
    await page.getByRole('button', { name: /Thêm xe/i }).click();
    
    await page.fill('input[name="license_plate"]', '29C-12345');
    
    // Handle ComboboxVehicleType logic
    // Handle ComboboxVehicleType logic
    await page.locator('div[role="dialog"] button[role="combobox"]').first().click();
    await page.click('button:has-text("Xe tải nhẹ")');
    
    await page.fill('input[name="brand"]', 'Hino');
    await page.fill('input[name="capacity_tons"]', '5');
    
    // Select fuel type
    await page.click('button:has-text("Chọn nhiên liệu")');
    await page.click('div[role="option"]:has-text("Dầu/Diesel")');

    await page.fill('input[name="engine_number"]', 'ENG-123');
    await page.fill('input[name="chassis_number"]', 'CHS-123');
    
    // Fill dates and trigger blur
    await page.fill('input[name="insurance_civil_expiry"]', '2025-12-31');
    await page.press('input[name="insurance_civil_expiry"]', 'Tab');
    
    await page.fill('input[name="registration_expiry_date"]', '2025-12-31');
    await page.press('input[name="registration_expiry_date"]', 'Tab');
    
    // NĐ10 fields
    await page.check('input[name="gps_installed"]');
    await page.check('input[name="dashcam_installed"]');
    
    await page.fill('input[name="transport_badge_expiry"]', '2025-12-31');
    await page.press('input[name="transport_badge_expiry"]', 'Tab');

    await page.click('button[type="submit"]');
    
    // Capture screenshot right after submit
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Sao Vang/.gemini/antigravity-ide/brain/3315ead6-c260-4fd1-8003-d7c01d1277c3/scratch/vehicles-after-submit.png' });
    
    // Check if there is any toast message
    const toastTexts = await page.locator('[role="status"], [role="alert"]').allInnerTexts();
    if (toastTexts.length > 0) {
        console.log('Toasts appeared:', toastTexts);
    }

    // Verify toast
    await expect(page.locator('text=Đã thêm xe mới thành công')).toBeVisible({ timeout: 5000 });

    // 3. Drivers: Create driver with EXPIRED health check
    await page.click('a[href="/drivers"]');
    await page.waitForURL('**/drivers');
    await page.getByRole('button', { name: /Thêm tài xế/i }).click();
    
    await page.fill('input[name="full_name"]', 'Nguyễn Văn A (E2E)');
    await page.fill('input[name="phone"]', '0901234567');
    await page.fill('input[name="license_number"]', 'GPLX-123');
    
    await page.click('button:has-text("Chọn hạng")');
    await page.click('div[role="option"]:has-text("C")');
    
    // Dates
    await page.fill('input[name="date_of_birth"]', '1990-01-01');
    await page.press('input[name="date_of_birth"]', 'Tab');
    
    await page.fill('input[name="id_card"]', '012345678912');
    
    await page.fill('input[name="id_issue_date"]', '2015-01-01');
    await page.press('input[name="id_issue_date"]', 'Tab');
    
    await page.fill('input[name="address"]', 'Hà Nội');
    
    await page.fill('input[name="license_expiry"]', '2028-01-01');
    await page.press('input[name="license_expiry"]', 'Tab');
    
    // Expired health check to test validation
    await page.fill('input[name="health_check_expiry"]', '2023-01-01'); // Expired
    await page.press('input[name="health_check_expiry"]', 'Tab');
    
    await page.fill('input[name="base_salary"]', '10000000');
    
    // Select vehicle - the combobox uses a Select Component.
    await page.click('button:has-text("Chọn xe")');
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:has-text("29C-12345")');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    const toastTexts2 = await page.locator('[role="status"], [role="alert"]').allInnerTexts();
    if (toastTexts2.length > 0) {
        console.log('Driver Toasts appeared:', toastTexts2);
    }
    await page.screenshot({ path: 'C:/Users/Sao Vang/.gemini/antigravity-ide/brain/3315ead6-c260-4fd1-8003-d7c01d1277c3/scratch/drivers-after-submit.png' });
    
    await expect(page.locator('text=Thành công').first()).toBeVisible({ timeout: 5000 });

    // 4. Dispatch: Create Trip
    await page.goto('/dispatch');
    await page.waitForURL('**/dispatch');
    
    // Create new Trip using QuickTripModal
    await page.getByRole('button', { name: /Tạo chuyến mới/i }).click();
    
    // 1st combobox: Vehicle
    await page.locator('div[role="dialog"] button[role="combobox"]').nth(0).click();
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:has-text("29C-12345")');
    
    // 2nd combobox: Route
    await page.locator('div[role="dialog"] button[role="combobox"]').nth(1).click();
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:has-text("Hà Nội - Hải Phòng")');
    
    // The driver should be auto-filled, or we can select it from 3rd combobox
    await page.locator('div[role="dialog"] button[role="combobox"]').nth(2).click();
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:has-text("Nguyễn Văn A (E2E)")');
    
    // Datetime-local Input
    await page.fill('input[type="datetime-local"]', '2026-12-31T08:00');
    await page.press('input[type="datetime-local"]', 'Tab');
    
    // Notes Textarea
    await page.fill('textarea', '20 tấn xi măng (NĐ10 test)');
    
    // Submit QuickTripModal
    await page.getByRole('button', { name: 'Tạo Chuyến Ngay' }).click();
    await page.waitForTimeout(1000);
    
    // Expect NĐ10 validation error
    await expect(page.locator('text=đã hết hạn').first()).toBeVisible({ timeout: 5000 });
  });
});

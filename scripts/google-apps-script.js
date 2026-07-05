/**
 * ============================================================================
 * GOOGLE APPS SCRIPT CHO HỆ THỐNG ĐỒNG BỘ 2 CHIỀU (D1 ↔ GOOGLE SHEETS)
 * ============================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở file Google Sheets của bạn.
 * 2. Chọn Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Dán toàn bộ đoạn code này vào file Code.gs, thay thế code cũ.
 * 4. Sửa lại biến `API_URL` và `API_SECRET_KEY` theo cấu hình thực tế của bạn.
 * 5. Bấm Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment).
 *    - Loại: Ứng dụng web (Web app).
 *    - Cấp quyền truy cập: "Bất kỳ ai" (Anyone).
 * 6. Copy URL Web app vừa tạo và dán vào Cài đặt của hệ thống Quản lý Vận tải.
 */

// CẤU HÌNH HỆ THỐNG
const CONFIG = {
  // Thay đổi URL này thành domain thực tế của bạn
  API_URL: 'https://[TEN-MIEN-CUA-BAN]/api/webhook/google-sheets',
  // Key bảo mật dùng để xác thực khi Sheets đẩy dữ liệu về D1
  API_SECRET_KEY: 'PHUAN_SECRET_KEY_123',
  // Danh sách các bảng dữ liệu cho phép đồng bộ (Toàn bộ 12 danh mục Vận tải & Kho)
  ALLOWED_SHEETS: ['vehicles', 'drivers', 'trips', 'customers', 'expenses', 'transport_orders', 'routes', 'inventory', 'tires', 'materials', 'tools', 'fuel', 'maintenance']
};

/**
 * Lắng nghe request từ hệ thống Quản lý Vận tải đẩy sang Google Sheets
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let { action, sheet, collection, operation, id, data } = payload;
    
    const SHEET_MAP = {
      'vehicles': 'Danh Muc Xe',
      'drivers': 'Tai Xe',
      'customers': 'Khach Hang',
      'routes': 'Tuyen Duong',
      'trips': 'Chuyen Van Chuyen',
      'expenses': 'Chi Phi',
      'transport_orders': 'Don Hang',
      'tires': 'Kho Lop',
      'inventory': 'Kho Vat Tu',
      'maintenance': 'Bao Tri'
    };
    if (SHEET_MAP[sheet] || SHEET_MAP[collection]) {
      sheet = SHEET_MAP[sheet] || SHEET_MAP[collection];
    }

    if ((action !== 'sync' && action !== 'batch_sync') || !sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Bảng không hợp lệ hoặc bị cấm.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let ws = ss.getSheetByName(sheet);

    // Nếu chưa có Sheet tương ứng, tự động tạo mới
    if (!ws) {
      ws = ss.insertSheet(sheet);
      if (data && !Array.isArray(data) && typeof data === 'object') {
        const headers = Object.keys(data);
        ws.appendRow(headers);
        ws.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
      }
    }

    // Nếu là thao tác BATCH_SYNC (Đồng bộ hàng loạt khi bấm nút trên App)
    if (action === 'batch_sync') {
      ws.clear(); // Xóa dữ liệu cũ trên sheet để cập nhật bộ mới nhất
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        ws.appendRow(headers);
        ws.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7"); // Xanh lá Phú An
        
        const rows = data.map(item => headers.map(h => item[h] !== undefined && item[h] !== null ? item[h] : ''));
        if (rows.length > 0) {
          ws.getRange(2, 1, rows.length, headers.length).setValues(rows);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: `Đã nạp ${Array.isArray(data) ? data.length : 0} dòng vào bảng ${sheet}.` }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];
    
    // Nếu là thao tác INSERT (Thêm mới)
    if (operation === 'INSERT') {
      const newRow = headers.map(header => data[header] !== undefined ? data[header] : '');
      ws.appendRow(newRow);
    } 
    // Nếu là thao tác UPDATE (Cập nhật)
    else if (operation === 'UPDATE' && id) {
      const dataRange = ws.getDataRange();
      const allValues = dataRange.getValues();
      const idColIndex = headers.indexOf('id');
      
      if (idColIndex !== -1) {
        // Tìm dòng chứa id cần update (bỏ qua dòng 0 là header)
        for (let r = 1; r < allValues.length; r++) {
          if (allValues[r][idColIndex] === id) {
            const rowNumber = r + 1;
            // Cập nhật từng ô dữ liệu
            Object.keys(data).forEach(key => {
              const colIndex = headers.indexOf(key);
              if (colIndex !== -1) {
                ws.getRange(rowNumber, colIndex + 1).setValue(data[key]);
              }
            });
            break;
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Đồng bộ thành công.' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Lắng nghe sự kiện Edit trực tiếp trên Google Sheets (do Kế toán nhập tay)
 * và đẩy dữ liệu về lại D1.
 */
function onEdit(e) {
  if (!e || !e.range) return;

  const ws = e.range.getSheet();
  const sheetName = ws.getName();
  
  // Chỉ quan tâm những Sheet nằm trong danh sách cho phép
  if (!CONFIG.ALLOWED_SHEETS.includes(sheetName)) return;

  const row = e.range.getRow();
  if (row === 1) return; // Bỏ qua việc sửa Header

  const headers = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];
  const rowData = ws.getRange(row, 1, 1, ws.getLastColumn()).getValues()[0];

  // Map header -> value để tạo Object JSON
  let payloadData = {};
  let id = null;

  headers.forEach((header, index) => {
    payloadData[header] = rowData[index];
    if (header === 'id') {
      id = rowData[index];
    }
  });

  // Nếu dòng chưa có ID, nghĩa là dòng mới hoàn toàn chưa được lưu vào D1
  const operation = id ? 'UPDATE' : 'INSERT';

  const payload = {
    action: 'sync_from_sheets',
    sheet: sheetName,
    operation: operation,
    id: id,
    data: payloadData
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + CONFIG.API_SECRET_KEY
    },
    'payload': JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(CONFIG.API_URL, options);
  } catch (error) {
    console.error("Lỗi đồng bộ D1:", error);
  }
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, DatabaseZap, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { 
  vehicleAdapter, driverAdapter, customerAdapter, routeAdapter, 
  tripAdapter, expenseAdapter, transportOrderAdapter, tiresAdapter, 
  inventoryAdapter, maintenanceAdapter 
} from "@/lib/data-adapter";

export function GoogleSheetsSyncCard() {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secretKey, setSecretKey] = useState("PHUAN_SECRET_KEY_123");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(15); // Mặc định 15 phút để tránh limit

  useEffect(() => {
    const savedUrl = localStorage.getItem('google_sheets_webhook_url') || import.meta.env.VITE_GOOGLE_APPS_SCRIPT_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbx5KzSFEFbwUi7mGEV_9G3AWpw7zMSM-57lAYssYLdHpd9GA5ZQlXp4oBzRQB6P43poIg/exec";
    const savedKey = localStorage.getItem('google_sheets_secret_key') || import.meta.env.VITE_API_SECRET_KEY || "PHUAN_SECRET_KEY_123";
    const savedAutoSync = localStorage.getItem('google_sheets_auto_sync') === 'true';
    const savedInterval = parseInt(localStorage.getItem('google_sheets_sync_interval') || '15', 10);
    
    setWebhookUrl(savedUrl);
    setSecretKey(savedKey);
    setAutoSync(savedAutoSync);
    setSyncInterval(savedInterval);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoSync && webhookUrl) {
      intervalId = setInterval(() => {
        handleForceSync(true); // pass true for silent auto-sync
      }, syncInterval * 60 * 1000); 
    }
    return () => clearInterval(intervalId);
  }, [autoSync, webhookUrl, syncInterval]);

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('google_sheets_auto_sync', checked.toString());
    if (checked) {
      toast({
        title: "⏰ Đã bật tự động đồng bộ",
        description: `Dữ liệu sẽ tự động đẩy lên Google Sheets mỗi ${syncInterval} phút.`,
      });
      handleForceSync(true);
    } else {
      toast({
        title: "Đã tắt tự động đồng bộ",
        description: "Bạn cần đồng bộ thủ công bằng nút bên dưới.",
      });
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setSyncInterval(value);
    localStorage.setItem('google_sheets_sync_interval', value.toString());
    if (autoSync) {
      toast({
        title: "⏱️ Đã cập nhật chu kỳ",
        description: `Chu kỳ đồng bộ mới: ${value} phút/lần.`,
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('google_sheets_webhook_url', webhookUrl);
      localStorage.setItem('google_sheets_secret_key', secretKey);
      
      toast({
        title: "✅ Lưu cấu hình thành công",
        description: "Webhook URL và Secret Key đã được lưu an toàn. Tính năng đồng bộ Google Sheets sẵn sàng.",
      });
    } catch (error) {
      toast({
        title: "Lỗi lưu cấu hình",
        description: "Không thể lưu cấu hình vào bộ nhớ.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceSync = async (isAuto = false) => {
    if (!webhookUrl) {
      toast({
        title: "⚠️ Thiếu Webhook URL",
        description: "Vui lòng nhập Google Apps Script Webhook URL của bác và nhấn Lưu trước khi đồng bộ.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress("Đang tải dữ liệu từ hệ thống...");

    try {
      const FUEL_CATEGORIES = ['Nhiên liệu', 'Dầu Diesel', 'Nhớt', 'Mỡ bôi trơn', 'Dung dịch', 'AdBlue'];
      const TOOL_CATEGORIES = ['Công cụ', 'Dụng cụ', 'Thiết bị', 'CCDC', 'Đồ nghề'];

      const HEADER_MAP: Record<string, string> = {
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

      const mapHeaders = (data: any[]) => {
        return data.map(row => {
          const newRow: any = {};
          // Ensure tenant_id is first if it exists
          if (row.tenant_id) newRow['tenant_id'] = row.tenant_id;
          
          for (const key of Object.keys(row)) {
            if (key === 'tenant_id') continue;
            const vietnameseHeader = HEADER_MAP[key] || key;
            newRow[vietnameseHeader] = row[key];
          }
          return newRow;
        });
      };

      const collections = [
        { name: 'vehicles', sheetName: 'Danh Muc Xe', label: 'Xe vận tải', adapter: vehicleAdapter },
        { name: 'drivers', sheetName: 'Tai Xe', label: 'Tài xế NĐ10', adapter: driverAdapter },
        { name: 'customers', sheetName: 'Khach Hang', label: 'Khách hàng', adapter: customerAdapter },
        { name: 'routes', sheetName: 'Tuyen Duong', label: 'Tuyến đường', adapter: routeAdapter },
        { name: 'trips', sheetName: 'Chuyen Van Chuyen', label: 'Chuyến xe', adapter: tripAdapter },
        { name: 'expenses', sheetName: 'Chi Phi', label: 'Chi phí', adapter: expenseAdapter },
        { name: 'transport_orders', sheetName: 'Don Hang', label: 'Đơn hàng', adapter: transportOrderAdapter },
        { name: 'tires', sheetName: 'Kho Lop', label: 'Kho Lốp', adapter: tiresAdapter },
        { name: 'maintenance', sheetName: 'Bao Tri', label: 'Bảo dưỡng', adapter: maintenanceAdapter }
      ];

      let totalRecords = 0;
      let successSheets = 0;

      // Regular collections
      for (const col of collections) {
        setSyncProgress(`Đang đẩy ${col.label}...`);
        try {
          const rows = await col.adapter.list(500);
          if (rows && rows.length > 0) {
            totalRecords += rows.length;
            const mappedRows = mapHeaders(rows);
            
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'batch_sync',
                sheet: col.sheetName || col.name,
                collection: col.name,
                data: mappedRows
              })
            });

            if (response.ok) {
              successSheets++;
            }
          }
        } catch (err) {
          console.error(`Lỗi đồng bộ bảng ${col.name}:`, err);
        }
      }

      // Handle Inventory separately to split into 3 sheets
      setSyncProgress(`Đang phân tách và đẩy dữ liệu Kho...`);
      try {
        const invRows = await inventoryAdapter.list(1000);
        if (invRows && invRows.length > 0) {
          const fuelItems = invRows.filter((i: any) => i.category && FUEL_CATEGORIES.some(c => i.category.toLowerCase().includes(c.toLowerCase())));
          const toolItems = invRows.filter((i: any) => i.category && TOOL_CATEGORIES.some(c => i.category.toLowerCase().includes(c.toLowerCase())));
          const materialItems = invRows.filter((i: any) => !fuelItems.includes(i) && !toolItems.includes(i));

          const invSplits = [
            { sheet: 'Kho Vat Tu', data: materialItems, name: 'Vật tư' },
            { sheet: 'Kho Nhien Lieu', data: fuelItems, name: 'Nhiên liệu' },
            { sheet: 'Kho CCDC', data: toolItems, name: 'CCDC' }
          ];

          for (const split of invSplits) {
            if (split.data.length > 0) {
              totalRecords += split.data.length;
              const mappedRows = mapHeaders(split.data);
              
              const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'batch_sync',
                  sheet: split.sheet,
                  collection: 'inventory',
                  data: mappedRows
                })
              });
              if (response.ok) successSheets++;
            }
          }
        }
      } catch (err) {
        console.error(`Lỗi phân tách Kho:`, err);
      }

      setSyncProgress("");
      if (!isAuto) {
        toast({
          title: "🎉 Đồng bộ toàn bộ hoàn tất!",
          description: `Đã đẩy thành công ${totalRecords} bản ghi từ ${successSheets} bảng dữ liệu sang Google Sheets!`,
        });
      }
    } catch (error: any) {
      setSyncProgress("");
      if (!isAuto) {
        toast({
          title: "❌ Lỗi kết nối Google Sheets",
          description: error.message || "Kiểm tra lại Webhook URL và quyền truy cập Web App trên Google Apps Script.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-emerald-700 flex items-center gap-2 text-lg">
          <DatabaseZap className="w-5 h-5 text-emerald-600" />
          Đồng bộ Google Sheets & D1 Cloudflare (2 Chiều Realtime)
        </CardTitle>
        <CardDescription className="text-slate-600">
          Mô hình đồng bộ tối ưu cho doanh nghiệp Vận tải Việt Nam: Dữ liệu được quản lý siêu tốc trên D1/Firebase và tự động cập nhật song song sang bảng tính Excel / Google Sheets để kế toán theo dõi, kiểm toán.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="font-semibold text-slate-700">Google Apps Script Webhook URL</Label>
          <Input 
            value={webhookUrl} 
            onChange={(e) => setWebhookUrl(e.target.value)} 
            placeholder="https://script.google.com/macros/s/.../exec"
            className="bg-white border-slate-300 focus:border-emerald-500"
          />
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />
            URL Web app lấy từ Google Apps Script sau khi bấm Triển khai (Deploy) &gt; Web app (Anyone).
          </p>
        </div>
        
        <div className="space-y-2">
          <Label className="font-semibold text-slate-700">API Secret Key</Label>
          <Input 
            type="password"
            value={secretKey} 
            onChange={(e) => setSecretKey(e.target.value)} 
            className="bg-white border-slate-300 focus:border-emerald-500"
          />
          <p className="text-[11px] text-muted-foreground">Mã bảo mật xác thực 2 chiều khi Google Sheets đẩy thay đổi về hệ thống.</p>
        </div>

        {syncProgress && (
          <div className="p-2.5 bg-emerald-100/80 rounded-md border border-emerald-300 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {syncProgress}
          </div>
        )}

        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Lịch Đồng Bộ Tự Động (Auto-Sync)
            </Label>
            <p className="text-xs text-slate-500">
              Tự động đẩy dữ liệu từ D1 lên Google Sheets. Tùy chỉnh chu kỳ để tránh vượt giới hạn Quota của Apps Script.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={syncInterval} 
              onChange={handleIntervalChange}
              disabled={!autoSync}
              className="text-sm border border-slate-300 rounded-md bg-white px-2 py-1 outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={5}>5 phút</option>
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={60}>60 phút</option>
            </select>
            <Switch 
              checked={autoSync} 
              onCheckedChange={handleToggleAutoSync} 
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />}
            Lưu cấu hình
          </Button>
          
          <Button 
            onClick={() => handleForceSync(false)}
            disabled={isSyncing || !webhookUrl}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all active:scale-[0.98]"
          >
            {isSyncing ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Đang đẩy dữ liệu siêu tốc...</>
            ) : (
              <><DatabaseZap className="w-4 h-4 mr-2" /> ⚡ Đồng bộ toàn bộ dữ liệu ngay</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ExcelImportDialog, ImportColumn } from "@/components/shared/ExcelImportDialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wrench, AlertTriangle, Loader2, Trash2, RefreshCw, Search, Download, Upload, Plus, Calendar, MapPin, Truck } from "lucide-react";
import { useMaintenanceOrders, useCreateMaintenanceOrder, useUpdateMaintenanceOrder, useDeleteMaintenanceOrder } from "@/hooks/useMaintenance";
import { useVehicles, useVehiclesByStatus } from "@/hooks/useVehicles";
import { ExcelFilter } from "@/components/vehicles/ExcelFilter";
import { ColumnChooser } from "@/components/vehicles/ColumnChooser";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { getNextCodeByPrefix, getMonthlyPrefix } from "@/lib/code-generator";

// Type definitions
interface MaintenanceOrder {
  id: string;
  order_code: string;
  vehicle_id: string;
  maintenance_type: string;
  scheduled_date: string; // was order_date?
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'; // Updated status enum

  // Costs
  labor_cost?: number | null;
  parts_cost?: number | null;
  total_cost?: number | null;

  // Details
  vendor_name?: string | null;
  odometer_at_service?: number | null;

  // Next service
  next_service_date?: string | null;
  next_service_km?: number | null;

  completed_at?: string | null;

  // Legacy or unused but potentially present
  cost?: number | null;
  notes?: string | null;

  // Relations
  vehicle?: any;
}

// Form Schema
const maintenanceSchema = z.object({
  order_code: z.string().refine(val => !val || /^(MNT-(\d{4}-)+\d+|MNT\d{4}|BD\d{4}|BD\d{4}-\d+|BD-(\d{4}-)+\d+)$/.test(val), "Mã bảo dưỡng sai chuẩn (VD: BD-2604-01)").optional(),
  vehicle_id: z.string().min(1, "Xe là bắt buộc"),
  maintenance_type: z.enum(['routine', 'repair', 'inspection', 'tire', 'other'] as const),
  description: z.string().min(1, "Mô tả công việc là bắt buộc"),
  scheduled_date: z.string().min(1, "Ngày dự kiến là bắt buộc"),
  vendor_name: z.string().optional().nullable(),
  odometer_at_service: z.coerce.number().min(0).nullable(),
  labor_cost: z.coerce.number().min(0).nullable(),
  parts_cost: z.coerce.number().min(0).nullable(),
  next_service_km: z.coerce.number().min(0).nullable(),
  next_service_date: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'] as const),
}).refine(data => {
  if (data.completed_at && data.scheduled_date) {
    return new Date(data.completed_at) >= new Date(data.scheduled_date);
  }
  return true;
}, {
  message: "Ngày hoàn thành phải sau hoặc bằng ngày dự kiến",
  path: ["completed_at"]
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

const maintenanceTypeLabels: Record<string, string> = {
  routine: 'Bảo dưỡng định kỳ',
  repair: 'Sửa chữa',
  inspection: 'Đăng kiểm',
  tire: 'Lốp xe',
  other: 'Khác',
};

export default function Maintenance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canDelete, canExport } = usePermissions('maintenance');
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['order_code', 'vehicle', 'maintenance_type', 'scheduled_date', 'total_cost', 'status']);


  // Admin override reason state
  const [adminReasonDialogOpen, setAdminReasonDialogOpen] = useState(false);
  const [adminReason, setAdminReason] = useState("");
  const [pendingAdminAction, setPendingAdminAction] = useState<
    | { type: 'update'; id: string; data: any }
    | { type: 'delete'; id: string }
    | null
  >(null);

  // Import Columns Config
  const importColumns: ImportColumn[] = [
    { key: 'order_code', header: 'Mã lệnh', required: true },
    { key: 'vehicle_license_plate', header: 'Biển số xe', required: true },
    { key: 'maintenance_type', header: 'Loại bảo trì', required: true },
    { key: 'scheduled_date', header: 'Ngày dự kiến', required: true, type: 'date' },
    { key: 'description', header: 'Mô tả công việc', required: true },
    { key: 'vendor_name', header: 'Nhà cung cấp' },
    { key: 'labor_cost', header: 'Chi phí nhân công', type: 'number' },
    { key: 'parts_cost', header: 'Chi phí phụ tùng', type: 'number' },
    { key: 'odometer_at_service', header: 'Odo lúc bảo trì', type: 'number' },
    { key: 'next_service_km', header: 'Km bảo trì tiếp theo', type: 'number' },
    { key: 'next_service_date', header: 'Ngày bảo trì tiếp theo', type: 'date' },
    { key: 'completed_at', header: 'Ngày hoàn thành', type: 'date' },
    { key: 'status', header: 'Trạng thái' },
  ];
  // Data Hooks
  const { data: orders, isLoading } = useMaintenanceOrders();
  const { data: vehicles } = useVehicles();

  // Mutation Hooks
  const createMutation = useCreateMaintenanceOrder();
  const updateMutation = useUpdateMaintenanceOrder();
  const deleteMutation = useDeleteMaintenanceOrder();

  // Form setup
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      order_code: "",
      vehicle_id: "",
      maintenance_type: 'routine',
      description: "",
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      labor_cost: 0,
      parts_cost: 0,
      odometer_at_service: 0,
    },
  });

  // Handlers
  const handleAdd = useCallback(async () => {
    setSelectedOrder(null);
    const nextCode = getNextCodeByPrefix(
      (orders || []).map(o => o.order_code),
      getMonthlyPrefix('BD'),
      2
    );

    form.reset({
      order_code: nextCode,
      vehicle_id: "",
      maintenance_type: 'routine',
      description: "",
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      labor_cost: 0,
      parts_cost: 0,
      odometer_at_service: 0,
      vendor_name: "",
      next_service_km: 0,
      next_service_date: "",
      completed_at: "",
    });
    setDialogOpen(true);
  }, [form]);

  // Check for navigation from Alerts
  useEffect(() => {
    const checkAlertNavigation = async () => {
      const selectedVehicleId = sessionStorage.getItem('selectedVehicleIdForMaintenance');
      if (selectedVehicleId) {
        await handleAdd();
        form.setValue('vehicle_id', selectedVehicleId);
        sessionStorage.removeItem('selectedVehicleIdForMaintenance');
      }
    };
    checkAlertNavigation();
  }, [form, handleAdd]);

  const handleRowClick = useCallback((order: MaintenanceOrder) => {
    setSelectedOrder(order);
    form.reset({
      order_code: order.order_code,
      vehicle_id: order.vehicle_id,
      maintenance_type: order.maintenance_type as "routine" | "repair" | "inspection" | "tire" | "other",
      description: order.description,
      scheduled_date: format(parseISO(order.scheduled_date), 'yyyy-MM-dd'),
      vendor_name: order.vendor_name,
      odometer_at_service: order.odometer_at_service || 0,
      labor_cost: order.labor_cost || 0,
      parts_cost: order.parts_cost || 0,
      next_service_km: order.next_service_km || 0,
      next_service_date: order.next_service_date ? format(parseISO(order.next_service_date), 'yyyy-MM-dd') : "",
      completed_at: order.completed_at ? format(parseISO(order.completed_at), 'yyyy-MM-dd') : "",
      status: order.status || 'scheduled',
    });
    setDialogOpen(true);
  }, [form]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, order: MaintenanceOrder) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    const isTerminal = ['completed', 'cancelled'].includes(selectedOrder.status);
    if (isTerminal && isAdmin) {
      // Admin needs to provide reason for terminal state deletion
      setPendingAdminAction({ type: 'delete', id: selectedOrder.id });
      setDeleteDialogOpen(false);
      setAdminReason("");
      setAdminReasonDialogOpen(true);
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id: selectedOrder.id });
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      // handled by hook
    }
  };

  // Handle bulk delete
  const handleDeleteSelected = (ids: string[]) => {
    if (ids.length === 0) return;
    setSelectedIds(new Set(ids));
    setDeleteAllDialogOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    let successCount = 0;
    let errorCount = 0;
    const idsToDelete = Array.from(selectedIds);

    for (const id of idsToDelete) {
      try {
        await deleteMutation.mutateAsync({ id });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    setDeleteAllDialogOpen(false);
    setSelectedIds(new Set());

    toast({
      title: "Xóa hoàn tất",
      description: `Đã xóa ${successCount} lệnh bảo trì${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
    });
  };

  const onSubmit = async (data: MaintenanceFormValues) => {
    const processedData = {
      ...data,
      next_service_date: data.next_service_date === "" ? null : data.next_service_date,
      completed_at: data.completed_at === "" ? null : data.completed_at,
    };

    try {
      if (selectedOrder) {
        const isTerminal = ['completed', 'cancelled'].includes(selectedOrder.status);
        if (isTerminal && isAdmin) {
          // Admin editing terminal state: require reason
          setPendingAdminAction({ type: 'update', id: selectedOrder.id, data: processedData });
          setDialogOpen(false);
          setAdminReason("");
          setAdminReasonDialogOpen(true);
          return;
        }
        await updateMutation.mutateAsync({
          id: selectedOrder.id,
          updates: processedData,
        });
      } else {
        await createMutation.mutateAsync(processedData);
      }
      setDialogOpen(false);
      toast({ title: "Thành công", description: selectedOrder ? "Đã cập nhật lệnh bảo trì" : "Đã tạo lệnh bảo trì mới thành công" });
    } catch (error: any) {
      console.error("Maintenance submit error:", error);
      toast({
        title: "Lỗi lưu dữ liệu",
        description: error.message || "Có lỗi xảy ra khi lưu lệnh bảo trì",
        variant: "destructive"
      });
    }
  };

  // Admin override: execute pending action with reason
  const handleAdminReasonConfirm = async () => {
    if (!pendingAdminAction || adminReason.trim().length < 10) return;
    try {
      if (pendingAdminAction.type === 'update') {
        await updateMutation.mutateAsync({
          id: pendingAdminAction.id,
          updates: pendingAdminAction.data,
          reason: adminReason.trim(),
        });
        toast({ title: "Thành công", description: "Đã cập nhật lệnh bảo trì (Admin Override)" });
      } else {
        await deleteMutation.mutateAsync({
          id: pendingAdminAction.id,
          reason: adminReason.trim(),
        });
        toast({ title: "Thành công", description: "Đã xóa lệnh bảo trì (Admin Override)" });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive"
      });
    } finally {
      setAdminReasonDialogOpen(false);
      setAdminReason("");
      setPendingAdminAction(null);
      setSelectedOrder(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast({ title: "Làm mới thành công", description: "Dữ liệu bảo trì đã cập nhật" });
    } catch (error) {
      toast({ title: "Lỗi đồng bộ", description: "Không thể cập nhật dữ liệu", variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    import('@/lib/export').then(({ exportToCSV }) => {
      exportToCSV(orders || [], 'Danh_sach_bao_tri', [
        { key: 'order_code', header: 'Mã lệnh' },
        { key: 'vehicle.license_plate', header: 'Xe' },
        { key: 'maintenance_type', header: 'Loại bảo trì' },
        { key: 'scheduled_date', header: 'Ngày dự kiến' },
        { key: 'completed_at', header: 'Ngày hoàn thành' },
        { key: 'total_cost', header: 'Chi phí' },
        { key: 'status', header: 'Trạng thái' },
      ]);
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleImportData = async (rows: any[]) => {
    let successCount = 0;
    let errorCount = 0;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (const row of rows) {
      try {
        await delay(50); // Pacing for stability
        // 1. Lookup Vehicle
        let vehicleId = "";
        if (row.vehicle_license_plate) {
          const vehicle = vehicles?.find(v => v.license_plate.toLowerCase() === String(row.vehicle_license_plate).toLowerCase());
          vehicleId = vehicle?.id || "";
        }

        if (!vehicleId) {
          throw new Error(`Không tìm thấy xe: ${row.vehicle_license_plate}`);
        }

        await createMutation.mutateAsync({
          order_code: String(row.order_code || `BT-${Date.now()}`),
          vehicle_id: vehicleId,
          maintenance_type: ((val) => {
            const v = String(val).toLowerCase();
            if (v.includes('định kỳ') || v === 'routine') return 'routine';
            if (v.includes('sửa chữa') || v === 'repair') return 'repair';
            if (v.includes('đăng kiểm') || v === 'inspection') return 'inspection';
            if (v.includes('lốp') || v === 'tire') return 'tire';
            return 'other';
          })(row.maintenance_type),
          description: String(row.description || ''),
          scheduled_date: String(row.scheduled_date || format(new Date(), 'yyyy-MM-dd')),
          vendor_name: row.vendor_name ? String(row.vendor_name) : null,
          odometer_at_service: row.odometer_at_service ? Number(row.odometer_at_service) : 0,
          labor_cost: row.labor_cost ? Number(row.labor_cost) : 0,
          parts_cost: row.parts_cost ? Number(row.parts_cost) : 0,
          next_service_km: row.next_service_km ? Number(row.next_service_km) : 0,
          next_service_date: row.next_service_date ? String(row.next_service_date) : null,
          completed_at: row.completed_at ? String(row.completed_at) : null,
          status: ((val) => {
            const v = String(val).toLowerCase();
            if (v.includes('kế hoạch') || v === 'scheduled') return 'scheduled';
            if (v.includes('đang thực hiện') || v === 'in_progress') return 'in_progress';
            if (v.includes('hoàn thành') || v === 'completed') return 'completed';
            if (v.includes('hủy') || v === 'cancelled') return 'cancelled';
            return 'scheduled';
          })(row.status),
        } as any);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error("Import error", error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['maintenance'] });

    toast({
      title: "Nhập lệnh bảo trì thành công",
      description: `Đã nhập ${successCount} lệnh${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
    });
  };

  // Filter data based on search query and active filters
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(order => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.order_code?.toLowerCase().includes(query) ||
          order.vehicle?.license_plate?.toLowerCase().includes(query) ||
          order.maintenance_type?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 2. Excel Filters
      if (activeFilters.maintenance_type && activeFilters.maintenance_type.length > 0) {
        if (!activeFilters.maintenance_type.includes(order.maintenance_type)) return false;
      }
      if (activeFilters.status && activeFilters.status.length > 0) {
        if (!activeFilters.status.includes(order.status)) return false;
      }

      return true;
    });
  }, [orders, searchQuery, activeFilters]);

  const scheduledCount = orders?.filter(o => o.status === 'scheduled').length || 0;
  const totalCost = orders?.reduce((sum, o) => sum + (o.total_cost || 0), 0) || 0;

  const columns = useMemo<Column<MaintenanceOrder>[]>(() => [
    {
      key: 'order_code',
      header: 'Mã lệnh',
      width: '120px',
      render: (value) => <span className="font-mono font-medium">{value as string}</span>,
    },
    {
      key: 'vehicle',
      header: 'Biển số xe',
      render: (_, row) => <span className="font-mono">{row.vehicle?.license_plate || 'N/A'}</span>,
    },
    {
      key: 'maintenance_type',
      header: 'Loại bảo trì',
      render: (value) => maintenanceTypeLabels[value as string] || value,
    },
    {
      key: 'description',
      header: 'Mô tả công việc',
    },
    {
      key: 'scheduled_date',
      header: 'Ngày dự kiến',
      render: (value) => formatDate(value as string),
    },
    {
      key: 'total_cost',
      header: 'Chi phí',
      align: 'right',
      render: (value) => <span className="tabular-nums">{formatCurrency(value as number)}</span>,
    },
    {
      key: 'vendor_name',
      header: 'Nhà cung cấp',
      render: (value) => value ? (value as string) : <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '140px',
      render: (value) => <StatusBadge status={value as any} />,
    },
    ...(canDelete ? [{
      key: 'id' as const,
      header: '',
      width: '50px',
      render: (_: any, row: any) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e: React.MouseEvent) => handleDeleteClick(e, row)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    }] : []) as any[]
  ], [handleDeleteClick, canDelete]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {/* 1. Compact Header Row */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bảo Trì – Sửa Chữa</h1>
          <p className="text-muted-foreground text-sm">{`${scheduledCount} lệnh đang chờ thực hiện • Tổng chi phí: ${formatCurrency(totalCost)}`}</p>
        </div>
        {scheduledCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">{scheduledCount} lệnh sắp đến hạn</span>
          </div>
        )}
      </div>

      {/* 2. Unified Toolbar Row */}
      <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center justify-between bg-muted/10 p-2 rounded-lg border">
        {/* Left Side: Search + Filters */}
        <div className="flex flex-col sm:flex-row flex-1 w-full xl:w-auto gap-2">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã lệnh, biển số xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 bg-background"
            />
          </div>

          <div className="flex-1 overflow-x-auto pb-1 sm:pb-0">
            <ExcelFilter
              data={orders || []}
              filterConfigs={[
                { key: 'maintenance_type', label: 'Loại bảo trì', type: 'multi-select', options: Object.entries(maintenanceTypeLabels).map(([value, label]) => ({ label, value })) },
                { key: 'status', label: 'Trạng thái', type: 'multi-select', options: [
                  { label: 'Đã lên lịch', value: 'scheduled' },
                  { label: 'Đang thực hiện', value: 'in_progress' },
                  { label: 'Hoàn thành', value: 'completed' },
                  { label: 'Đã hủy', value: 'cancelled' },
                ]},
              ]}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
          </div>
        </div>

        {/* Right Side: Actions (Compact) */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {canDelete && selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteSelected(Array.from(selectedIds))}
              className="h-8 gap-1 px-3 shadow-sm animate-in fade-in zoom-in-95"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa {selectedIds.size} lệnh</span>
            </Button>
          )}

          <ColumnChooser
            columns={columns.map(c => ({ key: String(c.key), header: c.header }))}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
            storageKey="maintenance_visible_columns"
            defaultRequiredKeys={['order_code', 'vehicle']}
          />

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          <Button variant="ghost" size="icon" onClick={handleSyncAll} disabled={isSyncing} title="Đồng bộ" className="h-8 w-8">
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          </Button>

          {canCreate && (
            <Button variant="outline" size="sm" onClick={handleImport} className="h-8 px-2 sm:px-3">
              <Upload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nhập</span>
            </Button>
          )}

          {canExport && (
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 px-2 sm:px-3">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Xuất</span>
            </Button>
          )}

          {canCreate && (
            <Button size="sm" onClick={handleAdd} className="h-8 gap-1 px-2 sm:px-3">
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Tạo lệnh</span>
            </Button>
          )}
        </div>
      </div>

      <div className="hidden md:block">
        <DataTable
          data={filteredOrders}
          columns={columns.filter(c => visibleColumns.includes(String(c.key)))}
          selectable
          onRowClick={handleRowClick}
          selectedRowIds={selectedIds}
          onSelectionChange={(ids) => setSelectedIds(new Set(ids))}
          onDeleteSelected={canDelete ? handleDeleteSelected : undefined}
          hideToolbar={true}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-3 pt-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50">Không tìm thấy lệnh bảo trì phù hợp</div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="bg-white p-4 rounded-xl border shadow-sm border-slate-200 active:bg-slate-50 transition-colors"
              onClick={() => handleRowClick(order)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg text-slate-800">{order.vehicle?.license_plate || 'N/A'}</div>
                  <div className="text-sm font-medium text-blue-600">{order.order_code} • {maintenanceTypeLabels[order.maintenance_type] || order.maintenance_type}</div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  order.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                  order.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {order.status === 'completed' ? 'Hoàn thành' : 
                   order.status === 'in_progress' ? 'Đang làm' : 
                   order.status === 'cancelled' ? 'Đã hủy' : 'Đã lên lịch'}
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                <Calendar className="w-3.5 h-3.5" /> 
                <span>Dự kiến: {formatDate(order.scheduled_date)}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-3 line-clamp-1">
                <Wrench className="w-3.5 h-3.5" /> 
                <span>{order.description}</span>
              </div>
              
              <div className="flex gap-2">
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm" 
                    onClick={(e) => { 
                      e.stopPropagation();
                      handleRowClick(order);
                    }}
                  >
                    Cập nhật
                  </Button>
                )}
                {canDelete && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="px-3 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDeleteClick(e, order)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hidden file input for import removed - replaced by ExcelImportDialog */}
      <ExcelImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportData}
        entityName="lệnh bảo trì"
        columns={importColumns}
        sampleData={[
          {
            order_code: 'BT2603001',
            vehicle_license_plate: '29C-12345',
            maintenance_type: 'Bảo dưỡng định kỳ',
            scheduled_date: '2024-02-15',
            description: 'Thay dầu, lọc nhớt',
            vendor_name: 'Garage A',
            labor_cost: 500000,
            parts_cost: 1500000,
            status: 'Kế hoạch'
          }
        ]}
        existingCodes={orders?.map(o => o.order_code) || []}
        codeField="order_code"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              {selectedOrder ? 'Chi tiết lệnh bảo trì' : 'Tạo lệnh bảo trì mới'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Mã lệnh: ${selectedOrder.order_code}`
                : 'Nhập thông tin bảo trì xe'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="order_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã lệnh *</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: BT2603001" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xe *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn xe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles?.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.license_plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenance_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại bảo trì *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="routine">Bảo dưỡng định kỳ</SelectItem>
                          <SelectItem value="repair">Sửa chữa</SelectItem>
                          <SelectItem value="inspection">Đăng kiểm</SelectItem>
                          <SelectItem value="tire">Lốp xe</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày dự kiến *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? parseISO(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả công việc *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Chi tiết..." rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vendor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhà cung cấp/Garage</FormLabel>
                      <FormControl>
                        <Input placeholder="Tên garage..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="odometer_at_service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odo lúc bảo trì</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labor_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chi phí nhân công</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parts_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chi phí phụ tùng</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_service_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Km bảo trì tiếp theo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_service_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bảo trì tiếp theo</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? parseISO(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="completed_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày hoàn thành</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? parseISO(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                          <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedOrder ? 'Cập nhật' : 'Tạo lệnh'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa lệnh bảo trì <strong>{selectedOrder?.order_code}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedIds.size} lệnh bảo trì?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {selectedIds.size} lệnh bảo trì đã chọn? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Override Reason Dialog */}
      <Dialog open={adminReasonDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAdminReasonDialogOpen(false);
          setAdminReason("");
          setPendingAdminAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Quyền Admin Override
            </DialogTitle>
            <DialogDescription>
              Bạn đang {pendingAdminAction?.type === 'delete' ? 'xóa' : 'sửa'} lệnh bảo trì ở trạng thái đã hoàn thành/hủy.
              Vui lòng nhập lý do (tối thiểu 10 ký tự). Thao tác sẽ được ghi nhận trong nhật ký kiểm toán.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="admin-reason" className="font-medium">Lý do <span className="text-destructive">*</span></Label>
            <Textarea
              id="admin-reason"
              placeholder="Nhập lý do tại sao cần thay đổi (VD: Sai thông tin nhà cung cấp, cần cập nhật chi phí thực tế...)"
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            {adminReason.length > 0 && adminReason.trim().length < 10 && (
              <p className="text-sm text-destructive">Lý do phải có ít nhất 10 ký tự ({adminReason.trim().length}/10)</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAdminReasonDialogOpen(false);
              setAdminReason("");
              setPendingAdminAction(null);
            }}>
              Hủy
            </Button>
            <Button
              onClick={handleAdminReasonConfirm}
              disabled={adminReason.trim().length < 10 || updateMutation.isPending || deleteMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {(updateMutation.isPending || deleteMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Xác nhận Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

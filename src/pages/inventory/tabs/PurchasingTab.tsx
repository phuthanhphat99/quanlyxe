import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ShoppingCart, FileSpreadsheet, Printer, Check, X, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePurchaseOrders, useCreatePO, useUpdatePO, useInventoryItems } from '@/hooks/useInventory';
import { exportToExcel, exportToCSV, printTable } from '@/lib/export-utils';
import { useToast } from '@/hooks/use-toast';
import { DataTable, Column } from "@/components/shared/DataTable";
import { ColumnChooser } from "@/components/vehicles/ColumnChooser";
import { Search } from "lucide-react";

export function PurchasingTab() {
  const { data: pos = [], isLoading } = usePurchaseOrders();
  const { data: items = [] } = useInventoryItems();
  const createPO = useCreatePO();
  const updatePO = useUpdatePO();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'po_code', 'vendor_name', 'order_date', 'expected_date', 'total_amount', 'status', 'notes', 'actions'
  ]);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    po_code: '',
    vendor_name: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_date: '',
    total_amount: '',
    notes: '',
  });

  const handleCreatePO = () => {
    if (!formData.po_code || !formData.vendor_name) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập mã PO và tên nhà cung cấp", variant: "destructive" });
      return;
    }
    createPO.mutate({
      po_code: formData.po_code,
      vendor_name: formData.vendor_name,
      order_date: formData.order_date,
      expected_date: formData.expected_date || null,
      total_amount: Number(formData.total_amount) || 0,
      status: 'pending',
      notes: formData.notes,
    }, {
      onSuccess: () => {
        setCreateModalOpen(false);
        setFormData({ po_code: '', vendor_name: '', order_date: new Date().toISOString().slice(0, 10), expected_date: '', total_amount: '', notes: '' });
      }
    });
  };

  const handleStatusChange = (poId: string, newStatus: string) => {
    updatePO.mutate({ id: poId, data: { status: newStatus } });
  };

  const statusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">Chờ duyệt</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">Đã nhập</Badge>;
      case 'cancelled': return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200">Đã hủy</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPos = React.useMemo(() => {
    if (!searchTerm) return pos;
    return pos.filter((p: any) => 
      (p.po_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.vendor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [pos, searchTerm]);

  const columns = React.useMemo<Column<any>[]>(() => [
    { key: 'po_code', header: 'Mã PO', render: (val) => <span className="font-medium text-blue-700">{val as string}</span> },
    { key: 'vendor_name', header: 'Nhà Cung Cấp', render: (val) => <span className="font-medium">{val as string || '---'}</span> },
    { key: 'order_date', header: 'Ngày Đặt', render: (val) => <span className="text-muted-foreground">{val as string}</span> },
    { key: 'expected_date', header: 'Ngày Dự Kiến', render: (val) => <span className="text-muted-foreground">{val as string || '---'}</span> },
    { key: 'total_amount', header: 'Tổng Giá Trị', align: 'right', render: (val) => <span className="font-bold">{(val as number || 0).toLocaleString()}đ</span> },
    { key: 'status', header: 'Trạng Thái', align: 'center', render: (val) => statusBadge(val as string) },
    { key: 'notes', header: 'Ghi Chú', render: (val) => <span className="text-muted-foreground text-sm max-w-[200px] truncate block">{val as string || '---'}</span> },
    { key: 'actions', header: 'Thao Tác', align: 'right', render: (_, row) => (
      <div className="flex justify-end gap-1">
        {row.status === 'pending' ? (
          <>
            <Button size="sm" variant="outline" className="h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange(row.id, 'completed')}>
              <Check className="w-3 h-3 mr-1" /> Duyệt
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => handleStatusChange(row.id, 'cancelled')}>
              <X className="w-3 h-3 mr-1" /> Hủy
            </Button>
          </>
        ) : (
          <span className="text-xs text-slate-400 italic">Đã xử lý</span>
        )}
      </div>
    )}
  ], []);

  // Export handlers
  const handleExportExcel = () => {
    const exportData = pos.map((po: any) => ({
      'Mã PO': po.po_code,
      'Nhà Cung Cấp': po.vendor_name || '',
      'Ngày Đặt': po.order_date,
      'Ngày Dự Kiện': po.expected_date || '',
      'Tổng Giá Trị (VNĐ)': po.total_amount,
      'Trạng Thái': po.status === 'pending' ? 'Chờ duyệt' : po.status === 'completed' ? 'Đã nhập' : 'Đã hủy',
      'Ghi Chú': po.notes || '',
    }));
    exportToExcel(exportData, `DonMuaSam_${new Date().toISOString().slice(0,10)}`, 'Đơn Mua Sắm');
    toast({ title: "Xuất Excel", description: "Đã tải file Excel thành công." });
  };

  const handleExportCSV = () => {
    const exportData = pos.map((po: any) => ({
      'Mã PO': po.po_code,
      'Nhà Cung Cấp': po.vendor_name || '',
      'Ngày Đặt': po.order_date,
      'Tổng Giá Trị': po.total_amount,
      'Trạng Thái': po.status === 'pending' ? 'Chờ duyệt' : po.status === 'completed' ? 'Đã nhập' : 'Đã hủy',
    }));
    exportToCSV(exportData, `DonMuaSam_${new Date().toISOString().slice(0,10)}`);
    toast({ title: "Xuất CSV", description: "Đã tải file CSV thành công." });
  };

  const handlePrint = () => {
    const headers = ['Mã PO', 'Nhà Cung Cấp', 'Ngày Đặt', 'Ngày Dự Kiện', 'Tổng Giá Trị', 'Trạng Thái'];
    const rows = pos.map((po: any) => [
      po.po_code,
      po.vendor_name || '',
      po.order_date,
      po.expected_date || '---',
      po.total_amount?.toLocaleString() + 'đ',
      po.status === 'pending' ? 'Chờ duyệt' : po.status === 'completed' ? 'Đã nhập' : 'Đã hủy',
    ]);
    printTable('BÁO CÁO ĐƠN MUA SẮM VẬT TƯ', headers, rows);
  };

  const totalPending = pos.filter((p: any) => p.status === 'pending').length;
  const totalCompleted = pos.filter((p: any) => p.status === 'completed').length;
  const totalValue = pos.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-2 fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Đơn Yêu Cầu Mua Sắm (PO)</h2>
          <p className="text-sm text-muted-foreground">Theo dõi và quản lý việc đặt mua vật tư từ nhà cung cấp</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber-50/60 border-amber-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{totalPending}</div>
            <div className="text-xs text-amber-600 font-medium">Đang chờ duyệt</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/60 border-emerald-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{totalCompleted}</div>
            <div className="text-xs text-emerald-600 font-medium">Đã hoàn thành</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/60 border-blue-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{totalValue.toLocaleString()}đ</div>
            <div className="text-xs text-blue-600 font-medium">Tổng giá trị PO</div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Toolbar Row */}
      <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center justify-between bg-muted/10 p-2 rounded-lg border">
        {/* Left Side: Search */}
        <div className="flex flex-col sm:flex-row flex-1 w-full xl:w-auto gap-2">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã PO hoặc NCC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 bg-background"
            />
          </div>
        </div>

        {/* Right Side: Actions (Compact) */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto max-w-full pt-1 xl:pt-0 w-full xl:w-auto justify-end">
          <ColumnChooser
            columns={columns.map(c => ({ key: String(c.key), header: c.header }))}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
            storageKey="purchasing_tab_columns"
            defaultRequiredKeys={['po_code', 'vendor_name']}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600">
                <FileSpreadsheet className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2 text-slate-600" /> In báo cáo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={() => setCreateModalOpen(true)} className="h-8 gap-1 ml-1 bg-slate-800 hover:bg-slate-900 text-white shadow-sm">
            <PlusCircle className="w-4 h-4 mr-1 text-white" /> Tạo Yêu Cầu Mới
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <DataTable
          data={filteredPos}
          columns={columns.filter(c => visibleColumns.includes(String(c.key)))}
          hideToolbar={true}
          isLoading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-3 pt-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">Đang tải đơn mua sắm...</div>
        ) : filteredPos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50">Không tìm thấy đơn mua sắm nào</div>
        ) : (
          filteredPos.map((po: any) => (
            <div key={po.id} className="bg-white p-4 rounded-xl border shadow-sm border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg text-blue-700">{po.po_code}</div>
                  <div className="text-sm font-medium text-slate-800">{po.vendor_name || '---'}</div>
                </div>
                <div>{statusBadge(po.status)}</div>
              </div>
              <div className="flex items-center justify-between mb-3 text-sm">
                <div>
                  <p className="text-slate-500">Ngày đặt</p>
                  <p className="font-medium text-slate-800">{po.order_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Tổng giá trị</p>
                  <p className="font-bold text-slate-800 text-lg">{(po.total_amount || 0).toLocaleString()}đ</p>
                </div>
              </div>
              {po.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-3 border-t mt-3">
                  <Button size="sm" variant="outline" className="h-8 text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => handleStatusChange(po.id, 'cancelled')}>
                    <X className="w-4 h-4 mr-1" /> Hủy
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange(po.id, 'completed')}>
                    <Check className="w-4 h-4 mr-1" /> Duyệt
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create PO Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg border-t-4 border-t-blue-500">
          <DialogHeader><DialogTitle className="flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-blue-600" /> Tạo Đề Xuất Mua Sắm Mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã PO (*)</Label>
                <Input placeholder="PO-2026-001" value={formData.po_code} onChange={e => setFormData({...formData, po_code: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Nhà Cung Cấp (*)</Label>
                <Input placeholder="Công ty TNHH ABC" value={formData.vendor_name} onChange={e => setFormData({...formData, vendor_name: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày Đặt Hàng</Label>
                <Input type="date" value={formData.order_date} onChange={e => setFormData({...formData, order_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Ngày Dự Kiến Giao</Label>
                <Input type="date" value={formData.expected_date} onChange={e => setFormData({...formData, expected_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tổng Giá Trị Đơn Hàng (VNĐ)</Label>
              <Input type="number" placeholder="0" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Ghi Chú / Chi Tiết Đơn Hàng</Label>
              <Input placeholder="10 lốp Michelin 11R22.5, 5 bộ lọc dầu..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <Button onClick={handleCreatePO} className="w-full mt-4 bg-blue-600 hover:bg-blue-700" disabled={createPO.isPending}>
              {createPO.isPending ? "Đang lưu..." : "Tạo Đề Xuất Mua Sắm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

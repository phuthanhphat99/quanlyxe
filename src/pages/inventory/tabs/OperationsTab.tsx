import React, { useState } from 'react';
import { useInventoryItems, useCreateInventoryItem, useCreateTransaction, useCreateTire } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ArrowDownToLine, ArrowUpToLine, Search, FileSpreadsheet, Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToCSV, printTable } from '@/lib/export-utils';
import { ExcelImportDialog, ImportColumn } from "@/components/shared/ExcelImportDialog";
import { ExcelFilter } from "@/components/vehicles/ExcelFilter";
import { ColumnChooser } from "@/components/vehicles/ColumnChooser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function OperationsTab() {
  const { data: items = [], isLoading } = useInventoryItems();
  const createItem = useCreateInventoryItem();
  const createTransaction = useCreateTransaction();
  const createTire = useCreateTire();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'item_code', 'name', 'category', 'current_stock', 'unit', 'average_cost', 'location'
  ]);
  
  // Modals state
  const [isAddItemModalOpen, setAddItemModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [importExcelDialogOpen, setImportExcelDialogOpen] = useState(false);
  
  const importColumns: ImportColumn[] = [
    { key: 'item_code', header: 'Mã Vật Tư/Lốp', required: true },
    { key: 'name', header: 'Tên Vật Tư/Lốp', required: true },
    { key: 'category', header: 'Danh Mục', required: true },
    { key: 'unit', header: 'Đơn Vị', required: true },
    { key: 'min_stock_level', header: 'Tồn Tối Thiểu', type: 'number' },
    { key: 'current_stock', header: 'Tồn Kho', type: 'number', required: true },
    { key: 'average_cost', header: 'Đơn Giá TB', type: 'number' },
    { key: 'location', header: 'Vị Trí' },
  ];

  const handleExcelImport = async (data: any[]) => {
    try {
      let importedCount = 0;
      for (const row of data) {
        if (!row.item_code || !row.name) continue;
        createItem.mutate({
          item_code: String(row.item_code),
          name: String(row.name),
          category: String(row.category || 'Lốp Xe'),
          unit: String(row.unit || 'Cái'),
          min_stock_level: Number(row.min_stock_level) || 5,
          current_stock: Number(row.current_stock) || 0,
          average_cost: Number(row.average_cost) || 0,
          total_value: (Number(row.current_stock) || 0) * (Number(row.average_cost) || 0),
          location: String(row.location || '')
        });
        importedCount++;
      }
      toast({ title: "Nhập Excel thành công", description: `Đã xếp hàng thêm ${importedCount} mã vật tư/lốp.` });
    } catch (error) {
      toast({ title: "Lỗi nhập Excel", description: "Đã có lỗi xảy ra", variant: "destructive" });
    }
  };

  // Forms state
  const [itemFormData, setItemFormData] = useState({
    item_code: '', name: '', category: 'Lốp Xe', unit: 'Cái', min_stock_level: '5',
    current_stock: '0', average_cost: '0', location: ''
  });

  const [transactionData, setTransactionData] = useState({
    item_id: '', quantity: '', unit_price: '', notes: '', reference_id: '', 
    // Cho Lốp xe (nếu category là Lốp)
    generate_tires: false,
    tire_brand: '', tire_size: '11R22.5'
  });

  const handleCreateItem = () => {
    if (!itemFormData.item_code || !itemFormData.name) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập mã và tên", variant: "destructive" });
      return;
    }
    if (!/^(LOP-\d{4}-\d+|LOP\d{4}|LOP-\d{4}|VT-\d{4}-\d+|VT\d{4}|VT-\d{4})$/.test(itemFormData.item_code)) {
      toast({ title: "Sai định dạng mã", description: "Mã sai định dạng (VD: LOP-2405-01 hoặc VT-2405-01)", variant: "destructive" });
      return;
    }
    createItem.mutate({
      item_code: itemFormData.item_code,
      name: itemFormData.name,
      category: itemFormData.category,
      unit: itemFormData.unit,
      min_stock_level: Number(itemFormData.min_stock_level),
      current_stock: Number(itemFormData.current_stock),
      average_cost: Number(itemFormData.average_cost),
      total_value: Number(itemFormData.current_stock) * Number(itemFormData.average_cost),
      location: itemFormData.location
    }, {
      onSuccess: () => {
        setAddItemModalOpen(false);
        setItemFormData({ item_code: '', name: '', category: 'Lốp Xe', unit: 'Cái', min_stock_level: '5', current_stock: '0', average_cost: '0', location: '' });
      }
    });
  };

  const handleAddClick = () => {
    let nextCode = `LOP-2405-01`;
    if (items && items.length > 0) {
      const yymm = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7);
      nextCode = `LOP-${yymm}-${String(items.length + 1).padStart(2, '0')}`;
    }
    setItemFormData({
      item_code: nextCode, name: '', category: 'Lốp Xe', unit: 'Cái', min_stock_level: '5',
      current_stock: '0', average_cost: '0', location: ''
    });
    setAddItemModalOpen(true);
  };

  const handleTransaction = (type: 'IN_NEW' | 'OUT_REPAIR') => {
    if (!transactionData.item_id || !transactionData.quantity) {
      toast({ title: "Lỗi", description: "Vui lòng chọn vật tư và nhập số lượng", variant: "destructive" });
      return;
    }

    const qty = Number(transactionData.quantity);
    if (qty <= 0) {
      toast({ title: "Lỗi", description: "Số lượng phải lớn hơn 0", variant: "destructive" });
      return;
    }

    // Kiểm tra tồn kho khi xuất
    if (type === 'OUT_REPAIR') {
      const currentItem = items.find(i => i.id === transactionData.item_id);
      if (currentItem && qty > currentItem.current_stock) {
        toast({ title: "Không đủ tồn kho", description: `Tồn kho hiện tại: ${currentItem.current_stock} ${currentItem.unit}. Không thể xuất ${qty}.`, variant: "destructive" });
        return;
      }
    }

    const price = Number(transactionData.unit_price) || 0;

    createTransaction.mutate({
      type,
      item_id: transactionData.item_id,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
      notes: transactionData.notes,
      reference_id: transactionData.reference_id,
      transaction_code: `TXN-${Date.now().toString().slice(-6)}`,
      transaction_date: new Date().toISOString()
    }, {
      onSuccess: async () => {
        // Nếu là Nhập Kho và chọn 'tạo mã lốp' - tạo tuần tự để tránh race condition
        if (type === 'IN_NEW' && transactionData.generate_tires) {
          for (let i = 0; i < qty; i++) {
            try {
              await createTire.mutateAsync({
                item_id: transactionData.item_id,
                serial_number: `SN-${Date.now().toString().slice(-6)}-${i+1}`,
                brand: transactionData.tire_brand,
                size: transactionData.tire_size,
                current_status: 'IN_STOCK',
                total_km_run: 0
              });
            } catch (e) {
              console.error(`Failed to create tire ${i+1}:`, e);
            }
          }
        }
        setImportModalOpen(false);
        setExportModalOpen(false);
        setTransactionData({ item_id: '', quantity: '', unit_price: '', notes: '', reference_id: '', generate_tires: false, tire_brand: '', tire_size: '11R22.5' });
      }
    });
  };

  const filteredItems = React.useMemo(() => {
    return items.filter(i => {
      const matchSearch = (i.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.item_code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      
      if (activeFilters.category && activeFilters.category.length > 0) {
        if (!activeFilters.category.includes(i.category)) return false;
      }
      
      if (activeFilters.stock_status && activeFilters.stock_status.length > 0) {
        const isLow = i.current_stock < i.min_stock_level;
        if (activeFilters.stock_status.includes('low') && !isLow) return false;
        if (activeFilters.stock_status.includes('normal') && isLow) return false;
      }

      return true;
    });
  }, [items, searchTerm, activeFilters]);

  const columns = React.useMemo<Column<any>[]>(() => [
    { key: 'item_code', header: 'Mã VT' },
    { key: 'name', header: 'Tên Vật Tư', render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{val as string}</span>
        {row.current_stock < row.min_stock_level && (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] leading-none py-0.5">Sắp hết</Badge>
        )}
      </div>
    ) },
    { key: 'category', header: 'Danh Mục' },
    { key: 'current_stock', header: 'Tồn Kho', align: 'right', render: (val) => (
      <span className="font-bold text-lg text-slate-700">{(val as number).toLocaleString()}</span>
    ) },
    { key: 'unit', header: 'Đơn Vị', render: (val) => <span className="text-muted-foreground">{val as string}</span> },
    { key: 'average_cost', header: 'Đơn Giá TB', align: 'right', render: (val) => <span className="font-medium">{(val as number).toLocaleString()}đ</span> },
    { key: 'location', header: 'Vị Trí Kho', render: (val) => <span className="text-muted-foreground">{(val as string) || '---'}</span> },
  ], []);

  const selectedItem = items.find(i => i.id === transactionData.item_id);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-2 fade-in duration-300">
      {/* Unified Toolbar Row */}
      <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center justify-between bg-muted/10 p-2 rounded-lg border">
        {/* Left Side: Search + Filters */}
        <div className="flex flex-col sm:flex-row flex-1 w-full xl:w-auto gap-2">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã hoặc tên vật tư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 bg-background"
            />
          </div>
          <div className="flex-1 overflow-x-auto pb-1 sm:pb-0">
            <ExcelFilter
              data={items}
              filterConfigs={[
                { key: 'category', label: 'Danh mục', type: 'multi-select', options: Array.from(new Set(items.map(i => i.category))).map(c => ({ label: c as string, value: c as string })) },
                { key: 'stock_status', label: 'Tồn kho', type: 'multi-select', options: [{ label: 'Đang đủ', value: 'normal' }, { label: 'Sắp hết', value: 'low' }] },
              ]}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
          </div>
        </div>

        {/* Right Side: Actions (Compact) */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto max-w-full pt-1 xl:pt-0 w-full xl:w-auto justify-end">
          <Button size="sm" onClick={() => setImportModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 shadow-sm">
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Nhập Kho
          </Button>
          <Button size="sm" onClick={() => setExportModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white h-8 px-3 shadow-sm">
            <ArrowUpToLine className="w-4 h-4 mr-2" /> Xuất Kho
          </Button>

          <div className="w-px h-6 bg-border mx-1" />
          
          <ColumnChooser
            columns={columns.map(c => ({ key: String(c.key), header: c.header }))}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
            storageKey="operations_tab_columns"
            defaultRequiredKeys={['item_code', 'name']}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600">
                <FileSpreadsheet className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const exportData = items.map(i => ({ 'Mã VT': i.item_code, 'Tên Vật Tư': i.name, 'Danh Mục': i.category, 'Tồn Kho': i.current_stock, 'Đơn Vị': i.unit, 'Đơn Giá TB': i.average_cost, 'Vị Trí': i.location || '' }));
                exportToExcel(exportData, `TonKho_${new Date().toISOString().slice(0,10)}`, 'Tồn Kho');
                toast({ title: 'Xuất Excel', description: 'Đã tải file thành công.' });
              }}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const exportData = items.map(i => ({ 'Mã VT': i.item_code, 'Tên': i.name, 'Tồn': i.current_stock, 'ĐVT': i.unit }));
                exportToCSV(exportData, `TonKho_${new Date().toISOString().slice(0,10)}`);
                toast({ title: 'Xuất CSV', description: 'Đã tải file thành công.' });
              }}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                printTable('BÁO CÁO TỒN KHO VẬT TƯ', ['Mã VT', 'Tên Vật Tư', 'Danh Mục', 'Tồn Kho', 'ĐVT', 'Đơn Giá TB', 'Vị Trí'],
                  items.map(i => [i.item_code, i.name, i.category, String(i.current_stock), i.unit, i.average_cost.toLocaleString() + 'đ', i.location || '---']));
              }}>
                <Printer className="w-4 h-4 mr-2 text-slate-600" /> In báo cáo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={() => setImportExcelDialogOpen(true)} className="h-8 gap-1 ml-1" variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-1 text-slate-500" />
            Nhập Excel
          </Button>
          <Button size="sm" onClick={handleAddClick} className="h-8 gap-1 ml-1" variant="outline">
            <PlusCircle className="w-4 h-4 mr-1 text-slate-500" />
            Tạo Mã Vật Tư/Lốp
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <DataTable
          data={filteredItems}
          columns={columns.filter(c => visibleColumns.includes(String(c.key)))}
          hideToolbar={true}
          isLoading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-3 pt-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">Đang tải danh mục vật tư...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50">Không tìm thấy vật tư phù hợp</div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl border shadow-sm border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg text-slate-800">{item.name}</div>
                  <div className="text-sm font-medium text-blue-600">{item.item_code} • {item.category}</div>
                </div>
                {item.current_stock < item.min_stock_level ? (
                  <div className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-rose-100 text-rose-700 border-rose-200">Sắp hết</div>
                ) : (
                  <div className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-100 text-green-700 border-green-200">Sẵn sàng</div>
                )}
              </div>
              <div className="flex items-center gap-4 mb-3 text-sm">
                <div>
                  <p className="text-slate-500">Tồn kho</p>
                  <p className="font-bold text-slate-800">{item.current_stock.toLocaleString()} {item.unit}</p>
                </div>
                <div>
                  <p className="text-slate-500">Đơn giá</p>
                  <p className="font-bold text-slate-800">{item.average_cost.toLocaleString()}đ</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL: NHẬP EXCEL --- */}
      <ExcelImportDialog
        isOpen={importExcelDialogOpen}
        onClose={() => setImportExcelDialogOpen(false)}
        onImport={handleExcelImport}
        entityName="Vật tư / Lốp"
        columns={importColumns}
        sampleData={[
          {
            item_code: 'LOP-2405-01',
            name: 'Lốp Michelin 11R22.5',
            category: 'Lốp Xe',
            unit: 'Cái',
            min_stock_level: 10,
            current_stock: 20,
            average_cost: 6500000,
            location: 'Kho Lốp'
          }
        ]}
      />

      {/* --- MODAL: TẠO MÃ VẬT TƯ --- */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tạo Mã Danh Mục Vật Tư Mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mã Vật Tư (*)</Label><Input placeholder="VT-001" value={itemFormData.item_code} onChange={e => setItemFormData({...itemFormData, item_code: e.target.value})} /></div>
              <div className="space-y-2"><Label>Danh Mục</Label><Input value={itemFormData.category} onChange={e => setItemFormData({...itemFormData, category: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Tên Vật Tư (*)</Label><Input placeholder="Lốp Nhập Khẩu..." value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>Đơn vị tính</Label><Input value={itemFormData.unit} onChange={e => setItemFormData({...itemFormData, unit: e.target.value})} /></div>
              <div className="space-y-2"><Label>Tồn Tối Thiểu</Label><Input type="number" value={itemFormData.min_stock_level} onChange={e => setItemFormData({...itemFormData, min_stock_level: e.target.value})} /></div>
            </div>
             <div className="space-y-2"><Label>Vị Trí Định Danh Trong Kho</Label><Input placeholder="Kệ A2-Tầng 3" value={itemFormData.location} onChange={e => setItemFormData({...itemFormData, location: e.target.value})} /></div>
            <Button onClick={handleCreateItem} className="w-full mt-4" disabled={createItem.isPending}>{createItem.isPending ? "Đang lưu..." : "Xác nhận tạo mã"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: NHẬP KHO --- */}
      <Dialog open={isImportModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-md border-t-4 border-t-emerald-500">
          <DialogHeader><DialogTitle className="flex items-center"><ArrowDownToLine className="w-5 h-5 mr-2 text-emerald-600"/> Phiếu Nhập Kho</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chọn Vật Tư (*)</Label>
              <Select value={transactionData.item_id} onValueChange={(val) => setTransactionData({...transactionData, item_id: val})}>
                <SelectTrigger><SelectValue placeholder="Chọn từ danh sách mã vật tư..."/></SelectTrigger>
                <SelectContent>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.item_code} - {i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Số Lượng Thực Nhập (*)</Label><Input type="number" placeholder="Ví dụ: 10" value={transactionData.quantity} onChange={e => setTransactionData({...transactionData, quantity: e.target.value})} /></div>
              <div className="space-y-2"><Label>Đơn Giá Nhập (VNĐ)</Label><Input type="number" placeholder="0" value={transactionData.unit_price} onChange={e => setTransactionData({...transactionData, unit_price: e.target.value})} /></div>
            </div>
            
            {/* Logic thông minh: nếu là Lốp, tự sinh seri */}
            {selectedItem?.category?.toLowerCase().includes('lốp') && Number(transactionData.quantity) > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-md space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="gen_tire" className="rounded" checked={transactionData.generate_tires} onChange={(e) => setTransactionData({...transactionData, generate_tires: e.target.checked})} />
                  <label htmlFor="gen_tire" className="text-sm font-medium text-blue-800">Tự động sinh mã Serial Quản Lý cho {transactionData.quantity} lốp này</label>
                </div>
                {transactionData.generate_tires && (
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1"><Label className="text-xs text-blue-700">Hãng</Label><Input className="h-8 text-sm" value={transactionData.tire_brand} onChange={e => setTransactionData({...transactionData, tire_brand: e.target.value})} /></div>
                     <div className="space-y-1"><Label className="text-xs text-blue-700">Kích Cỡ</Label><Input className="h-8 text-sm" value={transactionData.tire_size} onChange={e => setTransactionData({...transactionData, tire_size: e.target.value})} /></div>
                   </div>
                )}
              </div>
            )}

            <div className="space-y-2"><Label>Số Hóa Đơn / Phiếu Xuất Kho Của NCC</Label><Input placeholder="HD-2024-..." value={transactionData.reference_id} onChange={e => setTransactionData({...transactionData, reference_id: e.target.value})} /></div>
            <div className="space-y-2"><Label>Ghi Chú Nhập Kho</Label><Input value={transactionData.notes} onChange={e => setTransactionData({...transactionData, notes: e.target.value})} /></div>
            <Button onClick={() => handleTransaction('IN_NEW')} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? "Đang xử lý..." : "Xác Nhận Nhập Kho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: XUẤT KHO --- */}
      <Dialog open={isExportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md border-t-4 border-t-rose-500">
          <DialogHeader><DialogTitle className="flex items-center"><ArrowUpToLine className="w-5 h-5 mr-2 text-rose-600"/> Phiếu Xuất Kho Khác (Sửa Chữa)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground mb-2 italic">* Lưu ý: Để xuất lốp gắn lên xe, vui lòng qua tab "Vòng Đời Lốp" để gắn theo Serial.</p>
            <div className="space-y-2">
              <Label>Chọn Vật Tư (*)</Label>
              <Select value={transactionData.item_id} onValueChange={(val) => setTransactionData({...transactionData, item_id: val})}>
                <SelectTrigger><SelectValue placeholder="Chọn từ danh sách..."/></SelectTrigger>
                <SelectContent>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.item_code} - {i.name} (Tồn: {i.current_stock})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Số Lượng Cần Xuất (*)</Label><Input type="number" placeholder="Ví dụ: 2" value={transactionData.quantity} onChange={e => setTransactionData({...transactionData, quantity: e.target.value})} /></div>
            <div className="space-y-2"><Label>Lý do xuất / Mã tham chiếu</Label><Input placeholder="Xuất sửa chữa ngoại tuyến..." value={transactionData.notes} onChange={e => setTransactionData({...transactionData, notes: e.target.value})} /></div>
            <Button onClick={() => handleTransaction('OUT_REPAIR')} className="w-full mt-4 bg-rose-600 hover:bg-rose-700" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? "Đang xử lý..." : "Xác Nhận Xuất Kho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

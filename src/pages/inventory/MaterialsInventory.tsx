import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Box, TrendingUp, Search, PlusCircle, ArrowDownToLine, ArrowUpToLine,
  FileSpreadsheet, Printer, AlertTriangle, Coins, Package, History,
  BarChart, Filter
} from "lucide-react";
import { useInventoryItems, useCreateInventoryItem, useCreateTransaction, useInventoryTransactions } from '@/hooks/useInventory';
import { exportToExcel, exportToCSV, printTable } from '@/lib/export-utils';
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column } from "@/components/shared/DataTable";
import { ExcelFilter } from "@/components/vehicles/ExcelFilter";
import { ColumnChooser } from "@/components/vehicles/ColumnChooser";
import { PageHeader } from "@/components/shared/PageHeader";

// Category keywords for filtering materials/spare parts
const MATERIAL_CATEGORIES = ['Vật Tư', 'Phụ Tùng', 'Lọc', 'Vật tư', 'phụ tùng'];

function isMaterialCategory(category: string | undefined | null) {
  if (!category) return false;
  // Exclude tire-specific and fuel categories
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes('lốp') || lowerCat.includes('nhiên liệu') || lowerCat.includes('dầu diesel') || lowerCat.includes('ccdc') || lowerCat.includes('công cụ') || lowerCat.includes('dụng cụ')) {
    return false;
  }
  // Include known material categories, or anything not explicitly excluded
  return MATERIAL_CATEGORIES.some(c => lowerCat.includes(c.toLowerCase())) || 
    (!lowerCat.includes('lốp') && !lowerCat.includes('nhiên liệu') && !lowerCat.includes('ccdc'));
}

export default function MaterialsInventory() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: allItems = [], isLoading } = useInventoryItems();
  const { data: allTransactions = [], isLoading: txLoading } = useInventoryTransactions();
  const createItem = useCreateInventoryItem();
  const createTransaction = useCreateTransaction();
  const { toast } = useToast();

  // Filter items specific to materials
  const items = useMemo(() => allItems.filter(i => isMaterialCategory(i.category)), [allItems]);

  // ─── SEARCH & FILTERS ───
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'item_code', 'name', 'category', 'current_stock', 'unit', 'average_cost', 'total_value', 'location'
  ]);

  const filteredItems = useMemo(() => {
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

  // ─── COLUMNS ───
  const columns = useMemo<Column<any>[]>(() => [
    { key: 'item_code', header: 'Mã VT' },
    { key: 'name', header: 'Tên Vật Tư', render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{val as string}</span>
        {row.current_stock < row.min_stock_level && (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] leading-none py-0.5">Sắp hết</Badge>
        )}
      </div>
    ) },
    { key: 'category', header: 'Loại', render: (val) => <Badge variant="secondary" className="text-xs">{val as string}</Badge> },
    { key: 'current_stock', header: 'Tồn Kho', align: 'right', render: (val, row) => (
      <div className="text-right">
        <span className="font-bold text-lg text-slate-700">{(val as number).toLocaleString()}</span>
      </div>
    ) },
    { key: 'unit', header: 'Đơn Vị', render: (val) => <span className="text-muted-foreground">{val as string}</span> },
    { key: 'average_cost', header: 'Đơn Giá TB', align: 'right', render: (val) => <span className="font-medium">{(val as number).toLocaleString()}đ</span> },
    { key: 'total_value', header: 'Thành Tiền', align: 'right', render: (val) => <span className="font-medium text-orange-700">{((val as number) || 0).toLocaleString()}đ</span> },
    { key: 'location', header: 'Vị Trí', render: (val) => <span className="text-muted-foreground">{(val as string) || '---'}</span> },
  ], []);

  // ─── TRANSACTIONS (filtered by material items) ───
  const materialItemIds = useMemo(() => new Set(items.map(i => i.id)), [items]);
  const transactions = useMemo(() =>
    allTransactions.filter((t: any) => materialItemIds.has(t.item_id)).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [allTransactions, materialItemIds]
  );

  const [visibleHistoryColumns, setVisibleHistoryColumns] = useState<string[]>([
    'transaction_code', 'date', 'type', 'item', 'quantity', 'unit_price', 'total_price', 'notes'
  ]);

  const historyColumns = useMemo<Column<any>[]>(() => [
    { key: 'transaction_code', header: 'Mã GD', render: (val) => <span className="font-mono text-xs text-slate-600">{val as string}</span> },
    { key: 'date', header: 'Ngày', render: (_, row) => <span className="text-muted-foreground text-sm">{new Date(row.transaction_date || row.created_at).toLocaleDateString('vi-VN')}</span> },
    { key: 'type', header: 'Loại', render: (val) => txTypeLabel(val as string) },
    { key: 'item', header: 'Vật Tư', render: (_, row) => {
      const linkedItem = items.find(i => i.id === row.item_id);
      return <span className="font-medium">{linkedItem?.name || row.item_id}</span>;
    } },
    { key: 'quantity', header: 'Số Lượng', align: 'right', render: (val) => <span className="font-bold">{val as number}</span> },
    { key: 'unit_price', header: 'Đơn Giá', align: 'right', render: (val) => <span>{((val as number) || 0).toLocaleString()}đ</span> },
    { key: 'total_price', header: 'Thành Tiền', align: 'right', render: (val) => <span className="font-medium text-blue-700">{((val as number) || 0).toLocaleString()}đ</span> },
    { key: 'notes', header: 'Ghi Chú', render: (val) => <span className="text-muted-foreground text-sm max-w-[200px] truncate">{val as string || '---'}</span> },
  ], [items]);

  // ─── KPIs ───
  const totalValue = items.reduce((sum, i) => sum + (i.total_value || 0), 0);
  const lowStockItems = items.filter(i => i.current_stock < i.min_stock_level);
  const totalItems = items.length;

  // ─── MODALS ───
  const [isAddItemModalOpen, setAddItemModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const [itemFormData, setItemFormData] = useState({
    item_code: '', name: '', category: 'Vật Tư', unit: 'Cái', min_stock_level: '5',
    current_stock: '0', average_cost: '0', location: ''
  });

  const [transactionData, setTransactionData] = useState({
    item_id: '', quantity: '', unit_price: '', notes: '', reference_id: ''
  });

  const handleCreateItem = () => {
    if (!itemFormData.item_code || !itemFormData.name) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập mã và tên vật tư", variant: "destructive" });
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
        setItemFormData({ item_code: '', name: '', category: 'Vật Tư', unit: 'Cái', min_stock_level: '5', current_stock: '0', average_cost: '0', location: '' });
      }
    });
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
      transaction_code: `VT-${Date.now().toString().slice(-6)}`,
      transaction_date: new Date().toISOString()
    }, {
      onSuccess: () => {
        setImportModalOpen(false);
        setExportModalOpen(false);
        setTransactionData({ item_id: '', quantity: '', unit_price: '', notes: '', reference_id: '' });
      }
    });
  };

  // ─── EXPORT HANDLERS ───
  const handleExportExcel = () => {
    const exportData = filteredItems.map(i => ({
      'Mã VT': i.item_code, 'Tên Vật Tư': i.name, 'Danh Mục': i.category,
      'Tồn Kho': i.current_stock, 'Đơn Vị': i.unit, 'Đơn Giá TB': i.average_cost,
      'Tổng Giá Trị': i.total_value, 'Vị Trí': i.location || ''
    }));
    exportToExcel(exportData, `KhoVatTu_${new Date().toISOString().slice(0, 10)}`, 'Kho Vật Tư');
    toast({ title: 'Xuất Excel', description: 'Đã tải file thành công.' });
  };

  const handleExportCSV = () => {
    const exportData = filteredItems.map(i => ({
      'Mã VT': i.item_code, 'Tên': i.name, 'Tồn': i.current_stock, 'ĐVT': i.unit
    }));
    exportToCSV(exportData, `KhoVatTu_${new Date().toISOString().slice(0, 10)}`);
    toast({ title: 'Xuất CSV', description: 'Đã tải file thành công.' });
  };

  const handlePrint = () => {
    printTable('BÁO CÁO TỒN KHO VẬT TƯ - PHỤ TÙNG',
      ['Mã VT', 'Tên Vật Tư', 'Danh Mục', 'Tồn Kho', 'ĐVT', 'Đơn Giá TB', 'Vị Trí'],
      filteredItems.map(i => [i.item_code, i.name, i.category, String(i.current_stock), i.unit, i.average_cost.toLocaleString() + 'đ', i.location || '---']));
  };

  const txTypeLabel = (type: string) => {
    switch (type) {
      case 'IN_NEW': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Nhập mới</Badge>;
      case 'IN_RETURN': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Trả về</Badge>;
      case 'OUT_INSTALL': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Xuất lắp</Badge>;
      case 'OUT_REPAIR': return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Xuất sửa</Badge>;
      case 'OUT_SCRAP': return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Thanh lý</Badge>;
      case 'ADJUSTMENT': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Điều chỉnh</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20 p-2 sm:p-4">
      <PageHeader 
        title="Kho Vật Tư & Phụ Tùng" 
        description="Quản lý nhập xuất tồn kho vật tư, phụ tùng xe tải" 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:flex sm:flex-nowrap justify-start h-auto gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="dashboard" className="sm:flex-none">
            <TrendingUp className="w-4 h-4 mr-2" /> Tổng Quan
          </TabsTrigger>
          <TabsTrigger value="operations" className="sm:flex-none">
            <Box className="w-4 h-4 mr-2" /> Nhập / Xuất
          </TabsTrigger>
          <TabsTrigger value="history" className="sm:flex-none">
            <History className="w-4 h-4 mr-2" /> Lịch Sử
          </TabsTrigger>
          <TabsTrigger value="reports" className="sm:flex-none">
            <BarChart className="w-4 h-4 mr-2" /> Báo Cáo
          </TabsTrigger>
        </TabsList>

        {/* TAB: TỔNG QUAN */}
        <TabsContent value="dashboard" className="m-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-blue-100/50 text-blue-700 rounded-2xl">
                  <Coins className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng Giá Trị Tồn Kho</p>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    {totalValue.toLocaleString()} đ
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-emerald-100/50 text-emerald-700 rounded-2xl">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng Mặt Hàng</p>
                  <h3 className="text-2xl font-bold text-emerald-700">{totalItems} <span className="text-sm font-normal text-emerald-500">mặt hàng</span></h3>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-rose-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('operations')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-rose-100/50 text-rose-700 rounded-2xl">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cảnh Báo Sắp Hết</p>
                  <h3 className="text-2xl font-bold text-rose-700">{lowStockItems.length} <span className="text-sm font-normal text-rose-500">vật tư</span></h3>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('history')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-amber-100/50 text-amber-700 rounded-2xl">
                  <History className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Giao Dịch Gần Đây</p>
                  <h3 className="text-2xl font-bold text-amber-700">{transactions.length} <span className="text-sm font-normal text-amber-500">phiếu</span></h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Vật tư cần nhập gấp
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {lowStockItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Kho vật tư đang dồi dào, không có cảnh báo.</div>
                ) : (
                  <div className="divide-y">
                    {lowStockItems.slice(0, 5).map(item => (
                      <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div>
                          <h4 className="font-medium text-slate-800">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">Mã: {item.item_code} • Kho: {item.location || 'Chưa XĐ'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-rose-600 font-bold">{item.current_stock} {item.unit}</div>
                          <div className="text-xs text-slate-500">Tối thiểu: {item.min_stock_level}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" /> Tồn kho theo danh mục
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                    {Array.from(new Set(items.map(i => i.category))).map(cat => {
                      const catItems = items.filter(i => i.category === cat);
                      const catValue = catItems.reduce((sum, i) => sum + (i.total_value || 0), 0);
                      return (
                        <div key={cat} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div>
                            <h4 className="font-medium text-slate-800">{cat}</h4>
                            <p className="text-xs text-muted-foreground">{catItems.length} mặt hàng</p>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-700 font-bold">{catValue.toLocaleString()} đ</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: NHẬP / XUẤT */}
        <TabsContent value="operations" className="m-0 space-y-4">
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
            <div className="flex flex-wrap items-center gap-1 w-full xl:w-auto justify-end">
              <Button size="sm" onClick={() => setImportModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2 sm:px-3 shadow-sm">
                <ArrowDownToLine className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Nhập Kho</span>
              </Button>
              <Button size="sm" onClick={() => setExportModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white h-8 px-2 sm:px-3 shadow-sm">
                <ArrowUpToLine className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Xuất Kho</span>
              </Button>
              <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
              <ColumnChooser
                columns={columns.map(c => ({ key: String(c.key), header: c.header }))}
                visibleColumns={visibleColumns}
                onVisibilityChange={setVisibleColumns}
                storageKey="materials_inventory_columns"
                defaultRequiredKeys={['item_code', 'name']}
              />
            </div>
          </div>
          
          <div className="hidden md:block">
            <DataTable
              data={filteredItems}
              columns={columns.filter(c => visibleColumns.includes(String(c.key)))}
              hideToolbar={true}
              isLoading={isLoading}
              onRowClick={(item) => setSelectedItem(item)}
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-3 pt-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Đang tải danh mục...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50">Không tìm thấy vật tư phù hợp</div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl border shadow-sm border-slate-200" onClick={() => setSelectedItem(item)}>
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
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: LỊCH SỬ GIAO DỊCH */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="history" className="m-0 space-y-6">
          <div className="animate-in slide-in-from-right-2 fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Lịch Sử Giao Dịch Kho Vật Tư</h2>
                <p className="text-sm text-muted-foreground">Theo dõi toàn bộ phiếu nhập/xuất kho vật tư & phụ tùng</p>
              </div>
              <ColumnChooser
                columns={historyColumns.map(c => ({ key: String(c.key), header: c.header }))}
                visibleColumns={visibleHistoryColumns}
                onVisibilityChange={setVisibleHistoryColumns}
                storageKey="materials_history_columns"
                defaultRequiredKeys={['transaction_code', 'item']}
              />
            </div>

            <div className="hidden md:block">
              <DataTable
                data={transactions}
                columns={historyColumns.filter(c => visibleHistoryColumns.includes(String(c.key)))}
                hideToolbar={true}
                isLoading={txLoading}
              />
            </div>

            {/* Mobile History View */}
            <div className="md:hidden grid grid-cols-1 gap-3 pt-2">
              {txLoading ? (
                <div className="text-center py-8 text-muted-foreground animate-pulse">Đang tải lịch sử...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-slate-50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-100 rounded-full"><History className="w-10 h-10 text-slate-400" /></div>
                    <p className="font-medium text-slate-700">Chưa có giao dịch nào</p>
                    <p className="text-sm text-muted-foreground">Các phiếu nhập/xuất kho sẽ hiển thị tại đây.</p>
                  </div>
                </div>
              ) : (
                transactions.map((tx: any) => {
                  const linkedItem = items.find(i => i.id === tx.item_id);
                  return (
                    <div key={tx.id} className="bg-white p-4 rounded-xl border shadow-sm border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-slate-800">{linkedItem?.name || tx.item_id}</div>
                        <div>{txTypeLabel(tx.type)}</div>
                      </div>
                      <div className="text-xs text-slate-500 mb-3 flex justify-between">
                        <span className="font-mono text-slate-600">{tx.transaction_code}</span>
                        <span>{new Date(tx.transaction_date || tx.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                        <div>
                          <div className="text-xs text-slate-500">Số lượng</div>
                          <div className="font-bold text-slate-800">{tx.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Thành tiền</div>
                          <div className="font-bold text-blue-700">{(tx.total_price || 0).toLocaleString()}đ</div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: BÁO CÁO */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="reports" className="m-0 space-y-6">
          <div className="animate-in slide-in-from-right-2 fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Báo Cáo Kho Vật Tư</h2>
                <p className="text-sm text-muted-foreground">Phân tích xu hướng nhập/xuất và biến động giá trị tồn kho</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-slate-300 text-slate-700">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất báo cáo
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2 text-slate-600" /> In báo cáo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50/60 border-blue-100">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{totalItems}</div>
                  <div className="text-xs text-blue-600 font-medium">Mặt hàng trong kho</div>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50/60 border-emerald-100">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{totalValue.toLocaleString()}đ</div>
                  <div className="text-xs text-emerald-600 font-medium">Tổng giá trị tồn</div>
                </CardContent>
              </Card>
              <Card className="bg-rose-50/60 border-rose-100">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-rose-700">{lowStockItems.length}</div>
                  <div className="text-xs text-rose-600 font-medium">Sắp hết hàng</div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50/60 border-amber-100">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">{categories.length}</div>
                  <div className="text-xs text-amber-600 font-medium">Nhóm danh mục</div>
                </CardContent>
              </Card>
            </div>

            {/* Category breakdown */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50/80 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-indigo-500" /> Phân Bổ Tồn Kho Theo Danh Mục
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {categories.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Chưa có dữ liệu để phân tích.</div>
                ) : (
                  <div className="divide-y">
                    {categories.map(cat => {
                      const catItems = items.filter(i => i.category === cat);
                      const catValue = catItems.reduce((sum, i) => sum + (i.total_value || 0), 0);
                      const catStock = catItems.reduce((sum, i) => sum + (i.current_stock || 0), 0);
                      const percent = totalValue > 0 ? ((catValue / totalValue) * 100).toFixed(1) : '0';
                      return (
                        <div key={cat} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h4 className="font-medium text-slate-800">{cat}</h4>
                              <p className="text-xs text-muted-foreground">{catItems.length} mặt hàng • {catStock} đơn vị</p>
                            </div>
                            <div className="text-right">
                              <div className="text-blue-700 font-bold">{catValue.toLocaleString()} đ</div>
                              <div className="text-xs text-slate-500">{percent}% tổng kho</div>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL: TẠO MÃ VẬT TƯ */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tạo Mã Vật Tư Mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mã Vật Tư (*)</Label><Input placeholder="VT-001" value={itemFormData.item_code} onChange={e => setItemFormData({...itemFormData, item_code: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Danh Mục</Label>
                <Select value={itemFormData.category} onValueChange={v => setItemFormData({...itemFormData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vật Tư">Vật Tư</SelectItem>
                    <SelectItem value="Phụ Tùng">Phụ Tùng</SelectItem>
                    <SelectItem value="Lọc">Lọc (Dầu, Gió, Nhớt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Tên Vật Tư (*)</Label><Input placeholder="Lọc dầu Hino 500..." value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Đơn vị tính</Label><Input value={itemFormData.unit} onChange={e => setItemFormData({...itemFormData, unit: e.target.value})} /></div>
              <div className="space-y-2"><Label>Tồn Tối Thiểu</Label><Input type="number" value={itemFormData.min_stock_level} onChange={e => setItemFormData({...itemFormData, min_stock_level: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Vị Trí Kho</Label><Input placeholder="Kệ A2-Tầng 3" value={itemFormData.location} onChange={e => setItemFormData({...itemFormData, location: e.target.value})} /></div>
            <Button onClick={handleCreateItem} className="w-full mt-4" disabled={createItem.isPending}>{createItem.isPending ? "Đang lưu..." : "Xác nhận tạo mã"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL: NHẬP KHO */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={isImportModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-md border-t-4 border-t-emerald-500">
          <DialogHeader><DialogTitle className="flex items-center"><ArrowDownToLine className="w-5 h-5 mr-2 text-emerald-600"/> Phiếu Nhập Kho Vật Tư</DialogTitle></DialogHeader>
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
            <div className="space-y-2"><Label>Số Hóa Đơn / Phiếu NCC</Label><Input placeholder="HD-2024-..." value={transactionData.reference_id} onChange={e => setTransactionData({...transactionData, reference_id: e.target.value})} /></div>
            <div className="space-y-2"><Label>Ghi Chú Nhập Kho</Label><Input value={transactionData.notes} onChange={e => setTransactionData({...transactionData, notes: e.target.value})} /></div>
            <Button onClick={() => handleTransaction('IN_NEW')} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? "Đang xử lý..." : "Xác Nhận Nhập Kho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL: XUẤT KHO */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={isExportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md border-t-4 border-t-rose-500">
          <DialogHeader><DialogTitle className="flex items-center"><ArrowUpToLine className="w-5 h-5 mr-2 text-rose-600"/> Phiếu Xuất Kho Vật Tư</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
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
            <div className="space-y-2"><Label>Lý do xuất / Xe sử dụng</Label><Input placeholder="Xuất cho xe 51C-xxx sửa chữa..." value={transactionData.notes} onChange={e => setTransactionData({...transactionData, notes: e.target.value})} /></div>
            <Button onClick={() => handleTransaction('OUT_REPAIR')} className="w-full mt-4 bg-rose-600 hover:bg-rose-700" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? "Đang xử lý..." : "Xác Nhận Xuất Kho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

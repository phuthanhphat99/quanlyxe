import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Box, Wrench, Package, History, TrendingUp, AlertTriangle, PenTool, ShoppingCart } from "lucide-react";
import { useInventoryItems, useTires } from '@/hooks/useInventory';

// Subcomponents - we will extract these to separate files if needed, but for now they are here
import { DashboardTab } from './tabs/DashboardTab';
import { OperationsTab } from './tabs/OperationsTab';
import { PurchasingTab } from './tabs/PurchasingTab';
import { LifecycleTab } from './tabs/LifecycleTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { PageHeader } from "@/components/shared/PageHeader";

export default function TireInventory() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-4 animate-fade-in pb-20 p-2 sm:p-4">
      <PageHeader 
        title="Quản Lý Vật Tư & Lốp Xe" 
        description="Hệ thống quản lý vòng đời vật tư khép kín: Mua sắm ➔ Nhập kho ➔ Sử dụng ➔ Thanh lý" 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap justify-start h-auto gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="dashboard" className="sm:flex-none">
            <TrendingUp className="w-4 h-4 mr-2" /> Tổng Quan
          </TabsTrigger>
          <TabsTrigger value="operations" className="sm:flex-none">
            <Box className="w-4 h-4 mr-2" /> Nhập / Xuất
          </TabsTrigger>
          <TabsTrigger value="purchasing" className="sm:flex-none">
            <ShoppingCart className="w-4 h-4 mr-2" /> Mua Sắm
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="sm:flex-none">
            <History className="w-4 h-4 mr-2" /> Vòng Đời Lốp
          </TabsTrigger>
          <TabsTrigger value="analytics" className="col-span-2 sm:col-span-1 sm:flex-none">
            <PenTool className="w-4 h-4 mr-2" /> Báo Cáo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="m-0 space-y-4">
          <DashboardTab onNavigate={setActiveTab} />
        </TabsContent>

        <TabsContent value="operations" className="m-0 space-y-4">
          <OperationsTab />
        </TabsContent>

        <TabsContent value="purchasing" className="m-0 space-y-4">
          <PurchasingTab />
        </TabsContent>

        <TabsContent value="lifecycle" className="m-0 space-y-4">
          <LifecycleTab />
        </TabsContent>

        <TabsContent value="analytics" className="m-0 space-y-4">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

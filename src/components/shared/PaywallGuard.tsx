import React from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Lock, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const PaywallGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="relative w-full h-full">
            {children}
        </div>
    );
};

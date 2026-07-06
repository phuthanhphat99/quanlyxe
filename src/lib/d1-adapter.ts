import { getTenantId } from './data-adapter';

// API base path handled by Vite Proxy in DEV, or absolute in PROD
const API_BASE = '/api';

export const createD1Adapter = (collectionName: string) => ({
    list: async (limitCount?: number, offsetCount?: number) => {
        const tenantId = getTenantId();
        if (!tenantId) return [];
        const res = await fetch(`${API_BASE}/${collectionName}?limit=${limitCount || 100}`, {
            headers: { 'x-tenant-id': tenantId }
        });
        if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
        let rows = await res.json();
        
        // Basic mapping for specific collections (simplified version of Firestore adapter mappings)
        if (collectionName === 'vehicles') {
            rows = rows.map((row: any) => ({
                ...row,
                registration_cost: row.registration_cost ?? 350000,
                status: row.status || 'active'
            }));
        }
        return rows;
    },
    get: async (id: string) => {
        const tenantId = getTenantId();
        if (!tenantId) return null;
        const res = await fetch(`${API_BASE}/${collectionName}/${id}`, {
            headers: { 'x-tenant-id': tenantId }
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
        return await res.json();
    },
    getById: async (id: string) => {
        const tenantId = getTenantId();
        if (!tenantId) return null;
        const res = await fetch(`${API_BASE}/${collectionName}/${id}`, {
            headers: { 'x-tenant-id': tenantId }
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
        return await res.json();
    },
    create: async (data: any) => {
        const tenantId = getTenantId() || data.tenant_id;
        const res = await fetch(`${API_BASE}/${collectionName}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-tenant-id': tenantId 
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Create error: ${res.statusText}`);
        return await res.json();
    },
    update: async (id: string, data: any) => {
        const tenantId = getTenantId() || data.tenant_id;
        const res = await fetch(`${API_BASE}/${collectionName}/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-tenant-id': tenantId 
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Update error: ${res.statusText}`);
        return await res.json();
    },
    delete: async (id: string) => {
        const tenantId = getTenantId();
        const res = await fetch(`${API_BASE}/${collectionName}/${id}`, {
            method: 'DELETE',
            headers: { 'x-tenant-id': tenantId }
        });
        if (!res.ok) throw new Error(`Delete error: ${res.statusText}`);
        return await res.json();
    },
    count: async () => {
        const rows = await createD1Adapter(collectionName).list();
        return rows.length;
    }
});

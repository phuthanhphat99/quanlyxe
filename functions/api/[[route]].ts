const ALLOWED_TABLES = [
    'users', 'company_settings', 'activity_logs', 'alerts',
    'vehicles', 'drivers', 'routes', 'customers', 'partners',
    'transport_orders', 'trips', 'trip_location_logs',
    'expenses', 'trip_expenses', 'maintenance', 'tires',
    'inventory', 'inventory_transactions'
];

function sanitizeTable(table: string) {
    if (!ALLOWED_TABLES.includes(table)) {
        throw new Error(`Bảng ${table} không hợp lệ.`);
    }
    return table;
}

// Background sync to Google Sheets
async function syncToGoogleSheets(env: any, context: any, payload: any) {
    const webhookUrl = env.VITE_GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
    if (!webhookUrl) return; // Bỏ qua nếu không có cấu hình webhook

    const syncTask = fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(err => console.error('Lỗi khi đồng bộ Google Sheets:', err));

    // Đẩy task chạy ngầm, không làm chậm request chính
    context.waitUntil(syncTask);
}

// Handler cho Webhook gọi ngược từ Google Sheets về D1
async function handleGoogleSheetsWebhook(request: Request, env: any) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // Xác thực API Key
    const authHeader = request.headers.get('Authorization');
    const expectedKey = `Bearer ${env.VITE_API_SECRET_KEY || 'PHUAN_SECRET_KEY_123'}`;
    if (!authHeader || authHeader !== expectedKey) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const payload = await request.json();
        const { action, sheet, operation, id, data } = payload;

        if (action !== 'sync_from_sheets' || !sheet || !ALLOWED_TABLES.includes(sheet)) {
            return new Response('Invalid payload', { status: 400 });
        }

        const table = sanitizeTable(sheet);

        // Lấy danh sách cột
        const tableInfo = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
        const validColumns = new Set(tableInfo.results.map((col: any) => col.name));

        if (operation === 'UPDATE' && id) {
            // Update
            data.updated_at = new Date().toISOString();
            const keys = Object.keys(data).filter(k => k !== 'id' && /^[a-zA-Z0-9_]+$/.test(k) && validColumns.has(k));
            if (keys.length > 0) {
                const setClause = keys.map(k => `${k} = ?`).join(', ');
                const values = keys.map(k => data[k] !== undefined && data[k] !== null ? data[k] : null);
                
                // Lưu ý: Dữ liệu từ Sheets dội về có thể của bất kỳ tenant nào, nên update theo ID là đủ 
                // hoặc lấy tenant_id từ data nếu có
                const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
                await env.DB.prepare(query).bind(...values, id).run();
            }
        } else if (operation === 'INSERT') {
            // Insert
            const recordId = data.id || crypto.randomUUID();
            data.id = recordId;
            if (!data.created_at) data.created_at = new Date().toISOString();
            data.updated_at = new Date().toISOString();

            const keys = Object.keys(data).filter(k => /^[a-zA-Z0-9_]+$/.test(k) && validColumns.has(k));
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(k => data[k] !== undefined && data[k] !== null ? data[k] : null);

            const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
            await env.DB.prepare(query).bind(...values).run();
        }

        return new Response(JSON.stringify({ success: true }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequest(context: any) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    
    // params.route is an array of path segments
    // e.g. /api/vehicles/123 -> params.route = ['vehicles', '123']
    const routeParts = params.route || [];
    if (routeParts.length === 0) {
        return new Response('FleetPro D1 API', { status: 200 });
    }

    // Xử lý Webhook từ Google Sheets
    if (routeParts[0] === 'webhook' && routeParts[1] === 'google-sheets') {
        return handleGoogleSheetsWebhook(request, env);
    }

    const tableName = routeParts[0];
    const id = routeParts[1];

    let tenantId = request.headers.get('x-tenant-id');
    
    // Nếu request là OPTIONS (CORS)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (!tenantId && tableName !== 'company_settings' && tableName !== 'users') {
        return new Response(JSON.stringify({ error: 'Missing x-tenant-id' }), { status: 400 });
    }

    try {
        const table = sanitizeTable(tableName);

        if (request.method === 'GET') {
            if (id) {
                // Get By ID
                const result = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ? AND (tenant_id = ? OR tenant_id = 'phuan_tnc')`)
                                           .bind(id, tenantId).first();
                if (!result) return new Response('Not found', { status: 404 });
                return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
            } else {
                // List
                const limit = parseInt(url.searchParams.get('limit') || '100', 10);
                const offset = parseInt(url.searchParams.get('offset') || '0', 10);
                const { results } = await env.DB.prepare(`SELECT * FROM ${table} WHERE tenant_id = ? OR tenant_id = 'phuan_tnc' ORDER BY created_at DESC LIMIT ? OFFSET ?`)
                                                .bind(tenantId, limit, offset).all();
                return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (request.method === 'POST') {
            const data = await request.json();
            const recordId = data.id || crypto.randomUUID();
            data.id = recordId;
            if (!data.tenant_id) data.tenant_id = tenantId;
            if (!data.created_at) data.created_at = new Date().toISOString();
            data.updated_at = new Date().toISOString();

            // Lấy danh sách cột thực tế của bảng để tránh lỗi insert cột không tồn tại
            const tableInfo = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
            const validColumns = new Set(tableInfo.results.map((col: any) => col.name));

            const keys = Object.keys(data).filter(k => /^[a-zA-Z0-9_]+$/.test(k) && validColumns.has(k));
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(k => data[k] !== undefined && data[k] !== null ? data[k] : null);

            const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
            await env.DB.prepare(query).bind(...values).run();

            // Đồng bộ sang Google Sheets
            syncToGoogleSheets(env, context, {
                action: 'sync',
                sheet: table,
                operation: 'INSERT',
                data: data
            });

            return new Response(JSON.stringify({ id: recordId, ...data }), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }

        if (request.method === 'PUT') {
            if (!id) return new Response('Missing ID for update', { status: 400 });
            const data = await request.json();
            data.updated_at = new Date().toISOString();

            // Loại bỏ các trường không cần update
            delete data.id;
            delete data.tenant_id;
            delete data.created_at;

            const keys = Object.keys(data).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
            if (keys.length === 0) return new Response('No data to update', { status: 400 });

            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = keys.map(k => data[k] !== undefined && data[k] !== null ? data[k] : null);

            const query = `UPDATE ${table} SET ${setClause} WHERE id = ? AND tenant_id = ?`;
            await env.DB.prepare(query).bind(...values, id, tenantId).run();

            // Đồng bộ sang Google Sheets
            syncToGoogleSheets(env, context, {
                action: 'sync',
                sheet: table,
                operation: 'UPDATE',
                data: { id, ...data }
            });

            return new Response(JSON.stringify({ success: true, id }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (request.method === 'DELETE') {
            if (!id) return new Response('Missing ID for delete', { status: 400 });
            
            // Soft delete
            await env.DB.prepare(`UPDATE ${table} SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`)
                        .bind(id, tenantId).run();

            // Đồng bộ sang Google Sheets
            syncToGoogleSheets(env, context, {
                action: 'sync',
                sheet: table,
                operation: 'DELETE',
                data: { id }
            });

            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ 
            error: 'Method not allowed', 
            method: request.method,
            tableName,
            id,
            routeParts
        }), { status: 405, headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
        console.error('D1 API Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

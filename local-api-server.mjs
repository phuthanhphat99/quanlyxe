import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8788; // Port Vite is proxying to

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'fleetpro-local.db');
const db = new Database(dbPath);

// Apply schema if new
try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'd1', 'schema.sql'), 'utf-8');
    db.exec(schemaSql);
    console.log('Database schema initialized.');
} catch (error) {
    console.error('Error initializing schema:', error);
}

const ALLOWED_TABLES = [
    'users', 'company_settings', 'activity_logs', 'alerts',
    'vehicles', 'drivers', 'routes', 'customers', 'partners',
    'transport_orders', 'trips', 'trip_location_logs',
    'expenses', 'trip_expenses', 'maintenance', 'tires',
    'inventory', 'inventory_transactions'
];

function sanitizeTable(table) {
    if (!ALLOWED_TABLES.includes(table)) {
        throw new Error(`Bảng ${table} không hợp lệ.`);
    }
    return table;
}

// Catch-all route mirroring Cloudflare Pages Functions
const handleApiRequest = (req, res) => {
    try {
        const tableName = req.params.table;
        const id = req.params.id;
        let tenantId = req.headers['x-tenant-id'];

        if (!tenantId && tableName !== 'company_settings' && tableName !== 'users') {
            return res.status(400).json({ error: 'Missing x-tenant-id' });
        }

        const table = sanitizeTable(tableName);

        if (req.method === 'GET') {
            if (id) {
                const stmt = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND tenant_id = ?`);
                const result = stmt.get(id, tenantId);
                if (!result) return res.status(404).send('Not found');
                return res.json(result);
            } else {
                const limit = parseInt(req.query.limit || '100', 10);
                const offset = parseInt(req.query.offset || '0', 10);
                const stmt = db.prepare(`SELECT * FROM ${table} WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`);
                const results = stmt.all(tenantId, limit, offset);
                return res.json(results);
            }
        }

        if (req.method === 'POST') {
            const data = req.body;
            const recordId = data.id || crypto.randomUUID();
            data.id = recordId;
            if (!data.tenant_id) data.tenant_id = tenantId;
            if (!data.created_at) data.created_at = new Date().toISOString();
            if (!data.updated_at) data.updated_at = new Date().toISOString();

            const keys = Object.keys(data).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(k => data[k] !== undefined && data[k] !== null ? data[k] : null);

            const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
            const stmt = db.prepare(query);
            stmt.run(...values);

            return res.status(201).json({ id: recordId, ...data });
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).send('Missing ID for update');
            const data = req.body;
            data.updated_at = new Date().toISOString();

            delete data.id;
            delete data.tenant_id;
            delete data.created_at;

            const keys = Object.keys(data).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
            if (keys.length === 0) return res.status(400).send('No data to update');

            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = keys.map(k => data[k] !== undefined && data[k] !== null ? data[k] : null);

            const query = `UPDATE ${table} SET ${setClause} WHERE id = ? AND tenant_id = ?`;
            const stmt = db.prepare(query);
            stmt.run(...values, id, tenantId);

            return res.json({ success: true, id });
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).send('Missing ID for delete');
            
            // Soft delete
            const stmt = db.prepare(`UPDATE ${table} SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`);
            stmt.run(id, tenantId);

            return res.json({ success: true });
        }

        return res.status(405).send('Method not allowed');

    } catch (err) {
        console.error('Local API Error:', err);
        return res.status(500).json({ error: err.message });
    }
};

app.all('/api/:table', handleApiRequest);
app.all('/api/:table/:id', handleApiRequest);

app.listen(PORT, () => {
    console.log(`Local API Server (mocking D1) running on http://localhost:${PORT}`);
});

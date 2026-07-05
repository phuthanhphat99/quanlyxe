/**
 * FleetPro V3 Online Backend (Google Apps Script) - SETUP PRO & REALTIME SYNC
 * Pattern tham chiếu từ Coach.io.vn nhưng đã tối ưu cho nghiệp vụ vận tải.
 *
 * Deploy Web App:
 * - Execute as: Me
 * - Access: Anyone (hoặc theo policy nội bộ)
 */

var TRANSPORT_APP_NAME = 'FleetPro V3 Online';

// MVP_MAP: xác định mục tiêu web app và đối tượng phục vụ (để tránh lệch scope)
var MVP_MAP = {
	goal: 'Số hoá vận tải cho doanh nghiệp nhỏ-vừa bằng Google Sheets + Web App, thao tác đơn giản cho người không rành công nghệ',
	target_users: [
		'Chủ doanh nghiệp vận tải',
		'Điều phối/dispatch',
		'Kế toán vận tải',
		'Quản lý đội xe'
	],
	mvp_modules: ['tenants', 'vehicles', 'drivers', 'customers', 'routes', 'trips', 'expenses', 'maintenance', 'auditlog', 'inventory_fuel', 'inventory_tools'],
	non_goal: ['Không làm CRM/marketing automation phức tạp', 'Không làm tính năng SaaS giáo dục của Coach']
};

var RESOURCE_MAP = {
	tenants: { sheet: 'Tenants', keyColumn: 'tenant_id', tier: 'bridge', requiresTenant: false },
	useraccounts: { sheet: 'User Account', keyColumn: 'user_id', tier: 'bridge', requiresTenant: true },
	featureflags: { sheet: 'FeatureFlags', keyColumn: 'flag_key', tier: 'bridge', requiresTenant: false },
	planlimits: { sheet: 'PlanLimits', keyColumn: 'plan_code', tier: 'bridge', requiresTenant: false },
	auditlog: { sheet: 'AuditLog', keyColumn: 'record_id', tier: 'bridge', requiresTenant: false },
	vehicles: { sheet: 'Danh Muc Xe', keyColumn: 'Mã xe', tier: 'row', requiresTenant: true },
	drivers: { sheet: 'Tai Xe', keyColumn: 'Mã tài xế', tier: 'row', requiresTenant: true },
	customers: { sheet: 'Khach Hang', keyColumn: 'Mã KH', tier: 'row', requiresTenant: true },
	routes: { sheet: 'Tuyen Duong', keyColumn: 'Mã tuyến', tier: 'row', requiresTenant: true },
	trips: { sheet: 'Chuyen Van Chuyen', keyColumn: 'Mã chuyến', tier: 'silo', requiresTenant: true },
	expenses: { sheet: 'Chi Phi', keyColumn: 'Mã chi phí', tier: 'silo', requiresTenant: true },
	maintenance: { sheet: 'Bao Tri', keyColumn: 'Mã lệnh', tier: 'silo', requiresTenant: true },
	transport_orders: { sheet: 'Don Hang', keyColumn: 'Mã đơn', tier: 'silo', requiresTenant: true },
	tires: { sheet: 'Kho Lop', keyColumn: 'Mã lốp', tier: 'row', requiresTenant: true },
	inventory: { sheet: 'Kho Vat Tu', keyColumn: 'Mã vật tư/CCDC', tier: 'row', requiresTenant: true },
	fuel: { sheet: 'Kho Nhien Lieu', keyColumn: 'Mã vật tư/CCDC', tier: 'row', requiresTenant: true },
	tools: { sheet: 'Kho CCDC', keyColumn: 'Mã vật tư/CCDC', tier: 'row', requiresTenant: true }
};

var LEGACY_LIST_ALIASES = {
	getTrips: 'trips',
	getVehicles: 'vehicles',
	getDrivers: 'drivers',
	getCustomers: 'customers',
	getRoutes: 'routes',
	getExpenses: 'expenses',
	getFuel: 'fuel',
	getTools: 'tools',
	getInventory: 'inventory'
};

var GET_ACTION_ALIASES = {
	config: 'config',
	getConfig: 'config',
	getTrip: 'get',
	getVehicle: 'get',
	getDriver: 'get',
	getCustomer: 'get',
	getRoute: 'get',
	getExpense: 'get'
};

var MUTATION_ROLES = {
	upsert: ['admin_global', 'admin_tenant', 'editor_tenant'],
	del: ['admin_global', 'admin_tenant', 'editor_tenant'],
	importCsv: ['admin_global', 'admin_tenant', 'editor_tenant'],
	createTrip: ['admin_global', 'admin_tenant', 'editor_tenant'],
	updateTrip: ['admin_global', 'admin_tenant', 'editor_tenant'],
	confirmTrip: ['admin_global', 'admin_tenant', 'editor_tenant'],
	closeTrip: ['admin_global', 'admin_tenant', 'editor_tenant']
};

var REQUIRED_META_COLUMNS = ['tenant_id', 'record_id', 'created_at', 'updated_at', 'updated_by'];

/**
 * One-click setup config (sửa theo tenant thực tế trước khi chạy setupTransportCustom)
 */
var SETUP_CONFIG = {
	SPREADSHEET_ID: '1SFXH7xwlMAGxjh-Y5PCglkadgxVVe5xRaEZZeewJv_o',
	TENANT_ID: 'internal-tenant-1',
	TENANT_DOMAIN: 'internal.fleetpro.vn',
	APP_NAME: 'FleetPro V3',
	PRIMARY_COLOR: '#2563eb',
	TENANT_STATUS: 'active',
	ADMIN_TOKEN: 'change_me_admin_token'
};

function doGet(e) {
	try {
		var params = (e && e.parameter) || {};
		var action = String(params.action || '').trim();

		// Nếu không có tham số hoặc action là setup/ui -> Trả về giao diện Web App HTML Setup PRO
		if (!action || action === 'setup' || action === 'ui') {
			return HtmlService.createHtmlOutputFromFile('FleetProV3SetupUI')
				.setTitle('FleetPro V3 Setup PRO')
				.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
		}

		if (GET_ACTION_ALIASES[action] === 'config') {
			return jsonOutput(handleTransportConfig(params));
		}

		if (action === 'tenant-config') {
			return jsonOutput(handleTenantConfig(params));
		}

		if (LEGACY_LIST_ALIASES[action]) {
			params.action = 'list';
			params.resource = LEGACY_LIST_ALIASES[action];
			if (action === 'getExpenses' && params.tripId && !params['Chuyến']) {
				params['Chuyến'] = params.tripId;
			}
			action = 'list';
		}

		if (GET_ACTION_ALIASES[action] === 'get') {
			action = 'get';
		}

		if (action !== 'list' && action !== 'get') {
			return jsonOutput(errorResult('Unknown action', { action: action || '(empty)' }));
		}

		var context = resolveTenantContext(params);
		if (!context.ok) {
			return jsonOutput(errorResult(context.error || 'Tenant resolution failed', {
				code: context.code || 'tenant_error',
				fallback: context.code === 'tenant_not_found' ? 'not-found' : 'error'
			}));
		}

		var auth = resolveRoleContext(params.token || '', context);
		if (!auth.ok) {
			return jsonOutput(errorResult(auth.error, { code: auth.code }));
		}

		if (action === 'list') {
			return jsonOutput(handleList(params, context, auth));
		}
		return jsonOutput(handleGet(params, context, auth));
	} catch (error) {
		return jsonOutput(errorResult(error.message || 'Unexpected error in doGet'));
	}
}

function handleTransportConfig(params) {
	var context = resolveTenantContext(params, true);
	if (!context.ok) {
		return {
			status: 'error',
			fallback: context.code === 'tenant_not_found' ? 'not-found' : 'error',
			message: context.error
		};
	}

	return {
		status: 'ok',
		app: {
			name: TRANSPORT_APP_NAME,
			domain: context.tenant.domain,
			tenant_id: context.tenant.tenant_id,
			primary_color: context.tenant.primary_color || '#2563eb'
		},
		mvp_map: MVP_MAP,
		resources: Object.keys(RESOURCE_MAP),
		endpoints: {
			tenant_config: '?action=tenant-config&tenant_id=' + encodeURIComponent(context.tenant.tenant_id),
			list_trips: '?action=list&resource=trips&tenant_id=' + encodeURIComponent(context.tenant.tenant_id),
			list_vehicles: '?action=list&resource=vehicles&tenant_id=' + encodeURIComponent(context.tenant.tenant_id)
		}
	};
}

function doPost(e) {
	try {
		var payload = parsePostPayload(e);
		var type = String(payload.type || payload.action || '').trim();

		if (!type) {
			return jsonOutput(errorResult('Missing POST type/action'));
		}

		// Xử lý Webhook đồng bộ thời gian thực từ FleetPro Web App (Force Sync & Realtime)
		if (type === 'sync' || type === 'batch_sync') {
			return handleWebhookSync_(payload);
		}

		if (type === 'setSpreadsheetId') {
			return jsonOutput(handleSetSpreadsheetId(payload));
		}

		if (type === 'authLogin' || type === 'login') {
			var loginContext = resolveTenantContext(payload, true);
			if (!loginContext.ok) {
				return jsonOutput(errorResult(loginContext.error || 'Tenant resolution failed', {
					code: loginContext.code || 'tenant_error',
					fallback: loginContext.code === 'tenant_not_found' ? 'not-found' : 'error'
				}));
			}
			return jsonOutput(handleAuthLogin(payload, loginContext));
		}

		var context = resolveTenantContext(payload);
		if (!context.ok) {
			return jsonOutput(errorResult(context.error || 'Tenant resolution failed', {
				code: context.code || 'tenant_error',
				fallback: context.code === 'tenant_not_found' ? 'not-found' : 'error'
			}));
		}

		var auth = resolveRoleContext(payload.token || '', context);
		if (!auth.ok) {
			return jsonOutput(errorResult(auth.error, { code: auth.code }));
		}

		if (type === 'delete') {
			assertWriteRole(type, auth);
			return jsonOutput(handleDelete(payload, context, auth));
		}

		if (type === 'upsert') {
			assertWriteRole(type, auth);
			return jsonOutput(handleUpsert(payload, context, auth));
		}

		if (type === 'importCsv') {
			assertWriteRole(type, auth);
			return jsonOutput(handleImportCsv(payload, context, auth));
		}

		if (type === 'registerUser') {
			assertUserAccountsWriteRole('useraccounts', auth);
			return jsonOutput(handleRegisterUser(payload, context, auth));
		}

		if (type === 'createTrip' || type === 'updateTrip' || type === 'confirmTrip' || type === 'closeTrip') {
			assertWriteRole(type, auth);
			return jsonOutput(handleTripMutation(type, payload, context, auth));
		}

		return jsonOutput(errorResult('Unknown POST type', { type: type }));
	} catch (error) {
		return jsonOutput(errorResult(error.message || 'Unexpected error in doPost'));
	}
}

function handleWebhookSync_(payload) {
	var sheetName = payload.sheet || payload.collection;
	if (RESOURCE_MAP[sheetName] && RESOURCE_MAP[sheetName].sheet) {
		sheetName = RESOURCE_MAP[sheetName].sheet;
	}
	var operation = payload.operation;
	var id = payload.id;
	var data = payload.data;
	var type = payload.action || payload.type;

	if (!sheetName) {
		return jsonOutput({ status: 'error', message: 'Missing sheet name' });
	}

	var props = PropertiesService.getScriptProperties();
	var spreadsheetId = asString(props.getProperty('SPREADSHEET_ID')) || asString(SETUP_CONFIG.SPREADSHEET_ID);
	if (!spreadsheetId) {
		return jsonOutput({ status: 'error', message: 'Spreadsheet ID not configured' });
	}

	var ss = SpreadsheetApp.openById(spreadsheetId);
	var ws = ss.getSheetByName(sheetName);

	if (!ws) {
		ws = ss.insertSheet(sheetName);
		if (data && !Array.isArray(data) && typeof data === 'object') {
			var headers = Object.keys(data);
			ws.appendRow(headers);
			ws.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
		}
	}

	if (type === 'batch_sync') {
		ws.clear();
		if (Array.isArray(data) && data.length > 0) {
			var headers = Object.keys(data[0]);
			ws.appendRow(headers);
			ws.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
			
			var rows = data.map(function(item) {
				return headers.map(function(h) {
					return item[h] !== undefined && item[h] !== null ? item[h] : '';
				});
			});
			if (rows.length > 0) {
				ws.getRange(2, 1, rows.length, headers.length).setValues(rows);
			}
		}
		return jsonOutput({ status: 'ok', success: true, message: 'Đã nạp ' + (Array.isArray(data) ? data.length : 0) + ' dòng vào bảng ' + sheetName });
	}

	var headers = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0].map(asString);
	if (operation === 'INSERT') {
		var newRow = headers.map(function(header) { return data[header] !== undefined ? data[header] : ''; });
		ws.appendRow(newRow);
	} else if (operation === 'UPDATE' && id) {
		var dataRange = ws.getDataRange();
		var allValues = dataRange.getValues();
		var idColIndex = headers.indexOf('id');
		if (idColIndex < 0) idColIndex = headers.indexOf('record_id');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã xe');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã tài xế');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã KH');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã tuyến');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã chuyến');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã phiếu');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã lệnh');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã lốp');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã vật tư/CCDC');
		if (idColIndex < 0) idColIndex = headers.indexOf('Mã đơn');
		
		if (idColIndex !== -1) {
			for (var r = 1; r < allValues.length; r++) {
				if (asString(allValues[r][idColIndex]) === asString(id)) {
					var rowNumber = r + 1;
					Object.keys(data).forEach(function(key) {
						var colIndex = headers.indexOf(key);
						if (colIndex !== -1) {
							ws.getRange(rowNumber, colIndex + 1).setValue(data[key]);
						}
					});
					break;
				}
			}
		}
	}

	return jsonOutput({ status: 'ok', success: true, message: 'Đồng bộ thành công.' });
}

function handleTenantConfig(params) {
	var context = resolveTenantContext(params, true);
	if (!context.ok) {
		return {
			status: 'error',
			fallback: context.code === 'tenant_not_found' ? 'not-found' : 'error',
			message: context.error
		};
	}
	return {
		status: 'ok',
		tenant_id: context.tenant.tenant_id,
		domain: context.tenant.domain,
		app_name: context.tenant.app_name || 'FleetPro',
		support_email: context.tenant.support_email || '',
		primary_color: context.tenant.primary_color || '#2563eb',
		spreadsheet_id: context.tenant.spreadsheet_id || context.bridgeSpreadsheetId,
		feature_flags: parseJsonSafe(context.tenant.feature_flags_json || '{}', {}),
		plan_code: context.tenant.plan_code || 'default'
	};
}

function handleSetSpreadsheetId(payload) {
	var props = PropertiesService.getScriptProperties();
	var adminToken = String(payload.adminToken || payload.token || '').trim();
	var expected = String(props.getProperty('ADMIN_TOKEN') || '').trim();
	if (!expected || adminToken !== expected) {
		return errorResult('Unauthorized admin action', { code: 'unauthorized' });
	}

	var spreadsheetId = String(payload.spreadsheetId || '').trim();
	if (!spreadsheetId && payload.spreadsheetUrl) {
		spreadsheetId = extractSpreadsheetId(String(payload.spreadsheetUrl));
	}
	if (!spreadsheetId) {
		return errorResult('Missing spreadsheetId/spreadsheetUrl');
	}

	props.setProperty('SPREADSHEET_ID', spreadsheetId);
	return okResult({ message: 'SPREADSHEET_ID updated', spreadsheetId: spreadsheetId });
}

function handleList(params, context, auth) {
	var resource = normalizeResource(params.resource);
	assertReadRole(resource, auth);
	var cfg = getResourceConfig(resource);
	requireTenantIfNeeded(cfg, context);

	var sheet = getSheetForResource(cfg, context);
	if (!sheet) {
		return [];
	}

	var rows = sheetToObjects(sheet);
	rows = applyTenantFilter(rows, cfg, context);
	rows = applyParamFilters(rows, params);
	return rows;
}

function handleGet(params, context, auth) {
	var resource = normalizeResource(params.resource);
	assertReadRole(resource, auth);
	var cfg = getResourceConfig(resource);
	requireTenantIfNeeded(cfg, context);

	var sheet = getSheetForResource(cfg, context);
	if (!sheet) {
		return errorResult('Resource sheet not found', { resource: resource });
	}

	var keyColumn = params.keyColumn || cfg.keyColumn;
	var keyValue = String(params.keyValue || '').trim();
	if (!keyColumn || !keyValue) {
		return errorResult('Missing keyColumn/keyValue');
	}

	var rows = applyTenantFilter(sheetToObjects(sheet), cfg, context);
	for (var i = 0; i < rows.length; i++) {
		if (String(rows[i][keyColumn] || '') === keyValue) {
			return rows[i];
		}
	}
	return errorResult('Record not found', { resource: resource, keyColumn: keyColumn, keyValue: keyValue });
}

function handleUpsert(payload, context, auth) {
	var resource = normalizeResource(payload.resource);
	assertUserAccountsWriteRole(resource, auth);
	var cfg = getResourceConfig(resource);
	requireTenantIfNeeded(cfg, context);

	var sheet = getOrCreateSheetForResource(cfg, context, payload.headers || []);
	ensureMetaColumns(sheet);

	var rows = payload.rows || [];
	if (!Array.isArray(rows) || rows.length === 0) {
		return errorResult('rows must be a non-empty array');
	}

	var keyColumn = String(payload.keyColumn || cfg.keyColumn || '').trim();
	if (!keyColumn) {
		return errorResult('Missing keyColumn');
	}

	var data = sheet.getDataRange().getValues();
	var headers = data.length ? data[0].map(asString) : [];
	if (headers.length === 0) {
		headers = mergeHeaders([], rows);
		ensureHeaderColumn(headers, keyColumn);
		REQUIRED_META_COLUMNS.forEach(function (col) { ensureHeaderColumn(headers, col); });
		sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
		data = sheet.getDataRange().getValues();
	}

	var headerIndex = indexMap(headers);
	var existingByKey = {};
	for (var r = 1; r < data.length; r++) {
		var rowObj = toObject(headers, data[r]);
		if (!allowRowForTenant(rowObj, cfg, context)) {
			continue;
		}
		var existingKey = asString(rowObj[keyColumn]);
		if (existingKey) {
			existingByKey[existingKey] = r + 1;
		}
	}

	var updated = 0;
	var appended = 0;
	var actor = getActor(auth, payload);
	var now = isoNow();

	for (var i = 0; i < rows.length; i++) {
		var record = shallowClone(rows[i]);
		applyMeta(record, context, actor, now);
		if (!record.record_id) {
			record.record_id = buildRecordId(context.tenant.tenant_id, resource, i);
		}

		var keyValue = asString(record[keyColumn]);
		if (!keyValue) {
			throw new Error('Missing key value for keyColumn: ' + keyColumn);
		}

		var rowArray = objectToRow(headers, record);
		var existingRow = existingByKey[keyValue];

		if (existingRow) {
			var beforeObj = toObject(headers, sheet.getRange(existingRow, 1, 1, headers.length).getValues()[0]);
			assertTenantOwnership(beforeObj, cfg, context);
			sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowArray]);
			updated += 1;
			writeAuditLog(context, actor, 'upsert:update', resource, keyValue, beforeObj, record, 'ok');
		} else {
			sheet.appendRow(rowArray);
			appended += 1;
			writeAuditLog(context, actor, 'upsert:append', resource, keyValue, null, record, 'ok');
		}
	}

	return okResult({ updated: updated, appended: appended, resource: resource });
}

function handleDelete(payload, context, auth) {
	var resource = normalizeResource(payload.resource);
	assertUserAccountsWriteRole(resource, auth);
	var cfg = getResourceConfig(resource);
	requireTenantIfNeeded(cfg, context);

	var sheet = getSheetForResource(cfg, context);
	if (!sheet) {
		return errorResult('Resource sheet not found', { resource: resource });
	}

	var keyColumn = String(payload.keyColumn || cfg.keyColumn || '').trim();
	var keyValue = String(payload.keyValue || payload.id || '').trim();
	if (!keyColumn || !keyValue) {
		return errorResult('Missing keyColumn/keyValue');
	}

	var data = sheet.getDataRange().getValues();
	if (data.length < 2) {
		return okResult({ deleted: 0 });
	}

	var headers = data[0].map(asString);
	var actor = getActor(auth, payload);
	var deleted = 0;

	for (var r = data.length - 1; r >= 1; r--) {
		var rowObj = toObject(headers, data[r]);
		if (asString(rowObj[keyColumn]) !== keyValue) {
			continue;
		}
		assertTenantOwnership(rowObj, cfg, context);
		sheet.deleteRow(r + 1);
		deleted += 1;
		writeAuditLog(context, actor, 'delete', resource, keyValue, rowObj, null, 'ok');
	}

	return okResult({ deleted: deleted, resource: resource, keyValue: keyValue });
}

function handleImportCsv(payload, context, auth) {
	var resource = normalizeResource(payload.resource);
	var rows = payload.rows || [];
	return handleUpsert({
		resource: resource,
		keyColumn: payload.keyColumn,
		rows: rows,
		actor: payload.actor || auth.subject,
		headers: payload.headers
	}, context, auth);
}

function handleAuthLogin(payload, context) {
	var identifier = asString(payload.email || payload.user_id || payload.userId || payload.username).toLowerCase();
	var token = asString(payload.api_token || payload.token || payload.password);

	if (!identifier || !token) {
		return errorResult('Missing credentials', { code: 'missing_credentials' });
	}

	var cfg = getResourceConfig('useraccounts');
	var sheet = getSheetForResource(cfg, context);
	if (!sheet) {
		return errorResult('User account sheet not found', { code: 'user_sheet_missing' });
	}

	var rows = applyTenantFilter(sheetToObjects(sheet), cfg, context);
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var rowEmail = asString(row.email).toLowerCase();
		var rowUserId = asString(row.user_id).toLowerCase();
		var rowDisplayName = asString(row.display_name).toLowerCase();

		var matchedIdentifier = (identifier === rowEmail || identifier === rowUserId || identifier === rowDisplayName);
		if (!matchedIdentifier) {
			continue;
		}

		var candidateToken = asString(row.api_token || row.token || row.access_token);
		if (!candidateToken || candidateToken !== token) {
			continue;
		}

		var status = asString(row.status || 'active').toLowerCase();
		if (status && status !== 'active') {
			return errorResult('User account is inactive', { code: 'account_inactive' });
		}

		var role = normalizeRole(asString(row.role || 'user_tenant'));
		var scope = asString(row.tenant_id || context.tenantId);
		if ((role === 'admin_tenant' || role === 'editor_tenant' || role === 'user_tenant') && scope !== String(context.tenantId)) {
			return errorResult('User account tenant scope mismatch', { code: 'tenant_scope_violation' });
		}

		return okResult({
			message: 'Login successful',
			auth: {
				role: role,
				scope: scope,
				subject: asString(row.user_id || row.email || row.display_name || 'tenant_user')
			},
			user: {
				tenant_id: scope,
				user_id: asString(row.user_id),
				email: asString(row.email),
				display_name: asString(row.display_name),
				role: role,
				status: status || 'active'
			},
			tenant: {
				tenant_id: context.tenantId,
				domain: asString(context.tenant.domain),
				app_name: asString(context.tenant.app_name || TRANSPORT_APP_NAME),
				primary_color: asString(context.tenant.primary_color || '#2563eb')
			}
		});
	}

	return errorResult('Invalid credentials', { code: 'unauthorized_token' });
}

function handleRegisterUser(payload, context, auth) {
	var tenantId = asString(payload.tenant_id || payload.tenantId || context.tenantId);
	if (tenantId !== asString(context.tenantId)) {
		return errorResult('Cross-tenant registration denied', { code: 'tenant_scope_violation' });
	}

	var userId = asString(payload.user_id || payload.userId || ('user-' + new Date().getTime()));
	var email = asString(payload.email).toLowerCase();
	var displayName = asString(payload.display_name || payload.displayName || userId);
	var role = normalizeRole(asString(payload.role || 'user_tenant'));
	var status = asString(payload.status || 'active').toLowerCase() || 'active';
	var apiToken = asString(payload.api_token || payload.token || Utilities.getUuid().replace(/-/g, ''));

	if (!email) {
		return errorResult('Missing email', { code: 'missing_email' });
	}

	if (status !== 'active' && status !== 'inactive') {
		return errorResult('Invalid status', { code: 'invalid_status' });
	}

	if (auth.role === 'admin_tenant' && role === 'admin_global') {
		return errorResult('admin_tenant cannot assign admin_global', { code: 'forbidden_role_assignment' });
	}

	var cfg = getResourceConfig('useraccounts');
	var sheet = getOrCreateSheetForResource(cfg, context, ['tenant_id', 'user_id', 'email', 'display_name', 'role', 'status', 'api_token']);
	var rows = applyTenantFilter(sheetToObjects(sheet), cfg, context);

	for (var i = 0; i < rows.length; i++) {
		var existing = rows[i];
		if (asString(existing.user_id) === userId) {
			return errorResult('user_id already exists', { code: 'duplicate_user_id', user_id: userId });
		}
		if (asString(existing.email).toLowerCase() === email) {
			return errorResult('email already exists', { code: 'duplicate_email', email: email });
		}
	}

	var now = isoNow();
	var row = {
		tenant_id: tenantId,
		user_id: userId,
		email: email,
		display_name: displayName,
		role: role,
		status: status,
		api_token: apiToken,
		created_at: now,
		updated_at: now,
		updated_by: getActor(auth, payload)
	};

	var result = handleUpsert({
		resource: 'useraccounts',
		keyColumn: 'user_id',
		rows: [row]
	}, context, auth);

	if (result.status === 'error') {
		return result;
	}

	return okResult({
		message: 'User registered',
		user: {
			tenant_id: tenantId,
			user_id: userId,
			email: email,
			display_name: displayName,
			role: role,
			status: status,
			api_token: apiToken
		}
	});
}

function handleTripMutation(type, payload, context, auth) {
	var tripsCfg = getResourceConfig('trips');
	var tripsSheet = getOrCreateSheetForResource(tripsCfg, context, ['Mã chuyến', 'Trạng thái']);
	ensureMetaColumns(tripsSheet);

	var tripId = String(payload.id || payload.tripId || payload['Mã chuyến'] || '').trim();
	var actor = getActor(auth, payload);
	var now = isoNow();
	var data = tripsSheet.getDataRange().getValues();
	var headers = data.length ? data[0].map(asString) : [];
	var keyColumn = tripsCfg.keyColumn;

	if (type === 'createTrip') {
		var record = shallowClone(payload);
		var generatedTripId = tripId || buildHumanCode('CD', context);
		record[keyColumn] = generatedTripId;
		record['Trạng thái'] = record['Trạng thái'] || 'Mới';
		applyMeta(record, context, actor, now);
		if (!record.record_id) {
			record.record_id = buildRecordId(context.tenant.tenant_id, 'trips', generatedTripId);
		}
		var appended = handleUpsert({ resource: 'trips', keyColumn: keyColumn, rows: [record] }, context, auth);
		if (appended.status === 'error') {
			return appended;
		}
		return okResult({ tripId: generatedTripId, created: true });
	}

	if (!tripId) {
		return errorResult('Missing trip id');
	}

	if (data.length < 2) {
		return errorResult('Trip not found', { id: tripId });
	}

	var rowIndex = -1;
	var rowObj = null;
	for (var r = 1; r < data.length; r++) {
		var obj = toObject(headers, data[r]);
		if (asString(obj[keyColumn]) === tripId) {
			assertTenantOwnership(obj, tripsCfg, context);
			rowIndex = r + 1;
			rowObj = obj;
			break;
		}
	}

	if (rowIndex < 0) {
		return errorResult('Trip not found', { id: tripId });
	}

	var before = shallowClone(rowObj);
	if (type === 'updateTrip') {
		var updates = payload.updates || {};
		for (var key in updates) {
			if (updates.hasOwnProperty(key)) {
				rowObj[key] = updates[key];
			}
		}
	} else if (type === 'confirmTrip') {
		rowObj['Trạng thái'] = 'Đã xác nhận';
	} else if (type === 'closeTrip') {
		var guard = validateTripCloseGuard(context, tripId, payload.forceOverride === true || payload.forceOverride === 'true');
		if (!guard.ok) {
			return errorResult(guard.message, { code: 'trip_close_guard', details: guard.details });
		}
		rowObj['Trạng thái'] = 'Đã đóng';
		rowObj['Ngày đóng'] = now;
	}

	applyMeta(rowObj, context, actor, now);
	var rowArray = objectToRow(headers, rowObj);
	tripsSheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowArray]);
	writeAuditLog(context, actor, type, 'trips', tripId, before, rowObj, 'ok');

	return okResult({ id: tripId, status: rowObj['Trạng thái'] || '', action: type });
}

function validateTripCloseGuard(context, tripId, forceOverride) {
	var trip = getTripById(context, tripId);
	if (!trip) {
		return { ok: false, message: 'Trip not found for close guard', details: { tripId: tripId } };
	}

	var revenue = parseNumber(trip['Cước vận chuyển']);
	if (!revenue || revenue <= 0) {
		return { ok: true };
	}

	var expenses = listExpensesByTrip(context, tripId);
	var totalExpense = 0;
	for (var i = 0; i < expenses.length; i++) {
		totalExpense += parseNumber(expenses[i]['Số tiền']);
	}

	var ratio = totalExpense / revenue;
	if (ratio > 1.2 && !forceOverride) {
		return {
			ok: false,
			message: 'Cannot close trip: expenses exceed 120% revenue',
			details: { revenue: revenue, totalExpense: totalExpense, ratio: ratio }
		};
	}

	return { ok: true, details: { revenue: revenue, totalExpense: totalExpense, ratio: ratio } };
}

function resolveTenantContext(input, allowRootFallback) {
	var props = PropertiesService.getScriptProperties();
	var bridgeSpreadsheetId = String(props.getProperty('SPREADSHEET_ID') || '').trim();
	if (!bridgeSpreadsheetId) {
		return { ok: false, code: 'config_error', error: 'SPREADSHEET_ID is not configured' };
	}

	var bridgeSs = SpreadsheetApp.openById(bridgeSpreadsheetId);
	var hint = String((input && (input.tenant_id || input.tenantId || input.domain)) || '').trim().toLowerCase();
	var hasHint = !!hint;
	var tenantRows = [];
	var tenantsSheet = bridgeSs.getSheetByName('Tenants');
	if (tenantsSheet) {
		tenantRows = sheetToObjects(tenantsSheet);
	}

	var tenant = null;
	var active = filterActiveTenants(tenantRows);
	for (var i = 0; i < active.length; i++) {
		var row = active[i];
		var candidateTenantId = String(row.tenant_id || '').toLowerCase();
		var candidateDomain = String(row.domain || '').toLowerCase();
		if (hint && (hint === candidateTenantId || hint === candidateDomain)) {
			tenant = row;
			break;
		}
	}

	if (!tenant && allowRootFallback && !hasHint) {
		var rootDomain = String(props.getProperty('DEFAULT_TENANT_DOMAIN') || '').toLowerCase();
		var rootTenantId = String(props.getProperty('DEFAULT_TENANT_ID') || '').toLowerCase();
		for (var j = 0; j < active.length; j++) {
			var t = active[j];
			if ((rootDomain && String(t.domain || '').toLowerCase() === rootDomain) ||
					(rootTenantId && String(t.tenant_id || '').toLowerCase() === rootTenantId) ||
					String(t.is_default || '').toLowerCase() === 'true') {
				tenant = t;
				break;
			}
		}
		if (!tenant && active.length > 0) {
			tenant = active[0];
		}
	}

	if (!tenant) {
		return {
			ok: false,
			code: 'tenant_not_found',
			error: 'Tenant not found',
			bridgeSpreadsheetId: bridgeSpreadsheetId
		};
	}

	var tenantId = String(tenant.tenant_id || '').trim();
	if (!tenantId) {
		return { ok: false, code: 'tenant_invalid', error: 'Tenant row missing tenant_id' };
	}

	var siloSpreadsheetId = String(tenant.spreadsheet_id || '').trim() || bridgeSpreadsheetId;
	var siloSs = SpreadsheetApp.openById(siloSpreadsheetId);

	return {
		ok: true,
		tenant: tenant,
		tenantId: tenantId,
		bridgeSpreadsheetId: bridgeSpreadsheetId,
		bridgeSs: bridgeSs,
		siloSpreadsheetId: siloSpreadsheetId,
		siloSs: siloSs
	};
}

function resolveRoleContext(token, context) {
	var tokenValue = String(token || '').trim();
	if (!tokenValue) {
		return { ok: true, role: 'public', scope: context.tenantId, subject: 'anonymous' };
	}

	var map = parseApiKeys();
	var raw = map[tokenValue];
	if (!raw) {
		var userAccountAuth = resolveUserAccountAuth(tokenValue, context);
		if (!userAccountAuth.ok) {
			return userAccountAuth;
		}
		return userAccountAuth;
	}

	var role = normalizeRole(raw.role);

	var scope = raw.scope || context.tenantId;
	if ((role === 'admin_tenant' || role === 'editor_tenant' || role === 'user_tenant') && String(scope) !== String(context.tenantId)) {
		return { ok: false, code: 'tenant_scope_violation', error: 'Token tenant scope mismatch' };
	}

	return { ok: true, role: role, scope: scope, subject: raw.subject || 'token_user' };
}

function assertWriteRole(action, auth) {
	var allowed = MUTATION_ROLES[action] || [];
	if (allowed.indexOf(auth.role) < 0) {
		throw new Error('Forbidden action for role: ' + auth.role + ' on ' + action);
	}
}

function assertReadRole(resource, auth) {
	if (resource !== 'useraccounts') return;
	if (auth.role !== 'admin_global' && auth.role !== 'admin_tenant') {
		throw new Error('Forbidden resource for role: ' + auth.role + ' on ' + resource);
	}
}

function assertUserAccountsWriteRole(resource, auth) {
	if (resource !== 'useraccounts') return;
	if (auth.role !== 'admin_global' && auth.role !== 'admin_tenant') {
		throw new Error('Forbidden mutation for role: ' + auth.role + ' on ' + resource);
	}
}

function requireTenantIfNeeded(cfg, context) {
	if (cfg.requiresTenant && (!context || !context.tenantId)) {
		throw new Error('Tenant is required for this resource');
	}
}

function getResourceConfig(resource) {
	var cfg = RESOURCE_MAP[resource];
	if (!cfg) {
		throw new Error('Unknown resource: ' + resource);
	}
	return cfg;
}

function getSheetForResource(cfg, context) {
	var ss = (cfg.tier === 'bridge') ? context.bridgeSs : context.siloSs;
	return ss.getSheetByName(cfg.sheet);
}

function getOrCreateSheetForResource(cfg, context, seedHeaders) {
	var ss = (cfg.tier === 'bridge') ? context.bridgeSs : context.siloSs;
	var sheet = ss.getSheetByName(cfg.sheet);
	if (!sheet) {
		sheet = ss.insertSheet(cfg.sheet);
	}
	var currentData = sheet.getDataRange().getValues();
	if (currentData.length === 0) {
		var headers = mergeHeaders(seedHeaders || [], []);
		if (cfg.keyColumn) ensureHeaderColumn(headers, cfg.keyColumn);
		REQUIRED_META_COLUMNS.forEach(function (col) { ensureHeaderColumn(headers, col); });
		if (headers.length > 0) {
			sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
		}
	}
	return sheet;
}

function applyTenantFilter(rows, cfg, context) {
	if (!cfg.requiresTenant) {
		return rows;
	}

	if (cfg.tier === 'silo') {
		return rows.filter(function (row) {
			var rowTenant = asString(row.tenant_id);
			return !rowTenant || rowTenant === context.tenantId;
		});
	}

	return rows.filter(function (row) {
		return asString(row.tenant_id) === context.tenantId;
	});
}

function applyParamFilters(rows, params) {
	var skipKeys = { action: true, resource: true, tenant_id: true, tenantId: true, domain: true, token: true };
	return rows.filter(function (row) {
		for (var key in params) {
			if (!params.hasOwnProperty(key) || skipKeys[key]) continue;
			if (String(row[key] || '') !== String(params[key] || '')) {
				return false;
			}
		}
		return true;
	});
}

function allowRowForTenant(row, cfg, context) {
	if (!cfg.requiresTenant) {
		return true;
	}
	if (cfg.tier === 'silo') {
		return !row.tenant_id || asString(row.tenant_id) === context.tenantId;
	}
	return asString(row.tenant_id) === context.tenantId;
}

function assertTenantOwnership(row, cfg, context) {
	if (!cfg.requiresTenant) {
		return;
	}
	if (!allowRowForTenant(row, cfg, context)) {
		throw new Error('Cross-tenant access denied');
	}
}

function ensureMetaColumns(sheet) {
	var data = sheet.getDataRange().getValues();
	if (data.length === 0) {
		sheet.getRange(1, 1, 1, REQUIRED_META_COLUMNS.length).setValues([REQUIRED_META_COLUMNS]);
		return;
	}
	var headers = data[0].map(asString);
	var changed = false;
	REQUIRED_META_COLUMNS.forEach(function (col) {
		if (headers.indexOf(col) < 0) {
			headers.push(col);
			changed = true;
		}
	});
	if (changed) {
		sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
	}
}

function applyMeta(record, context, actor, now) {
	record.tenant_id = record.tenant_id || context.tenantId;
	record.updated_at = now;
	record.updated_by = actor;
	if (!record.created_at) {
		record.created_at = now;
	}
}

function getTripById(context, tripId) {
	var cfg = getResourceConfig('trips');
	var sheet = getSheetForResource(cfg, context);
	if (!sheet) return null;
	var rows = applyTenantFilter(sheetToObjects(sheet), cfg, context);
	for (var i = 0; i < rows.length; i++) {
		if (asString(rows[i]['Mã chuyến']) === tripId) {
			return rows[i];
		}
	}
	return null;
}

function listExpensesByTrip(context, tripId) {
	var cfg = getResourceConfig('expenses');
	var sheet = getSheetForResource(cfg, context);
	if (!sheet) return [];
	var rows = applyTenantFilter(sheetToObjects(sheet), cfg, context);
	return rows.filter(function (row) {
		return asString(row['Chuyến']) === tripId;
	});
}

function writeAuditLog(context, actor, action, resource, keyValue, beforeObj, afterObj, result) {
	try {
		var cfg = getResourceConfig('auditlog');
		var sheet = getOrCreateSheetForResource(cfg, context, ['timestamp', 'tenant_id', 'actor', 'action', 'resource', 'key_value', 'before_json', 'after_json', 'result']);
		var headers = sheet.getDataRange().getValues()[0].map(asString);
		var rowObj = {
			timestamp: isoNow(),
			tenant_id: context.tenantId,
			actor: actor || 'unknown',
			action: action,
			resource: resource,
			key_value: keyValue || '',
			before_json: JSON.stringify(slimSnapshot(beforeObj)),
			after_json: JSON.stringify(slimSnapshot(afterObj)),
			result: result || 'ok',
			record_id: buildRecordId(context.tenantId, 'auditlog', action),
			created_at: isoNow(),
			updated_at: isoNow(),
			updated_by: actor || 'unknown'
		};
		sheet.appendRow(objectToRow(headers, rowObj));
	} catch (error) {
	}
}

function filterActiveTenants(rows) {
	return rows.filter(function (row) {
		var status = String(row.status || 'active').toLowerCase();
		return status === 'active' || status === 'trial' || status === 'pilot';
	});
}

function parseApiKeys() {
	var raw = String(PropertiesService.getScriptProperties().getProperty('API_KEYS') || '').trim();
	if (!raw) return {};
	var map = {};
	raw.split(',').forEach(function (pair) {
		var tokenRole = pair.split(':');
		if (tokenRole.length < 2) return;
		var token = tokenRole[0].trim();
		if (!token) return;
		map[token] = {
			role: tokenRole[1].trim(),
			scope: (tokenRole[2] || '').trim(),
			subject: (tokenRole[3] || '').trim()
		};
	});
	return map;
}

function resolveUserAccountAuth(token, context) {
	var cfg = getResourceConfig('useraccounts');
	var sheet = getSheetForResource(cfg, context);
	if (!sheet) {
		return { ok: false, code: 'unauthorized_token', error: 'Invalid token' };
	}

	var rows = applyTenantFilter(sheetToObjects(sheet), cfg, context);
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var candidateToken = asString(row.api_token || row.token || row.access_token);
		if (!candidateToken || candidateToken !== token) {
			continue;
		}

		var status = asString(row.status || 'active').toLowerCase();
		if (status && status !== 'active') {
			return { ok: false, code: 'account_inactive', error: 'User account is inactive' };
		}

		var role = normalizeRole(asString(row.role || 'user_tenant'));
		var scope = asString(row.tenant_id || context.tenantId);
		if ((role === 'admin_tenant' || role === 'editor_tenant' || role === 'user_tenant') && scope !== String(context.tenantId)) {
			return { ok: false, code: 'tenant_scope_violation', error: 'User account tenant scope mismatch' };
		}

		var subject = asString(row.user_id || row.email || row.display_name || 'tenant_user');
		return { ok: true, role: role, scope: scope, subject: subject };
	}

	return { ok: false, code: 'unauthorized_token', error: 'Invalid token' };
}

function normalizeRole(rawRole) {
	var role = String(rawRole || '').trim().toLowerCase();
	if (!role) return 'user_tenant';

	var normalized = role
		.replace(/[\s\-]+/g, '_')
		.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
		.replace(/[èéẹẻẽêềếệểễ]/g, 'e')
		.replace(/[ìíịỉĩ]/g, 'i')
		.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
		.replace(/[ùúụủũưừứựửữ]/g, 'u')
		.replace(/[ỳýỵỷỹ]/g, 'y')
		.replace(/đ/g, 'd');

	if (normalized === 'admin') return 'admin_global';
	if (normalized === 'admin_global' || normalized === 'admin_tenant' || normalized === 'editor_tenant' || normalized === 'user_tenant') return normalized;

	if (normalized === 'manager' || normalized === 'quan_ly' || normalized === 'supervisor') return 'admin_tenant';
	if (normalized === 'accountant' || normalized === 'ke_toan' || normalized === 'dispatcher' || normalized === 'dieu_phoi') return 'editor_tenant';
	if (normalized === 'driver' || normalized === 'tai_xe' || normalized === 'viewer' || normalized === 'read_only' || normalized === 'user') return 'user_tenant';
	if (normalized === 'editor') return 'editor_tenant';

	return 'user_tenant';
}

function parsePostPayload(e) {
	if (!e || !e.postData || !e.postData.contents) {
		return {};
	}
	var content = e.postData.contents;
	try {
		return JSON.parse(content);
	} catch (_err) {
		var obj = {};
		content.split('&').forEach(function (part) {
			var kv = part.split('=');
			if (!kv[0]) return;
			obj[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
		});
		return obj;
	}
}

function sheetToObjects(sheet) {
	var values = sheet.getDataRange().getValues();
	if (!values || values.length < 2) return [];
	var headers = values[0].map(asString);
	var rows = [];
	for (var i = 1; i < values.length; i++) {
		rows.push(toObject(headers, values[i]));
	}
	return rows;
}

function toObject(headers, row) {
	var obj = {};
	for (var i = 0; i < headers.length; i++) {
		obj[headers[i]] = row[i];
	}
	return obj;
}

function objectToRow(headers, obj) {
	return headers.map(function (header) {
		var value = obj[header];
		return value === undefined || value === null ? '' : value;
	});
}

function mergeHeaders(seedHeaders, rows) {
	var list = [];
	(seedHeaders || []).forEach(function (header) { ensureHeaderColumn(list, header); });
	(rows || []).forEach(function (row) {
		for (var key in row) {
			if (row.hasOwnProperty(key)) {
				ensureHeaderColumn(list, key);
			}
		}
	});
	return list;
}

function ensureHeaderColumn(headers, col) {
	if (!col) return;
	if (headers.indexOf(col) < 0) {
		headers.push(col);
	}
}

function indexMap(headers) {
	var map = {};
	for (var i = 0; i < headers.length; i++) {
		map[headers[i]] = i;
	}
	return map;
}

function buildRecordId(tenantId, resource, suffix) {
	return [tenantId, resource, suffix || new Date().getTime()].join('_');
}

function buildHumanCode(prefix, context) {
	var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'yyMM');
	var seed = ('' + new Date().getTime()).slice(-4);
	return prefix + date + seed;
}

function getActor(auth, payload) {
	return String(payload.actor || payload.updated_by || auth.subject || 'anonymous');
}

function normalizeResource(resource) {
	var name = String(resource || '').trim();
	if (!name) {
		throw new Error('Missing resource');
	}
	return name.toLowerCase();
}

function parseJsonSafe(value, fallback) {
	try {
		return JSON.parse(value);
	} catch (_err) {
		return fallback;
	}
}

function parseNumber(value) {
	if (value === null || value === undefined || value === '') {
		return 0;
	}
	var normalized = String(value).replace(/,/g, '').trim();
	var parsed = parseFloat(normalized);
	return isNaN(parsed) ? 0 : parsed;
}

function extractSpreadsheetId(url) {
	var match = String(url || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
	return match ? match[1] : '';
}

function asString(value) {
	return value === null || value === undefined ? '' : String(value).trim();
}

function shallowClone(obj) {
	var target = {};
	if (!obj) return target;
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			target[key] = obj[key];
		}
	}
	return target;
}

function slimSnapshot(obj) {
	if (!obj) return null;
	var result = {};
	var allow = ['tenant_id', 'record_id', 'Mã chuyến', 'Mã xe', 'Mã tài xế', 'Mã KH', 'Mã tuyến', 'Mã chi phí', 'Trạng thái', 'updated_at', 'updated_by'];
	for (var i = 0; i < allow.length; i++) {
		var key = allow[i];
		if (obj[key] !== undefined) {
			result[key] = obj[key];
		}
	}
	return result;
}

function okResult(data) {
	var out = { status: 'ok' };
	if (data) {
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				out[key] = data[key];
			}
		}
	}
	return out;
}

function errorResult(message, extra) {
	var out = { status: 'error', message: message || 'Unknown error' };
	if (extra) {
		for (var key in extra) {
			if (extra.hasOwnProperty(key)) {
				out[key] = extra[key];
			}
		}
	}
	return out;
}

function jsonOutput(data) {
	return ContentService
		.createTextOutput(JSON.stringify(data))
		.setMimeType(ContentService.MimeType.JSON);
}

function isoNow() {
	return new Date().toISOString();
}

/**
 * ============================================================
 * CUSTOM SETUP (RUN FROM APPS SCRIPT DROPDOWN)
 * ============================================================
 * 1) Sửa SETUP_CONFIG (SPREADSHEET_ID, TENANT_ID, TENANT_DOMAIN)
 * 2) Chạy setupTransportCustom()
 * 3) Chạy printTransportEnv() để copy .env
 */
function setupTransportCustom() {
	var props = PropertiesService.getScriptProperties();
	var spreadsheetId = asString(SETUP_CONFIG.SPREADSHEET_ID) || asString(props.getProperty('SPREADSHEET_ID'));
	if (!spreadsheetId) {
		throw new Error('Thiếu SPREADSHEET_ID. Hãy điền SETUP_CONFIG.SPREADSHEET_ID hoặc chạy setSetupSpreadsheetId("SPREADSHEET_ID_OR_URL") trước.');
	}

	props.setProperty('SPREADSHEET_ID', spreadsheetId);
	props.setProperty('DEFAULT_TENANT_ID', SETUP_CONFIG.TENANT_ID);
	if (SETUP_CONFIG.ADMIN_TOKEN && SETUP_CONFIG.ADMIN_TOKEN !== 'change_me_admin_token') {
		props.setProperty('ADMIN_TOKEN', SETUP_CONFIG.ADMIN_TOKEN);
	}

	var ss = SpreadsheetApp.openById(spreadsheetId);

	var tenantId = SETUP_CONFIG.TENANT_ID;
	var now = isoNow();

	ensureSheetWithHeaders_(ss, 'Tenants', [
		'tenant_id', 'domain', 'app_name', 'primary_color', 'support_email', 'status', 'spreadsheet_id', 'feature_flags_json', 'plan_code'
	]);
	ensureSheetWithSeed_(ss, 'User Account', ['tenant_id', 'user_id', 'email', 'display_name', 'role', 'status', 'api_token', 'created_at', 'updated_at'], [
		[tenantId, 'admin-' + tenantId, 'admin@' + SETUP_CONFIG.TENANT_DOMAIN, 'Tenant Admin', 'admin_tenant', 'active', 'REPLACE_ADMIN_TENANT_TOKEN', now, now],
		[tenantId, 'manager-' + tenantId, 'manager@' + SETUP_CONFIG.TENANT_DOMAIN, 'Quản lý vận hành', 'manager', 'active', 'REPLACE_MANAGER_TOKEN', now, now],
		[tenantId, 'accountant-' + tenantId, 'accountant@' + SETUP_CONFIG.TENANT_DOMAIN, 'Kế toán', 'accountant', 'active', 'REPLACE_ACCOUNTANT_TOKEN', now, now],
		[tenantId, 'driver-' + tenantId, 'driver@' + SETUP_CONFIG.TENANT_DOMAIN, 'Tài xế', 'driver', 'active', 'REPLACE_DRIVER_TOKEN', now, now],
		[tenantId, 'editor-' + tenantId, 'editor@' + SETUP_CONFIG.TENANT_DOMAIN, 'Tenant Editor', 'editor_tenant', 'active', 'REPLACE_EDITOR_TENANT_TOKEN', now, now],
		[tenantId, 'user-' + tenantId, 'user@' + SETUP_CONFIG.TENANT_DOMAIN, 'Tenant User', 'user_tenant', 'active', 'REPLACE_USER_TENANT_TOKEN', now, now]
	]);
	ensureSheetWithSeed_(ss, 'FeatureFlags', ['flag_key', 'flag_value', 'description'], [
		['trip_close_guard_ratio', '1.2', 'Khoá đóng chuyến nếu chi phí > 120% doanh thu'],
		['enable_maintenance_alert', 'true', 'Bật cảnh báo bảo trì']
	]);
	ensureSheetWithSeed_(ss, 'PlanLimits', ['plan_code', 'metric_key', 'metric_value'], [
		['default', 'max_vehicles', '500'],
		['default', 'max_drivers', '1000']
	]);
	ensureSheetWithHeaders_(ss, 'AuditLog', ['timestamp', 'tenant_id', 'actor', 'action', 'resource', 'key_value', 'before_json', 'after_json', 'result']);

	// Sheet dữ liệu tối ưu - Tiếng Việt duy nhất (Vietnamese-only infrastructure)
	ensureSheetWithSeed_(ss, 'Danh Muc Xe', ['tenant_id', 'Mã xe', 'Biển số', 'Loại xe', 'Trạng thái'], [
		[tenantId, 'XE001', '79C-123.45', 'Tải 8 tấn', 'active'],
		[tenantId, 'XE002', '79H-456.78', 'Container', 'active'],
		[tenantId, 'XE003', '79C-888.99', 'Tải 5 tấn', 'inactive']
	]);
	ensureSheetWithSeed_(ss, 'Tai Xe', ['tenant_id', 'Mã tài xế', 'Họ tên', 'Điện thoại', 'Trạng thái'], [
		[tenantId, 'TX001', 'Nguyễn Văn A', '0909000001', 'active'],
		[tenantId, 'TX002', 'Trần Văn B', '0909000002', 'active'],
		[tenantId, 'TX003', 'Lê Văn C', '0909000003', 'inactive']
	]);
	ensureSheetWithSeed_(ss, 'Khach Hang', ['tenant_id', 'Mã KH', 'Tên khách hàng', 'Điện thoại', 'Trạng thái'], [
		[tenantId, 'KH001', 'Công ty Xây Dựng Bình Minh', '02583888888', 'active'],
		[tenantId, 'KH002', 'CTY TM An Phát', '02583777777', 'active'],
		[tenantId, 'KH003', 'Nhà máy Gạch ABC', '02583666666', 'active']
	]);
	ensureSheetWithSeed_(ss, 'Tuyen Duong', ['tenant_id', 'Mã tuyến', 'Tên tuyến', 'Điểm đi', 'Điểm đến'], [
		[tenantId, 'TD001', 'Nha Trang - TP.HCM', 'Nha Trang', 'TP.HCM'],
		[tenantId, 'TD002', 'Nha Trang - Đà Nẵng', 'Nha Trang', 'Đà Nẵng'],
		[tenantId, 'TD003', 'Nha Trang - Buôn Ma Thuột', 'Nha Trang', 'Buôn Ma Thuột']
	]);
	ensureSheetWithSeed_(ss, 'Chuyen Van Chuyen', ['tenant_id', 'Mã chuyến', 'Xe', 'Tài xế', 'Tuyến', 'Khách hàng', 'Ngày đi', 'Cước vận chuyển', 'Trạng thái'], [
		[tenantId, 'CD26030001', 'XE001', 'TX001', 'TD001', 'KH001', '2026-03-20', 18000000, 'Đã xác nhận'],
		[tenantId, 'CD26030002', 'XE002', 'TX002', 'TD002', 'KH002', '2026-03-21', 26000000, 'Mới'],
		[tenantId, 'CD26030003', 'XE001', 'TX001', 'TD003', 'KH003', '2026-03-22', 12000000, 'Đã đóng']
	]);
	ensureSheetWithSeed_(ss, 'Chi Phi', ['tenant_id', 'Mã chi phí', 'Ngày chi', 'Loại chi phí', 'Chuyến', 'Số tiền', 'Trạng thái'], [
		[tenantId, 'CP26030001', '2026-03-20', 'FUEL', 'CD26030001', 3500000, 'confirmed'],
		[tenantId, 'CP26030002', '2026-03-20', 'TOLL', 'CD26030001', 1200000, 'confirmed'],
		[tenantId, 'CP26030003', '2026-03-22', 'LOADING', 'CD26030003', 900000, 'confirmed']
	]);
	ensureSheetWithSeed_(ss, 'Bao Tri', ['tenant_id', 'Mã lệnh', 'Xe', 'Loại bảo trì', 'Ngày dự kiến', 'Trạng thái'], [
		[tenantId, 'BT26030001', 'XE001', 'Bảo dưỡng định kỳ', '2026-03-28', 'planned'],
		[tenantId, 'BT26030002', 'XE002', 'Thay lốp', '2026-03-30', 'planned']
	]);
	ensureSheetWithSeed_(ss, 'Don Hang', ['tenant_id', 'Mã đơn', 'Ngày tạo', 'Khách hàng', 'Trạng thái'], [
		[tenantId, 'DH26030001', '2026-03-20', 'KH001', 'active']
	]);
	ensureSheetWithSeed_(ss, 'Kho Lop', ['tenant_id', 'Mã lốp', 'Tên lốp', 'Số lượng', 'Trạng thái'], [
		[tenantId, 'LOP001', 'Lốp Michelin 11R22.5', 10, 'active']
	]);
	ensureSheetWithSeed_(ss, 'Kho Vat Tu', ['tenant_id', 'Mã vật tư/CCDC', 'Tên vật tư', 'Số lượng', 'Trạng thái'], [
		[tenantId, 'VT001', 'Bơm nước', 5, 'active']
	]);
	ensureSheetWithSeed_(ss, 'Kho Nhien Lieu', ['tenant_id', 'Mã vật tư/CCDC', 'Tên nhiên liệu', 'Số lượng', 'Trạng thái'], [
		[tenantId, 'NL001', 'Dầu Diesel 0.05S', 5000, 'active'],
		[tenantId, 'NL002', 'Nhớt động cơ', 200, 'active']
	]);
	ensureSheetWithSeed_(ss, 'Kho CCDC', ['tenant_id', 'Mã vật tư/CCDC', 'Tên CCDC', 'Số lượng', 'Trạng thái'], [
		[tenantId, 'CC001', 'Súng xiết bu lông', 3, 'active']
	]);

	// Migration nhẹ cho các sheet cũ thiếu tenant_id
	ensureTenantColumnAndBackfill_(ss, 'Danh Muc Xe', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Tai Xe', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Khach Hang', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Tuyen Duong', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Chuyen Van Chuyen', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Chi Phi', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Bao Tri', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Don Hang', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Kho Lop', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Kho Vat Tu', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Kho Nhien Lieu', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'Kho CCDC', tenantId);
	ensureTenantColumnAndBackfill_(ss, 'User Account', tenantId);

	upsertTenantRow_(ss, {
		tenant_id: SETUP_CONFIG.TENANT_ID,
		domain: SETUP_CONFIG.TENANT_DOMAIN,
		app_name: SETUP_CONFIG.APP_NAME,
		primary_color: SETUP_CONFIG.PRIMARY_COLOR,
		support_email: '',
		status: SETUP_CONFIG.TENANT_STATUS,
		spreadsheet_id: spreadsheetId,
		feature_flags_json: '{}',
		plan_code: 'default'
	});

	var envText = printTransportEnv();
	Logger.log('✅ setupTransportCustom xong. Copy .env:\n' + envText);

	return okResult({
		message: 'Setup hoàn tất - Tối ưu Việt Nam Only',
		spreadsheetId: spreadsheetId,
		tenantId: SETUP_CONFIG.TENANT_ID,
		createdSheets: ['Tenants', 'User Account', 'FeatureFlags', 'PlanLimits', 'AuditLog', 'Danh Muc Xe', 'Tai Xe', 'Khach Hang', 'Tuyen Duong', 'Chuyen Van Chuyen', 'Chi Phi', 'Bao Tri', 'Don Hang', 'Kho Lop', 'Kho Vat Tu', 'Kho Nhien Lieu', 'Kho CCDC'],
		totalSheets: 17,
		env: envText
	});
}

function setSetupSpreadsheetId(spreadsheetIdOrUrl) {
	var raw = asString(spreadsheetIdOrUrl);
	if (!raw) {
		throw new Error('Thiếu tham số spreadsheetIdOrUrl');
	}
	var spreadsheetId = raw;
	if (raw.indexOf('http') === 0) {
		spreadsheetId = extractSpreadsheetId(raw);
	}
	if (!spreadsheetId) {
		throw new Error('Không parse được Spreadsheet ID từ giá trị truyền vào');
	}
	PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
	return okResult({ message: 'Đã lưu SPREADSHEET_ID', spreadsheetId: spreadsheetId });
}

function clearTransportSampleData_() {
	var props = PropertiesService.getScriptProperties();
	var spreadsheetId = asString(props.getProperty('SPREADSHEET_ID')) || asString(SETUP_CONFIG.SPREADSHEET_ID);
	if (!spreadsheetId) {
		throw new Error('Thiếu SPREADSHEET_ID. Chạy STEP_1_Nhap_ID_SHEET trước.');
	}

	var ss = SpreadsheetApp.openById(spreadsheetId);
	var targetSheets = [
		'Danh Muc Xe',
		'Tai Xe',
		'Khach Hang',
		'Tuyen Duong',
		'Chuyen Van Chuyen',
		'Chi Phi',
		'Bao Tri',
		'Don Hang',
		'Kho Lop',
		'Kho Vat Tu',
		'Kho Nhien Lieu',
		'Kho CCDC'
	];

	var cleared = [];
	for (var i = 0; i < targetSheets.length; i++) {
		var sheetName = targetSheets[i];
		var sheet = ss.getSheetByName(sheetName);
		if (!sheet) {
			continue;
		}

		var lastRow = sheet.getLastRow();
		var lastCol = sheet.getLastColumn();
		if (lastRow > 1 && lastCol > 0) {
			sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
			cleared.push(sheetName);
		}
	}

	return okResult({
		message: 'Đã xóa dữ liệu mẫu (giữ header)',
		spreadsheetId: spreadsheetId,
		clearedSheets: cleared
	});
}

/**
 * ============================================================
 * CÁC HÀM UI CHO WEB APP HTML (FleetProV3SetupUI.html)
 * ============================================================
 */
function uiGetSetupSnapshot() {
	var props = PropertiesService.getScriptProperties();
	var spreadsheetId = asString(props.getProperty('SPREADSHEET_ID')) || asString(SETUP_CONFIG.SPREADSHEET_ID);
	return {
		status: 'ok',
		spreadsheetId: spreadsheetId || 'Chưa cấu hình',
		tenantId: SETUP_CONFIG.TENANT_ID,
		domain: SETUP_CONFIG.TENANT_DOMAIN
	};
}

function uiSetSpreadsheetId(input) {
	try {
		return setSetupSpreadsheetId(input);
	} catch (err) {
		return { status: 'error', message: err.message || String(err) };
	}
}

function uiSeedSampleData() {
	try {
		return setupTransportCustom();
	} catch (err) {
		return { status: 'error', message: err.message || String(err) };
	}
}

function uiClearSampleData() {
	try {
		return clearTransportSampleData_();
	} catch (err) {
		return { status: 'error', message: err.message || String(err) };
	}
}

function uiRunAllInOne() {
	try {
		var props = PropertiesService.getScriptProperties();
		var spreadsheetId = asString(props.getProperty('SPREADSHEET_ID')) || asString(SETUP_CONFIG.SPREADSHEET_ID);
		if (!spreadsheetId) {
			return { status: 'error', message: 'Vui lòng nhập và lưu Spreadsheet ID trước khi chạy ALL IN ONE.' };
		}
		return setupTransportCustom();
	} catch (err) {
		return { status: 'error', message: err.message || String(err) };
	}
}

function uiExplainMvpMap() {
	return {
		status: 'ok',
		app: TRANSPORT_APP_NAME,
		mvp_map: MVP_MAP,
		resources: Object.keys(RESOURCE_MAP)
	};
}

function onOpen() {
	try {
		buildFleetProV3SetupMenu_();
	} catch (err) {
		Logger.log('Error in onOpen: ' + err.message);
	}
}

function buildFleetProV3SetupMenu_() {
	try {
		var ui = SpreadsheetApp.getUi();
		ui.createMenu('🚀 FleetPro V3 Setup PRO')
			.addItem('🌟 Mở Giao Diện Setup PRO (HTML Sidebar)', 'showSetupProSidebar')
			.addItem('💻 Mở Giao Diện Setup PRO (Cửa sổ lớn)', 'showSetupProDialog')
			.addSeparator()
			.addItem('⚡ 1. Cấu hình & Seed Data Mẫu', 'setupTransportCustom')
			.addItem('🧹 2. Xóa Data Mẫu (Giữ Header)', 'clearTransportSampleData_')
			.addSeparator()
			.addItem('🔑 Xem Biến Môi Trường (.env)', 'showEnvDialog_')
			.addToUi();
	} catch (err) {
		// Không chạy được nếu script là standalone (chưa gắn vào container Spreadsheet)
	}
}

function showSetupProSidebar() {
	var html = HtmlService.createHtmlOutputFromFile('FleetProV3SetupUI')
		.setTitle('🚀 FleetPro V3 Setup PRO')
		.setWidth(450);
	SpreadsheetApp.getUi().showSidebar(html);
}

function showSetupProDialog() {
	var html = HtmlService.createHtmlOutputFromFile('FleetProV3SetupUI')
		.setWidth(680)
		.setHeight(580);
	SpreadsheetApp.getUi().showModalDialog(html, '🚀 FleetPro V3 Setup PRO - All In One');
}

function showEnvDialog_() {
	var envText = printTransportEnv();
	var html = HtmlService.createHtmlOutput('<pre style="padding:15px; font-family:monospace; font-size:13px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; user-select:all;">' + envText + '</pre>')
		.setWidth(550)
		.setHeight(300);
	SpreadsheetApp.getUi().showModalDialog(html, 'Biến Môi Trường (.env) - Copy vào dự án');
}

function printTransportEnv() {
	var props = PropertiesService.getScriptProperties();
	var spreadsheetId = asString(props.getProperty('SPREADSHEET_ID')) || asString(SETUP_CONFIG.SPREADSHEET_ID);
	var envText = [
		'# FleetPro V3 Transport Configuration',
		'VITE_GOOGLE_SHEET_ID=' + spreadsheetId,
		'VITE_TENANT_ID=' + SETUP_CONFIG.TENANT_ID,
		'VITE_TENANT_DOMAIN=' + SETUP_CONFIG.TENANT_DOMAIN,
		'VITE_APP_NAME="' + SETUP_CONFIG.APP_NAME + '"',
		'VITE_API_SECRET_KEY=' + SETUP_CONFIG.ADMIN_TOKEN
	].join('\n');
	return envText;
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
	var sheet = ss.getSheetByName(sheetName);
	if (!sheet) {
		sheet = ss.insertSheet(sheetName);
	}
	var data = sheet.getDataRange().getValues();
	if (data.length === 0) {
		sheet.appendRow(headers);
		sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
	}
	return sheet;
}

function ensureSheetWithSeed_(ss, sheetName, headers, seedRows) {
	var sheet = ensureSheetWithHeaders_(ss, sheetName, headers);
	var data = sheet.getDataRange().getValues();
	if (data.length <= 1 && seedRows && seedRows.length > 0) {
		seedRows.forEach(function(row) {
			sheet.appendRow(row);
		});
	}
	return sheet;
}

function ensureTenantColumnAndBackfill_(ss, sheetName, tenantId) {
	var sheet = ss.getSheetByName(sheetName);
	if (!sheet) return;
	var data = sheet.getDataRange().getValues();
	if (data.length === 0) return;
	var headers = data[0].map(asString);
	var colIdx = headers.indexOf('tenant_id');
	if (colIdx < 0) {
		colIdx = 0;
		sheet.insertColumnBefore(1);
		sheet.getRange(1, 1).setValue('tenant_id').setFontWeight("bold").setBackground("#dcfce7");
		var lastRow = sheet.getLastRow();
		if (lastRow > 1) {
			sheet.getRange(2, 1, lastRow - 1, 1).setValue(tenantId);
		}
	} else {
		var lastRow = sheet.getLastRow();
		if (lastRow > 1) {
			var values = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
			var changed = false;
			for (var r = 0; r < values.length; r++) {
				if (!values[r][0]) {
					values[r][0] = tenantId;
					changed = true;
				}
			}
			if (changed) {
				sheet.getRange(2, colIdx + 1, lastRow - 1, 1).setValues(values);
			}
		}
	}
}

function upsertTenantRow_(ss, tenantObj) {
	var sheet = ensureSheetWithHeaders_(ss, 'Tenants', [
		'tenant_id', 'domain', 'app_name', 'primary_color', 'support_email', 'status', 'spreadsheet_id', 'feature_flags_json', 'plan_code'
	]);
	var data = sheet.getDataRange().getValues();
	var headers = data[0].map(asString);
	var idIdx = headers.indexOf('tenant_id');
	var foundRow = -1;
	if (idIdx >= 0) {
		for (var r = 1; r < data.length; r++) {
			if (asString(data[r][idIdx]) === tenantObj.tenant_id) {
				foundRow = r + 1;
				break;
			}
		}
	}
	var rowArray = objectToRow(headers, tenantObj);
	if (foundRow > 0) {
		sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowArray]);
	} else {
		sheet.appendRow(rowArray);
	}
}

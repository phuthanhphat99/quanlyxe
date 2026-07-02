const API_KEY = "AIzaSyDSDAaGKHTK6xdCUIV-Lw2ca0dL-mb7XF4";
const PROJECT_ID = "quanlyxe-phuan";
const TENANT_ID = "internal-tenant-phuan";

const newVehicles = require('./extract.cjs') || [];

async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

async function getVehiclesByTenant(idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'vehicles' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'tenant_id' },
          op: 'EQUAL',
          value: { stringValue: TENANT_ID }
        }
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  // runQuery returns an array of { document: {...} } objects
  return data.map(d => d.document).filter(Boolean);
}

async function deleteVehicle(idToken, name) {
  const url = `https://firestore.googleapis.com/v1/${name}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  const data = await res.json();
  if (data && data.error) throw new Error(data.error.message);
}

async function createVehicle(idToken, v) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/vehicles`;
  const now = new Date().toISOString();
  
  const capacity_tons = v.vehicle_type === 'CONTAINER' ? 30 : 15;
  const capacity_cbm = v.vehicle_type === 'CONTAINER' ? 68 : 35;
  const fuel_consumption = v.vehicle_type === 'CONTAINER' ? 35 : 20;

  const body = {
    fields: {
      vehicle_code: { stringValue: v.vehicle_code },
      license_plate: { stringValue: v.license_plate },
      vehicle_type: { stringValue: v.vehicle_type === 'CONTAINER' ? 'container' : 'truck' },
      brand: { stringValue: v.brand },
      fuel_type: { stringValue: v.fuel_type },
      capacity_tons: { doubleValue: capacity_tons },
      capacity_cbm: { doubleValue: capacity_cbm },
      fuel_consumption_per_100km: { doubleValue: fuel_consumption },
      current_odometer: { integerValue: 100000 },
      usage_limit_years: { stringValue: String(v.usage_limit_years) },
      status: { stringValue: 'active' },
      tenant_id: { stringValue: TENANT_ID },
      created_at: { stringValue: now },
      updated_at: { stringValue: now },
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

(async () => {
  try {
    const auth = await signIn('admin@phuancr.vn', 'Demo@1234');
    if (auth.error) throw new Error(auth.error.message);
    const idToken = auth.idToken;

    console.log("Fetching existing vehicles...");
    const existing = await getVehiclesByTenant(idToken);
    console.log(`Found ${existing.length} existing vehicles for tenant ${TENANT_ID}. Deleting...`);
    
    for (const v of existing) {
       await deleteVehicle(idToken, v.name);
    }
    console.log("Deleted old vehicles.");

    const parsedVehicles = require('./extract.cjs');

    console.log(`Seeding ${parsedVehicles.length} real vehicles...`);
    
    let success = 0;
    for (const v of parsedVehicles) {
        await createVehicle(idToken, v);
        console.log(`✅ Seeded ${v.license_plate}`);
        success++;
    }

    console.log(`\n🎉 Seeded ${success} vehicles successfully.`);

  } catch(e) {
    console.error("Fatal Error:", e);
  }
})();

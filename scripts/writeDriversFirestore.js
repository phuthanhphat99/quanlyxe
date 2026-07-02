const API_KEY = "AIzaSyDSDAaGKHTK6xdCUIV-Lw2ca0dL-mb7XF4";
const PROJECT_ID = "quanlyxe-phuan";
const TENANT_ID = "internal-tenant-phuan";

const drivers = [];
for (let i = 1; i <= 33; i++) {
  drivers.push({ email: `taixe${i}@phuancr.vn`, password: 'Demo@1234', name: `Tài xế ${i}` });
}

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

async function writeFirestoreUser(idToken, uid, user) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const now = new Date().toISOString();
  
  const body = {
    fields: {
      email: { stringValue: user.email },
      full_name: { stringValue: user.name },
      role: { stringValue: 'driver' },
      status: { stringValue: 'active' },
      tenant_id: { stringValue: TENANT_ID },
      created_at: { stringValue: now },
    }
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data;
}

(async () => {
  console.log(`\n📝 Ghi ${drivers.length} hồ sơ tài xế vào Firestore...\n`);
  let success = 0, fail = 0;
  
  for (const d of drivers) {
    try {
      // Step 1: Sign in to get idToken and UID
      const auth = await signIn(d.email, d.password);
      if (auth.error) {
        console.error(`❌ ${d.email} — Login failed: ${auth.error.message}`);
        fail++;
        continue;
      }
      
      // Step 2: Write user profile to Firestore
      await writeFirestoreUser(auth.idToken, auth.localId, d);
      console.log(`✅ ${d.email} — UID: ${auth.localId} → Firestore OK`);
      success++;
    } catch (err) {
      console.error(`❌ ${d.email} — ${err.message}`);
      fail++;
    }
  }
  
  console.log(`\n📊 Kết quả: ${success} thành công, ${fail} thất bại\n`);
})();

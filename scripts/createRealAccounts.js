const API_KEY = "AIzaSyDSDAaGKHTK6xdCUIV-Lw2ca0dL-mb7XF4";
const PROJECT_ID = "quanlyxe-phuan";
const TENANT_ID = "internal-tenant-phuan";

const users = [
  { email: 'admin@phuancr.vn', password: 'Demo@1234', role: 'admin', full_name: 'Quản Trị Viên Phú An' },
  { email: 'quanly@phuancr.vn', password: 'Demo@1234', role: 'manager', full_name: 'Quản Lý Vận Hành' },
  { email: 'ketoan@phuancr.vn', password: 'Demo@1234', role: 'accountant', full_name: 'Kế Toán' },
  { email: 'taixe@phuancr.vn', password: 'Demo@1234', role: 'driver', full_name: 'Tài Xế Phú An' }
];

async function createAccount(user) {
  console.log(`Creating ${user.email}...`);
  // 1. Sign up
  const signupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true })
  });
  
  const signupData = await signupRes.json();
  if (signupData.error) {
    if (signupData.error.message === 'EMAIL_EXISTS') {
        console.log(`[SKIP] ${user.email} already exists. Attempting login to sync Firestore...`);
        const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true })
        });
        const loginData = await loginRes.json();
        if (loginData.error) {
            console.error(`Failed to login ${user.email}:`, loginData.error.message);
            return;
        }
        await updateFirestore(loginData.localId, loginData.idToken, user);
        return;
    }
    console.error(`Error creating ${user.email}:`, signupData.error.message);
    return;
  }
  
  // 2. Update Firestore
  await updateFirestore(signupData.localId, signupData.idToken, user);
}

async function updateFirestore(uid, token, user) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const firestoreRes = await fetch(url, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fields: {
        email: { stringValue: user.email },
        full_name: { stringValue: user.full_name },
        role: { stringValue: user.role },
        tenant_id: { stringValue: TENANT_ID },
        status: { stringValue: 'active' },
        created_at: { stringValue: new Date().toISOString() }
      }
    })
  });
  const firestoreData = await firestoreRes.json();
  if (firestoreData.error) {
    console.error(`Error writing Firestore for ${user.email}:`, firestoreData.error.message);
  } else {
    console.log(`[SUCCESS] ${user.email} created/updated with role: ${user.role}`);
  }
}

async function run() {
  for (const u of users) {
    await createAccount(u);
  }
  console.log("Done!");
}

run();

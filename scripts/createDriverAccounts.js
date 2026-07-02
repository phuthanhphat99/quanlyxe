const API_KEY = "AIzaSyDSDAaGKHTK6xdCUIV-Lw2ca0dL-mb7XF4";

const drivers = [];
for (let i = 1; i <= 33; i++) {
  drivers.push({ email: `taixe${i}@phuancr.vn`, password: 'Demo@1234', name: `Tài xế ${i}` });
}

async function createAccount(user) {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          displayName: user.name,
          returnSecureToken: true,
        }),
      }
    );
    const data = await res.json();
    if (data.error) {
      if (data.error.message === 'EMAIL_EXISTS') {
        console.log(`⏭️  ${user.email} — đã tồn tại (OK)`);
      } else {
        console.error(`❌ ${user.email} — ${data.error.message}`);
      }
    } else {
      console.log(`✅ ${user.email} — UID: ${data.localId}`);
    }
  } catch (err) {
    console.error(`❌ ${user.email} — ${err.message}`);
  }
}

(async () => {
  console.log(`\n🚛 Tạo ${drivers.length} tài khoản tài xế cho Phú An...\n`);
  for (const d of drivers) {
    await createAccount(d);
  }
  console.log('\n✅ Hoàn tất!\n');
})();

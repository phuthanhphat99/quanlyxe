import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/Auth.tsx',
  'src/lib/data-adapter.ts',
  'public/docs/huong-dan-phu-an/index.html',
  'README.md',
  'scripts/admin-seed-demo.mjs'
];

files.forEach(f => {
  const filePath = path.resolve(f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(/phuancr\.com/g, 'phuancr.vn');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated ' + f);
    }
  }
});

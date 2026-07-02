import fs from 'fs';
import path from 'path';

const SRC_DIR = 'd:\\QUANLYXE_ONLINE\\quanlyxe\\src';
const HTML_FILE = 'd:\\QUANLYXE_ONLINE\\quanlyxe\\index.html';

const IGNORED_STRINGS = [
    'fleetpro:',
    'fleetpro_',
    '_fleetpro',
    'fleetpro-app',
    'fleetpro.vn',
    'FleetProBot',
];

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, fileList);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Use a regex to match "FleetPro" but ensure it's not part of an ignored string pattern
    // This is a simple approach: we replace "FleetPro" with "Phú An" where it appears as text
    
    // Actually, we can just replace "FleetPro" with "Phú An" and then fix the known technical ones back.
    // However, JS variables like `FleetProBot` should be preserved.
    
    const originalContent = content;
    
    // Replace standalone or text FleetPro
    // \b doesn't work well with PascalCase sometimes, but let's just do a global replace
    // and then revert the ignored strings.
    
    content = content.replace(/FleetPro/g, "Phú An");
    content = content.replace(/fleetpro/g, "phuan");

    // Revert technical strings
    content = content.replace(/Phú AnBot/g, "FleetProBot");
    content = content.replace(/phuan-app/g, "fleetpro-app");
    content = content.replace(/phuan_/g, "fleetpro_");
    content = content.replace(/_phuan/g, "_fleetpro");
    content = content.replace(/phuan:/g, "fleetpro:");
    content = content.replace(/phuan\.vn/g, "fleetpro.vn");
    content = content.replace(/Phú An Demo Company/g, "Phú An");
    content = content.replace(/Phú An Demo/g, "Phú An");
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

const allFiles = walk(SRC_DIR);
allFiles.push(HTML_FILE);

allFiles.forEach(processFile);

console.log("Branding update complete!");

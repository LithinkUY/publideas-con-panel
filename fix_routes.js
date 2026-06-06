const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app/api', function(filePath) {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('export async function GET') && !content.includes('export const dynamic')) {
      const parts = content.split('export async function GET');
      const newContent = parts[0] + '\nexport const dynamic = "force-dynamic";\n\nexport async function GET' + parts[1];
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', filePath);
    }
  }
});

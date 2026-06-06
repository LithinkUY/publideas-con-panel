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
    if (content.startsWith('export const dynamic = "force-dynamic";\n')) {
      // Remove the bad line at the top
      content = content.replace('export const dynamic = "force-dynamic";\n', '');
      
      // Find the last import line
      const lines = content.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, '\nexport const dynamic = "force-dynamic";');
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log('Fixed imports for', filePath);
      } else {
        fs.writeFileSync(filePath, 'export const dynamic = "force-dynamic";\n' + content);
      }
    }
  }
});

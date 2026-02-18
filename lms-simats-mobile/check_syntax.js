const fs = require('fs');
const path = require('path');
const parser = require('./node_modules/@babel/parser');

function findFiles(dir) {
    const files = [];
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !f.startsWith('.') && f !== 'node_modules') {
            files.push(...findFiles(full));
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            files.push(full);
        }
    }
    return files;
}

const files = findFiles('./src');
let errors = 0;
for (const f of files) {
    try {
        parser.parse(fs.readFileSync(f, 'utf8'), {
            sourceType: 'module',
            plugins: ['typescript', 'jsx', 'decorators-legacy']
        });
    } catch (e) {
        const line = e.loc ? e.loc.line : '?';
        console.log(f + ':' + line + ' - ' + e.message);
        errors++;
    }
}
if (errors === 0) console.log('No syntax errors found.');

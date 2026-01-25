import fs from 'fs';
import path from 'path';

const SEARCH_DIRECTORIES = [
    'src/lib/ai',
    'src/app/api'
];

const FORBIDDEN_WORDS = [
    /\bI\b/,
    /\bme\b/,
    /\bmy\b/,
    /\bmine\b/,
    /\bI'm\b/,
    /\bI've\b/
];

function scanFiles(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanFiles(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Look for string literals that might be prompts
            FORBIDDEN_WORDS.forEach((regex) => {
                if (regex.test(content)) {
                    // This is a simple check, could be refined to only look at actual prompt strings
                    console.log(`[WARNING] Potential anthropomorphization found in ${fullPath}: ${regex}`);
                }
            });
        }
    }
}

console.log('--- Starting Safety Audit: Anthropomorphization Scan ---');
SEARCH_DIRECTORIES.forEach(dir => {
    const absolutePath = path.resolve(process.cwd(), dir);
    if (fs.existsSync(absolutePath)) {
        scanFiles(absolutePath);
    }
});
console.log('--- Audit Complete ---');

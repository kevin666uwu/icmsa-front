import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const required = ['.web-model-version', '.env.example', 'README.md', '.github/workflows/ci.yml', 'src/services/api.js', 'src/lib/session.js', 'src/app/router/navigation.js', 'tests/api.test.js'];
for (const path of required) if (!existsSync(path)) throw new Error(`Missing ${path}`);
const version = readFileSync('.web-model-version', 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid version');
const paths = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n');
if (!paths[0]) throw new Error('Initialize and stage the repository first');
const secrets = new RegExp('gh[pousr]_' + '[A-Za-z0-9]{30,}|github_pat_' + '[A-Za-z0-9_]{30,}|-----BEGIN ' + '(?:RSA |EC |OPENSSH )?PRIVATE KEY-----');
for (const path of paths) {
  if (path.split('/').at(-1) === '.env' || /\.(pem|key)$/.test(path)) throw new Error(`Sensitive file: ${path}`);
  if (secrets.test(readFileSync(path, 'utf8'))) throw new Error(`Credential pattern in ${path}`);
}
console.log(`Compliance PASS: version=${version}, files=${paths.length}, required files and credential patterns checked`);
console.log('Run npm test for session/routing contracts and npm audit separately.');

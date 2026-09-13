/** Drive正本のローカルコピーからGitHub Pages用ファイルを同期する。Node.js 22+。 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const [sourceArg, targetArg] = process.argv.slice(2);
if (!sourceArg || !targetArg) {
  console.error('Usage: node sync-site.mjs /path/to/CISSP_Study_Notes /path/to/cissp-study-notes');
  process.exit(1);
}
const source = fs.realpathSync(sourceArg), target = path.resolve(targetArg);
if (source === target || target.startsWith(source + path.sep) || source.startsWith(target + path.sep)) {
  throw new Error('正本と公開先は、互いに包含しない別フォルダを指定してください。');
}
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function safe(base, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') ||
      relative.split('/').some(s => !s || s === '..' || s === '.' || (s.startsWith('.') && s !== '.nojekyll'))) {
    throw new Error(`許可しないパス: ${relative}`);
  }
  const full = path.resolve(base, relative);
  if (!full.startsWith(base + path.sep)) throw new Error(`範囲外: ${relative}`);
  // シンボリックリンク経由の書き込み・読み出しを避ける。
  let cursor = base;
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`リンクは使用できません: ${cursor}`);
  }
  return full;
}
const book = JSON.parse(fs.readFileSync(safe(source, 'book.json'), 'utf8'));
const pages = [...book.domains.filter(d => d.source), ...book.pages];
const built = spawnSync(process.execPath, [safe(source, 'build/build.mjs')], {stdio:'inherit'});
if (built.status !== 0) throw new Error('Markdown → HTML生成に失敗しました。公開先は更新していません。');
const outputs = ['index.html', ...pages.map(p => p.output), 'assets/style.css', 'assets/app.js', 'build-report.json'];
if (new Set(outputs).size !== outputs.length) throw new Error('出力の重複');
const files = new Map(outputs.map(p => [p, fs.readFileSync(safe(source, 'site/' + p))]));
files.set('.nojekyll', Buffer.from(''));
files.set('README.md', fs.readFileSync(safe(source, 'publishing/README_GitHub.md')));
files.set('tools/sync-from-drive.mjs', fs.readFileSync(safe(source, 'publishing/sync-site.mjs')));

// Project Siteの接頭辞を含むURLで、参照先と節アンカーを確認。
const base = 'https://19990202ray.github.io/cissp-study-notes/';
const documents = new Map([...files].filter(([p]) => p.endsWith('.html')).map(([p,data]) => [p,data.toString('utf8')]));
const ids = new Map([...documents].map(([p,html]) => {
  const values = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  if (values.length !== new Set(values).size) throw new Error(`ID重複: ${p}`);
  return [p,new Set(values)];
}));
let localLinks = 0;
for (const [file, html] of documents) {
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = m[1].replaceAll('&amp;', '&');
    if (/^(https?:|mailto:)/i.test(ref)) continue;
    if (ref.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(ref)) throw new Error(`相対パスではありません: ${file}: ${ref}`);
    const url = new URL(ref, base + file);
    if (!url.href.startsWith(base)) throw new Error(`Project Site範囲外: ${ref}`);
    let dest = decodeURIComponent(url.pathname.slice('/cissp-study-notes/'.length));
    if (!dest || dest.endsWith('/')) dest += 'index.html';
    if (!files.has(dest)) throw new Error(`参照先がありません: ${file} → ${dest}`);
    if (url.hash && !ids.get(dest)?.has(decodeURIComponent(url.hash.slice(1)))) throw new Error(`節がありません: ${file} → ${ref}`);
    localLinks++;
  }
  if (!html.includes('name="viewport"')) throw new Error(`viewport未指定: ${file}`);
}
const sourceInputs = [...new Set(['book.json', 'build/build.mjs', 'ui/style.css', 'ui/app.js',
  'vendor/marked/marked.esm.js', 'vendor/marked/LICENSE.md', 'publishing/README_GitHub.md',
  'publishing/sync-site.mjs', ...pages.map(p => p.source)])].sort();
const manifest = {
  format:1, source:'Google Drive: CISSP/CISSP_Study_Notes', contentVersion:book.version,
  sourceFiles:sourceInputs.map(p => ({path:p,sha256:hash(fs.readFileSync(safe(source,p)))})),
  files:[...files].map(([p,data]) => ({path:p,bytes:data.length,sha256:hash(data)})),
  validation:{htmlPages:documents.size,localLinks,rootRelativePaths:0},
  workflow:'Edit Drive sources, rebuild and sync, save changed source/site files to Drive, then commit/push generated files to main.'
};
const manifestPath = safe(target, 'publish-manifest.json');
let previous = [];
if (fs.existsSync(manifestPath)) {
  const old = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if (old.format !== 1 || !Array.isArray(old.files)) throw new Error('同期台帳の形式が不正です。');
  previous = old.files;
  for (const item of previous) {
    const full = safe(target,item.path);
    if (!fs.existsSync(full) || hash(fs.readFileSync(full)) !== item.sha256) {
      throw new Error(`公開側の独自変更を検出しました。必要な修正をDrive正本へ戻してから同期してください: ${item.path}`);
    }
  }
  for (const p of files.keys()) {
    if (!previous.some(x => x.path === p) && fs.existsSync(safe(target,p))) throw new Error(`未管理ファイルと競合: ${p}`);
  }
}
// すべての検査後に、管理対象だけをコピー。過去に管理した不要ファイルだけを削除。
fs.mkdirSync(target,{recursive:true});
for (const [p,data] of files) {
  const full = safe(target,p); fs.mkdirSync(path.dirname(full),{recursive:true}); fs.writeFileSync(full,data);
}
for (const item of previous) if (!files.has(item.path)) fs.unlinkSync(safe(target,item.path));
fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({status:'ok',publishedFiles:files.size+1,...manifest.validation}));

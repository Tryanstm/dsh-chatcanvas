import fs from 'node:fs';
import path from 'node:path';

export function installManifest(source) {
  if (source.name !== 'dsh-chatcanvas' || !/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(source.version)) throw Error('Unexpected public package identity');
  const keys = ['name','version','description','author','keywords','icon','repository','homepage','bugs','type','license','engines','exports','files','dsh','peerDependencies','peerDependenciesMeta','publishConfig'];
  return Object.fromEntries(keys.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
}

export function includeInstallFile(file) {
  const normalized = file.replaceAll('\\', '/');
  return !normalized.endsWith('.map') && !/(?:^|\/)dist\/preview(?:\/|$)/.test(normalized);
}

export function assertPrebuiltPackage(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (manifest.name !== 'dsh-chatcanvas' || manifest.scripts || manifest.devDependencies || manifest.dependencies || manifest.private) throw Error('Publish only the prebuilt installation stage');
  if (manifest.publishConfig?.registry !== 'https://registry.npmjs.org/' || manifest.publishConfig?.access !== 'public' || manifest.publishConfig?.tag !== 'next') throw Error('Preview publishing configuration is missing');
  for (const entry of Object.values(manifest.exports)) {
    if (typeof entry !== 'string' || !entry.startsWith('./') || entry.includes('..') || !fs.statSync(path.join(root, entry)).isFile()) throw Error('Missing or unsafe package export: ' + entry);
  }
  const patch = fs.readFileSync(path.join(root, 'cordis.patch.yml'), 'utf8');
  if (!/name:\s*['"]?dsh-chatcanvas['"]?\s*(?:\r?\n|$)/.test(patch)) throw Error('Bundle patch does not load the public package');
  const client = fs.readFileSync(path.join(root, 'dist/client.js'), 'utf8');
  if (!client.startsWith('window.__ModuleLoader__.load({id:"dsh-chatcanvas",')) throw Error('Client module ID does not match the package name');
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw Error('Symlink in installation stage');
      if (!includeInstallFile(file)) throw Error('Development artifact in installation stage: ' + path.relative(root,file));
      if (entry.isDirectory()) walk(file);
      else if (fs.statSync(file).size > 64 * 1024 * 1024) throw Error('File exceeds market reader limit: ' + entry.name);
    }
  };
  walk(root);
  return manifest;
}

// content/ の設定ファイル（社員・サービス・柱・サイト）を読む
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function loadConfig(dir) {
  const base = dir instanceof URL ? fileURLToPath(dir) : dir;
  const read = (name) => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8'));
  return {
    staff: read('staff.json'),
    services: read('services.json'),
    pillars: read('pillars.json'),
    site: read('site.json'),
  };
}

import { apiFetch } from '../services/api.js';
export const read = (path, signal) => apiFetch('/api/v1' + path, { signal });
export const write = (path, body, method = 'POST') => apiFetch('/api/v1' + path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export async function allRecords(path, signal) {
  const result = [];
  for (let offset = 0; ; offset += 100) {
    const page = await read(path + '?limit=100&offset=' + offset, signal);
    result.push(...page.items);
    if (result.length >= page.total || page.items.length === 0) return result;
  }
}
export const displayName = row => row.name || [row.first_name, row.last_name, row.second_last_name].filter(Boolean).join(' ') || row.request_type || row.category || '#' + row.id;

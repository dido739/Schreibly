import { supabase } from './supabase.js';

async function request(method, url, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('GET', '/api/health'),
  listDocs: () => request('GET', '/api/docs'),
  createDoc: (payload = {}) => request('POST', '/api/docs', payload),
  getDoc: (id) => request('GET', `/api/docs/${id}`),
  saveDoc: (id, doc) =>
    request('PUT', `/api/docs/${id}`, { title: doc.title, markdown: doc.markdown, goal: doc.goal }),
  deleteDoc: (id) => request('DELETE', `/api/docs/${id}`),
  getCharacters: () => request('GET', '/api/characters'),
  saveCharacters: (characters) => request('PUT', '/api/characters', { characters }),
};

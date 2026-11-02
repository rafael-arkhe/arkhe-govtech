export async function api<T = any>(path: string, data?: unknown, method = 'POST', headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch('/api/' + path, data === undefined ? { cache: 'no-store' } : { method, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Não foi possível concluir a operação.');
  return value;
}
export function base64(bytes: ArrayBuffer) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
export function unbase64(value: string) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
export async function signLocally(pem: string, payload: string) {
  const bytes = unbase64(pem.replace(/-----[^-]+-----|\s/g, ''));
  const key = await crypto.subtle.importKey('pkcs8', bytes, { name: 'Ed25519' }, false, ['sign']);
  return base64(await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(payload)));
}
export async function signHexLocally(pem: string, hex: string) {
  if (!/^(?:[a-f0-9]{2}){1,131072}$/.test(hex)) throw new Error('Desafio de assinatura inválido.');
  const bytes = unbase64(pem.replace(/-----[^-]+-----|\s/g, ''));
  const key = await crypto.subtle.importKey('pkcs8', bytes, {name:'Ed25519'}, false, ['sign']);
  const payload = Uint8Array.from(hex.match(/../g)!, value => parseInt(value,16));
  return base64(await crypto.subtle.sign('Ed25519', key, payload));
}

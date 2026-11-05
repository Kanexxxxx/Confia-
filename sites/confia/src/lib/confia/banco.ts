import 'server-only';
import { env } from 'cloudflare:workers';
export function banco(): D1Database {
  if (!env.DB) throw new Error('Banco temporariamente indisponível.');
  return env.DB;
}
export async function lista<T>(query: string, ...values: (string|number|null)[]): Promise<T[]> {
  const result = await banco().prepare(query).bind(...values).all<T>();
  return result.results;
}
export async function grava(query: string, ...values: (string|number|null)[]) {
  return banco().prepare(query).bind(...values).run();
}

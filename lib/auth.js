import { cookies } from 'next/headers';
export async function getAccessToken() {
  const c = await cookies();
  return c.get('d_access')?.value;
}

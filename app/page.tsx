import { redirect } from 'next/navigation';

/**
 * Página principal - redirige a login
 */
export default function Home() {
  redirect('/login');
}

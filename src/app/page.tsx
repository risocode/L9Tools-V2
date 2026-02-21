
import { redirect } from 'next/navigation';

export default async function RootPage() {
  // The Boss Hunt page is now the public landing page for all users.
  // Middleware also handles this redirect, but keeping as fallback
  redirect('/boss-hunt');
}

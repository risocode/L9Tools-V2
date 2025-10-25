
import { redirect } from 'next/navigation';

export default async function RootPage() {
  // The Boss Hunt page is now the public landing page for all users.
  redirect('/boss-hunt');
}

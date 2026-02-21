import { redirect } from 'next/navigation';

// Ability page still in development – hidden from nav; redirect to dashboard
export default function AbilityPage() {
  redirect('/dashboard');
}

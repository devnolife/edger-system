import { redirect } from 'next/navigation';

export default function HomePage() {
  // By default, redirect to the login page
  redirect('/login');
}

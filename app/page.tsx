import { redirect } from 'next/navigation';

export default function HomePage() {
  // For now, always redirect to login page
  // In a real app, you would check auth status and redirect accordingly
  redirect('/login');
}

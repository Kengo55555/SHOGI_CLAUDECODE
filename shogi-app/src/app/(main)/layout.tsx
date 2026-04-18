import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Navbar user={{ id: user.id, handleName: user.handleName }} />
      <main className="flex-1">{children}</main>
    </>
  );
}

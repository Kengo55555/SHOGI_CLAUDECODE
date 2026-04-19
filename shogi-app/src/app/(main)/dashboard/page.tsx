import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="font-[family-name:var(--font-noto-serif)] text-2xl font-bold text-kinpaku mb-1">
          {user.handleName} <span className="text-[#C4364A]">殿</span>
        </h2>
        <p className="text-xs text-[#D4A017]/40 tracking-widest font-serif">お越しをお待ちしておりました</p>
        <div className="divider-hana w-32 mx-auto mt-3" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/game/cpu" className="card-yukaku rounded-xl p-6 text-center hover:shadow-lg hover:shadow-[#D4A017]/10 transition-all group">
          <div className="text-3xl mb-2 text-[#C4364A] group-hover:scale-110 transition-transform">☗</div>
          <span className="font-bold font-serif text-[#F4E4C1]">一人稽古</span>
          <p className="text-xs text-[#F4E4C1]/40 mt-1">CPU対戦</p>
        </Link>
        <Link href="/match-requests/new" className="card-yukaku rounded-xl p-6 text-center hover:shadow-lg hover:shadow-[#D4A017]/10 transition-all group">
          <div className="text-3xl mb-2 text-[#D4A017] group-hover:scale-110 transition-transform">⚔</div>
          <span className="font-bold font-serif text-[#F4E4C1]">真剣勝負</span>
          <p className="text-xs text-[#F4E4C1]/40 mt-1">対戦募集</p>
        </Link>
      </div>

      <section className="mb-8">
        <h3 className="text-sm font-bold mb-3 text-[#D4A017]/70 font-serif flex items-center gap-2">
          <span className="w-8 h-px bg-gradient-to-r from-[#D4A017] to-transparent" />
          手合待ちの間
        </h3>
        <div className="card-yukaku rounded-xl p-6 text-center text-[#F4E4C1]/35 text-sm font-serif">
          現在、対局をお待ちの方はおられません
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold mb-3 text-[#D4A017]/70 font-serif flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-[#D4A017] to-transparent" />
            戦績帳
          </span>
          <Link href="/records" className="text-xs text-[#D4A017]/40 hover:text-[#D4A017] font-normal transition-colors">全て見る</Link>
        </h3>
        <div className="card-yukaku rounded-xl p-6 text-center text-[#F4E4C1]/35 text-sm font-serif">
          まだ対局の記録はございません
        </div>
      </section>
    </div>
  );
}

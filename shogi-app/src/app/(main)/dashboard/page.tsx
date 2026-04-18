import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 挨拶 */}
      <div className="text-center mb-8">
        <h2 className="font-[family-name:var(--font-noto-serif)] text-2xl font-bold text-kinpaku mb-1">
          {user.handleName} 殿
        </h2>
        <p className="text-xs text-[#F0E6D3]/40 tracking-widest">お越しをお待ちしておりました</p>
        <div className="divider-kinpaku w-32 mx-auto mt-3" />
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/game/cpu"
          className="card-urushi rounded-lg p-6 text-center hover:border-[#D4A017]/60 transition-all group shimmer"
        >
          <div className="text-3xl mb-2 text-[#D4A017] group-hover:scale-110 transition-transform">☗</div>
          <span className="font-bold font-serif text-[#F0E6D3]">一人稽古</span>
          <p className="text-xs text-[#F0E6D3]/40 mt-1">CPU対戦</p>
        </Link>
        <Link
          href="/match-requests/new"
          className="card-urushi rounded-lg p-6 text-center hover:border-[#B22222]/60 transition-all group shimmer"
        >
          <div className="text-3xl mb-2 text-[#C41E3A] group-hover:scale-110 transition-transform">⚔</div>
          <span className="font-bold font-serif text-[#F0E6D3]">真剣勝負</span>
          <p className="text-xs text-[#F0E6D3]/40 mt-1">対戦募集</p>
        </Link>
      </div>

      {/* 対戦募集一覧 */}
      <section className="mb-8">
        <h3 className="text-sm font-bold mb-3 text-[#D4A017] font-serif flex items-center gap-2">
          <span className="w-8 h-px bg-gradient-to-r from-[#D4A017] to-transparent" />
          手合待ちの間
        </h3>
        <div className="card-urushi rounded-lg p-6 text-center text-[#F0E6D3]/40 text-sm">
          現在、対局をお待ちの方はおられません
        </div>
      </section>

      {/* 戦績サマリ */}
      <section>
        <h3 className="text-sm font-bold mb-3 text-[#D4A017] font-serif flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-[#D4A017] to-transparent" />
            戦績帳
          </span>
          <Link href="/records" className="text-xs text-[#F4A7B9]/60 hover:text-[#F4A7B9] font-normal transition-colors">
            全て見る
          </Link>
        </h3>
        <div className="card-urushi rounded-lg p-6 text-center text-[#F0E6D3]/40 text-sm">
          まだ対局の記録はございません
        </div>
      </section>
    </div>
  );
}

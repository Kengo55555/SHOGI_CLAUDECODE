import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6">
        こんにちは、{user.handleName}さん
      </h2>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/game/cpu"
          className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:border-[#2B4C7E] transition-colors"
        >
          <div className="text-2xl mb-2">&#x2616;</div>
          <span className="font-medium">CPU対戦する</span>
        </Link>
        <Link
          href="/match-requests/new"
          className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:border-[#2B4C7E] transition-colors"
        >
          <div className="text-2xl mb-2">&#x2617;</div>
          <span className="font-medium">対戦募集する</span>
        </Link>
      </div>

      {/* 対戦募集一覧（プレースホルダー） */}
      <section className="mb-8">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          アクティブな募集
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          現在対戦募集はありません。CPU対戦で腕を磨きましょう！
        </div>
      </section>

      {/* 戦績サマリ（プレースホルダー） */}
      <section>
        <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
          最近の戦績
          <Link href="/records" className="text-sm text-[#2B4C7E] hover:underline font-normal">
            全て見る
          </Link>
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          まだ対局記録がありません
        </div>
      </section>
    </div>
  );
}

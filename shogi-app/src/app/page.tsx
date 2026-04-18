import Link from 'next/link';

export default function TopPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5]">
      {/* タイトル */}
      <h1 className="font-[family-name:var(--font-noto-serif)] text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
        将棋オンライン
      </h1>
      <p className="text-gray-600 mb-10 text-center">
        気軽に一局、いつでもどこでも。
      </p>

      {/* CTA */}
      <Link
        href="/register"
        className="bg-[#2D5F2D] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#245024] transition-colors"
      >
        メールアドレスで始める
      </Link>

      <div className="mt-4">
        <Link href="/login" className="text-sm text-[#2B4C7E] hover:underline">
          登録済みの方はこちら
        </Link>
      </div>

      {/* 特徴 */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl px-4">
        <div className="text-center">
          <div className="text-3xl mb-2">&#x2616;</div>
          <h3 className="font-bold mb-1">一人で遊べる</h3>
          <p className="text-sm text-gray-600">
            CPUと3レベルで練習
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">&#x2617;</div>
          <h3 className="font-bold mb-1">人と対戦</h3>
          <p className="text-sm text-gray-600">
            対戦募集シグナルで気軽に
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">&#x1F4CA;</div>
          <h3 className="font-bold mb-1">成長が見える</h3>
          <p className="text-sm text-gray-600">
            戦績・棋譜で棋力向上
          </p>
        </div>
      </div>

      <p className="mt-12 text-xs text-gray-400">
        無料・登録簡単
      </p>
    </div>
  );
}

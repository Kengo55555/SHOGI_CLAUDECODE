import Link from 'next/link';

export default function TopPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-seigaiha opacity-60" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />

      {/* 左右の灯籠風装飾 */}
      <div className="absolute left-4 top-1/4 w-2 h-32 bg-gradient-to-b from-[#B22222] via-[#C41E3A] to-[#B22222] rounded-full opacity-40 blur-sm" />
      <div className="absolute right-4 top-1/4 w-2 h-32 bg-gradient-to-b from-[#B22222] via-[#C41E3A] to-[#B22222] rounded-full opacity-40 blur-sm" />

      <div className="relative z-10 text-center px-4">
        {/* 上部装飾 */}
        <div className="mb-6">
          <div className="divider-kinpaku w-48 mx-auto mb-4" />
          <p className="text-[#D4A017] text-xs tracking-[0.5em] font-serif">
            オンライン将棋対戦
          </p>
        </div>

        {/* タイトル */}
        <h1 className="font-[family-name:var(--font-noto-serif)] text-5xl md:text-7xl font-bold mb-4 text-kinpaku tracking-wider">
          将棋処
        </h1>
        <p className="text-[#F4A7B9] text-lg md:text-xl mb-2 font-serif">
          ～ 気軽に一局、いつでもどこでも ～
        </p>

        {/* 下部装飾 */}
        <div className="divider-kinpaku w-64 mx-auto mt-4 mb-10" />

        {/* CTA */}
        <Link
          href="/register"
          className="btn-kurenai inline-block px-10 py-4 rounded-lg text-lg font-bold tracking-wide"
        >
          参 戦 す る
        </Link>

        <div className="mt-4">
          <Link href="/login" className="text-sm text-[#D4A017]/70 hover:text-[#D4A017] transition-colors">
            登録済みの方はこちら
          </Link>
        </div>

        {/* 特徴カード */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          {[
            { icon: '☗', title: '一人稽古', desc: 'CPUと三段階で腕を磨く' },
            { icon: '⚔', title: '真剣勝負', desc: '対戦募集で全国の棋士と一戦' },
            { icon: '巻', title: '棋譜帳', desc: '戦績と棋譜で己を知る' },
          ].map((item) => (
            <div
              key={item.title}
              className="card-urushi rounded-lg p-6 text-center shimmer"
            >
              <div className="text-3xl mb-3 text-[#D4A017]">{item.icon}</div>
              <h3 className="font-bold text-[#F0E6D3] font-serif mb-1">{item.title}</h3>
              <p className="text-xs text-[#F0E6D3]/60">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-[#D4A017]/30 tracking-widest">
          無 料 ・ 登 録 簡 単
        </p>
      </div>
    </div>
  );
}

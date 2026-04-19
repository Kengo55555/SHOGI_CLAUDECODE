import Link from 'next/link';

export default function TopPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* 上部の金帯 */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#D4A017]/60 to-transparent" />

      {/* 花びら装飾 */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-[#C4364A]/5 blur-2xl" />
      <div className="absolute top-20 right-16 w-56 h-56 rounded-full bg-[#7A0F1A]/8 blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-48 h-48 rounded-full bg-[#D4A017]/4 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-36 h-36 rounded-full bg-[#C4364A]/6 blur-2xl" />

      <div className="relative z-10 text-center px-4">
        <div className="divider-hana w-48 mx-auto mb-6" />

        <p className="text-[#D4A017]/70 text-xs tracking-[0.5em] font-serif mb-4">
          オンライン将棋対戦
        </p>

        <h1 className="font-[family-name:var(--font-noto-serif)] text-6xl md:text-8xl font-bold mb-4 text-kinpaku tracking-wider drop-shadow-sm">
          将棋処
        </h1>

        <p className="text-[#F4E4C1]/60 text-lg md:text-xl mb-2 font-serif">
          ～ 気軽に一局、いつでもどこでも ～
        </p>

        <div className="divider-hana w-64 mx-auto mt-4 mb-12" />

        <Link
          href="/register"
          className="btn-kurenai inline-block px-12 py-4 rounded-lg text-lg tracking-[0.3em]"
        >
          参 戦 す る
        </Link>

        <div className="mt-4">
          <Link href="/login" className="text-sm text-[#D4A017]/50 hover:text-[#D4A017] transition-colors font-serif">
            登録済みの方はこちら
          </Link>
        </div>

        {/* 特徴カード */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          {[
            { icon: '☗', title: '一人稽古', desc: 'CPUと三段階で腕を磨く', color: '#C4364A' },
            { icon: '⚔', title: '真剣勝負', desc: '全国の棋士と一戦', color: '#F4E4C1' },
            { icon: '巻', title: '棋譜帳', desc: '戦績と棋譜で己を知る', color: '#D4A017' },
          ].map((item) => (
            <div
              key={item.title}
              className="card-yukaku rounded-xl p-6 text-center hover:shadow-lg hover:shadow-[#D4A017]/10 transition-all"
            >
              <div className="text-3xl mb-3" style={{ color: item.color }}>{item.icon}</div>
              <h3 className="font-bold text-[#F4E4C1] font-serif mb-1">{item.title}</h3>
              <p className="text-xs text-[#F4E4C1]/50">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-xs text-[#D4A017]/25 tracking-[0.4em]">
          無 料 ・ 登 録 簡 単
        </p>
      </div>

      {/* 下部の金帯 */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#D4A017]/60 to-transparent" />
    </div>
  );
}

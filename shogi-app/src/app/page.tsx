import Link from 'next/link';

export default function TopPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* 上部の紅帯 */}
      <div className="absolute top-0 left-0 w-full h-2 bg-kurenai-obi" />

      {/* 花の装飾（大きな丸） */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-[#C4364A]/8 blur-2xl" />
      <div className="absolute top-20 right-16 w-56 h-56 rounded-full bg-[#F4A7B9]/12 blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-48 h-48 rounded-full bg-[#E05B6F]/6 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-36 h-36 rounded-full bg-[#C4364A]/10 blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#D4A017]/4 blur-3xl" />

      {/* 黒雲取りの帯 */}
      <div className="absolute top-[15%] left-0 w-full h-24 bg-gradient-to-r from-[#2D2226]/10 via-transparent to-[#2D2226]/8 -skew-y-3" />
      <div className="absolute bottom-[20%] left-0 w-full h-20 bg-gradient-to-r from-transparent via-[#2D2226]/6 to-transparent skew-y-2" />

      <div className="relative z-10 text-center px-4">
        <div className="divider-hana w-48 mx-auto mb-6" />

        <p className="text-[#C4364A] text-xs tracking-[0.5em] font-serif mb-4">
          オンライン将棋対戦
        </p>

        <h1 className="font-[family-name:var(--font-noto-serif)] text-6xl md:text-8xl font-bold mb-4 text-[#2D2226] tracking-wider drop-shadow-sm">
          将棋処
        </h1>

        <p className="text-[#C4364A] text-lg md:text-xl mb-2 font-serif">
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
          <Link href="/login" className="text-sm text-[#C4364A]/50 hover:text-[#C4364A] transition-colors font-serif">
            登録済みの方はこちら
          </Link>
        </div>

        {/* 特徴カード */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          {[
            { icon: '☗', title: '一人稽古', desc: 'CPUと三段階で腕を磨く', color: '#C4364A' },
            { icon: '⚔', title: '真剣勝負', desc: '全国の棋士と一戦', color: '#2D2226' },
            { icon: '巻', title: '棋譜帳', desc: '戦績と棋譜で己を知る', color: '#D4A017' },
          ].map((item) => (
            <div
              key={item.title}
              className="card-hana rounded-xl p-6 text-center shimmer hover:shadow-lg hover:shadow-[#C4364A]/10 transition-all"
            >
              <div className="text-3xl mb-3" style={{ color: item.color }}>{item.icon}</div>
              <h3 className="font-bold text-[#2D2226] font-serif mb-1">{item.title}</h3>
              <p className="text-xs text-[#2D2226]/50">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-xs text-[#C4364A]/25 tracking-[0.4em]">
          無 料 ・ 登 録 簡 単
        </p>
      </div>

      {/* 下部の紅帯 */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-kurenai-obi" />
    </div>
  );
}

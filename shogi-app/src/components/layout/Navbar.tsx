'use client';

import Link from 'next/link';
import { useState } from 'react';

interface NavbarProps {
  user: {
    id: string;
    handleName: string;
  };
}

export function Navbar({ user }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#DDB06C]/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* ロゴ */}
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-noto-serif)] text-lg font-bold text-[#1A1A1A]"
          >
            将棋オンライン
          </Link>

          {/* PCナビゲーション */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm hover:text-[#2B4C7E] transition-colors">
              ダッシュボード
            </Link>
            <Link href="/game/cpu" className="text-sm hover:text-[#2B4C7E] transition-colors">
              CPU対戦
            </Link>
            <Link href="/match-requests" className="text-sm hover:text-[#2B4C7E] transition-colors">
              対戦募集
            </Link>
            <Link href="/records" className="text-sm hover:text-[#2B4C7E] transition-colors">
              戦績
            </Link>
          </nav>

          {/* 右側: 通知 + ユーザー */}
          <div className="hidden md:flex items-center gap-4">
            {/* 通知ベル（後で実装） */}
            <button className="relative p-1 text-gray-600 hover:text-[#2B4C7E] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* ユーザーメニュー */}
            <Link
              href="/settings/profile"
              className="text-sm text-gray-700 hover:text-[#2B4C7E] transition-colors"
            >
              {user.handleName}
            </Link>
          </div>

          {/* モバイルメニューボタン */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-100 pt-2">
            <Link href="/dashboard" className="block py-2 text-sm hover:text-[#2B4C7E]">
              ダッシュボード
            </Link>
            <Link href="/game/cpu" className="block py-2 text-sm hover:text-[#2B4C7E]">
              CPU対戦
            </Link>
            <Link href="/match-requests" className="block py-2 text-sm hover:text-[#2B4C7E]">
              対戦募集
            </Link>
            <Link href="/records" className="block py-2 text-sm hover:text-[#2B4C7E]">
              戦績
            </Link>
            <Link href="/settings/profile" className="block py-2 text-sm hover:text-[#2B4C7E]">
              設定
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

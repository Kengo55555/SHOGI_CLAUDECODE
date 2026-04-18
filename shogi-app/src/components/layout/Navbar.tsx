'use client';

import Link from 'next/link';
import { useState } from 'react';

interface NavbarProps {
  user: { id: string; handleName: string };
}

export function Navbar({ user }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: '御座所' },
    { href: '/game/cpu', label: 'CPU対戦' },
    { href: '/match-requests', label: '対戦募集' },
    { href: '/records', label: '戦績帳' },
  ];

  return (
    <header className="bg-gradient-to-r from-[#1A1A1A] via-[#111] to-[#1A1A1A] border-b border-[#D4A017]/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-noto-serif)] text-lg font-bold text-kinpaku tracking-widest"
          >
            将棋処
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[#F0E6D3]/70 hover:text-[#D4A017] transition-colors rounded hover:bg-[#D4A017]/5 font-serif"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button className="relative p-1.5 text-[#D4A017]/50 hover:text-[#D4A017] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <Link
              href="/settings/profile"
              className="text-sm text-[#F4A7B9] hover:text-[#F4A7B9]/80 transition-colors font-serif"
            >
              {user.handleName}
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-[#D4A017]"
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

        {isMobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-[#D4A017]/10 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm text-[#F0E6D3]/70 hover:text-[#D4A017] font-serif"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/settings/profile" className="block py-2 text-sm text-[#F4A7B9] font-serif">
              設定
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

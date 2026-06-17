'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Github } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/', label: '主页' },
  { href: '/blog', label: '文章' },
  { href: '/notes', label: '笔记' },
  { href: '/kb', label: '知识库' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b-0">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold text-text-primary hover:text-primary transition-colors"
          >
            <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover p-0.5 shadow-lg shadow-primary-glow">
              <span className="flex items-center justify-center w-full h-full rounded-full bg-bg-elevated overflow-hidden">
                <Image
                  src="/Logo.png"
                  alt="shen"
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full"
                />
              </span>
            </span>
            <span className="font-display">shen</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-primary bg-primary-subtle'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/nfap9"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex w-9 h-9 rounded-lg glass items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute inset-x-0 top-full border-t border-border-default">
          <div className="glass-elevated mx-4 mt-2 rounded-2xl p-2 shadow-xl">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      active
                        ? 'text-primary bg-primary-subtle'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <a
                href="https://github.com/nfap9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

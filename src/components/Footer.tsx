import Link from 'next/link';
import { Github, FileText, Bot } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { href: '/llms.txt', label: '/llms.txt', icon: FileText },
    { href: '/llms-full.txt', label: '/llms-full.txt', icon: Bot },
  ];

  return (
    <footer className="relative mt-auto">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      <div className="glass border-t-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <p className="text-sm text-text-muted">
                © {currentYear} shen. 个人博客
              </p>
              <div className="flex items-center gap-3">
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <a
              href="https://github.com/nfap9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

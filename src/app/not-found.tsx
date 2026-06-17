import Link from 'next/link';
import { Home } from 'lucide-react';

export const metadata = {
  title: '404 | shen 的博客',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center glass gradient-border rounded-3xl p-10 sm:p-16 max-w-md">
        <h1 className="text-7xl sm:text-8xl font-bold text-text-primary mb-4 font-display">
          404
        </h1>
        <p className="text-xl text-text-secondary mb-8">页面找不到了</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary-glow hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-200"
        >
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}

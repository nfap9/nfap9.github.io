import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <Image
              src="/Logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <span>shen</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              主页
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              文章
            </Link>
            <Link
              href="/notes"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              笔记
            </Link>
            <Link
              href="/kb"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              知识库
            </Link>
            <a
              href="https://github.com/nfap9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

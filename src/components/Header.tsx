export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <a
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <img src="/Logo.png" alt="Logo" className="w-8 h-8 rounded-full" />
            <span>shen</span>
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              主页
            </a>
            <a
              href="/blog"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              文章
            </a>
            <a
              href="/notes"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              笔记
            </a>
            <a
              href="/kb"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              知识库
            </a>
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

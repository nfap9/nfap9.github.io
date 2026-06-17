import Link from "next/link";

export const metadata = {
  title: "404 | shen 的博客",
};

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">页面找不到了</p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

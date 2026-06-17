import PostCard from '@/components/PostCard';
import { getBlogPosts } from '@/lib/content';

export default async function HomePage() {
  const allPosts = await getBlogPosts();
  const posts = allPosts.slice(0, 6);
  const categories = [
    ...new Set(allPosts.map((post) => post.meta.category).filter(Boolean) as string[]),
  ];

  return (
    <>
      <section className="bg-gradient-to-b from-primary-50 to-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
            <img src="/Logo.png" alt="shen" className="w-16 h-16 rounded-full" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">shen 的博客</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">个人成长 & 前端技术</p>
          <p className="text-gray-500 mb-8">记录每一步的成长</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="/blog"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            >
              查看文章
            </a>
            <a
              href="/kb"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              知识库
            </a>
            <a
              href="https://github.com/nfap9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">最新文章</h2>
            <p className="text-gray-500">探索前端技术的点点滴滴</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          <div className="text-center mt-10 flex items-center justify-center gap-6">
            <a
              href="/blog"
              className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              查看全部文章
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
            <a
              href="/kb"
              className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              进入知识库
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">技术分类</h2>
            <p className="text-gray-500">涵盖多个前端技术领域</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {categories.map((category) => (
              <a
                key={category}
                href={`/kb?category=${encodeURIComponent(category)}`}
                className="group p-6 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors text-center"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 mb-2">
                  {category}
                </h3>
                <p className="text-sm text-gray-500">
                  {allPosts.filter((p) => p.meta.category === category).length} 篇文章
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

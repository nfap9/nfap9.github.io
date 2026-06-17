import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Library, Github } from 'lucide-react';
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
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-60 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-300/10 dark:bg-sky-500/10 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center mb-8 animate-fade-in">
            <span className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary via-primary-hover to-primary p-1 glow-primary">
              <span className="flex items-center justify-center w-full h-full rounded-full bg-bg-elevated overflow-hidden">
                <Image
                  src="/Logo.png"
                  alt="shen"
                  width={88}
                  height={88}
                  className="w-20 h-20 rounded-full"
                  priority
                />
              </span>
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 animate-slide-up text-balance">
            shen 的博客
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto animate-slide-up text-balance">
            极客技术 & 知识库 · 记录前端成长与思考
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-slide-up">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary-glow hover:bg-primary-hover hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              查看文章
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/kb"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-text-primary font-medium hover:bg-bg-elevated hover:-translate-y-0.5 transition-all duration-200"
            >
              <Library className="w-4 h-4" />
              知识库
            </Link>
            <a
              href="https://github.com/nfap9"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-text-primary font-medium hover:bg-bg-elevated hover:-translate-y-0.5 transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                最新文章
              </h2>
              <p className="text-text-secondary">探索前端技术的点点滴滴</p>
            </div>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              查看全部文章
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 relative">
        <div className="absolute inset-0 -z-10 bg-bg-elevated/50" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              技术分类
            </h2>
            <p className="text-text-secondary">涵盖多个前端技术领域</p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {categories.map((category) => {
              const count = allPosts.filter((p) => p.meta.category === category).length;
              return (
                <Link
                  key={category}
                  href={`/kb?category=${encodeURIComponent(category)}`}
                  className="group relative glass gradient-border rounded-2xl p-6 text-center hover:-translate-y-1 transition-transform duration-300"
                >
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors mb-2">
                    {category}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {count} 篇文章
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';
import { ArrowLeft, Hash } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { getAllItems, getAllTags } from '@/lib/content';

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = await params;
  return {
    title: `标签: ${tag} | shen 的博客`,
    description: `查看标签为 ${tag} 的所有内容`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const allItems = await getAllItems();
  const matchedItems = allItems.filter((item) => item.meta.tags?.includes(tag));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="glass gradient-border rounded-2xl p-6 sm:p-8 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-subtle text-primary">
            <Hash className="w-5 h-5" />
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
            {tag}
          </h1>
        </div>
        <p className="text-text-secondary">
          共 {matchedItems.length} 条内容带有此标签
        </p>
      </div>

      {matchedItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 animate-stagger">
          {matchedItems.map((item) => (
            <PostCard
              key={`${item.type}-${item.slug}`}
              post={item}
              basePath={item.type === 'blog' ? 'blog' : 'notes'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-text-secondary">该标签下暂无内容</p>
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/kb"
          className="group inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
          返回知识库
        </Link>
      </div>
    </div>
  );
}

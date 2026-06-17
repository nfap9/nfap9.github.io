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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <span className="text-gray-500 font-normal">标签:</span> #{tag}
        </h1>
        <p className="text-gray-500">共 {matchedItems.length} 条内容</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {matchedItems.map((item) => (
          <PostCard
            key={item.slug}
            post={item}
            basePath={item.type === 'blog' ? 'blog' : 'notes'}
          />
        ))}
      </div>

      <div className="mt-10">
        <a
          href="/kb"
          className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回知识库
        </a>
      </div>
    </div>
  );
}

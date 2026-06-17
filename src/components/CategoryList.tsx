import type { ContentItem } from '@/lib/content';

interface CategoryListProps {
  posts: ContentItem[];
  currentCategory?: string;
}

export default function CategoryList({ posts, currentCategory }: CategoryListProps) {
  const categories = [
    ...new Set(posts.map((post) => post.meta.category).filter(Boolean) as string[]),
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <a
        href="/blog"
        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !currentCategory
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        全部
      </a>
      {categories.map((category) => (
        <a
          key={category}
          href={`/blog?category=${encodeURIComponent(category)}`}
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            currentCategory === category
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category}
        </a>
      ))}
    </div>
  );
}

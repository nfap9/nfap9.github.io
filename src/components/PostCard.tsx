import { formatDate } from '@/utils/date';
import type { ContentItem } from '@/lib/content';

interface PostCardProps {
  post: ContentItem;
  basePath?: string;
}

export default function PostCard({ post, basePath }: PostCardProps) {
  const { title, description, pubDate, category, tags } = post.meta;
  const isNote = post.type === 'notes';
  const href = `/${basePath || (isNote ? 'notes' : 'blog')}/${post.slug}/`;

  return (
    <article className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-300">
      <a href={href} className="block">
        <div className="flex items-center gap-2 mb-3">
          {isNote && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
              笔记
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
              {category}
            </span>
          )}
          {pubDate && (
            <time className="text-xs text-gray-400" dateTime={pubDate.toISOString()}>
              {formatDate(pubDate)}
            </time>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
          {title}
        </h2>
        {description && <p className="text-gray-600 text-sm line-clamp-2">{description}</p>}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </a>
    </article>
  );
}

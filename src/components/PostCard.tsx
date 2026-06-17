import Link from 'next/link';
import { Calendar } from 'lucide-react';
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
    <article className="group glass gradient-border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-glow/20 transition-all duration-300 animate-slide-up">
      <Link href={href} className="block">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {isNote && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-subtle text-amber-accent border border-amber-accent/20">
              笔记
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-subtle text-primary-hover">
              {category}
            </span>
          )}
          {pubDate && (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted ml-auto">
              <Calendar className="w-3 h-3" />
              <time dateTime={pubDate.toISOString()}>{formatDate(pubDate)}</time>
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {title}
        </h2>
        {description && (
          <p className="text-text-secondary text-sm line-clamp-2 mb-4">{description}</p>
        )}
      </Link>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-bg-elevated text-text-secondary border border-border-default hover:border-primary/30 hover:text-primary transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { formatDate } from '@/utils/date';
import MdxContent from './MdxContent';
import ReadingProgress from './ReadingProgress';
import type { ContentItem } from '@/lib/content';

interface BlogPostLayoutProps {
  item: ContentItem;
  backLink?: string;
  backText?: string;
}

export default function BlogPostLayout({
  item,
  backLink = '/blog',
  backText = '返回文章列表',
}: BlogPostLayoutProps) {
  const { title, pubDate, updatedDate, category, tags } = item.meta;

  const showUpdatedDate =
    updatedDate && pubDate && updatedDate.getTime() !== pubDate.getTime();

  return (
    <>
      <ReadingProgress />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="glass gradient-border rounded-2xl p-6 sm:p-10 mb-10">
          {category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-subtle text-primary-hover mb-5">
              {category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            {pubDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-text-muted" />
                <time dateTime={pubDate.toISOString()}>
                  发布于 {formatDate(pubDate)}
                </time>
              </span>
            )}
            {showUpdatedDate && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-text-muted" />
                <time dateTime={updatedDate!.toISOString()}>
                  更新于 {formatDate(updatedDate!)}
                </time>
              </span>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border-default">
              <Tag className="w-4 h-4 text-text-muted mt-1" />
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-bg-elevated text-text-secondary border border-border-default hover:border-primary/30 hover:text-primary transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-lg max-w-none">
          <MdxContent source={item.body} />
        </div>

        <div className="mt-12 pt-8 border-t border-border-default">
          <Link
            href={backLink}
            className="group inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            {backText}
          </Link>
        </div>
      </article>
    </>
  );
}

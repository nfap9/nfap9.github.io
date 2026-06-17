import Link from "next/link";
import { formatDate } from "@/utils/date";
import MdxContent from "./MdxContent";
import type { ContentItem } from "@/lib/content";

interface BlogPostLayoutProps {
  item: ContentItem;
  backLink?: string;
  backText?: string;
}

export default function BlogPostLayout({
  item,
  backLink = "/blog",
  backText = "返回文章列表",
}: BlogPostLayoutProps) {
  const { title, pubDate, updatedDate, category, tags } = item.meta;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        {category && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 mb-4">
            {category}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {pubDate && (
            <time dateTime={pubDate.toISOString()}>发布于 {formatDate(pubDate)}</time>
          )}
          {updatedDate && updatedDate.getTime() !== pubDate?.getTime() && (
            <time dateTime={updatedDate.toISOString()}>更新于 {formatDate(updatedDate)}</time>
          )}
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
      <MdxContent source={item.body} />
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          href={backLink}
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
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
          {backText}
        </Link>
      </div>
    </article>
  );
}

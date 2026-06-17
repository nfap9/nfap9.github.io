'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import PostCard from './PostCard';
import type { ContentItem } from '@/lib/content';

interface BlogListClientProps {
  posts: ContentItem[];
  categories: string[];
  title?: string;
  countText?: string;
  emptyText?: string;
  resetText?: string;
}

export default function BlogListClient({
  posts,
  categories,
  title = '文章列表',
  countText = '篇文章',
  emptyText = '没有找到匹配的内容',
  resetText = '清除筛选',
}: BlogListClientProps) {
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 从 URL 初始化分类筛选（外部系统同步）
    const url = new URL(window.location.href);
    const category = url.searchParams.get('category') || '';
    if (category && categories.includes(category)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategory(category);
    }
  }, [categories]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = !activeCategory || post.meta.category === activeCategory;
      const matchesSearch =
        !query ||
        post.meta.title?.toLowerCase().includes(query) ||
        post.meta.description?.toLowerCase().includes(query) ||
        post.meta.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const url = new URL(window.location.href);
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleReset = () => {
    setActiveCategory('');
    setSearchQuery('');
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    window.history.replaceState({}, '', url.toString());
  };

  const hasFilters = activeCategory || searchQuery;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">{title}</h1>
        <p className="text-text-secondary">
          共 {filteredPosts.length} {countText}
          {hasFilters && posts.length !== filteredPosts.length && (
            <span className="text-text-muted ml-2">（总计 {posts.length}）</span>
          )}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange('')}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === ''
                ? 'bg-primary text-white shadow-md shadow-primary-glow'
                : 'glass text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-primary text-white shadow-md shadow-primary-glow'
                  : 'glass text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索标题、描述、标签..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl glass text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              aria-label="清除搜索"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 animate-stagger">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-text-secondary mb-4">{emptyText}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              {resetText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

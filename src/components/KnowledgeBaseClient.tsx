'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, Bot, FileText, BookOpen, StickyNote, Tag, FolderOpen } from 'lucide-react';
import PostCard from './PostCard';
import type { ContentItem } from '@/lib/content';

interface KnowledgeBaseClientProps {
  items: ContentItem[];
  categories: string[];
  tags: string[];
}

export default function KnowledgeBaseClient({
  items,
  categories,
  tags,
}: KnowledgeBaseClientProps) {
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

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = !activeCategory || item.meta.category === activeCategory;
      const matchesSearch =
        !query ||
        item.meta.title?.toLowerCase().includes(query) ||
        item.meta.description?.toLowerCase().includes(query) ||
        item.meta.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      blogs: items.filter((item) => item.type === 'blog').length,
      notes: items.filter((item) => item.type === 'notes').length,
      categories: categories.length,
      tagCount: tags.length,
    };
  }, [items, categories, tags]);

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

  const statCards = [
    { label: '总内容', value: stats.total, icon: FolderOpen },
    { label: '博客文章', value: stats.blogs, icon: BookOpen },
    { label: '笔记', value: stats.notes, icon: StickyNote },
    { label: '分类', value: stats.categories, icon: Tag },
    { label: '标签', value: stats.tagCount, icon: Tag },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
          个人知识库
        </h1>
        <p className="text-text-secondary mb-6 max-w-2xl">
          这里汇集了博客长文与碎片化笔记，按主题分类整理，便于检索与回顾。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 animate-stagger">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="glass gradient-border rounded-2xl p-4 text-center animate-slide-up"
            >
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-subtle text-primary mb-2">
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass gradient-border rounded-2xl p-5 mb-10">
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-subtle text-primary flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Agent / LLM 检索入口
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              如果你是 AI Agent 或需要使用 LLM 检索本站知识，建议优先访问以下入口：
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/llms.txt"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                /llms.txt — 站点概述
              </Link>
              <Link
                href="/llms-full.txt"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                /llms-full.txt — 全文聚合
              </Link>
            </div>
          </div>
        </div>
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
            placeholder="搜索知识库内容..."
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

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">所有内容</h2>
        <p className="text-sm text-text-muted">
          共 {filteredItems.length} 条
          {hasFilters && items.length !== filteredItems.length && (
            <span className="ml-2">（总计 {items.length}）</span>
          )}
        </p>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 animate-stagger">
          {filteredItems.map((item) => (
            <PostCard
              key={`${item.type}-${item.slug}`}
              post={item}
              basePath={item.type === 'blog' ? 'blog' : 'notes'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-text-secondary mb-4">该分类下暂无内容</p>
          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              查看全部
            </button>
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-16 pt-10 border-t border-border-default">
          <h2 className="text-lg font-semibold text-text-primary mb-4">标签索引</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const count = items.filter((item) => item.meta.tags?.includes(tag)).length;
              return (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm glass text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <span>#{tag}</span>
                  <span className="text-xs text-text-muted">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

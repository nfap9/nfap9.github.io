'use client';

import { useEffect } from 'react';
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

export default function BlogListClient({ posts, categories, title = '文章列表', countText = '篇文章', emptyText = '该分类下暂无文章', resetText = '查看全部文章' }: BlogListClientProps) {
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.category-btn');
    const postItems = document.querySelectorAll<HTMLDivElement>('.post-item');
    const postCount = document.getElementById('post-count');
    const noPosts = document.getElementById('no-posts');
    const resetBtn = document.getElementById('reset-filter');

    function filterPosts(category: string) {
      let visibleCount = 0;

      postItems.forEach((item) => {
        const itemCategory = item.dataset.categories || '';
        if (!category || itemCategory === category) {
          item.classList.remove('hidden');
          visibleCount++;
        } else {
          item.classList.add('hidden');
        }
      });

      buttons.forEach((btn) => {
        const btnCategory = btn.dataset.category || '';
        if (btnCategory === category) {
          btn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
          btn.classList.add('bg-primary-600', 'text-white');
        } else {
          btn.classList.remove('bg-primary-600', 'text-white');
          btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        }
      });

      if (postCount) {
        postCount.textContent = `共 ${visibleCount} ${countText}`;
      }

      if (visibleCount === 0) {
        noPosts?.classList.remove('hidden');
      } else {
        noPosts?.classList.add('hidden');
      }
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category || '';
        filterPosts(category);
      });
    });

    resetBtn?.addEventListener('click', () => {
      filterPosts('');
    });

    const url = new URL(window.location.href);
    const initialCategory = url.searchParams.get('category') || '';
    if (initialCategory) {
      filterPosts(initialCategory);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500" id="post-count">
          共 {posts.length} {countText}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8" id="category-filters">
        <button
          data-category=""
          className="category-btn inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors bg-primary-600 text-white"
        >
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category}
            data-category={category}
            className="category-btn inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2" id="posts-grid">
        {posts.map((post) => (
          <div
            key={post.slug}
            data-categories={post.meta.category || ''}
            className="post-item"
          >
            <PostCard post={post} />
          </div>
        ))}
      </div>

      <div id="no-posts" className="hidden text-center py-20">
        <p className="text-gray-500">{emptyText}</p>
        <button
          id="reset-filter"
          className="inline-flex items-center mt-4 text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          {resetText}
        </button>
      </div>
    </div>
  );
}

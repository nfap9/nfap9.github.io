'use client';

import { useEffect } from "react";
import Link from "next/link";
import PostCard from "./PostCard";
import type { ContentItem } from "@/lib/content";

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
  const blogCount = items.filter((item) => item.type === "blog").length;
  const notesCount = items.filter((item) => item.type === "notes").length;

  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".category-btn");
    const itemEntries = document.querySelectorAll<HTMLDivElement>(".item-entry");
    const itemCount = document.getElementById("item-count");
    const noItems = document.getElementById("no-items");
    const resetBtn = document.getElementById("reset-filter");

    function filterItems(category: string) {
      let visibleCount = 0;

      itemEntries.forEach((item) => {
        const itemCategory = item.dataset.categories || "";
        if (!category || itemCategory === category) {
          item.classList.remove("hidden");
          visibleCount++;
        } else {
          item.classList.add("hidden");
        }
      });

      buttons.forEach((btn) => {
        const btnCategory = btn.dataset.category || "";
        if (btnCategory === category) {
          btn.classList.remove("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
          btn.classList.add("bg-primary-600", "text-white");
        } else {
          btn.classList.remove("bg-primary-600", "text-white");
          btn.classList.add("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
        }
      });

      if (itemCount) {
        itemCount.textContent = `共 ${visibleCount} 条`;
      }

      if (visibleCount === 0) {
        noItems?.classList.remove("hidden");
      } else {
        noItems?.classList.add("hidden");
      }
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.category || "";
        filterItems(category);
      });
    });

    resetBtn?.addEventListener("click", () => {
      filterItems("");
    });

    const url = new URL(window.location.href);
    const initialCategory = url.searchParams.get("category") || "";
    if (initialCategory) {
      filterItems(initialCategory);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">个人知识库</h1>
        <p className="text-gray-500 mb-6">
          这里汇集了博客长文与碎片化笔记，按主题分类整理，便于检索与回顾。
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{items.length}</div>
            <div className="text-xs text-gray-500 mt-1">总内容</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{blogCount}</div>
            <div className="text-xs text-gray-500 mt-1">博客文章</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{notesCount}</div>
            <div className="text-xs text-gray-500 mt-1">笔记</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{categories.length}</div>
            <div className="text-xs text-gray-500 mt-1">分类</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{tags.length}</div>
            <div className="text-xs text-gray-500 mt-1">标签</div>
          </div>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 mb-10">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-primary-800 mb-1">Agent / LLM 检索入口</h3>
            <p className="text-sm text-primary-700 mb-2">
              如果你是 AI Agent 或需要使用 LLM 检索本站知识，建议优先访问以下入口：
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/llms.txt"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 transition-colors"
              >
                /llms.txt — 站点概述
              </Link>
              <Link
                href="/llms-full.txt"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 transition-colors"
              >
                /llms-full.txt — 全文聚合
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">按分类浏览</h2>
        <div className="flex flex-wrap gap-2" id="category-filters">
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
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">所有内容</h2>
        <p className="text-sm text-gray-500 mb-4" id="item-count">
          共 {items.length} 条
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2" id="items-grid">
        {items.map((item) => (
          <div
            key={`${item.type}-${item.slug}`}
            data-categories={item.meta.category || ""}
            className="item-entry"
          >
            <PostCard post={item} basePath={item.type === "blog" ? "blog" : "notes"} />
          </div>
        ))}
      </div>

      <div id="no-items" className="hidden text-center py-20">
        <p className="text-gray-500">该分类下暂无内容</p>
        <button
          id="reset-filter"
          className="inline-flex items-center mt-4 text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          查看全部
        </button>
      </div>

      {tags.length > 0 && (
        <div className="mt-16 pt-10 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">标签索引</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const count = items.filter((item) => item.meta.tags?.includes(tag)).length;
              return (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span>#{tag}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

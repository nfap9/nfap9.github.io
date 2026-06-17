import BlogListClient from '@/components/BlogListClient';
import { getBlogPosts } from '@/lib/content';

export const metadata = {
  title: '文章列表 | shen 的博客',
  description: '浏览所有博客文章',
};

export default async function BlogPage() {
  const allPosts = await getBlogPosts();
  const categories = [
    ...new Set(allPosts.map((post) => post.meta.category).filter(Boolean) as string[]),
  ];

  return <BlogListClient posts={allPosts} categories={categories} />;
}

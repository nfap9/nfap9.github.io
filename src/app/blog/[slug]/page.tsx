import { notFound } from 'next/navigation';
import BlogPostLayout from '@/components/BlogPostLayout';
import { getBlogPosts, getPostBySlug } from '@/lib/content';

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug('blog', slug);
  return {
    title: `${post?.meta.title || '文章'} | shen 的博客`,
    description: post?.meta.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug('blog', slug);

  if (!post) {
    notFound();
  }

  return <BlogPostLayout item={post} backLink="/blog" backText="返回文章列表" />;
}

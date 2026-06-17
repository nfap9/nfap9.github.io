import { notFound } from 'next/navigation';
import BlogPostLayout from '@/components/BlogPostLayout';
import { getNotes, getPostBySlug } from '@/lib/content';

export async function generateStaticParams() {
  const notes = await getNotes();
  return notes.map((note) => ({ slug: note.slug }));
}

interface NotePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NotePageProps) {
  const { slug } = await params;
  const note = await getPostBySlug('notes', slug);
  return {
    title: `${note?.meta.title || '笔记'} | shen 的博客`,
    description: note?.meta.description,
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = await getPostBySlug('notes', slug);

  if (!note) {
    notFound();
  }

  return <BlogPostLayout item={note} backLink="/kb" backText="返回知识库" />;
}

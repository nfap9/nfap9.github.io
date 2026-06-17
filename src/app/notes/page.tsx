import BlogListClient from '@/components/BlogListClient';
import { getNotes } from '@/lib/content';

export const metadata = {
  title: '笔记 | shen 的博客',
  description: '浏览所有技术笔记',
};

export default async function NotesPage() {
  const allNotes = await getNotes();
  const categories = [
    ...new Set(allNotes.map((note) => note.meta.category).filter(Boolean) as string[]),
  ];

  return <BlogListClient posts={allNotes} categories={categories} title="笔记列表" countText="篇笔记" emptyText="该分类下暂无笔记" resetText="查看全部笔记" />;
}

import KnowledgeBaseClient from '@/components/KnowledgeBaseClient';
import { getAllItems, getAllCategories, getAllTags } from '@/lib/content';

export const metadata = {
  title: '知识库 | shen 的博客',
  description: '按分类和标签组织的个人知识库',
};

export default async function KnowledgeBasePage() {
  const [allItems, categories, allTags] = await Promise.all([
    getAllItems(),
    getAllCategories(),
    getAllTags(),
  ]);

  return (
    <KnowledgeBaseClient
      items={allItems}
      categories={categories}
      tags={allTags}
    />
  );
}

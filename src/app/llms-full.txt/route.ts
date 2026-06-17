import { getAllItems, getBlogPosts, getNotes } from '@/lib/content';

export const dynamic = 'force-static';

export async function GET() {
  const blogPosts = await getBlogPosts();
  const notes = await getNotes();

  const sortByDate = (a: { meta: { pubDate?: Date } }, b: { meta: { pubDate?: Date } }) =>
    (b.meta.pubDate?.valueOf() || 0) - (a.meta.pubDate?.valueOf() || 0);

  blogPosts.sort(sortByDate);
  notes.sort(sortByDate);

  const allItems = [...blogPosts, ...notes].sort(sortByDate);
  const siteUrl = 'https://nfap9.github.io';

  let fullText = `# nfap9 个人知识库全文聚合

> 生成时间：${new Date().toISOString()}
> 站点：${siteUrl}
> 本文档包含所有博客文章和笔记的完整 Markdown 内容，供 LLM 检索和分析使用。
> 文章总数：${allItems.length}（博客 ${blogPosts.length} 篇 + 笔记 ${notes.length} 条）

`;

  for (const item of allItems) {
    const type = item.type === 'blog' ? '博客' : '笔记';
    const url = `${siteUrl}/${item.type === 'blog' ? 'blog' : 'notes'}/${item.slug}/`;

    fullText += `\n---\n\n`;
    fullText += `# ${item.meta.title}\n\n`;
    fullText += `> **类型**：${type}\n`;
    fullText += `> **URL**：${url}\n`;
    fullText += `> **分类**：${item.meta.category || '未分类'}\n`;
    fullText += `> **标签**：${(item.meta.tags || []).join(', ') || '无'}\n`;
    fullText += `> **发布日期**：${item.meta.pubDate?.toISOString().split('T')[0] || '无日期'}\n`;
    if (item.meta.updatedDate) {
      fullText += `> **更新日期**：${item.meta.updatedDate.toISOString().split('T')[0]}\n`;
    }
    if (item.meta.description) {
      fullText += `> **描述**：${item.meta.description}\n`;
    }
    fullText += `\n`;
    fullText += item.body;
    fullText += `\n`;
  }

  return new Response(fullText, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

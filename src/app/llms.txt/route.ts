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

  const categories = [...new Set(allItems.map((p) => p.meta.category).filter(Boolean))];
  const allTags = [...new Set(allItems.flatMap((p) => p.meta.tags || []))];

  const siteUrl = 'https://nfap9.github.io';

  const sections: string[] = [];

  sections.push(`# nfap9 的个人知识库

> 一个专注于前端技术的个人博客与知识库。
> 站点地址：${siteUrl}

## 概览

- **文章总数**：${allItems.length}（博客 ${blogPosts.length} 篇 + 笔记 ${notes.length} 条）
- **主要分类**：${categories.join('、') || '无'}
- **标签体系**：${allTags.join('、') || '无'}
`);

  sections.push(`## 最新内容

${allItems
  .slice(0, 15)
  .map((p) => {
    const type = p.type === 'blog' ? '博客' : '笔记';
    const url = `${siteUrl}/${p.type === 'blog' ? 'blog' : 'notes'}/${p.slug}/`;
    return `- [${p.meta.title}](${url}) — ${p.meta.description || '无描述'} (${type} · ${p.meta.category || '未分类'} · ${p.meta.pubDate?.toISOString().split('T')[0] || '无日期'})`;
  })
  .join('\n')}
`);

  if (categories.length > 0) {
    sections.push(`## 按分类索引

${categories
  .map((cat) => {
    const catItems = allItems.filter((p) => p.meta.category === cat);
    return `### ${cat}\n\n${catItems
      .map((p) => {
        const url = `${siteUrl}/${p.type === 'blog' ? 'blog' : 'notes'}/${p.slug}/`;
        return `- [${p.meta.title}](${url}) — ${p.meta.description || ''}`;
      })
      .join('\n')}`;
  })
  .join('\n\n')}
`);
  }

  if (allTags.length > 0) {
    sections.push(`## 按标签索引

${allTags
  .map((tag) => {
    const tagItems = allItems.filter((p) => p.meta.tags?.includes(tag));
    return `- **${tag}**：${tagItems.map((p) => p.meta.title).join('、')}`;
  })
  .join('\n')}
`);
  }

  sections.push(`## Agent 使用指引

如需基于全文内容进行深度分析或问答，请访问 ${siteUrl}/llms-full.txt 获取所有文章和笔记的完整 Markdown 内容。
`);

  const content = sections.join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface PostMeta {
  title: string;
  description?: string;
  pubDate?: Date;
  updatedDate?: Date;
  category?: string;
  tags?: string[];
  draft?: boolean;
}

export interface ContentItem {
  slug: string;
  type: 'blog' | 'notes';
  meta: PostMeta;
  body: string;
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');

function parseFrontmatter(data: Record<string, unknown>): PostMeta {
  return {
    title: String(data.title ?? ''),
    description: data.description ? String(data.description) : undefined,
    pubDate: data.pubDate ? new Date(String(data.pubDate)) : undefined,
    updatedDate: data.updatedDate ? new Date(String(data.updatedDate)) : undefined,
    category: data.category ? String(data.category) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : undefined,
    draft: data.draft === true,
  };
}

export async function getCollection(type: 'blog' | 'notes'): Promise<ContentItem[]> {
  const dir = path.join(CONTENT_DIR, type);
  let files: string[] = [];

  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }

  const items = await Promise.all(
    files
      .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
      .map(async (file) => {
        const filePath = path.join(dir, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(raw);
        const slug = file.replace(/\.(md|mdx)$/, '');

        return {
          slug,
          type,
          meta: parseFrontmatter(data),
          body: content,
          content: raw,
        };
      })
  );

  return items
    .filter((item) => !item.meta.draft)
    .sort((a, b) => (b.meta.pubDate?.getTime() || 0) - (a.meta.pubDate?.getTime() || 0));
}

export async function getBlogPosts(): Promise<ContentItem[]> {
  return getCollection('blog');
}

export async function getNotes(): Promise<ContentItem[]> {
  return getCollection('notes');
}

export async function getPostBySlug(
  type: 'blog' | 'notes',
  slug: string
): Promise<ContentItem | undefined> {
  const items = await getCollection(type);
  return items.find((item) => item.slug === slug);
}

export async function getAllItems(): Promise<ContentItem[]> {
  const [blogPosts, notes] = await Promise.all([getBlogPosts(), getNotes()]);
  return [...blogPosts, ...notes].sort(
    (a, b) => (b.meta.pubDate?.getTime() || 0) - (a.meta.pubDate?.getTime() || 0)
  );
}

export async function getAllTags(): Promise<string[]> {
  const items = await getAllItems();
  return [...new Set(items.flatMap((item) => item.meta.tags || []))];
}

export async function getAllCategories(): Promise<string[]> {
  const items = await getAllItems();
  return [...new Set(items.map((item) => item.meta.category).filter(Boolean) as string[])];
}

export function getItemUrl(item: ContentItem): string {
  return `/${item.type === 'blog' ? 'blog' : 'notes'}/${item.slug}/`;
}

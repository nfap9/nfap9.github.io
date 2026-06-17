import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

interface MdxContentProps {
  source: string;
}

export default async function MdxContent({ source }: MdxContentProps) {
  const processed = await remark().use(remarkGfm).use(html, { sanitize: false }).process(source);
  const htmlContent = processed.toString();

  return (
    <div
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

import type { Metadata } from 'next';
import ArticlePage from '@/components/site/ArticlePage';
import { getBlogArticle } from '@/lib/blogContent';
import { buildPageMetadata } from '@/lib/seo';

const article = getBlogArticle('choosing-restaurant-qr-ordering-system-india');

export const metadata: Metadata = buildPageMetadata({
  title: article.metaTitle,
  description: article.metaDescription,
  path: `/blog/${article.slug}`,
  type: 'article',
  publishedTime: article.datePublished,
  modifiedTime: article.dateModified,
});

export default function ChoosingQrSystemIndiaPage() {
  return <ArticlePage article={article} />;
}
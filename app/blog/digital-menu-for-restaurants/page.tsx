import type { Metadata } from 'next';
import ArticlePage from '@/components/site/ArticlePage';
import { getBlogArticle } from '@/lib/blogContent';
import { buildPageMetadata } from '@/lib/seo';

const article = getBlogArticle('digital-menu-for-restaurants');

export const metadata: Metadata = buildPageMetadata({
  title: article.metaTitle,
  description: article.metaDescription,
  path: `/blog/${article.slug}`,
  type: 'article',
  publishedTime: article.datePublished,
  modifiedTime: article.dateModified,
});

export default function DigitalMenuArticlePage() {
  return <ArticlePage article={article} />;
}
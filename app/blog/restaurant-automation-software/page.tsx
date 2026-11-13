import type { Metadata } from 'next';
import ArticlePage from '@/components/site/ArticlePage';
import { getBlogArticle } from '@/lib/blogContent';
import { buildPageMetadata } from '@/lib/seo';

const article = getBlogArticle('restaurant-automation-software');

export const metadata: Metadata = buildPageMetadata({
  title: article.metaTitle,
  description: article.metaDescription,
  path: `/blog/${article.slug}`,
  type: 'article',
  publishedTime: article.datePublished,
  modifiedTime: article.dateModified,
});

export default function RestaurantAutomationArticlePage() {
  return <ArticlePage article={article} />;
}
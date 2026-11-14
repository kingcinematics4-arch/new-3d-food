import type { Metadata } from 'next';
import { getCanonicalSiteUrl } from './siteUrl';

export const SITE_NAME = 'DinePixel';
export const SITE_URL = getCanonicalSiteUrl();
export const SITE_EMAIL = 'hello@dinepixel.com';
export const OG_IMAGE = `${SITE_URL}/images/dinepixel-og.png`;
export const SITE_DESCRIPTION =
  'Discover DinePixel, a smart restaurant QR ordering system with digital menus, table ordering, live order tracking and powerful restaurant management features. Built for modern restaurants in Mumbai, Thane, Navi Mumbai and across India.';

export const PRIMARY_KEYWORDS = [
  'QR ordering system',
  'best QR ordering system',
  'premium QR ordering system',
  '3D QR ordering system',
  'smart QR ordering system',
  'digital QR menu',
  'restaurant QR ordering system',
  'QR code food ordering system',
  'contactless restaurant ordering',
  'online restaurant ordering system',
  'restaurant digital menu system',
  'QR menu with online ordering',
  'restaurant management software',
  'restaurant automation software',
  'QR table ordering system',
  'scan and order restaurant system',
  'dine-in QR ordering software',
  'smart restaurant technology',
];

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image = OG_IMAGE,
  type = 'website',
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

interface SoftwareApplicationInput {
  name: string;
  description: string;
  path: string;
  featureList: string[];
  applicationCategory?: string;
}

export function softwareApplicationSchema({
  name,
  description,
  path,
  featureList,
  applicationCategory = 'BusinessApplication',
}: SoftwareApplicationInput) {
  return {
    '@type': 'SoftwareApplication',
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory,
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Works in modern mobile and desktop browsers.',
    featureList,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  };
}

interface ServiceSchemaInput {
  name: string;
  serviceType: string;
  description: string;
  path: string;
  areaServed: string[];
}

export function serviceSchema({
  name,
  serviceType,
  description,
  path,
  areaServed,
}: ServiceSchemaInput) {
  return {
    '@type': 'Service',
    name,
    serviceType,
    description,
    url: absoluteUrl(path),
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: areaServed.map((area) => ({
      '@type': 'Place',
      name: area,
    })),
    inLanguage: 'en',
  };
}

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: SeoFaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

interface HowToInput {
  name: string;
  description: string;
  path: string;
  steps: { label: string; description: string }[];
}

export function howToSchema({ name, description, path, steps }: HowToInput) {
  return {
    '@type': 'HowTo',
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: 'en',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.label,
      text: step.description,
    })),
  };
}

interface OfferCatalogInput {
  name: string;
  path: string;
  offers: { name: string; price: string }[];
}

export function offerCatalogSchema({ name, path, offers }: OfferCatalogInput) {
  return {
    '@type': 'OfferCatalog',
    name,
    url: absoluteUrl(path),
    itemListElement: offers.map((offer, index) => ({
      '@type': 'Offer',
      position: index + 1,
      name: offer.name,
      price: offer.price,
      priceCurrency: 'INR',
      url: absoluteUrl(path),
    })),
  };
}

interface ArticleSchemaInput {
  headline: string;
  description: string;
  path: string;
  publishedTime: string;
  modifiedTime: string;
  image?: string;
}

export function articleSchema({
  headline,
  description,
  path,
  publishedTime,
  modifiedTime,
  image = OG_IMAGE,
}: ArticleSchemaInput) {
  return {
    '@type': 'BlogPosting',
    headline,
    description,
    image: [image],
    datePublished: publishedTime,
    dateModified: modifiedTime,
    mainEntityOfPage: absoluteUrl(path),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  };
}

export function organizationSchema(logoUrl: string) {
  let logo = logoUrl;
  try {
    logo = new URL(logoUrl, SITE_URL).toString();
  } catch {
    logo = `${SITE_URL}/images/dinepixel-logo.png`;
  }

  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo,
    description: SITE_DESCRIPTION,
    email: SITE_EMAIL,
    areaServed: [
      { '@type': 'City', name: 'Mumbai' },
      { '@type': 'City', name: 'Thane' },
      { '@type': 'City', name: 'Navi Mumbai' },
      { '@type': 'State', name: 'Maharashtra' },
      { '@type': 'Country', name: 'India' },
    ],
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}
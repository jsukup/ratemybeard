"use client";

import Head from 'next/head';
import { BRAND_CONFIG, generateMetaTags, getBrandAsset } from '@/constants/branding';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  noIndex = false,
  noFollow = false,
  canonical
}: SEOHeadProps) {
  // Generate meta tags using brand configuration
  const metaTags = generateMetaTags({
    title,
    description,
    image,
    url
  });

  // Combine brand keywords with page-specific keywords
  const allKeywords = [
    ...BRAND_CONFIG.seo.keywords,
    ...keywords
  ].join(', ');

  // Structured data for organization
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": BRAND_CONFIG.name,
    "description": BRAND_CONFIG.longDescription,
    "url": BRAND_CONFIG.social.website,
    "logo": getBrandAsset('logo', 'main'),
    "contactPoint": {
      "@type": "ContactPoint",
      "email": BRAND_CONFIG.contactEmail,
      "contactType": "customer service"
    },
    "sameAs": [
      BRAND_CONFIG.social.github,
      // Add other social media URLs when available
    ]
  };

  // Structured data for website
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": BRAND_CONFIG.name,
    "description": BRAND_CONFIG.longDescription,
    "url": BRAND_CONFIG.social.website,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BRAND_CONFIG.social.website}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Generate robots meta content
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content={author || BRAND_CONFIG.name} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={metaTags['og:title']} />
      <meta property="og:description" content={metaTags['og:description']} />
      <meta property="og:image" content={metaTags['og:image']} />
      <meta property="og:url" content={metaTags['og:url']} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={metaTags['og:site_name']} />
      <meta property="og:locale" content={metaTags['og:locale']} />
      
      {/* Article-specific Open Graph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={metaTags['twitter:card']} />
      <meta name="twitter:title" content={metaTags['twitter:title']} />
      <meta name="twitter:description" content={metaTags['twitter:description']} />
      <meta name="twitter:image" content={metaTags['twitter:image']} />
      <meta name="twitter:site" content={metaTags['twitter:site']} />
      
      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href={getBrandAsset('favicon', 'ico')} />
      <link rel="icon" type="image/png" sizes="16x16" href={getBrandAsset('favicon', 'png16')} />
      <link rel="icon" type="image/png" sizes="32x32" href={getBrandAsset('favicon', 'png32')} />
      <link rel="apple-touch-icon" href={getBrandAsset('favicon', 'appleTouchIcon')} />
      <link rel="icon" type="image/png" sizes="192x192" href={getBrandAsset('favicon', 'androidChrome192')} />
      <link rel="icon" type="image/png" sizes="512x512" href={getBrandAsset('favicon', 'androidChrome512')} />
      
      {/* iOS App Icons */}
      <link rel="apple-touch-icon" sizes="180x180" href={getBrandAsset('appIcons', 'ios180')} />
      <link rel="apple-touch-icon" sizes="152x152" href={getBrandAsset('appIcons', 'ios152')} />
      <link rel="apple-touch-icon" sizes="120x120" href={getBrandAsset('appIcons', 'ios120')} />
      
      {/* Theme and App Configuration */}
      <meta name="theme-color" content={BRAND_CONFIG.colors.primary} />
      <meta name="msapplication-TileColor" content={BRAND_CONFIG.colors.primary} />
      <meta name="application-name" content={BRAND_CONFIG.name} />
      <meta name="apple-mobile-web-app-title" content={BRAND_CONFIG.name} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData)
        }}
      />
      
      {/* Additional Security Headers */}
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="referrer" content="origin-when-cross-origin" />
      
      {/* Copyright and Legal */}
      <meta name="copyright" content={`© ${BRAND_CONFIG.legal.copyrightYear} ${BRAND_CONFIG.legal.companyName}`} />
      
      {/* Language and Locale */}
      <meta httpEquiv="content-language" content="en-US" />
      <link rel="alternate" hrefLang="en" href={url || BRAND_CONFIG.social.website} />
    </Head>
  );
}

// Specialized SEO components for common pages

export function HomePageSEO() {
  return (
    <SEOHead
      title={`${BRAND_CONFIG.name} - ${BRAND_CONFIG.tagline}`}
      description={BRAND_CONFIG.longDescription}
      keywords={['home', 'main page', 'beard rating platform']}
      url={BRAND_CONFIG.social.website}
    />
  );
}

export function LeaderboardSEO() {
  return (
    <SEOHead
      title="Leaderboard - Top Rated Beards"
      description="Browse the top-rated beards on RateMyBeard. See community rankings and discover the highest-rated submissions."
      keywords={['leaderboard', 'rankings', 'top rated', 'best beards', 'high scores']}
      url={`${BRAND_CONFIG.social.website}/leaderboard`}
    />
  );
}

export function AboutSEO() {
  return (
    <SEOHead
      title="About RateMyBeard"
      description="Learn about RateMyBeard, a fun community platform for rating beard attractiveness. Discover how our rating system works and join the community."
      keywords={['about', 'how it works', 'community', 'rating system']}
      url={`${BRAND_CONFIG.social.website}/about`}
    />
  );
}

export function PrivacySEO() {
  return (
    <SEOHead
      title="Privacy Policy"
      description="Read our privacy policy to understand how we collect, use, and protect your personal information on RateMyBeard."
      keywords={['privacy', 'policy', 'data protection', 'user privacy']}
      url={`${BRAND_CONFIG.social.website}/privacy`}
      noIndex={true}
    />
  );
}

export function TermsSEO() {
  return (
    <SEOHead
      title="Terms of Service"
      description="Read our terms of service to understand the rules and guidelines for using RateMyBeard."
      keywords={['terms', 'service', 'rules', 'guidelines', 'legal']}
      url={`${BRAND_CONFIG.social.website}/terms`}
      noIndex={true}
    />
  );
}

// Dynamic SEO for user profiles or image pages
export function DynamicPageSEO({
  pageTitle,
  pageDescription,
  imageUrl,
  pageUrl,
  pageKeywords = []
}: {
  pageTitle: string;
  pageDescription: string;
  imageUrl?: string;
  pageUrl?: string;
  pageKeywords?: string[];
}) {
  return (
    <SEOHead
      title={pageTitle}
      description={pageDescription}
      image={imageUrl}
      url={pageUrl}
      keywords={pageKeywords}
      type="article"
    />
  );
}
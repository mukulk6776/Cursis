/**
 * Structured Data & Schema.org Markup for SEO
 * Helps search engines understand your content better
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export interface Review {
  author: string;
  datePublished: string;
  reviewBody: string;
  reviewRating: {
    ratingValue: number;
    bestRating: number;
  };
}

/**
 * Generate Organization Schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cursis',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    description: 'Autonomous workspace platform with AI-powered Ordis intelligence for enterprise teams',
    url: 'https://www.cursis.in',
    logo: 'https://www.cursis.in/icon.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@cursis.in',
    },
    sameAs: [
      'https://twitter.com/cursis',
      'https://linkedin.com/company/cursis',
      'https://github.com/cursis',
    ],
  };
}

/**
 * Generate FAQ Schema
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate How-To Schema
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: HowToStep[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  };
}

/**
 * Generate Article Schema
 */
export function generateArticleSchema(
  title: string,
  description: string,
  datePublished: string,
  dateModified: string,
  authorName: string = 'Cursis Team',
  image?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || 'https://www.cursis.in/og-image.png',
    datePublished,
    dateModified,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: 'https://www.cursis.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cursis',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cursis.in/icon.png',
      },
    },
  };
}

/**
 * Generate Product/Service Schema
 */
export function generateProductSchema(
  name: string,
  description: string,
  reviews?: Review[]
) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    brand: {
      '@type': 'Brand',
      name: 'Cursis',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  if (reviews && reviews.length > 0) {
    schema.review = reviews.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      datePublished: review.datePublished,
      reviewBody: review.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.reviewRating.ratingValue,
        bestRating: review.reviewRating.bestRating,
      },
    }));

    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (
        reviews.reduce((sum, r) => sum + r.reviewRating.ratingValue, 0) /
        reviews.length
      ).toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
    };
  }

  return schema;
}

/**
 * Generate Breadcrumb Schema
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Video Schema
 */
export function generateVideoSchema(
  name: string,
  description: string,
  thumbnailUrl: string,
  uploadDate: string,
  contentUrl: string,
  duration?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    uploadDate,
    contentUrl,
    duration,
  };
}

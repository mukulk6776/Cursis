import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketingPage from '@/components/landing/MarketingPage';
import { getPosts } from '@/lib/seo/blog';
import { marketingMetadata } from '@/lib/seo/marketing';

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderMarkdownBlocks(body: string): React.ReactNode[] {
  const normalized = body.replace(/\r\n/g, '\n').replace(/^(#{2,3} .+)\n/gm, '$1\n\n');
  const blocks = normalized
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, idx) => {
    if (block.startsWith('### ')) {
      return (
        <h3 key={idx} style={{ fontSize: '18px', fontWeight: 700, margin: '22px 0 8px' }}>
          {renderInlineFormatting(block.slice(4))}
        </h3>
      );
    }
    if (block.startsWith('## ')) {
      return <h2 key={idx}>{renderInlineFormatting(block.slice(3))}</h2>;
    }

    const lines = block.split('\n').map((l) => l.trim());
    if (lines.every((l) => l.startsWith('- '))) {
      return (
        <ul
          key={idx}
          style={{
            listStyle: 'disc',
            paddingLeft: '22px',
            margin: '12px 0 18px',
            display: 'grid',
            gap: '8px',
            lineHeight: 1.65,
          }}
        >
          {lines.map((line, liIdx) => (
            <li key={liIdx}>{renderInlineFormatting(line.slice(2))}</li>
          ))}
        </ul>
      );
    }

    return <p key={idx}>{renderInlineFormatting(lines.join(' '))}</p>;
  });
}

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPosts().find((p) => p.slug === slug);
  return post
    ? {
        ...marketingMetadata('/blog/' + slug, post.title, post.description),
        robots: { index: true, follow: true },
      }
    : {};
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return notFound();

  const wordCount = post.body.split(/\s+/).filter(Boolean).length;
  const articleUrl = `https://cursis.in/blog/${slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updated,
        wordCount,
        author: {
          '@type': 'Person',
          name: post.author,
          jobTitle: post.authorRole,
          url: 'https://cursis.in/about',
        },
        publisher: {
          '@type': 'Organization',
          name: 'CURSIS',
          url: 'https://cursis.in',
          logo: {
            '@type': 'ImageObject',
            url: 'https://cursis.in/icon.png',
          },
        },
        image: 'https://cursis.in/marketing-og.png',
        mainEntityOfPage: articleUrl,
        creativeWorkStatus: 'Published',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cursis.in/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://cursis.in/blog' },
          { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl },
        ],
      },
    ],
  };

  return (
    <MarketingPage
      title={post.title}
      intro={post.description}
      nextStep={
        slug === 'catch-delayed-tasks'
          ? 'Give that delayed task a next step'
          : slug === 'workload-balancing-small-teams'
          ? 'Make room for a better week'
          : 'Put your next brief in motion'
      }
    >
      <div
        className="marketing-card"
        style={{
          marginBottom: '18px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          fontSize: '13px',
        }}
      >
        <div>
          <strong>{post.author}</strong> · <span style={{ color: '#4B5563' }}>{post.authorRole}</span>
        </div>
        <div style={{ color: '#4B5563' }}>
          Published <time dateTime={post.date}>{post.date}</time> · Updated{' '}
          <time dateTime={post.updated}>{post.updated}</time> · {post.readTime}
        </div>
      </div>

      <article className="marketing-card marketing-prose">{renderMarkdownBlocks(post.body)}</article>

      <aside className="lp-keep-reading" style={{ marginTop: '24px' }}>
        <h2>Keep reading</h2>
        <ul>
          {posts
            .filter((p) => p.slug !== slug)
            .map((p) => (
              <li key={p.slug}>
                <Link className="marketing-link" href={'/blog/' + p.slug}>
                  {p.title}
                </Link>
              </li>
            ))}
        </ul>
      </aside>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
    </MarketingPage>
  );
}

import fs from 'node:fs';
import path from 'node:path';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  draft: boolean;
  date: string;
  updated: string;
  author: string;
  authorRole: string;
  readTime: string;
  body: string;
}

const AUTHOR_ROLES: Record<string, string> = {
  'Saransh Vashistha': 'CEO · Product direction',
  'Mukul Kumar': 'CTO · Engineering',
  Lakhan: 'CGO · Growth & community',
};

export function getPosts(): BlogPost[] {
  const directory = path.join(process.cwd(), 'content/blog');
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(directory, file), 'utf8');
      const [, frontmatter = '', body = ''] = raw.split('---');
      const fields = Object.fromEntries(
        frontmatter
          .trim()
          .split('\n')
          .map((line) => {
            const colon = line.indexOf(':');
            return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
          })
      );
      const author = fields.author || 'Saransh Vashistha';
      const words = body.trim().split(/\s+/).filter(Boolean).length;
      const mins = Math.max(2, Math.round(words / 180));
      return {
        slug: file.replace(/\.md$/, ''),
        title: fields.title || '',
        description: fields.description || '',
        draft: fields.status === 'draft',
        date: fields.date || '2026-10-31',
        updated: fields.updated || fields.date || '2026-11-26',
        author,
        authorRole: fields.authorRole || AUTHOR_ROLES[author] || 'Cursis Team',
        readTime: fields.readTime || `${mins} min read`,
        body: body.trim(),
      };
    });
}

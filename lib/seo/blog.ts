import fs from 'node:fs';
import path from 'node:path';
export function getPosts() {
 const directory = path.join(process.cwd(), 'content/blog');
 return fs.readdirSync(directory).filter(file => file.endsWith('.md')).map(file => {
  const raw = fs.readFileSync(path.join(directory, file), 'utf8');
  const [, frontmatter = '', body = ''] = raw.split('---');
  const fields = Object.fromEntries(frontmatter.trim().split('\n').map(line => { const colon = line.indexOf(':'); return [line.slice(0, colon), line.slice(colon + 1).trim()]; }));
  return { slug: file.replace(/\.md$/, ''), title: fields.title, description: fields.description, draft: fields.status === 'draft', body: body.trim() };
 });
}

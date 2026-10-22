import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';
import { BRAND_NAME, FREE_WORKSPACE_TEXT } from '@/lib/site';
export const metadata = marketingMetadata('/compare', 'Compare Cursis, Trello, Asana and ClickUp', 'Compare workflow fit and documented features. Cursis includes tasks, projects, calendar, video meetings, Ordis AI, automatic actions and reports.');
const tools = [
  { name: 'Trello', bestFor: 'Consider Trello for a visual workflow built around boards, lists and cards, with due dates and attachments on cards.', url: 'https://trello.com/tour' },
  { name: 'Asana', bestFor: 'Consider Asana for coordinating projects with task owners and due dates, different project views and cross-project reporting.', url: 'https://asana.com/features' },
  { name: 'ClickUp', bestFor: 'Consider ClickUp for organizing tasks, documents and team chat together, with configurable task views and reporting.', url: 'https://clickup.com/features' },
];
const features = ['Tasks', 'Projects', 'Calendar', 'Video meetings', 'Ordis AI', 'Automatic actions', 'Progress reports', FREE_WORKSPACE_TEXT];
export default function Compare() {
  return <MarketingPage title="Choose the workspace that fits your team." intro="Start with how your team works, then try the same real project in each tool.">
    <section className="marketing-prose"><h2>What {BRAND_NAME} is built for</h2><p>A small team that wants tasks, project context, conversations and meetings together, with Ordis AI to help catch delays and share work. {FREE_WORKSPACE_TEXT}.</p></section>
    <div className="marketing-grid">{tools.map(tool => <article key={tool.name} className="marketing-card"><h2>{tool.name}: a good fit for</h2><p>{tool.bestFor}</p><a href={tool.url} target="_blank" rel="noopener noreferrer">See {tool.name}’s official features ↗</a></article>)}</div>
    <section><h2>What’s included in {BRAND_NAME}</h2><p>Competitor entries link to their own documentation so you can check current availability for your needs. These links do not imply that a feature is missing.</p><div className="marketing-table-scroll"><table className="marketing-comparison"><caption>Included tools and where to verify alternatives</caption><thead><tr><th scope="col">Feature</th><th scope="col">{BRAND_NAME}</th>{tools.map(tool => <th scope="col" key={tool.name}>{tool.name}</th>)}</tr></thead><tbody>{features.map(feature => <tr key={feature}><th scope="row">{feature}</th><td>Included</td>{tools.map(tool => <td key={tool.name}><a href={tool.url} target="_blank" rel="noopener noreferrer">See their docs<span className="sr-only">: {tool.name}, {feature}</span> ↗</a></td>)}</tr>)}</tbody></table></div><p>Workflow suggestions are based on the official feature pages linked above, reviewed 22 October 2026. Check their sites for current details.</p></section>
    <p><Link href="/signup" className="btn btn-primary">Make my free workspace</Link></p>
  </MarketingPage>;
}

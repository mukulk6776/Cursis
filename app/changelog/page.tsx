import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';
import { changelogEntries } from '@/content/changelog';

export const metadata = marketingMetadata('/changelog', 'Changelog — Product Updates', 'Follow released improvements and fixes to the Cursis team workspace.');

export default function Changelog() {
  return <MarketingPage title="What’s new in Cursis" intro="Released improvements and fixes from the team." nextStep="Explore the current workspace">
    {changelogEntries.length ? changelogEntries.map(entry => <article className="marketing-card" key={entry.date + entry.title}>
      <time dateTime={entry.date}>{entry.date}</time><h2>{entry.title}</h2>
      <ul>{entry.changes.map(change => <li key={change}>{change}</li>)}</ul>
    </article>) : <p>No updates published yet.</p>}
  </MarketingPage>;
}

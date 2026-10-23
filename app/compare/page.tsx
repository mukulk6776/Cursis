import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/compare', 'Compare — Find the Right Way to Work', 'Compare a task-list-led routine with the way Cursis uses Ordis to suggest a next action. Choose based on your team’s needs.');
const rows = [
  ['Daily check-in', 'Review your list and choose what to follow up on.', 'Ask Ordis which work needs attention, then review its suggestion.'],
  ['When work stalls', 'Use the tool’s reminders, rules or your own check-in routine.', 'Ask what is blocking a task and who could take the next step.'],
  ['Deciding what to change', 'Use your team’s context and judgment.', 'Use your team’s context and judgment. AI suggestions can be wrong.'],
  ['Before you commit', 'Check the specific tool’s current features and plan limits.', 'Try the example on the homepage, then test your own project.'],
];
export default function Compare() {
  return <MarketingPage title="Pick the routine you will actually use." intro="A task list may be enough. If follow-ups keep slipping, try a different way to check in." nextStep="Judge it on your next real project">
    <div className="marketing-table-scroll" role="region" aria-label="Workspace approach comparison" tabIndex={0}><table className="marketing-comparison"><caption>Two ways to run a team check-in</caption><thead><tr><th scope="col">Question</th><th scope="col">Typical task tools</th><th scope="col">Cursis</th></tr></thead><tbody>{rows.map(([question, typical, cursis]) => <tr key={question}><th scope="row">{question}</th><td>{typical}</td><td>{cursis}</td></tr>)}</tbody></table></div>
    <p>This compares working styles, not a feature-by-feature ranking of every product. Capabilities vary by tool and setup; it does not mean alternatives lack these features.</p><div className="marketing-link-list"><Link className="marketing-link" href="/#ordis">Try the Ordis example</Link><Link className="marketing-link" href="/pricing">Check the workspace limit</Link></div>
  </MarketingPage>;
}

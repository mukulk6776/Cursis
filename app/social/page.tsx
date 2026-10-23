import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata, socialProfiles } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/social', 'Community — Official Cursis Channels', 'Find the official Cursis social profiles and Discord community.');
export default function Social() {
  return <MarketingPage title="Stay in the conversation." intro="Our official channels for ideas, questions and product news." nextStep="Come with something to work on">
    <ul className="marketing-social-list">{socialProfiles.map(profile => <li key={profile.name}><a href={profile.url} target="_blank" rel="noopener noreferrer">{profile.name}<span className="sr-only"> (opens in a new tab)</span> <span aria-hidden="true">↗</span></a></li>)}</ul>
  </MarketingPage>;
}

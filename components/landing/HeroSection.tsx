import Link from 'next/link';
import { ArrowUpRight, Check, MessageSquare, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return <section className="lp-section lp-hero" id="hero">
    <div className="lp-hero-header">
      <p className="lp-section-label">Your team’s next move</p>
      <h1 className="lp-hero-title">Less chasing.<br /><span className="tano-hero-marker">More getting done.</span></h1>
      <p className="lp-hero-text">Other tools store your tasks. Cursis chases them for you.</p>
      <div className="lp-hero-ctas">
        <Link prefetch={false} href="/signup" data-marketing="hero_button_click" className="btn btn-primary btn-lg">Make my workspace <ArrowUpRight size={18} aria-hidden="true" /></Link>
        <Link prefetch={false} href="/signup#signup-age-gate" className="btn btn-secondary btn-lg" aria-label="Continue with Google — confirm your age and privacy consent on signup"><span aria-hidden="true">G</span> Continue with Google</Link>
      </div>
    </div>
    <div className="lp-work-gallery" role="group" aria-label="Example ways to use Cursis">
      <a href="#ordis" className="lp-work-card lp-work-priorities">
        <div className="lp-work-card-top"><span>Daily priorities</span><ArrowUpRight size={22} aria-hidden="true" /></div>
        <div className="lp-work-art" aria-hidden="true"><div className="lp-paper lp-priority-paper"><span className="lp-paper-label">THE NEXT THING</span><strong>Review the brief</strong><span className="lp-paper-task"><Check size={14} /> Name a reviewer</span><span className="lp-paper-task"><span className="lp-empty-check" /> Set a deadline</span></div><span className="lp-gallery-sticker"><Sparkles size={15} /> Start here</span></div>
        <h2>Find the next move.</h2><span className="lp-work-card-action">Ask Ordis <span aria-hidden="true">→</span></span>
      </a>
      <a href="#ordis" className="lp-work-card lp-work-capacity">
        <div className="lp-work-card-top"><span>Team workload</span><ArrowUpRight size={22} aria-hidden="true" /></div>
        <div className="lp-work-art" aria-hidden="true"><div className="lp-paper lp-capacity-paper"><span className="lp-paper-label">ROOM TO HELP</span><div className="lp-capacity-row"><span>Assigned work</span><i /></div><div className="lp-capacity-row"><span>Available time</span><i /></div><span className="lp-paper-note">Talk before you reassign.</span></div></div>
        <h2>Make room to help.</h2><span className="lp-work-card-action">Look at the week <span aria-hidden="true">→</span></span>
      </a>
      <a href="#features" className="lp-work-card lp-work-meetings">
        <div className="lp-work-card-top"><span>Meeting follow-ups</span><ArrowUpRight size={22} aria-hidden="true" /></div>
        <div className="lp-work-art" aria-hidden="true"><div className="lp-meeting-bubble"><MessageSquare size={18} /> Let’s review the draft.</div><div className="lp-paper lp-meeting-paper"><span className="lp-paper-label">FOLLOW-UP TASK</span><strong><span className="lp-empty-check" /> Draft review</strong></div></div>
        <h2>Leave with a next step.</h2><span className="lp-work-card-action">Explore the workspace <span aria-hidden="true">→</span></span>
      </a>
    </div>
  </section>;
}

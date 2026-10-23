'use client';

import { useReducer, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trackMarketing } from '@/lib/analytics/marketing';

interface DemoPrompt { id: string; question: string; answer: string }
export const ORDIS_DEMO_PROMPTS: readonly DemoPrompt[] = [
  { id: 'priorities', question: 'What should we work on today?', answer: 'Approve the checkout design first so testing can start. Then fix the phone menu. Alex has time to help with testing before Friday.' },
  { id: 'workload', question: 'Who has room to help?', answer: 'Sarah has 36 hours of work and 30 hours available. Alex has 8 hours free. Ask Alex to take checkout testing so Sarah can focus on payments.' },
  { id: 'sprint', question: 'How is this week’s work going?', answer: '18 of 24 tasks are done. Four are in progress and two need review. Approve the checkout design today to keep testing on track for Friday.' },
  { id: 'checkout', question: 'Which deadline is at risk?', answer: 'Checkout testing is due Friday, but the payment error messages still need approval. Ask Jamie to review them by 2 PM so Alex can start testing.' },
];

interface DemoState { phase: 'idle' | 'complete'; prompt: DemoPrompt | null; answer: string }
export const INITIAL_DEMO_STATE: DemoState = { phase: 'idle', prompt: null, answer: '' };
export function ordisDemoReducer(state: DemoState, action: { type: 'select'; prompt: DemoPrompt }): DemoState {
  return state.phase === 'idle' ? { phase: 'complete', prompt: action.prompt, answer: action.prompt.answer } : state;
}

export default function OrdisSection() {
  const router = useRouter();
  const [state, dispatch] = useReducer(ordisDemoReducer, INITIAL_DEMO_STATE);
  const submitted = useRef(false);
  const messages = useRef<HTMLDivElement>(null);
  const locked = state.phase === 'complete';
  const selectPrompt = (prompt: DemoPrompt) => {
    // Lock before React commits so two rapid clicks still produce one answer.
    if (submitted.current) return;
    submitted.current = true;
    dispatch({ type: 'select', prompt });
    messages.current?.focus({ preventScroll: true });
    trackMarketing('demo_question_click', '/');
    trackMarketing('demo_completion', '/');
  };
  return <div className="lp-ordis-demo" data-phase={state.phase}>
    <header className="lp-ordis-demo-header"><span className="lp-ordis-demo-identity">✳ Ordis AI Assistant</span><span className="lp-ordis-demo-badge">{locked ? 'Answer ready' : 'Interactive demo'}</span></header>
    <div ref={messages} className="lp-ordis-demo-messages" role="log" aria-label="Ordis demo conversation" aria-live="polite" aria-atomic="true" tabIndex={0}>
      {state.prompt ? <>
        <div className="lp-ordis-demo-message lp-ordis-demo-user"><span className="lp-ordis-demo-sender">You</span><p>{state.prompt.question}</p></div>
        <div className="lp-ordis-demo-message lp-ordis-demo-answer"><span className="lp-ordis-demo-sender">Ordis</span><p>{state.answer}</p></div>
      </> : <div className="lp-ordis-demo-empty"><span className="lp-ordis-demo-spark" aria-hidden="true">✳</span><p>What would you ask your team?</p></div>}
    </div>
    <div className="lp-ordis-demo-footer">
      <div className="lp-ordis-demo-prompts" role="group" aria-label="Try a question" aria-hidden={locked} inert={locked}>
        <span className="lp-ordis-demo-prompt-label">Choose a question</span>
        <div className="lp-ordis-demo-prompt-list">{ORDIS_DEMO_PROMPTS.map(prompt => <button key={prompt.id} type="button" className="lp-ordis-demo-prompt" disabled={locked} aria-disabled={locked} onClick={() => selectPrompt(prompt)}>{prompt.question}</button>)}</div>
      </div>
      <div className="lp-ordis-demo-cta-slot">{locked && <div className="lp-ordis-demo-completion"><p>Now try a question about your own work.</p><button type="button" className="lp-ordis-demo-cta" onClick={() => { trackMarketing('signup_click', '/'); router.push('/signup?source=ordis-demo'); }}>Create your free workspace <span aria-hidden="true">→</span></button></div>}</div>
    </div>
  </div>;
}

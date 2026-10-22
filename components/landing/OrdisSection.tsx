'use client';

import React, { useEffect, useReducer, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface DemoPrompt {
  id: string;
  question: string;
  answer: string;
}

export const ORDIS_DEMO_PROMPTS: readonly DemoPrompt[] = [
  {
    id: 'priorities',
    question: 'What should we work on today?',
    answer: 'Approve the checkout design first so testing can start. Then fix the phone menu and check the update notes. Alex has time to help with testing so the team can finish by Friday.',
  },
  {
    id: 'workload',
    question: 'Who is overloaded this week?',
    answer: 'Sarah has 36 hours of work but only 30 hours available. Alex has 8 hours free. Give Alex the checkout testing so Sarah can focus on payments and her two reviews due Thursday.',
  },
  {
    id: 'sprint',
    question: 'How is this week’s work going?',
    answer: '18 of 24 tasks are done. Four are being worked on, and two need a review. The account settings update is ready. Approve the checkout design today so testing can finish before Friday.',
  },
  {
    id: 'checkout',
    question: 'What is holding up checkout?',
    answer: 'Jamie needs to approve the payment error messages by 2 PM today. Then Alex can test checkout. Get that approval first so testing can move ahead.',
  },
];

type DemoPhase = 'idle' | 'typing' | 'streaming' | 'complete';
interface DemoState { phase: DemoPhase; prompt: DemoPrompt | null; answer: string }
type DemoAction =
  | { type: 'select'; prompt: DemoPrompt; reducedMotion: boolean }
  | { type: 'start-stream' }
  | { type: 'chunk'; end: number }
  | { type: 'finish' };

export const INITIAL_DEMO_STATE: DemoState = { phase: 'idle', prompt: null, answer: '' };

export function ordisDemoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'select':
      if (state.phase !== 'idle') return state;
      return { phase: action.reducedMotion ? 'complete' : 'typing', prompt: action.prompt, answer: action.reducedMotion ? action.prompt.answer : '' };
    case 'start-stream':
      return state.phase === 'typing' ? { ...state, phase: 'streaming' } : state;
    case 'chunk': {
      if (state.phase !== 'streaming' || !state.prompt) return state;
      const end = Math.max(state.answer.length, action.end);
      return { ...state, answer: state.prompt.answer.slice(0, end), phase: end >= state.prompt.answer.length ? 'complete' : 'streaming' };
    }
    case 'finish':
      return state.prompt ? { ...state, phase: 'complete', answer: state.prompt.answer } : state;
    default:
      return state;
  }
}

export default function OrdisSection() {
  const router = useRouter();
  const [state, dispatch] = useReducer(ordisDemoReducer, INITIAL_DEMO_STATE);
  const submitted = useRef(false);
  const messages = useRef<HTMLDivElement>(null);
  const locked = state.phase !== 'idle';
  const busy = state.phase === 'typing' || state.phase === 'streaming';

  const selectPrompt = (prompt: DemoPrompt) => {
    // Lock synchronously, including clicks fired before React commits the disabled state.
    if (submitted.current) return;
    submitted.current = true;
    // Keep keyboard focus in the conversation when the question buttons disappear.
    messages.current?.focus({ preventScroll: true });
    dispatch({ type: 'select', prompt, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  };

  useEffect(() => {
    if (!busy || !state.prompt) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timeout: number | undefined;
    let interval: number | undefined;
    const clearTimers = () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
    const finishForReducedMotion = () => {
      if (motion.matches) {
        clearTimers();
        dispatch({ type: 'finish' });
      }
    };
    if (motion.matches) {
      dispatch({ type: 'finish' });
      return;
    }
    motion.addEventListener('change', finishForReducedMotion);
    if (state.phase === 'typing') {
      timeout = window.setTimeout(() => dispatch({ type: 'start-stream' }), 700);
    } else {
      let end = 0;
      interval = window.setInterval(() => {
        end += 4;
        dispatch({ type: 'chunk', end });
      }, 24);
    }
    return () => {
      clearTimers();
      motion.removeEventListener('change', finishForReducedMotion);
    };
  }, [busy, state.phase, state.prompt]);

  useEffect(() => {
    if (messages.current) messages.current.scrollTop = messages.current.scrollHeight;
  }, [state.phase, state.answer]);

  return (
    <section className="lp-section lp-ordis-section" id="ordis" aria-labelledby="ordis-demo-heading"><p className="marketing-sample">Sample data · Names, responses and actions are simulated.</p>
      <div className="lp-section-header">
        <div className="lp-section-label">Ordis AI</div>
        <h2 className="lp-section-title" id="ordis-demo-heading">Catch delays before deadlines slip.</h2>
        <p className="lp-section-subtitle">Ordis AI spots delayed tasks and helps share the workload. Try a question to see what your team could do next.</p>
      </div>

      <div className="lp-ordis-demo" data-phase={state.phase}>
        <header className="lp-ordis-demo-header">
          <div className="lp-ordis-demo-identity">
            <span className="lp-ordis-demo-logo" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 1024 1024" fill="none">
                <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#ffffff" strokeWidth="142" strokeLinecap="round" />
                <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" />
              </svg>
            </span>
            <span>Ordis AI Assistant</span>
          </div>
          <span className="lp-ordis-demo-badge">
            <span className="lp-ordis-demo-status-dot" aria-hidden="true" />
            {state.phase === 'complete' ? 'Answer ready' : busy ? 'Working on it' : 'Interactive demo'}
          </span>
        </header>

        <div ref={messages} className="lp-ordis-demo-messages" role="log" aria-label="Ordis demo conversation" aria-live="polite" aria-atomic="true" aria-busy={busy} tabIndex={0}>
          {state.phase === 'idle' ? (
            <div className="lp-ordis-demo-empty">
              <span className="lp-ordis-demo-spark" aria-hidden="true">✳</span>
              <p>Pick a question to see Ordis in action.</p>
              <span>Try it with sample team data.</span>
            </div>
          ) : (
            <>
              <div className="lp-ordis-demo-message lp-ordis-demo-user">
                <span className="lp-ordis-demo-sender">You</span>
                <p>{state.prompt?.question}</p>
              </div>
              <div className="lp-ordis-demo-message lp-ordis-demo-answer">
                <span className="lp-ordis-demo-sender">Ordis</span>
                {state.phase === 'typing' ? (
                  <div className="lp-ordis-demo-typing">
                    <span>Ordis is thinking</span>
                    <span aria-hidden="true"><i /><i /><i /></span>
                  </div>
                ) : (
                  <p>{state.answer}{state.phase === 'streaming' && <span className="lp-ordis-demo-cursor" aria-hidden="true">▍</span>}</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="lp-ordis-demo-footer">
          <div className="lp-ordis-demo-prompts" role="group" aria-label="Try a question" aria-hidden={locked} inert={locked}>
            <span className="lp-ordis-demo-prompt-label">Start with a question</span>
            <div className="lp-ordis-demo-prompt-list">
              {ORDIS_DEMO_PROMPTS.map(prompt => (
                <button key={prompt.id} type="button" className="lp-ordis-demo-prompt" disabled={locked} aria-disabled={locked} onClick={() => selectPrompt(prompt)}>
                  {prompt.question}
                </button>
              ))}
            </div>
          </div>
          <div className="lp-ordis-demo-cta-slot">
            {busy && <p className="lp-ordis-demo-progress" role="status">Ordis is writing your answer<span aria-hidden="true">…</span></p>}
            {state.phase === 'complete' && (
              <div className="lp-ordis-demo-completion">
                <p>Less chasing updates. More moving forward.</p>
                <button type="button" className="lp-ordis-demo-cta" onClick={() => router.push('/signup?source=ordis-demo')}>
                  Try this on your real tasks, free <span aria-hidden="true">→</span>
                </button>
                <span>Free to start · No credit card required</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

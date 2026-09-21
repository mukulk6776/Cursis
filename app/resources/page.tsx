import type { Metadata } from 'next';
import Link from 'next/link';
import {
  faqData,
  caseStudies,
  industryStats,
  expertQuotes,
  uniqueFrameworks,
  comparisonData,
  stepByStepGuides,
  realExamples,
} from '@/lib/seo/content-data';
import {
  generateOrganizationSchema,
  generateFAQSchema,
  generateArticleSchema,
} from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'Resources & Guides — Cursis Autonomous Workspace Platform',
  description:
    'Comprehensive guides, case studies, expert insights, and best practices for maximizing productivity with Cursis AI-powered workspace. Learn from real customer success stories.',
  keywords: [
    'workspace management guide',
    'AI automation tutorial',
    'project management best practices',
    'Ordis AI guide',
    'team collaboration strategies',
    'workflow automation examples',
    'enterprise workspace setup',
    'productivity case studies',
  ],
  openGraph: {
    title: 'Resources & Learning Center — Cursis',
    description: 'Case studies, guides, and expert insights for autonomous workspace management',
    type: 'website',
    url: 'https://www.cursis.in/resources',
  },
  alternates: {
    canonical: 'https://www.cursis.in/resources',
  },
};

export default function ResourcesPage() {
  const organizationSchema = generateOrganizationSchema();
  const faqSchema = generateFAQSchema(faqData);
  const articleSchema = generateArticleSchema(
    'Cursis Resources & Learning Center',
    'Complete guide to autonomous workspace management with AI',
    '2026-09-21',
    '2026-09-21'
  );

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, faqSchema, articleSchema]),
        }}
      />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Resources & Learning Center
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Master autonomous workspace management with proven strategies, real case studies,
                and expert insights from industry leaders.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {industryStats.slice(0, 4).map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stat.stat}</div>
                  <div className="text-sm text-gray-600">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section className="py-20 bg-white" id="case-studies">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Customer Success Stories</h2>
              <p className="text-xl text-gray-600">
                Real results from companies using Cursis and Ordis AI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {caseStudies.map((study) => (
                <article
                  key={study.id}
                  className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="text-sm text-blue-600 font-semibold mb-2">{study.industry}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{study.title}</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Team Size:</span>
                      <span className="font-semibold">{study.teamSize} members</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Time to Value:</span>
                      <span className="font-semibold">{study.metrics.timeToValue}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">ROI:</span>
                      <span className="font-semibold text-green-600">{study.metrics.roi}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Key Results:</h4>
                    <ul className="space-y-2">
                      {study.results.map((result, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-700">
                          <svg
                            className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                    <p className="text-sm text-gray-700 italic mb-2">
                      "{study.testimonial.quote}"
                    </p>
                    <footer className="text-sm font-semibold text-gray-900">
                      — {study.testimonial.author}, {study.testimonial.role}
                    </footer>
                  </blockquote>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Step-by-Step Guides Section */}
        <section className="py-20 bg-gray-50" id="guides">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Step-by-Step Guides</h2>
              <p className="text-xl text-gray-600">
                Comprehensive tutorials to master Cursis and Ordis AI
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {stepByStepGuides.map((guide) => (
                <article
                  key={guide.id}
                  className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                      {guide.difficulty}
                    </span>
                    <span className="text-sm text-gray-600">⏱️ {guide.estimatedTime}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{guide.title}</h3>
                  <p className="text-gray-600 mb-6">{guide.description}</p>

                  <div className="space-y-4">
                    {guide.steps.map((step) => (
                      <div
                        key={step.number}
                        className="flex items-start p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          {step.tip && (
                            <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border-l-2 border-blue-500">
                              💡 Tip: {step.tip}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Insights Section */}
        <section className="py-20 bg-white" id="expert-insights">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Expert Insights</h2>
              <p className="text-xl text-gray-600">
                Perspectives from industry leaders on autonomous workplace intelligence
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {expertQuotes.map((quote, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8"
                >
                  <div className="text-5xl text-blue-600 mb-4">"</div>
                  <blockquote className="text-lg text-gray-800 mb-6">{quote.quote}</blockquote>
                  <footer>
                    <div className="font-bold text-gray-900">{quote.author}</div>
                    <div className="text-sm text-gray-600">{quote.credentials}</div>
                    <div className="mt-2 inline-block px-3 py-1 bg-white text-blue-700 text-xs font-semibold rounded-full">
                      {quote.topic}
                    </div>
                  </footer>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Unique Frameworks Section */}
        <section className="py-20 bg-gray-900 text-white" id="frameworks">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Proprietary Methodologies</h2>
              <p className="text-xl text-gray-300">
                Proven frameworks that power autonomous workspace management
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {uniqueFrameworks.map((framework) => (
                <div
                  key={framework.id}
                  className="bg-gray-800 rounded-xl p-8 border border-gray-700"
                >
                  <h3 className="text-2xl font-bold mb-3">{framework.name}</h3>
                  <p className="text-gray-300 mb-6">{framework.description}</p>

                  <div className="space-y-4">
                    {framework.stages.map((stage, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4">
                        <div className="font-semibold text-white mb-1">{stage.name}</div>
                        <div className="text-sm text-gray-400 mb-1">{stage.description}</div>
                        {(stage as any).frequency && (
                          <div className="text-xs text-blue-400">
                            📊 {(stage as any).frequency || (stage as any).accuracy || (stage as any).avgResponseTime || (stage as any).improvement}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real Examples Section */}
        <section className="py-20 bg-white" id="examples">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Real-World Examples</h2>
              <p className="text-xl text-gray-600">
                See how Ordis AI autonomously solves real workplace challenges
              </p>
            </div>

            <div className="space-y-8">
              {realExamples.map((example, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{example.scenario}</h3>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-white text-blue-700 text-xs font-semibold rounded-full">
                        {example.industry}
                      </span>
                      <span className="px-3 py-1 bg-white text-gray-700 text-xs font-semibold rounded-full">
                        {example.teamSize}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">CONTEXT</div>
                      <p className="text-sm text-gray-700">{example.context}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-xs font-semibold text-blue-600 mb-2">
                        ORDIS DETECTION
                      </div>
                      <p className="text-sm text-gray-700">{example.ordisDetection}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-xs font-semibold text-green-600 mb-2">
                        AUTONOMOUS ACTION
                      </div>
                      <p className="text-sm text-gray-700">{example.autonomousAction}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-xs font-semibold text-purple-600 mb-2">OUTCOME</div>
                      <p className="text-sm font-semibold text-gray-900">{example.outcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50" id="faq">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Everything you need to know about Cursis</p>
            </div>

            <div className="space-y-6">
              {faqData.map((faq, idx) => (
                <details
                  key={idx}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 group"
                >
                  <summary className="text-lg font-semibold text-gray-900 cursor-pointer flex items-center justify-between">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Workspace?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join 1,250+ teams using Cursis to boost productivity and eliminate bottlenecks
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors border border-blue-500"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

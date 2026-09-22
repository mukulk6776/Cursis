import type { Metadata } from 'next';
import Link from 'next/link';
import { comparisonData } from '@/lib/seo/content-data';
import { generateArticleSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'Cursis vs Competitors — Feature Comparison & Pricing',
  description:
    'Compare Cursis autonomous workspace platform with Asana, Monday.com, and ClickUp. See features, pricing, AI capabilities, and why 1,250+ teams chose Cursis.',
  keywords: [
    'Cursis vs Asana',
    'Cursis vs Monday.com',
    'Cursis vs ClickUp',
    'project management comparison',
    'AI workspace comparison',
    'workspace pricing comparison',
    'best project management tool',
    'autonomous workspace vs traditional PM',
  ],
  openGraph: {
    title: 'Cursis vs Competitors — Complete Feature Comparison',
    description: 'See why teams choose Cursis over Asana, Monday.com, and ClickUp',
    type: 'article',
    url: 'https://cursis.in/compare',
  },
  alternates: {
    canonical: 'https://cursis.in/compare',
  },
};

export default function ComparePage() {
  const comparison = comparisonData['cursis-vs-competitors'];

  const articleSchema = generateArticleSchema(
    comparison.title,
    comparison.description,
    '2026-09-21',
    '2026-09-21'
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">{comparison.title}</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">{comparison.description}</p>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="p-4 text-left font-bold">Feature</th>
                    <th className="p-4 text-center font-bold bg-blue-700">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">Cursis</span>
                        <span className="text-xs font-normal text-blue-200">Recommended</span>
                      </div>
                    </th>
                    <th className="p-4 text-center font-bold">Asana</th>
                    <th className="p-4 text-center font-bold">Monday.com</th>
                    <th className="p-4 text-center font-bold">ClickUp</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.features.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <td className="p-4 font-semibold text-gray-900">{row.feature}</td>
                      <td className="p-4 text-center bg-blue-50 font-semibold text-blue-900">
                        {row.cursis}
                      </td>
                      <td className="p-4 text-center text-gray-700">{row.asana}</td>
                      <td className="p-4 text-center text-gray-700">{row.monday}</td>
                      <td className="p-4 text-center text-gray-700">{row.clickup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Key Differentiators */}
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  True Autonomous Actions
                </h3>
                <p className="text-gray-700">
                  Ordis doesn't just suggest - it executes. Automatically rebalances workloads,
                  sends notifications, and prevents bottlenecks without manual intervention.
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-8 border-2 border-green-200">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Enterprise Security Built-In
                </h3>
                <p className="text-gray-700">
                  SOC 2 Type II certified, comprehensive audit logging, and RBAC included in all
                  plans - not locked behind expensive enterprise tiers.
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-8 border-2 border-purple-200">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Better Value</h3>
                <p className="text-gray-700">
                  All-in-one platform with documents, messaging, and AI - no expensive add-ons
                  needed. Save $45K+ annually vs. tool sprawl.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Teams Switch Section */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-12">Why Teams Switch to Cursis</h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-800 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-4">From Asana</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>AI that takes action:</strong> Not just workflow rules, but
                      autonomous intelligence
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Built-in documents:</strong> No need for separate Google Docs
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Better pricing:</strong> Advanced features without enterprise tier
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-4">From Monday.com</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Predictive intelligence:</strong> Ordis prevents issues before they
                      happen
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Unified workspace:</strong> No add-ons needed for full functionality
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Cleaner interface:</strong> Professional, focused design
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-4">From ClickUp</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Less complexity:</strong> Powerful without overwhelming configuration
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Enterprise-grade security:</strong> SOC 2 certified out of the box
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Real AI:</strong> Autonomous agent vs. basic text generation
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-4">From Multiple Tools</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Consolidation:</strong> Replace 5-7 tools with one platform
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>Cost savings:</strong> $45K+ annual savings vs. tool sprawl
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>
                      <strong>No context switching:</strong> Everything in one workspace
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6">Ready to Make the Switch?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join 1,250+ teams who upgraded to autonomous workspace management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/resources"
                className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors border border-blue-500"
              >
                View Case Studies
              </Link>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              Free migration support • No credit card required • 14-day trial
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

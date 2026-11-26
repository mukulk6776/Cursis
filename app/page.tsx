import LandingPage from '@/components/landing/LandingPage';
import { marketingMetadata, socialProfiles, marketingFaqs } from '@/lib/seo/marketing';
import { PLAN_CATALOG } from '@/lib/plans';

export const metadata = marketingMetadata(
    '',
    'CURSIS',
    'All-in-one AI team workspace combining tasks, projects, meeting notes, calendar, My Day focus planning, and Ordis AI. Starter ($9/mo), Pro ($20/mo), or Custom Business.'
);

const currency = process.env.SCHEMA_OFFER_CURRENCY;
const resolvedCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD';

const schema = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': 'https://cursis.in/#organization',
            name: 'CURSIS',
            alternateName: ['Cursis'],
            url: 'https://cursis.in',
            logo: {
                '@type': 'ImageObject',
                url: 'https://cursis.in/icon.png',
            },
            description:
                'Cursis builds an integrated team workspace combining tasks, projects, meetings, My Day focus planning, and Ordis AI.',
            founder: [
                { '@type': 'Person', name: 'Saransh Vashistha', jobTitle: 'CEO · Product direction' },
                { '@type': 'Person', name: 'Mukul Kumar', jobTitle: 'CTO · Engineering' },
                { '@type': 'Person', name: 'Lakhan', jobTitle: 'CGO · Growth & community' },
            ],
            contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: 'official@cursis.in',
                url: 'https://cursis.in/contact',
            },
            sameAs: socialProfiles.map((p) => p.url),
        },
        {
            '@type': 'WebSite',
            '@id': 'https://cursis.in/#website',
            name: 'CURSIS',
            alternateName: ['Cursis', 'cursis.in'],
            url: 'https://cursis.in/',
            publisher: { '@id': 'https://cursis.in/#organization' },
        },
        {
            '@type': 'SoftwareApplication',
            '@id': 'https://cursis.in/#software',
            name: 'CURSIS',
            operatingSystem: 'Web',
            applicationCategory: 'BusinessApplication',
            url: 'https://cursis.in',
            description:
                'Unified AI project management and team collaboration workspace featuring Ordis AI delayed-task detection, grouped and Kanban task boards, My Day focus planner, meeting notes, and team workload visibility.',
            featureList: [
                'Grouped Stream and Drag-and-Drop Kanban Tasks',
                'Ordis AI Copilot for bottleneck and deadline risk detection',
                'My Day Focus Planner and live Team Pulse',
                'Projects, Milestones, and Workload Tracking',
                'Meeting Notes to Assigned Tasks',
                'Workspace Automations and Analytics',
            ],
            offers: {
                '@type': 'AggregateOffer',
                lowPrice: String(PLAN_CATALOG.starter.priceUsd ?? 9),
                highPrice: String(PLAN_CATALOG.pro.priceUsd ?? 20),
                offerCount: 3,
                priceCurrency: resolvedCurrency,
                offers: [
                    {
                        '@type': 'Offer',
                        name: PLAN_CATALOG.starter.name,
                        price: String(PLAN_CATALOG.starter.priceUsd ?? 9),
                        priceCurrency: resolvedCurrency,
                        url: 'https://cursis.in/pricing',
                    },
                    {
                        '@type': 'Offer',
                        name: PLAN_CATALOG.pro.name,
                        price: String(PLAN_CATALOG.pro.priceUsd ?? 20),
                        priceCurrency: resolvedCurrency,
                        url: 'https://cursis.in/pricing',
                    },
                    {
                        '@type': 'Offer',
                        name: PLAN_CATALOG.business.name,
                        url: 'https://cursis.in/contact?plan=business',
                    },
                ],
            },
            author: { '@id': 'https://cursis.in/#organization' },
        },
        {
            '@type': 'FAQPage',
            '@id': 'https://cursis.in/#faq',
            mainEntity: marketingFaqs.slice(0, 5).map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                },
            })),
        },
    ],
};

export default function MainPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
            />
            <LandingPage />
        </>
    );
}

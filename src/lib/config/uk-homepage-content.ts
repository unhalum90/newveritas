/**
 * UK Homepage Content Configuration
 * 
 * Complete content for the UK-focused landing page, including:
 * - Hero section with UK-specific messaging
 * - Trust bar with UK compliance badges
 * - 3-Product journey (Daily → Weekly → Unit)
 * - Pain-based segments (Primary, Secondary, MAT)
 * - Time/ROI section
 * - Trust & compliance
 * - UK pricing
 * - Final CTA
 */

export const UK_HOMEPAGE = {
    // ============================================================================
    // HERO SECTION
    // ============================================================================
    hero: {
        badge: "Built for UK Schools • GDPR Compliant • DfE AI Safety Standards",

        headline: "Voice-based learning for UK schools",

        subheadline:
            "Students learn through speaking—daily snapshot, weekly formative checks, and secure oral assessments. Track National Curriculum coverage automatically. Generate evidence for Ofsted in minutes.",

        cta_primary: {
            text: "Book a Demo",
            href: "/waitlist",
        },

        cta_secondary: {
            text: "See How It Works",
            href: "#how-it-works",
        },

        proof: "Launching with pilot schools • January 2026 • KS1–KS5",
    },

    // ============================================================================
    // TRUST BAR (Logos/Stats - Below Hero)
    // ============================================================================
    trustBar: {
        heading: "Designed for the UK education system",
        items: [
            { icon: "🇬🇧", text: "UK data hosting" },
            { icon: "✓", text: "GDPR compliant" },
            { icon: "🛡️", text: "DfE AI safety aligned" },
            { icon: "📋", text: "National Curriculum mapped" },
        ],
    },

    // ============================================================================
    // THE 3-PRODUCT JOURNEY (Core Section)
    // ============================================================================
    threeProducts: {
        heading: "One platform. Every stage of learning.",
        subheading: "From daily practice to summative assessment—all through voice",

        daily: {
            icon: "🧠",
            frequency: "2-3x week",
            name: "Study Lab",
            tagline: "Socratic check for understanding",

            studentPrompt: '"Explain why you ...."',

            whatHappens: [
                "AI asks probing questions about key concepts",
                "Student explains their thinking verbally",
                "Gaps identified before the next lesson even starts",
            ],

            teacherBenefit:
                "Dashboard shows who studied + common misconceptions before class",

            ukAlignment: "Aligned with UK oracy frameworks • NC subject coverage",

            useCases: [
                "Homework revision",
                "Exam preparation",
                "Concept reinforcement",
                "Flipped classroom",
            ],
        },

        weekly: {
            icon: "🎤",
            frequency: "end of each class",
            name: "Pulse",
            tagline: "Quick Understanding Capture",

            studentPrompt: '"Summarise today\'s learning in one sentence"',

            whatHappens: [
                "Student records 15-60-second voice response",
                "AI transcribes and aggregates student responses",
                "Teacher reviews entire class patterns in 5 minutes",
            ],

            teacherBenefit:
                "Know who's stuck before the next lesson—adjust teaching same day",

            ukAlignment: "Track NC domains • Identify intervention needs early",

            useCases: [
                "Exit tickets",
                "Homework checks",
                "Pre-assessment",
                "Retrieval practice",
            ],
        },

        unit: {
            icon: "🛡️",
            frequency: "1–2× per unit (4-10 min)",
            name: "Oral Assessment",
            tagline: "AI-Resistant Evaluation",

            studentPrompt:
                '"Explain the causes of WWI using evidence from the sources"',

            whatHappens: [
                "Student records 4-10 minute oral defence",
                "AI transcribes + evaluates against your rubric",
                "Teacher validates in 30 minutes (not 6 hours)",
            ],

            teacherBenefit:
                "Authentic assessment—students can't fake spontaneous reasoning",

            ukAlignment:
                "GCSE AO mapping • Teacher moderation evidence • Portfolio documentation",

            useCases: [
                "Unit assessments",
                "GCSE/A-Level prep",
                "Coursework defence",
                "End-of-term evaluation",
            ],
        },
    },

    // ============================================================================
    // PAIN-BASED SEGMENTS (Who This Is For)
    // ============================================================================
    segments: {
        heading: "Built for your context",
        subheading: "Whatever your phase or priorities, SayVeritas adapts",

        cards: [
            {
                icon: "🏫",
                audience: "Primary Schools (KS1–KS2)",

                pains: [
                    "Building oracy foundations across all subjects",
                    "Proving NC coverage for Ofsted inspections",
                    "Workload: marking 30 reading journals takes hours",
                ],

                solutions: [
                    "Daily speaking practice builds confidence + vocabulary",
                    "Auto-track NC Reading, Writing, and Speaking & Listening",
                    "Review 30 voice responses in 15 minutes—not 3 hours",
                ],

                ukSpecific:
                    "Generate evidence of pupil progress for EYFS/KS1 moderation",

                cta: {
                    text: "See Primary Use Cases",
                    href: "/use-cases/primary",
                },
            },

            {
                icon: "🎓",
                audience: "Secondary & Sixth Form (KS3–KS5)",

                pains: [
                    "GCSE/A-Level speaking components difficult to scale",
                    "Students using AI for written coursework",
                    "Generating moderation evidence is time-consuming",
                ],

                solutions: [
                    "Asynchronous oral exams—students record in their own time",
                    "Oral defences defeat AI cheating (must explain verbally)",
                    "Auto-generate Teacher Assessment Framework evidence",
                ],

                ukSpecific:
                    "Map to GCSE Assessment Objectives • Prepare for A-Level presentations",

                cta: {
                    text: "See Secondary Use Cases",
                    href: "/use-cases/secondary",
                },
            },

            {
                icon: "💼",
                audience: "Multi-Academy Trusts",

                pains: [
                    "Inconsistent assessment quality across 10+ schools",
                    "No trust-wide view of curriculum coverage",
                    "Each school buying separate tools wastes budget",
                ],

                solutions: [
                    "Standardised rubrics across the entire trust",
                    "Trust dashboard: see NC coverage by school and year group",
                    "Single contract, centralised billing, SSO integration",
                ],

                ukSpecific:
                    "Trust-level safeguarding dashboards • Compliance reporting for governance",

                cta: {
                    text: "Book MAT Demo",
                    href: "/waitlist?segment=mat",
                },
            },
        ],
    },

    // ============================================================================
    // TIME & ROI SECTION
    // ============================================================================
    timeROI: {
        heading: "Reclaim your time without sacrificing rigour",
        subheading: "Formative assessment that doesn't bury teachers in marking",

        stats: [
            {
                metric: "6 hours → 60 min",
                label: "Weekly marking time",
                explanation:
                    "Review 90 students' oral responses vs. marking essays all weekend",
                icon: "⏱️",
            },
            {
                metric: "3–5×",
                label: "More touchpoints",
                explanation:
                    "Daily + weekly checks vs. 2–3 summative tests per term",
                icon: "📊",
            },
            {
                metric: "2 minutes",
                label: "Generate Ofsted evidence",
                explanation:
                    "Export NC coverage report showing assessment across all domains",
                icon: "📋",
            },
        ],
    },

    // ============================================================================
    // HOW IT WORKS (Step-by-Step)
    // ============================================================================
    howItWorks: {
        heading: "Simple workflow. Powerful insights.",

        steps: [
            {
                number: 1,
                title: "Create assessment",
                description:
                    "Choose your Key Stage, select NC subject/domain, set your rubric. Or generate questions with AI based on your learning objectives.",
            },
            {
                number: 2,
                title: "Students respond by voice",
                description:
                    "Students record on any device—phone, tablet, laptop. Sequential questions prevent sharing. Works offline and syncs when connected.",
            },
            {
                number: 3,
                title: "AI scores, you validate",
                description:
                    "AI transcribes, scores against your rubric, and flags patterns. You review, adjust, and add feedback in 30 minutes—not hours.",
            },
            {
                number: 4,
                title: "Track coverage automatically",
                description:
                    "Every assessment auto-logs against NC subjects and domains. Generate reports for Ofsted, moderation, or SLT in two clicks.",
            },
        ],
    },

    // ============================================================================
    // TRUST & COMPLIANCE (UK-Specific)
    // ============================================================================
    trust: {
        heading: "Your data. Your pupils. Your control.",
        subheading: "Built for UK schools from the ground up",

        items: [
            {
                icon: "🔒",
                title: "GDPR & UK Data Protection",
                description:
                    "Data processed and stored in the UK. DPA-compliant. No data sold or used for AI training.",
                linkText: "Read our Data Policy",
                linkHref: "/privacy",
            },
            {
                icon: "✓",
                title: "Teacher review required",
                description:
                    "AI provides scoring suggestions; teachers make final decisions. You retain professional judgment and pupil relationships.",
                linkText: "How AI Scoring Works",
                linkHref: "/ai-use",
            },
            {
                icon: "👁️",
                title: "DfE AI Safety Aligned",
                description:
                    "Meets Department for Education guidance on generative AI in education. Transparent filtering, monitoring, and safeguarding.",
                linkText: "View Compliance",
                linkHref: "/ai-safety",
            },
            {
                icon: "⚙️",
                title: "School & MAT-level control",
                description:
                    "Admin dashboards with safeguarding oversight, usage reports, and trust-wide analytics. SSO available.",
                linkText: "Admin Features",
                linkHref: "/about",
            },
        ],
    },

    // ============================================================================
    // TESTIMONIALS
    // ============================================================================
    testimonials: {
        heading: "Launching with pilot schools in January 2026",
        subheading: "Join our founding cohort and shape the platform",

        cards: [
            {
                quote:
                    "We're excited to pilot SayVeritas with our KS2 cohort. The NC alignment and voice-based approach align perfectly with our oracy focus.",
                name: "Founding Pilot School",
                role: "Head of Assessment",
                schoolType: "Primary Academy",
            },
        ],
    },

    // ============================================================================
    // PRICING (UK-Specific)
    // ============================================================================
    pricing: {
        heading: "Flexible pricing for schools and individual teachers",
        subheading:
            "Whether you're piloting with one class or deploying trust-wide",

        tiers: [
            {
                name: "Teacher Credits",
                audience: "Individual teachers trying SayVeritas",
                priceDisplay: "From £12",
                priceDetail: "250 assessment credits",
                description:
                    "Pay as you go—credits never expire. Perfect for piloting with one or two classes.",
                features: [
                    "250 student assessments",
                    "All core features included",
                    "NC subject & domain tagging",
                    "Coverage reports",
                    "Email support",
                ],
                cta: {
                    text: "Purchase Credits",
                    href: "/waitlist",
                },
                popular: false,
            },

            {
                name: "School Licence",
                audience: "Primary, secondary, or sixth form colleges",
                priceDisplay: "From £15/pupil/year",
                priceDetail: "Minimum 100 pupils",
                description:
                    "Whole-school deployment with admin dashboards and priority support.",
                features: [
                    "Unlimited assessments",
                    "School admin dashboard",
                    "NC coverage tracking",
                    "Teacher training included",
                    "Priority support",
                    "Data export (CSV/PDF)",
                ],
                cta: {
                    text: "Book School Demo",
                    href: "/waitlist?tier=school",
                },
                popular: true,
                badge: "Most Popular",
            },

            {
                name: "Trust Licence",
                audience: "Multi-Academy Trusts & federations",
                priceDisplay: "Custom pricing",
                priceDetail: "Volume discounts available",
                description:
                    "Trust-wide deployment with centralised billing, SSO, and strategic support.",
                features: [
                    "Everything in School Licence",
                    "Trust-level dashboards",
                    "Centralised billing",
                    "SSO integration",
                    "Dedicated account manager",
                    "Custom onboarding",
                ],
                cta: {
                    text: "Contact Sales",
                    href: "/waitlist?tier=trust",
                },
                popular: false,
            },
        ],

        faq: [
            {
                question: "What counts as one 'assessment credit'?",
                answer:
                    "One credit = one pupil completing one assessment (regardless of how many questions). Credits never expire.",
            },
            {
                question: "Can we pilot with a small group before committing?",
                answer:
                    "Absolutely. Book a demo and we'll set up a free 30-day pilot with 2–3 teachers and up to 100 pupils.",
            },
            {
                question: "Do you offer multi-year contracts?",
                answer:
                    "Yes. Multi-year School and Trust licences receive discounted pricing. Contact sales for details.",
            },
            {
                question: "Is there a free trial?",
                answer:
                    "Individual teachers can purchase a small credit pack to trial. Schools and trusts receive a free 30-day pilot with onboarding support.",
            },
        ],
    },

    // ============================================================================
    // FINAL CTA
    // ============================================================================
    finalCTA: {
        heading: "Join our founding schools cohort",
        subheading:
            "Launch pilot: January 2026. Limited spaces available for early partners.",

        benefits: [
            "Free 30-day pilot with full platform access",
            "Direct input on UK-specific features",
            "Founding school pricing locked for 3 years",
            "Priority onboarding and training",
        ],

        cta_primary: {
            text: "Book Your Demo",
            href: "/waitlist",
        },

        cta_secondary: {
            text: "Email Us",
            href: "mailto:hello@sayveritas.co.uk",
        },

        note: "Questions? Email hello@sayveritas.co.uk",
    },
};

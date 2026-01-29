/**
 * US Homepage Content Configuration
 * 
 * Complete content for the US-focused landing page, matching the UK structure
 * but with US-specific messaging, terminology, and pricing.
 */

export const US_HOMEPAGE = {
    // ============================================================================
    // HERO SECTION
    // ============================================================================
    hero: {
        badge: "FERPA-Aware • SOC 2 in Progress • AI-Resistant by Design",

        headline: "Voice-based learning platform for grades 6-16",

        subheadline:
            "Students develop reasoning through speaking—daily practice, weekly checks, and AI-resistant assessments. Save 20+ hours per month. Restore Integrity to the process.",

        cta_primary: {
            text: "Start Free Trial",
            href: "/waitlist",
        },

        cta_secondary: {
            text: "Watch Demo",
            href: "#how-it-works",
        },

        proof: "Trusted by universities & K-12 districts • Standards-aligned",
    },

    // ============================================================================
    // TRUST BAR
    // ============================================================================
    trustBar: {
        heading: "Built for US schools & universities",
        items: [
            { icon: "🇺🇸", text: "US data hosting" },
            { icon: "✓", text: "FERPA-aware" },
            { icon: "🛡️", text: "AI-resistant" },
            { icon: "📋", text: "Standards-aligned" },
        ],
    },

    // ============================================================================
    // THE 3-PRODUCT JOURNEY
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
                "Gaps identified before the next class even starts",
            ],

            teacherBenefit: "Dashboard shows who studied + common misconceptions",

            ukAlignment: "", // Not used for US

            useCases: ["Homework review", "Exam prep", "Concept check"],
        },

        weekly: {
            icon: "🎤",
            frequency: "end of each class",
            name: "Pulse",
            tagline: "Quick Understanding Capture",

            studentPrompt: '"Summarize today\'s learning in one sentence"',

            whatHappens: [
                "Student records 15-60-second voice response",
                "AI transcribes and aggregates student responses",
                "Teacher reviews entire class patterns in 5 minutes",
            ],

            teacherBenefit: "Know who's stuck—adjust teaching same day",

            ukAlignment: "",

            useCases: ["Exit tickets", "Homework checks", "Pre-assessment"],
        },

        unit: {
            icon: "🛡️",
            frequency: "1-2× per unit (4-10 min)",
            name: "Oral Assessment",
            tagline: "AI-Resistant Evaluation",

            studentPrompt: '"Defend your thesis using evidence"',

            whatHappens: [
                "Student records 4-10 minute oral defense",
                "AI transcribes + evaluates against your rubric",
                "Teacher validates in 30 minutes (not 6 hours)",
            ],

            teacherBenefit: "Students can't fake spontaneous reasoning",

            ukAlignment: "",

            useCases: ["Unit tests", "AP/IB prep", "Final projects"],
        },
    },

    // ============================================================================
    // PAIN-BASED SEGMENTS
    // ============================================================================
    segments: {
        heading: "Built for your classroom",
        subheading: "Whatever your level or priorities, SayVeritas adapts",

        cards: [
            {
                icon: "🏫",
                audience: "Middle & High School (Grades 6-12)",

                pains: [
                    "Students using AI for written work",
                    "Teacher burnout from grading",
                    "Can't tell who actually understands",
                ],

                solutions: [
                    "Oral defenses defeat ChatGPT (must explain verbally)",
                    "Review 30 students in 30 min (not 6 hours)",
                    "Hear the thinking process in real-time",
                ],

                ukSpecific: "", // Not used

                cta: {
                    text: "See K-12 Use Cases",
                    href: "/use-cases/k12",
                },
            },
            {
                icon: "🎓",
                audience: "Higher Education",

                pains: [
                    "200+ student lectures make oral exams impossible",
                    "AI-generated essays epidemic",
                    "TAs overwhelmed with grading",
                ],

                solutions: [
                    "Asynchronous vivas scale to any class size",
                    "Oral responses reveal who used AI",
                    "AI-assisted review = 6 hours not 20",
                ],

                ukSpecific: "",

                cta: {
                    text: "See University Use Cases",
                    href: "/use-cases/university",
                },
            },
            {
                icon: "💬",
                audience: "Language Programs (ESL/MFL)",

                pains: [
                    "Speaking proficiency hard to assess at scale",
                    "Students need more practice time",
                    "Limited teacher bandwidth for 1-on-1",
                ],

                solutions: [
                    "Students practice speaking anytime, anywhere",
                    "AI provides pronunciation feedback",
                    "Track fluency progress automatically",
                ],

                ukSpecific: "",

                cta: {
                    text: "See Language Use Cases",
                    href: "/use-cases/languages",
                },
            },
        ],
    },

    // ============================================================================
    // TIME & ROI SECTION
    // ============================================================================
    timeROI: {
        heading: "Stop drowning in grading. Start teaching again.",
        subheading: "Formative assessment that actually saves time",

        stats: [
            {
                metric: "20+ hours/month",
                label: "Time saved",
                explanation: "Review entire class in 60 min vs 6 hours grading",
                icon: "⏱️",
            },
            {
                metric: "3-5×",
                label: "More touchpoints",
                explanation: "Daily + weekly checks vs 2-3 tests per semester",
                icon: "📊",
            },
            {
                metric: "AI-resistant",
                label: "Academic integrity",
                explanation: "Spontaneous oral reasoning can't be faked",
                icon: "🛡️",
            },
        ],
    },

    // ============================================================================
    // HOW IT WORKS
    // ============================================================================
    howItWorks: {
        heading: "Simple workflow. Powerful insights.",

        steps: [
            {
                number: 1,
                title: "Create assessment",
                description:
                    "Choose your standards, set your rubric. Or generate questions with AI based on your learning objectives.",
            },
            {
                number: 2,
                title: "Students respond by voice",
                description:
                    "Students record on any device. Works offline. Sequential questions prevent sharing.",
            },
            {
                number: 3,
                title: "AI scores, you validate",
                description:
                    "AI transcribes and scores. You review, adjust, add feedback in 30 min—not hours.",
            },
            {
                number: 4,
                title: "Track progress automatically",
                description:
                    "Auto-log standards coverage. Generate reports. Identify trends.",
            },
        ],
    },

    // ============================================================================
    // TRUST & COMPLIANCE
    // ============================================================================
    trust: {
        heading: "Your data. Your students. Your control.",
        subheading: "Built with teacher authority and student privacy in mind",

        items: [
            {
                icon: "🔒",
                title: "FERPA-aware by design",
                description:
                    "Student data stored securely. No data sold. DPA available for districts.",
                linkText: "Read our Privacy Policy",
                linkHref: "/privacy",
            },
            {
                icon: "✓",
                title: "Teacher review required",
                description:
                    "AI provides suggestions; teachers make final decisions. You retain professional judgment.",
                linkText: "How AI Scoring Works",
                linkHref: "/ai-use",
            },
            {
                icon: "👁️",
                title: "Transparent AI",
                description:
                    "See exactly how AI scored. Override any score. AI explains its reasoning.",
                linkText: "View Transparency Report",
                linkHref: "/ai-safety",
            },
            {
                icon: "⚙️",
                title: "Admin control",
                description:
                    "School/district dashboards. Usage reports. SSO available.",
                linkText: "Admin Features",
                linkHref: "/about",
            },
        ],
    },

    // ============================================================================
    // TESTIMONIALS
    // ============================================================================
    testimonials: {
        heading: "Join 1,000+ teachers who stopped grading papers",
        subheading: "And started listening to their students",

        cards: [
            {
                quote:
                    "Finally, I have time to actually teach instead of grade papers. SayVeritas gave me my weekends back.",
                name: "Sarah M.",
                role: "AP Biology Teacher",
                schoolType: "High School",
            },
            {
                quote:
                    "Grading essays used to take all weekend. Now I listen to 30 minutes of Pulse highlights and know exactly what to reteach on Monday.",
                name: "James L.",
                role: "History Dept Chair",
                schoolType: "Middle School",
            },
            {
                quote:
                    "My students are actually speaking the language now. They can't hide behind Google Translate when they have to respond with their voice.",
                name: "Maria G.",
                role: "Spanish Teacher",
                schoolType: "High School",
            },
        ],
    },

    // ============================================================================
    // PRICING
    // ============================================================================
    pricing: {
        heading: "Flexible pricing for teachers and schools",
        subheading: "Whether piloting with one class or deploying district-wide",

        tiers: [
            {
                name: "Starter Pack",
                audience: "Individual teachers",
                priceDisplay: "From $15",
                priceDetail: "250 assessment credits",
                description:
                    "Pay as you go—credits never expire. Perfect for trying with one class.",
                features: [
                    "250 student assessments",
                    "All core features",
                    "Standards tagging",
                    "Reports & analytics",
                    "Email support",
                ],
                cta: {
                    text: "Get Started",
                    href: "/waitlist",
                },
                popular: false,
            },

            {
                name: "Classroom Pack",
                audience: "K-12 schools or departments",
                priceDisplay: "$29",
                priceDetail: "600 assessment credits",
                description:
                    "Enough for a full-class assessment with room to spare.",
                features: [
                    "600 student assessments",
                    "Question rotation + integrity controls",
                    "Class report with misconceptions",
                    "Evidence snippets for review",
                    "Priority support",
                ],
                cta: {
                    text: "Get Classroom",
                    href: "/waitlist",
                },
                popular: true,
                badge: "Most Popular",
            },

            {
                name: "School License",
                audience: "Districts & universities",
                priceDisplay: "Custom",
                priceDetail: "Volume discounts",
                description:
                    "Unlimited credits with admin dashboards and dedicated support.",
                features: [
                    "Unlimited teacher accounts",
                    "Admin dashboard + analytics",
                    "SSO / rostering support",
                    "Purchase order + invoice support",
                    "Dedicated account manager",
                ],
                cta: {
                    text: "Contact Sales",
                    href: "mailto:hello@sayveritas.com?subject=SayVeritas%20Pricing%20Request",
                },
                popular: false,
            },
        ],

        faq: [
            {
                question: "What counts as one 'assessment credit'?",
                answer:
                    "One credit = one student completing one assessment (any length). Credits never expire.",
            },
            {
                question: "Can we try before we buy?",
                answer:
                    "Yes! Teachers can start with a small credit pack. Schools get a free 30-day pilot.",
            },
            {
                question: "Do you offer multi-year contracts?",
                answer:
                    "Yes. Multi-year school and district licenses receive discounted pricing.",
            },
            {
                question: "What about data privacy?",
                answer:
                    "We're FERPA-aware. Student audio is deleted after transcription. No data sold. DPA available.",
            },
        ],
    },

    // ============================================================================
    // FINAL CTA
    // ============================================================================
    finalCTA: {
        heading: "Ready to transform assessment?",
        subheading:
            "Join schools moving beyond written tests to authentic oral reasoning.",

        benefits: [
            "Free 30-day trial (schools) or small credit pack (teachers)",
            "Full platform access during trial",
            "Implementation support included",
            "Cancel anytime—no long-term contract",
        ],

        cta_primary: {
            text: "Start Free Trial",
            href: "/waitlist",
        },

        cta_secondary: {
            text: "Book Demo",
            href: "mailto:hello@sayveritas.com?subject=SayVeritas%20Demo%20Request",
        },

        note: "Questions? Email hello@sayveritas.com",
    },
};

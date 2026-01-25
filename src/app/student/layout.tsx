"use client";

import { SchoolLocaleProvider } from "@/hooks/use-school-locale";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <SchoolLocaleProvider>
            {children}
        </SchoolLocaleProvider>
    );
}

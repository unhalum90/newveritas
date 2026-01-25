"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSchoolLocale } from "@/hooks/use-school-locale";
import {
    Jurisdiction,
    KeyStage,
    KEY_STAGES,
    isUKLocale,
    sanitizeForUK,
    containsBannedTerms,
    APPROVED_TERMS_UK,
    DEFAULT_UK_DESCRIPTORS
} from "@/lib/config/uk-config";

/**
 * UK Locale Context
 * 
 * Provides jurisdiction-aware configuration throughout the app.
 * Per dev_team_final_alignment.md: Tenant-level configuration.
 */

interface UKLocaleContextValue {
    jurisdiction: Jurisdiction;
    isUK: boolean;
    keyStage: KeyStage | null;
    setKeyStage: (ks: KeyStage | null) => void;

    // Vocabulary helpers
    t: (text: string) => string;  // Translate/sanitize text for locale
    checkBannedTerms: (text: string) => string[];

    // UK-specific config
    descriptors: readonly string[];

    // Key Stage utilities
    keyStages: typeof KEY_STAGES;
    getKeyStageLabel: (ks: KeyStage) => string;
}

const UKLocaleContext = createContext<UKLocaleContextValue | null>(null);

interface UKLocaleProviderProps {
    children: ReactNode;
    initialJurisdiction?: Jurisdiction;
    initialKeyStage?: KeyStage;
}

export function UKLocaleProvider({
    children,
    initialJurisdiction,
    initialKeyStage
}: UKLocaleProviderProps) {
    const { locale: schoolLocale } = useSchoolLocale();

    // Default to school locale if no specific jurisdiction provided
    const [jurisdiction] = useState<Jurisdiction>(initialJurisdiction ?? schoolLocale);
    const [keyStage, setKeyStage] = useState<KeyStage | null>(initialKeyStage ?? null);

    const isUK = isUKLocale(jurisdiction);

    // Text sanitization for UK locale
    const t = (text: string): string => {
        if (!isUK) return text;
        return sanitizeForUK(text);
    };

    // Check for banned terms
    const checkBannedTerms = (text: string): string[] => {
        if (!isUK) return [];
        return containsBannedTerms(text);
    };

    // Get Key Stage display label
    const getKeyStageLabel = (ks: KeyStage): string => {
        return KEY_STAGES[ks].label;
    };

    const value: UKLocaleContextValue = {
        jurisdiction,
        isUK,
        keyStage,
        setKeyStage,
        t,
        checkBannedTerms,
        descriptors: isUK ? DEFAULT_UK_DESCRIPTORS : [],
        keyStages: KEY_STAGES,
        getKeyStageLabel,
    };

    return (
        <UKLocaleContext.Provider value={value}>
            {children}
        </UKLocaleContext.Provider>
    );
}

/**
 * Hook to access UK locale context
 */
export function useUKLocale(): UKLocaleContextValue {
    const context = useContext(UKLocaleContext);
    const { locale: schoolLocale, isUK: schoolIsUK } = useSchoolLocale();

    if (!context) {
        // Return values derived from global school settings if not wrapped in specific provider
        return {
            jurisdiction: schoolLocale,
            isUK: schoolIsUK,
            keyStage: null,
            setKeyStage: () => { },
            t: (text) => schoolIsUK ? sanitizeForUK(text) : text,
            checkBannedTerms: (text) => schoolIsUK ? containsBannedTerms(text) : [],
            descriptors: schoolIsUK ? DEFAULT_UK_DESCRIPTORS : [],
            keyStages: KEY_STAGES,
            getKeyStageLabel: (ks) => KEY_STAGES[ks].label,
        };
    }
    return context;
}

/**
 * Hook specifically for vocabulary translation
 */
export function useUKVocabulary() {
    const { isUK, t, checkBannedTerms } = useUKLocale();

    return {
        isUK,
        translate: t,
        checkBanned: checkBannedTerms,
        // Common term replacements
        terms: isUK ? APPROVED_TERMS_UK : null,
    };
}

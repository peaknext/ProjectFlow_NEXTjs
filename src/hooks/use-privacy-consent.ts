/**
 * Privacy Consent Management Hook
 *
 * Manages user consent for privacy policy and cookies
 * - Consent expires after 15 days of inactivity
 * - Auto-extends on successful login
 * - Stored in localStorage
 */

import { useState, useEffect, useCallback } from 'react';

const CONSENT_KEY = 'privacy_consent';
const CONSENT_VERSION = '1.0'; // Increment when privacy policy changes
const CONSENT_DURATION_DAYS = 15;

export interface PrivacyConsent {
  accepted: boolean;
  version: string;
  timestamp: number; // Unix timestamp
  cookieSettings: {
    necessary: boolean; // Always true (required for app to function)
    analytics: boolean;
    functional: boolean;
  };
}

const DEFAULT_CONSENT: PrivacyConsent = {
  accepted: false,
  version: CONSENT_VERSION,
  timestamp: 0,
  cookieSettings: {
    necessary: true,
    analytics: false,
    functional: false,
  },
};

/**
 * Check if consent is valid (not expired)
 */
function isConsentValid(consent: PrivacyConsent | null): boolean {
  if (!consent || !consent.accepted) return false;

  // Check version mismatch
  if (consent.version !== CONSENT_VERSION) return false;

  // Check expiration (15 days)
  const now = Date.now();
  const expiryTime = consent.timestamp + (CONSENT_DURATION_DAYS * 24 * 60 * 60 * 1000);

  return now < expiryTime;
}

/**
 * Get consent from localStorage
 */
function getStoredConsent(): PrivacyConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as PrivacyConsent;
    return isConsentValid(consent) ? consent : null;
  } catch (error) {
    console.error('Failed to parse privacy consent:', error);
    return null;
  }
}

/**
 * Save consent to localStorage
 */
function saveConsent(consent: PrivacyConsent): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Failed to save privacy consent:', error);
  }
}

/**
 * Hook for managing privacy consent
 */
export function usePrivacyConsent() {
  const [consent, setConsent] = useState<PrivacyConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Load consent on mount
  useEffect(() => {
    const storedConsent = getStoredConsent();

    if (storedConsent) {
      setConsent(storedConsent);
      setShowPrivacyModal(false);
    } else {
      setConsent(DEFAULT_CONSENT);
      setShowPrivacyModal(true);
    }

    setIsLoading(false);
  }, []);

  /**
   * Accept all privacy policies and cookies
   */
  const acceptAll = useCallback(() => {
    const newConsent: PrivacyConsent = {
      accepted: true,
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      cookieSettings: {
        necessary: true,
        analytics: true,
        functional: true,
      },
    };

    setConsent(newConsent);
    saveConsent(newConsent);
    setShowPrivacyModal(false);
  }, []);

  /**
   * Accept with custom cookie settings
   */
  const acceptWithSettings = useCallback((settings: PrivacyConsent['cookieSettings']) => {
    const newConsent: PrivacyConsent = {
      accepted: true,
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      cookieSettings: {
        ...settings,
        necessary: true, // Always true
      },
    };

    setConsent(newConsent);
    saveConsent(newConsent);
    setShowPrivacyModal(false);
  }, []);

  /**
   * Decline all optional cookies (keep only necessary)
   */
  const declineOptional = useCallback(() => {
    const newConsent: PrivacyConsent = {
      accepted: true,
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      cookieSettings: {
        necessary: true,
        analytics: false,
        functional: false,
      },
    };

    setConsent(newConsent);
    saveConsent(newConsent);
    setShowPrivacyModal(false);
  }, []);

  /**
   * Extend consent (called on successful login)
   */
  const extendConsent = useCallback(() => {
    if (!consent?.accepted) return;

    const updatedConsent: PrivacyConsent = {
      ...consent,
      timestamp: Date.now(), // Reset timestamp
    };

    setConsent(updatedConsent);
    saveConsent(updatedConsent);
  }, [consent]);

  /**
   * Open privacy settings modal
   */
  const openPrivacySettings = useCallback(() => {
    setShowPrivacyModal(true);
  }, []);

  /**
   * Close privacy modal without accepting (for re-opening settings)
   */
  const closeModal = useCallback(() => {
    // Only allow closing if consent already exists
    if (consent?.accepted) {
      setShowPrivacyModal(false);
    }
  }, [consent]);

  /**
   * Check if user needs to see privacy notice
   */
  const needsConsent = !consent?.accepted || !isConsentValid(consent);

  return {
    consent,
    isLoading,
    needsConsent,
    showPrivacyModal,
    acceptAll,
    acceptWithSettings,
    declineOptional,
    extendConsent,
    openPrivacySettings,
    closeModal,
  };
}

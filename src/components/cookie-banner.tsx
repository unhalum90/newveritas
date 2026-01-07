"use client";

import { useEffect, useState } from "react";

const CONSENT_COOKIE = "veritas_cookie_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

function hasConsentCookie() {
  return document.cookie.split("; ").some((row) => row.startsWith(`${CONSENT_COOKIE}=`));
}

function setConsentCookie() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=1; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!hasConsentCookie());
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 text-zinc-100 shadow-lg backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-zinc-300">
          We use essential cookies for authentication and security. By continuing, you agree to our cookie notice.
        </div>
        <button
          type="button"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          onClick={() => {
            setConsentCookie();
            setVisible(false);
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

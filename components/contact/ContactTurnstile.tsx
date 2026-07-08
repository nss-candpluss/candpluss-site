"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export type ContactTurnstileHandle = {
  reset: () => void;
};

type ContactTurnstileProps = {
  onTokenChange: (token: string | null) => void;
};

export const ContactTurnstile = forwardRef<ContactTurnstileHandle, ContactTurnstileProps>(
  function ContactTurnstile({ onTokenChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenChangeRef = useRef(onTokenChange);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

    onTokenChangeRef.current = onTokenChange;

    const resetWidget = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }

      onTokenChangeRef.current(null);
    }, []);

    useImperativeHandle(ref, () => ({ reset: resetWidget }), [resetWidget]);

    useEffect(() => {
      if (!siteKey || !containerRef.current) {
        return;
      }

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenChangeRef.current(token),
          "expired-callback": () => onTokenChangeRef.current(null),
          "error-callback": () => onTokenChangeRef.current(null),
        });
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        window.onloadTurnstileCallback = renderWidget;

        const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

        if (!existingScript) {
          const script = document.createElement("script");
          script.id = TURNSTILE_SCRIPT_ID;
          script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback";
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [siteKey]);

    if (!siteKey) {
      return null;
    }

    return <div ref={containerRef} />;
  }
);

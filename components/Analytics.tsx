import Script from "next/script";

/**
 * Google Tag Manager + GA4 analytics.
 * Renders nothing when the env vars are not set (graceful degradation).
 *
 * Required env vars (all NEXT_PUBLIC_ so they're available at build time):
 *   - NEXT_PUBLIC_GTM_ID        → GTM-XXXXXXX
 *   - NEXT_PUBLIC_GA_MEASUREMENT_ID → G-XXXXXXXXXX  (optional if using GTM)
 *
 * Single-entrypoint rule: GTM is the source of truth. When GTM is present
 * we DO NOT load gtag.js directly — GA4 must be configured *inside* GTM.
 * Loading both would double-count every pageview/event. Direct GA4 is only
 * a fallback for when GTM is not configured.
 */
export default function Analytics({ nonce }: { nonce?: string }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gtmId && !gaId) return null;

  const useDirectGa4 = !gtmId && Boolean(gaId);

  return (
    <>
      {/* ── Google Tag Manager ─────────────────────────────────────── */}
      {gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');
n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
          {/* GTM noscript fallback — placed early in body via layout */}
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

      {/* ── Google Analytics 4 (direct — only when GTM is absent) ───── */}
      {useDirectGa4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script
            id="ga4-config"
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${gaId}');`,
            }}
          />
        </>
      )}
    </>
  );
}

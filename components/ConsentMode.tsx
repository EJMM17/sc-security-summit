/**
 * Google Consent Mode v2 — default state.
 *
 * Rendered as a plain nonce'd inline <script> at the very top of <body> so it
 * executes during HTML parse — before GTM / GA / Ads / pixels (which load via
 * next/script `afterInteractive`). Storage is DENIED by default (privacy-first);
 * GTM still receives cookieless modeling pings. Returning visitors who
 * previously accepted have their stored choice applied as the default
 * immediately (no flicker, no re-prompt).
 *
 * The cookie banner (components/CookieConsent.tsx) calls
 * gtag('consent','update', …) to flip storage to granted/denied.
 *
 * Nonce-based: compatible with the per-request CSP in middleware.ts.
 */
export default function ConsentMode({ nonce }: { nonce?: string }) {
  const script = `window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=window.gtag||gtag;
var s='denied';
try{var r=window.localStorage.getItem('scss2026:cookie-consent');if(r){var d=JSON.parse(r);if(d&&d.decision==='all')s='granted';}}catch(e){}
gtag('consent','default',{ad_storage:s,ad_user_data:s,ad_personalization:s,analytics_storage:s,functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','url_passthrough',true);
gtag('set','ads_data_redaction',s!=='granted');`;

  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}

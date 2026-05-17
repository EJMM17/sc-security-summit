import Script from "next/script";

/**
 * LinkedIn Insight Tag.
 * Renders nothing when NEXT_PUBLIC_LINKEDIN_PARTNER_ID is not set.
 */
export default function LinkedInInsight({ nonce }: { nonce?: string }) {
  const partnerId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

  if (!partnerId) return null;

  return (
    <>
      <Script
        id="linkedin-insight"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `_linkedin_partner_id="${partnerId}";
window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];
var b=document.createElement("script");b.type="text/javascript";b.async=true;
b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
var n=document.querySelector('[nonce]');
n&&b.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));
s.parentNode.insertBefore(b,s);})(window.lintrk);`,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://px.ads.linkedin.com/collect/?pid=${partnerId}&fmt=gif`}
        />
      </noscript>
    </>
  );
}

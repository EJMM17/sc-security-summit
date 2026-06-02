import Script from "next/script";

/**
 * Meta (Facebook) Pixel base code.
 * Renders nothing when NEXT_PUBLIC_META_PIXEL_ID is not set.
 */
export default function MetaPixel({ nonce }: { nonce?: string }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (!pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;var x=b.querySelector('[nonce]');
x&&t.setAttribute('nonce',x.nonce||x.getAttribute('nonce'));
s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- tracking pixel fallback requires a raw img beacon inside noscript. */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

import React, { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT, ADSENSE_SLOT } from '../config.js';

let loaded = false;

export default function AdSlot() {
  const pushed = useRef(false);
  const on = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);
  useEffect(() => {
    if (!on) return;
    if (!loaded) {
      loaded = true;
      const s = document.createElement('script');
      s.async = true; s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
      document.head.appendChild(s);
    }
    if (!pushed.current) { pushed.current = true; try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* 광고 차단 등 */ } }
  }, [on]);
  if (!on) return null;
  return (
    <aside className="adslot" aria-label="광고">
      <small>광고</small>
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  );
}

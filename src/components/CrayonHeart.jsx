import React from 'react';

// 크레파스로 칠한 느낌의 하트. 가장자리를 살짝 울퉁불퉁하게 만들고, 칠한 면에 종이 결이 비치게 한다.
const HEART = 'M50 85 C22 64 5 48 6 29 C7 14 18 5 31 7 C40 8 46 13 50 21 C54 12 62 6 71 6 C85 6 95 16 94 30 C93 48 77 63 50 85 Z';
const SCRIBBLE = 'M2 16 L98 6 L4 26 L99 19 L6 38 L98 31 L8 50 L96 43 L14 62 L90 55 L24 72 L80 67 L36 82 L66 80';

export default function CrayonHeart({ id, color = 'var(--accent)', className, style }) {
  const f = 'crayon-' + id; const c = 'heart-' + id;
  return (
    <svg className={className} style={style} viewBox="0 0 100 92" aria-hidden="true" focusable="false">
      <defs>
        <filter id={f} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.55 0.09" numOctaves="3" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.5 0 0 0 -1.15" result="wax" />
          <feComposite in="rough" in2="wax" operator="in" />
        </filter>
        <clipPath id={c}><path d={HEART} /></clipPath>
      </defs>
      <g filter={`url(#${f})`}>
        <g clipPath={`url(#${c})`}>
          <path d={SCRIBBLE} fill="none" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: color }} />
          <path d={SCRIBBLE} fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 5)" style={{ stroke: color, opacity: 0.7 }} />
        </g>
        <path d={HEART} fill="none" strokeWidth="4.5" strokeLinejoin="round" style={{ stroke: color }} />
      </g>
    </svg>
  );
}

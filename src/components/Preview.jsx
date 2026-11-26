import React from 'react';

function Radar({ axes }) {
  const n = axes.length, cx = 160, cy = 130, R = 84;
  const P = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const f = (p) => p.map((x) => x.toFixed(1)).join(',');
  return (
    <svg className="radar" viewBox="0 0 320 260" role="img" aria-label="기준 중요도 레이더 차트">
      {[0.33, 0.66, 1].map((k) => <polygon key={k} points={axes.map((_, i) => f(P(i, R * k))).join(' ')} style={{ fill: 'none', stroke: 'var(--line)' }} />)}
      {axes.map((a, i) => { const e = P(i, R); return <line key={i} x1={cx} y1={cy} x2={e[0].toFixed(1)} y2={e[1].toFixed(1)} style={{ stroke: 'var(--line)' }} />; })}
      <polygon points={axes.map((a, i) => f(P(i, R * a.v / 100))).join(' ')} style={{ fill: 'var(--accent)', fillOpacity: 0.22, stroke: 'var(--accent)', strokeWidth: 2 }} />
      {axes.map((a, i) => { const l = P(i, R + 22); return <text key={i} x={l[0].toFixed(1)} y={(l[1] + 4).toFixed(1)} textAnchor="middle" style={{ fill: 'var(--ink)', fontSize: 12 }}>{a.label}</text>; })}
    </svg>
  );
}

function Row({ r }) {
  if (r.k === 'axis') {
    return (
      <div className="bar"><b>{r.label}</b><span>{r.l}</span>
        <div className="tr"><i className="dot" style={{ left: r.me + '%' }} />{r.you !== null && <i className="dot you" style={{ left: r.you + '%' }} />}</div>
        <span>{r.r}</span>
        {r.why && r.why.length > 0 && <span className="whyt">이유: {r.why.join(' · ')}</span>}
      </div>
    );
  }
  if (r.k === 'dots') {
    return (
      <dl className="pc-row"><dt>{r.label}</dt>
        <dd className="dots" aria-label={`5점 중 ${r.v}점`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= r.v ? 'on' : undefined} />)}</dd></dl>
    );
  }
  if (r.k === 'prio') {
    return <div className="prio">{r.g.map((x, i) => <div key={i} className={x.c}><em>{x.n}</em>{x.items.join(' · ')}</div>)}</div>;
  }
  if (r.k === 'radar') return <Radar axes={r.axes} />;
  return (
    <dl className="pc-row"><dt>{r.label}</dt>
      <dd>{r.v}{r.v2 ? <><br />{r.v2}</> : null}{r.why ? <span className="whyt">이유: {r.why}</span> : null}</dd></dl>
  );
}

export default function Preview({ model, head, sample }) {
  const hasYou = model.some((s) => s.rows.some((r) => r.k === 'axis' && r.you !== null));
  return (
    <div className="pcard" id="pcard">
      <div className="pc-head">
        <div className="kicker">{head.name ? head.name : <span className="brand">결 페이지</span>}{sample ? ' · 예시' : ''}</div>
        <h2>{head.tag || '나의 기준'}</h2>
        {head.kw.length > 0 && <div className="pc-tags">{head.kw.map((w) => <span key={w}>#{w}</span>)}</div>}
      </div>
      {model.length ? (
        <div className="pc-body">
          {hasYou && <div className="legend">● 나 &nbsp; ○ 상대에게 바라는 것</div>}
          {model.map((s) => (
            <section className="pc-sec" key={s.id || s.t}><h3>{s.t}</h3>{s.rows.map((r, i) => <Row r={r} key={i} />)}</section>
          ))}
        </div>
      ) : <div className="empty">카드에 담을 내용이 없어요. 질문에 답하거나 카드 깊이를 바꿔 보세요.</div>}
    </div>
  );
}

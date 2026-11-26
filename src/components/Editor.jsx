import React, { useRef, useState } from 'react';
import { Q, SECS, SM, DL, POS, NEG, POSO, NEGO } from '../data/questions.js';

const WARN = {
  belief: '이 영역은 선택 사항이에요. 저장한 이미지가 다른 사람에게 전달될 수 있으니 공개 여부를 꼭 확인하세요. 정당이나 지지 후보는 묻지 않아요.',
  body: '진단명이나 병력은 묻지 않고, 건강을 대하는 태도만 물어요.'
};

function Chip({ on, onClick, cls, children, label }) {
  return <button type="button" className={'chip' + (cls ? ' ' + cls : '')} aria-pressed={on} onClick={onClick} aria-label={label}>{children}</button>;
}

function SkipChip({ q, w, cur, act }) {
  return <Chip cls="skip" on={cur === 'skip'} onClick={() => act.chip(q.id, w, 'skip')}>건너뛰기</Chip>;
}

function useOther(q, a, act) {
  const cs = a.c || []; const open = a.oo === undefined ? cs.length > 0 : a.oo;
  const [text, setText] = useState('');
  const ref = useRef(null);
  const add = () => { const r = act.addOther(q.id, text); if (r !== 'blocked') { if (r === 'ok') setText(''); if (ref.current) ref.current.focus(); } };
  return {
    chip: <Chip key="oth" on={open} onClick={() => act.toggleOther(q.id)}>기타</Chip>,
    rest: (
      <>
        {cs.length > 0 && (
          <div className="chips">
            {cs.map((w, i) => (
              <span className="chip cu" key={w}>{w}
                <button type="button" className="x" aria-label={w + ' 삭제'} onClick={() => act.removeOther(q.id, i)}>✕</button></span>
            ))}
          </div>
        )}
        {open && (
          <div className="pair">
            <input ref={ref} className="in" type="text" maxLength={30} value={text} aria-label={q.l + ' 직접 추가'} placeholder="목록에 없는 항목을 적어요"
              onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
            <button type="button" className="btn" onClick={add}>추가</button>
          </div>
        )}
      </>
    )
  };
}

function MultiCtl({ q, w, a, act }) {
  const v = a[w]; const arr = Array.isArray(v) ? v : [];
  const ot = useOther(q, a, act);
  return (
    <>
      <div className="chips" role="group" aria-label={q.l}>
        {q.o.map((o, i) => { const p = arr.indexOf(i); return <Chip key={i} on={p >= 0} onClick={() => act.chip(q.id, w, i)}>{(q.t === 'k' && p >= 0 ? (p + 1) + ' ' : '') + o}</Chip>; })}
        {q.oth && ot.chip}
        <SkipChip q={q} w={w} cur={v} act={act} />
      </div>
      {q.oth && ot.rest}
      <div className="hint">{q.t === 'k' ? '중요한 순서대로 3개를 눌러요' : '목록에서 최대 ' + q.max + '개' + (q.oth ? ' · "기타"로 직접 추가하는 항목은 개수 제한이 없어요' : '')}</div>
    </>
  );
}

function Ctl({ q, w, a, L, act }) {
  const v = a[w];
  const aria = q.t === 't' ? q.p : q.l;
  if (q.t === 's') {
    return <div className="chips" role="group" aria-label={aria}>{q.o.map((o, i) => <Chip key={i} on={v === i} onClick={() => act.chip(q.id, w, i)}>{o}</Chip>)}<SkipChip q={q} w={w} cur={v} act={act} /></div>;
  }
  if (q.t === 'm' || q.t === 'k') return <MultiCtl q={q} w={w} a={a} act={act} />;
  if (q.t === 'f') {
    const os = L.opts(q);
    if (!os.length) return <div className="hint">앞의 "나의 약점"에서 고른 항목이 여기에 나타나요</div>;
    const arr = Array.isArray(v) ? v : [];
    return (
      <>
        <div className="chips" role="group" aria-label={aria}>{os.map((o) => <Chip key={o} on={arr.indexOf(o) >= 0} onClick={() => act.chip(q.id, w, o)}>{o}</Chip>)}<SkipChip q={q} w={w} cur={v} act={act} /></div>
        <div className="hint">최대 {q.max}개</div>
      </>
    );
  }
  if (q.t === 'r') {
    return (
      <>
        <div className="five" role="group" aria-label={aria}>{[1, 2, 3, 4, 5].map((n) => <Chip key={n} on={v === n} onClick={() => act.chip(q.id, w, n)} label={n + '점'}>{n}</Chip>)}</div>
        <div className="ends"><span>전혀 아니에요</span><span>매우 중요해요</span></div>
        <div className="chips"><SkipChip q={q} w={w} cur={v} act={act} /></div>
      </>
    );
  }
  if (q.t === 't') {
    return (
      <>
        <div className="tri" role="group" aria-label={aria}>
          <Chip on={v === 0} onClick={() => act.chip(q.id, w, 0)}>{q.o[0][0]}</Chip>
          <Chip on={v === 1} onClick={() => act.chip(q.id, w, 1)}>상황에 따라 달라요</Chip>
          <Chip on={v === 2} onClick={() => act.chip(q.id, w, 2)}>{q.o[1][0]}</Chip>
        </div>
        <div className="chips"><SkipChip q={q} w={w} cur={v} act={act} /></div>
      </>
    );
  }
  if (q.t === 'n') {
    const m = (v && v !== 'skip') ? v : {};
    return (
      <>
        <div className="pair">
          <input className="in" type="number" inputMode="numeric" placeholder={q.ph ? q.ph[0] : ''} aria-label={q.l + ' 최소'} value={m.a || ''} onChange={(e) => act.number(q.id, 'a', e.target.value)} />
          <span aria-hidden="true">~</span>
          <input className="in" type="number" inputMode="numeric" placeholder={q.ph ? q.ph[1] : ''} aria-label={q.l + ' 최대'} value={m.b || ''} onChange={(e) => act.number(q.id, 'b', e.target.value)} />
          <span>{q.u}</span>
        </div>
        <div className="hint">{q.ph ? '예: ' + q.ph[0] + ' ~ ' + q.ph[1] + ' · ' : ''}한쪽만 적어도 돼요</div>
      </>
    );
  }
  if (q.t === 'c') {
    const c = L.cardsOf();
    const grp = (list, opts, pre) => list.map((n, i) => (
      <div className="cardrow" key={pre + i}><b>{n}</b>
        <div className="chips" role="group" aria-label={n}>{opts.map((o, j) => <Chip key={j} on={c[pre + i] === j} onClick={() => act.card(pre + i, j)}>{o}</Chip>)}</div></div>
    ));
    return <><p className="sub">있으면 좋은 점</p>{grp(POS, POSO, 'p')}<p className="sub">피하고 싶은 행동</p>{grp(NEG, NEGO, 'n')}</>;
  }
  return null;
}

function QBlock({ q, st, L, act }) {
  const a = st.a[q.id] || {}; const off = !!st.hide[q.id];
  const lid = 'q-' + q.id;
  return (
    <section className={'qb' + (off ? ' off' : '')} aria-labelledby={lid}>
      <div className="qh">
        <div className="qt" id={lid}>{q.t === 't' ? q.p : q.l}</div>
        <span className="dep">{DL[q.d]}</span>
        <button type="button" className="eye" aria-pressed={!off} onClick={() => act.eye('q', q.id)}>{off ? '나만 보기' : '카드에 포함'}</button>
      </div>
      <div className="ctls">
        {q.du ? (
          <>
            <div className="who">나</div>
            <Ctl q={q} w="m" a={a} L={L} act={act} />
            <label className="dual"><input type="checkbox" checked={!!a.diff} onChange={(e) => act.diff(q.id, e.target.checked)} /> 상대에게 바라는 건 달라요</label>
            {a.diff && <><div className="who">상대에게 바라는 것</div><Ctl q={q} w="y" a={a} L={L} act={act} /></>}
          </>
        ) : <Ctl q={q} w="m" a={a} L={L} act={act} />}
        {q.why && st.qd >= 2 && a.m !== undefined && a.m !== 'skip' && (
          <div className="why">
            <div className="who">왜 그렇게 골랐나요? (선택이에요. 건너뛰어도 돼요)</div>
            <div className="chips" role="group" aria-label="이유 선택">{q.why.map((o, i) => <Chip key={i} on={a.w === i} onClick={() => act.chip(q.id, 'w', i)}>{o}</Chip>)}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function Intro({ st, L, act }) {
  const sg = L.suggest(); const kws = L.keywords(); const all = sg.concat(L.extras().filter((w) => sg.indexOf(w) < 0)); const names = ['가치 한 줄', '가치 나열', '강점과 가치', '직접 쓰기'];
  return (
    <>
      <section className="qb"><label className="qt" htmlFor="f-name">이름 또는 별칭</label>
        <input id="f-name" className="in" type="text" maxLength={20} placeholder="예: 민지" value={st.name} onChange={(e) => act.field('name', e.target.value)} />
        <div className="hint">실명 대신 별칭을 권해요</div></section>
      <section className="qb"><div className="qt">키워드</div>
        <div className="chips" role="group" aria-label="키워드">{all.map((w) => <Chip key={w} on={kws.indexOf(w) >= 0} onClick={() => act.keyword(w)}>#{w}</Chip>)}</div>
        <div className="hint">{sg.length
          ? '내가 답한 항목 중 카드에 공개된 것에서 자동으로 골랐어요(최대 5개). 뜻이 겹치는 키워드는 하나만 보여요. 뒤쪽의 에겐형·갓생형·MBTI 같은 말은 자동으로 들어가지 않으니, 마음에 들면 직접 눌러 보세요. 눌러서 바꿀 수 있어요.'
          : '질문에 답하면 핵심 가치, 장점, 성향, 생활 습관이 키워드로 자동 정리돼요. 에겐형·갓생형·MBTI 같은 말은 직접 눌러서 넣을 수 있어요.'}
          {' '}사람을 단정하는 말이 아니라 가볍게 소개하는 용도예요.</div>
        {st.kw !== null && <div className="chips"><Chip cls="skip" on={false} onClick={() => act.keywordAuto()}>자동 선택으로 되돌리기</Chip></div>}
      </section>
      <section className="qb"><div className="qt">한 줄 소개</div>
        <div className="chips" role="group" aria-label="한 줄 소개 방식">{names.map((t, i) => <Chip key={i} on={st.tpl === i} onClick={() => act.tpl(i)}>{t}</Chip>)}</div>
        {st.tpl === 3
          ? <input className="in" type="text" maxLength={60} aria-label="한 줄 소개" placeholder="나를 한 문장으로" value={st.custom} onChange={(e) => act.field('custom', e.target.value)} />
          : <div className="hint">미리보기: {L.tagline() || '핵심 가치를 고르면 만들어져요'}</div>}
      </section>
    </>
  );
}

export function Nav({ st, L, act }) {
  let d = 0, n = 0;
  SECS.forEach((s) => { if (s.id !== 'intro') { const p = L.prog(s.id); d += p[0]; n += p[1]; } });
  return (
    <nav className="nav" id="nav" aria-label="질문 카테고리">
      {SECS.map((s) => {
        const p = s.id === 'intro' ? null : L.prog(s.id); const done = p && p[1] && p[0] === p[1];
        return (
          <button type="button" key={s.id} className={'nv' + (done ? ' done' : '')} aria-current={st.sec === s.id ? 'true' : undefined} onClick={() => act.go(s.id)}>
            <span>{s.t}{s.x && st.soff[s.id] ? <i className="lk">나만 보기</i> : null}</span>
            {p ? <small>{p[0]}/{p[1]}</small> : null}
          </button>
        );
      })}
    </nav>
  );
}

export function progressText(st, L) {
  let d = 0, n = 0;
  SECS.forEach((s) => { if (s.id !== 'intro') { const p = L.prog(s.id); d += p[0]; n += p[1]; } });
  return `답한 질문 ${d} / ${n}`;
}

export function Panel({ st, L, act }) {
  const s = SM[st.sec]; const off = !!st.soff[s.id]; const i = SECS.indexOf(s);
  return (
    <main className="editor" id="main" tabIndex={-1}>
      <div className={'panel' + (off ? ' off' : '')}>
        <header>
          <div><h2>{s.t}</h2><small>{s.s}</small></div>
          {s.id !== 'intro' && <button type="button" className="eye" aria-pressed={!off} onClick={() => act.eye('s', s.id)}>{off ? '나만 보기' : '카드에 포함'}</button>}
        </header>
        {s.x && <div className="warn">{off ? '이 카테고리는 기본으로 나만 보기예요. 오른쪽 위의 버튼을 켜면 카드에 담겨요. ' : '이 카테고리는 지금 카드에 포함돼요. '}{WARN[s.id] || '모든 질문은 건너뛸 수 있어요.'}</div>}
        <div className="qs">
          {s.id === 'intro' ? <Intro st={st} L={L} act={act} /> : (
            <>
              {Q.filter((q) => q.s === s.id && q.d <= st.qd && L.condOk(q)).map((q) => <QBlock key={q.id} q={q} st={st} L={L} act={act} />)}
              {st.qd >= 3 && (
                <section className="qb"><label className="qt" htmlFor={'note-' + s.id}>한 줄 메모 <span className="dep">심층</span></label>
                  <textarea id={'note-' + s.id} className="in" placeholder="이 영역에서 덧붙이고 싶은 이야기 (선택)" value={st.notes[s.id] || ''} onChange={(e) => act.note(s.id, e.target.value)} />
                  <div className="hint">카드 깊이가 심층일 때만 카드에 나와요</div></section>
              )}
            </>
          )}
        </div>
        <div className="nextrow">
          <button type="button" className="btn ghost" hidden={i === 0} onClick={() => act.go(SECS[i - 1].id)}>이전 카테고리</button><span />
          <button type="button" className="btn" hidden={i === SECS.length - 1} onClick={() => act.go(SECS[i + 1].id)}>다음 카테고리</button>
        </div>
      </div>
    </main>
  );
}

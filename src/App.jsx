import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SECS, SM } from './data/questions.js';
import { makeLogic } from './lib/logic.js';
import { defaultState, loadState, saveState } from './lib/storage.js';
import * as A from './lib/actions.js';
import { exportCard } from './lib/export.js';
import { Nav, Panel, progressText } from './components/Editor.jsx';
import Preview from './components/Preview.jsx';
import Logo from './components/Logo.jsx';
import CrayonHeart from './components/CrayonHeart.jsx';
import AdSlot from './components/AdSlot.jsx';
import ko from './i18n/ko.js';

function Seg({ label, value, items, onPick }) {
  return (
    <span className="seg" role="group" aria-label={label}>
      {items.map(([v, t]) => <button type="button" key={v} aria-pressed={value === v} onClick={() => onPick(v)}>{t}</button>)}
    </span>
  );
}

// 한 번 더 눌러야 실행되는 버튼
function TwoStep({ label, armLabel, onRun }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  return <button type="button" className="btn ghost" onClick={() => { if (!armed) setArmed(true); else { setArmed(false); onRun(); } }}>{armed ? armLabel : label}</button>;
}

export default function App() {
  const [st, setSt] = useState(() => {
    const s = loadState() || defaultState();
    if (!loadState()) A.fillSample(s);
    if (!SM[s.sec]) s.sec = 'intro';
    return s;
  });
  const [tab, setTab] = useState('edit');
  const [toast, setToast] = useState('');
  const [check, setCheck] = useState(null);
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef(null);
  const stRef = useRef(st); stRef.current = st;

  const L = useMemo(() => makeLogic(st), [st]);
  const model = useMemo(() => L.model(), [L]);
  const head = useMemo(() => L.head(), [L]);

  useEffect(() => { const t = setTimeout(() => saveState(st), 400); return () => clearTimeout(t); }, [st]);
  // 탭을 닫거나 새로고침해도 마지막 입력이 남도록 바로 저장
  useEffect(() => {
    const flush = () => saveState(stRef.current);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); };
  }, []);

  const say = useCallback((msg) => {
    setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  // 현재 상태를 복사해 고친 뒤 반영. fn(draft, logic)이 문자열을 돌려주면 안내 문구로 보여준다.
  const mutate = useCallback((fn, opts = {}) => {
    const draft = structuredClone(stRef.current);
    const msg = fn(draft, makeLogic(draft));
    if (typeof msg === 'string' && msg !== 'ok' && msg !== 'empty') { say(msg); return msg; }
    stRef.current = draft; setSt(draft);
    if (opts.top) window.scrollTo(0, 0);
    return msg || 'ok';
  }, [say]);

  const act = useMemo(() => ({
    chip: (id, w, v) => mutate((d, l) => A.toggleChip(d, l, id, w, v)),
    card: (key, j) => mutate((d, l) => A.toggleCard(d, l, key, j)),
    number: (id, k, v) => mutate((d, l) => A.setNumber(d, l, id, k, v)),
    diff: (id, on) => mutate((d, l) => { l.entry(id).diff = on; d.sample = false; }),
    eye: (kind, id) => mutate((d) => { const map = kind === 'q' ? d.hide : d.soff; map[id] = !map[id]; d.preset = ''; d.sample = false; }),
    toggleOther: (id) => mutate((d, l) => A.toggleOtherOpen(d, l, id)),
    removeOther: (id, i) => mutate((d, l) => A.removeOther(d, l, id, i)),
    addOther: (id, text) => {
      const r = mutate((d, l) => A.addOther(d, l, id, text));
      return r === 'ok' ? 'ok' : r === 'empty' ? 'empty' : 'blocked';
    },
    field: (k, v) => mutate((d) => { d[k] = v; d.sample = false; }),
    note: (id, v) => mutate((d) => { d.notes[id] = v; }),
    keyword: (w) => mutate((d, l) => A.toggleKeyword(d, l, w)),
    keywordAuto: () => mutate((d) => { d.kw = null; d.sample = false; }),
    tpl: (i) => mutate((d) => { d.tpl = i; d.sample = false; }),
    go: (id) => mutate((d) => { d.sec = id; }, { top: true })
  }), [mutate]);

  const startExport = (kind) => {
    const sens = model.filter((s) => s.x);
    if (!sens.length) { setCheck(null); run(kind); return; }
    setCheck({ kind, titles: sens.map((s) => s.t) });
  };
  const run = async (kind) => {
    setCheck(null);
    if (busy) return;
    setBusy(true); say(ko.making);
    try {
      const r = await exportCard(kind, { model, head, sample: st.sample, name: st.name });
      say(ko.saved(r.pages, kind === 'png' && r.pages > 1));
    } catch (e) { say(ko.saveFail); }
    setBusy(false);
  };

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{ko.skipLink}</a>
      <div className="wrap">
        <header className="top">
          <div className="top-text">
            <h1><Logo className="logo" /><span className="brand">{ko.title}</span><span className="beta" title="베타 버전이에요. 질문과 화면이 계속 바뀔 수 있어요.">BETA</span></h1>
            <p className="intro">{ko.intro.map((line) => <span key={line}>{line}</span>)}</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <CrayonHeart id="a" className="h1" />
            <CrayonHeart id="b" className="h2" color="var(--heart-soft)" />
          </div>
        </header>
        <div className="toolbar" role="toolbar" aria-label="설정">
          <span className="tabs seg" role="group" aria-label="화면 전환">
            <button type="button" aria-pressed={tab === 'edit'} onClick={() => { setTab('edit'); window.scrollTo(0, 0); }}>{ko.tabEdit}</button>
            <button type="button" aria-pressed={tab === 'view'} onClick={() => { setTab('view'); window.scrollTo(0, 0); }}>{ko.tabView}</button>
          </span>
          <span className="lbl">{ko.qDepth}</span>
          <Seg label={ko.qDepth} value={st.qd} items={[[1, ko.depths[0]], [2, ko.depths[1]], [3, ko.depths[2]]]} onPick={(v) => mutate((d) => { d.qd = v; d.sample = false; })} />
          <span className="lbl">{ko.share}</span>
          <Seg label="공유 범위 프리셋" value={st.preset} items={['A', 'B', 'C'].map((k) => [k, ko.presets[k]])} onPick={(k) => mutate((d) => { A.applyPreset(d, k); d.sample = false; })} />
          <span className="spacer" />
          <span className="prog">{progressText(st, L)}</span>
          <TwoStep label={ko.sample} armLabel={ko.sampleArm} onRun={() => { mutate((d) => { A.fillSample(d); }); say(ko.sampled); }} />
          <TwoStep label={ko.reset} armLabel={ko.resetArm} onRun={() => { mutate((d) => { A.clearAll(d); }); say(ko.resetDone); }} />
        </div>
        <div className="layout" data-tab={tab}>
          <Nav st={st} L={L} act={act} />
          <Panel st={st} L={L} act={act} />
          <aside className="preview-col" aria-label={ko.preview}>
            <div className="pvbar">
              <span className="lbl">{ko.cardDepth}</span>
              <Seg label={ko.cardDepth} value={st.cd} items={[[1, ko.depths[0]], [2, ko.depths[1]], [3, ko.depths[2]]]} onPick={(v) => mutate((d) => { d.cd = v; d.preset = ''; d.sample = false; })} />
            </div>
            <div className="pvbar">
              <button type="button" className="btn" disabled={busy} onClick={() => startExport('png')}>{ko.savePng}</button>
              <button type="button" className="btn primary" disabled={busy} onClick={() => startExport('pdf')}>{ko.savePdf}</button>
            </div>
            {check && (
              <div className="chk" role="alertdialog" aria-label="저장 전 확인">
                <p>저장하기 전에 확인해 주세요. 카드에 민감한 카테고리 {check.titles.length}개가 들어 있어요: <b>{check.titles.join(', ')}</b>. 저장한 이미지나 PDF는 받는 사람이 그대로 볼 수 있어요.</p>
                <div className="row">
                  <button type="button" className="btn primary" onClick={() => run(check.kind)}>그대로 저장</button>
                  <button type="button" className="btn" onClick={() => setCheck(null)}>돌아가서 수정</button>
                </div>
              </div>
            )}
            <Preview model={model} head={head} sample={st.sample} />
            <p className="note">{ko.saveNote}</p>
            <AdSlot />
          </aside>
        </div>
        {!import.meta.env.VITE_EMBED && <footer className="sitefoot">
          <a href="./guide/">가이드</a><a href="./about.html">소개</a><a href="./privacy.html">개인정보처리방침</a>
        </footer>}
      </div>
      <div className="toast" role="status" aria-live="polite" hidden={!toast}>{toast}</div>
    </>
  );
}

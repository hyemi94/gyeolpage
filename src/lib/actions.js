// 상태(st)를 직접 고치는 동작들. 호출하는 쪽에서 structuredClone 한 사본을 넘긴다.
import { Q, QM, SECS, POS, NEG } from '../data/questions.js';

export const PRESETS = {
  A: { cd: 3, on: ['trust', 'money', 'future', 'belief', 'body', 'touch'] },
  B: { cd: 2, on: ['future', 'belief'] },
  C: { cd: 1, on: [] }
};

export function resetSoff(st) { st.soff = {}; SECS.forEach((s) => { if (s.x) st.soff[s.id] = true; }); }

export function clearAll(st) {
  st.a = {}; st.hide = {}; st.notes = {}; st.name = ''; st.kw = null; st.tpl = 0; st.custom = '';
  st.sample = false; st.preset = ''; resetSoff(st);
}

export function fillSample(st) {
  st.a = {}; st.hide = {}; st.notes = {}; st.name = ''; st.kw = null; st.tpl = 0; st.custom = ''; resetSoff(st);
  Q.forEach((q, i) => {
    const e = {}; const n = q.o ? q.o.length : 0;
    if (q.t === 's') e.m = (i * 5 + 2) % n;
    else if (q.t === 't') e.m = [0, 2, 1, 2, 0][i % 5];
    else if (q.t === 'm') { const arr = []; const k = Math.min(q.max, 2); for (let j = 0; j < k; j++) { const x = (i * 3 + j * 2) % n; if (arr.indexOf(x) < 0) arr.push(x); } e.m = arr; }
    else if (q.t === 'k') e.m = [0, 1, 2];
    else if (q.t === 'r') e.m = 2 + (i % 4);
    else if (q.t === 'n') e.m = q.id === 'byear' ? { a: '1988', b: '1996' } : { a: '', b: '' };
    else if (q.t === 'c') { const c = {}; POS.forEach((_, j) => { c['p' + j] = j % 3; }); NEG.forEach((_, j) => { c['n' + j] = j % 3; }); e.m = c; }
    else return;
    if (q.du && i % 4 === 0) {
      e.diff = true;
      e.y = q.t === 's' ? (e.m + 1) % n : q.t === 't' ? (e.m + 1) % 3 : [(e.m[0] + 1) % n];
    }
    if (q.why && i % 2 === 0) e.w = i % q.why.length;
    st.a[q.id] = e;
  });
  st.a.fix = { m: [QM.weak.o[st.a.weak.m[0]]] };
  st.sample = true; st.preset = '';
}

export function applyPreset(st, k) {
  const p = PRESETS[k]; st.cd = p.cd; resetSoff(st);
  SECS.forEach((s) => { if (s.x) st.soff[s.id] = p.on.indexOf(s.id) < 0; });
  st.preset = k;
}

// 선택지 버튼. 안내할 말이 있으면 문자열을 돌려준다.
export function toggleChip(st, L, qid, w, raw) {
  const q = QM[qid]; const e = L.entry(q.id);
  const v = raw === 'skip' ? 'skip' : (q.t === 'f' ? raw : Number(raw));
  if (raw === 'skip' || q.t === 's' || q.t === 't' || q.t === 'r') { e[w] = (e[w] === v) ? undefined : v; }
  else {
    const arr = Array.isArray(e[w]) ? e[w].slice() : []; const p = arr.indexOf(v); const mx = q.t === 'k' ? 3 : q.max;
    if (p >= 0) arr.splice(p, 1);
    else { if (arr.length >= mx) return '최대 ' + mx + '개까지 고를 수 있어요'; arr.push(v); }
    e[w] = arr;
  }
  if (e[w] === undefined || (Array.isArray(e[w]) && !e[w].length)) delete e[w];
  if (q.oth && e.m === 'skip') { delete e.c; delete e.oo; }
  if (q.id === 'weak' && st.a.fix && Array.isArray(st.a.fix.m)) {
    const os = L.opts(QM.fix); st.a.fix.m = st.a.fix.m.filter((x) => os.indexOf(x) >= 0); if (!st.a.fix.m.length) delete st.a.fix.m;
  }
  st.sample = false;
  return null;
}

export function addOther(st, L, id, text) {
  const w = text.trim(); if (!w) return 'empty';
  const q = QM[id]; const e = L.entry(id); const cs = Array.isArray(e.c) ? e.c.slice() : [];
  const all = (Array.isArray(e.m) ? e.m.map((i) => q.o[i]) : []).concat(cs);
  if (all.indexOf(w) >= 0) return '이미 추가된 항목이에요';
  cs.push(w); e.c = cs; e.oo = true; if (e.m === 'skip') delete e.m;
  st.sample = false;
  return null;
}

export function toggleOtherOpen(st, L, id) {
  const eo = L.entry(id); const cs0 = eo.c || []; const op = eo.oo === undefined ? cs0.length > 0 : eo.oo; eo.oo = !op;
}

export function removeOther(st, L, id, i) {
  const ec = L.entry(id); const arr = (ec.c || []).slice(); arr.splice(i, 1);
  if (arr.length) ec.c = arr; else delete ec.c;
  st.sample = false;
}

export function toggleCard(st, L, key, j) {
  const en = L.entry('cards'); en.m = en.m || {};
  if (en.m[key] === j) delete en.m[key]; else en.m[key] = j;
  st.sample = false;
}

export function toggleKeyword(st, L, kw) {
  const cur = st.kw === null ? L.keywords().slice() : st.kw.slice(); const p = cur.indexOf(kw);
  if (p >= 0) cur.splice(p, 1);
  else { if (cur.length >= 5) return '키워드는 최대 5개예요'; cur.push(kw); }
  st.kw = cur; st.sample = false;
  return null;
}

export function setNumber(st, L, id, k, value) {
  const en = L.entry(id); const m = (en.m && en.m !== 'skip') ? { ...en.m } : { a: '', b: '' };
  m[k] = value; en.m = m; st.sample = false;
}

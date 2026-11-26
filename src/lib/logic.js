// 카드 계산 로직: 상태(st)를 받아 카드 모델, 키워드, 진행률을 만든다.
import { Q, QM, SECS, AX, POS, NEG } from '../data/questions.js';

export function makeLogic(st) {
function val(id) { var a = st.a[id]; return a ? a.m : undefined; }
function entry(id) { return st.a[id] || (st.a[id] = {}); }
function cardsOf() { var a = st.a.cards; return (a && a.m) || {}; }
function answered(q) {
  if (q.t === 'c') return Object.keys(cardsOf()).length > 0;
  var v = val(q.id), cu = st.a[q.id] && st.a[q.id].c;
  if (q.oth && cu && cu.length) return true;
  if (v === undefined || v === null) return false;
  if (q.t === 'n') return v === 'skip' || !!(v.a || v.b);
  if (Array.isArray(v)) return v.length > 0;
  return true;
}
function condOk(q) { return !q.cond || val(q.cond[0]) === q.cond[1]; }
function incl(q) {
  if (st.soff[q.s] || st.hide[q.id] || q.d > st.cd || !condOk(q) || !answered(q)) return false;
  return val(q.id) !== 'skip' || q.t === 'c';
}
function josa(w, a, b) { var c = w.charCodeAt(w.length - 1); return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0) ? a : b; }
function opts(q) { return q.t === 'f' ? (val('weak') || []).filter(function (i) { return typeof i === 'number'; }).map(function (i) { return QM.weak.o[i]; }) : q.o; }
function vtxt(q, v) {
  if (q.t === 's') return q.o[v];
  if (q.t === 'm') return v.map(function (i) { return q.o[i]; }).join(' · ');
  if (q.t === 'k') return v.map(function (i, n) { return (n + 1) + ' ' + q.o[i]; }).join(' · ');
  if (q.t === 'f') return v.join(' · ');
  if (q.t === 't') return [q.o[0][0], '상황에 따라 달라요', q.o[1][0]][v];
  return String(v);
}
function score(q, v) { if (v === undefined || v === 'skip' || v === null) return null; return [q.o[0][1], 50, q.o[1][1]][v]; }
function avg(a) { var s = 0; a.forEach(function (x) { s += x; }); return s / a.length; }
function range(q, v) {
  var a = String(v.a || '').trim(), b = String(v.b || '').trim();
  if (q.id === 'byear') return a && b ? a + ' – ' + b + q.u : a ? a + q.u + ' 이후' : b + q.u + ' 이전';
  return a && b ? a + ' – ' + b + q.u : a ? a + q.u + ' 이상' : b + q.u + ' 이하';
}
function whyOf(q) { var a = st.a[q.id]; return (q.why && st.cd >= 2 && a && a.w !== undefined && q.why[a.w]) ? q.why[a.w] : ''; }
function axisRow(ax) {
  var me = [], you = [], diff = false, whys = [];
  Q.forEach(function (q) {
    if (q.t !== 't' || q.ax !== ax || !incl(q)) return;
    var a = st.a[q.id], sc = score(q, a.m); if (sc === null) return;
    var wy = whyOf(q); if (wy && whys.indexOf(wy) < 0) whys.push(wy);
    me.push(sc); var y = sc;
    if (a.diff && a.y !== undefined && a.y !== 'skip') { y = score(q, a.y); diff = true; }
    you.push(y);
  });
  if (!me.length) return null;
  return { k: 'axis', label: AX[ax][2], l: AX[ax][0], r: AX[ax][1], me: avg(me), you: diff ? avg(you) : null, why: whys };
}
function prioRow() {
  var c = cardsOf(), g = { must: [], nice: [], deal: [], avoid: [] };
  POS.forEach(function (n, i) { var v = c['p' + i]; if (v === 0) g.must.push(n); else if (v === 1) g.nice.push(n); });
  NEG.forEach(function (n, i) { var v = c['n' + i]; if (v === 0) g.deal.push(n); else if (v === 1) g.avoid.push(n); });
  var groups = [['must', '꼭 필요'], ['nice', '있으면 좋음'], ['deal', '절대 안 됨'], ['avoid', '되도록 피함']]
    .filter(function (x) { return g[x[0]].length; }).map(function (x) { return { c: x[0], n: x[1], items: g[x[0]] }; });
  return groups.length ? { k: 'prio', g: groups } : null;
}
function radarRow() {
  var ax = [], idx = {};
  Q.forEach(function (q) { if (q.t === 'r' && q.rk && incl(q)) { idx[q.id] = ax.length; ax.push({ label: q.rk, v: (val(q.id) - 1) * 25 }); } });
  function adj(tid, minus, plus) {
    var q = QM[tid]; if (!incl(q)) return; var s = score(q, val(tid)); if (s === null) return;
    var d = (s - 50) * 0.2;
    if (idx[minus] !== undefined) ax[idx[minus]].v -= d;
    if (idx[plus] !== undefined) ax[idx[plus]].v += d;
  }
  adj('t19', 'lookw', 'valw'); adj('t20', 'ecow', 'charw');
  if (ax.length < 3) return null;
  ax.forEach(function (a) { a.v = Math.max(4, Math.min(100, a.v)); });
  return { k: 'radar', axes: ax };
}
function rowOf(q) {
  var a = st.a[q.id], v = a.m;
  if (q.oth) { var ps = (Array.isArray(v) ? v.map(function (i) { return q.o[i]; }) : []).concat(a.c || []); return ps.length ? { k: 't', label: q.l, v: ps.join(' · ') } : null; }
  if (q.t === 'r') return { k: 'dots', label: q.l, v: v };
  if (q.t === 'n') return { k: 't', label: q.l, v: range(q, v) };
  if (q.t === 'c') return prioRow();
  var tm = vtxt(q, v), out = { k: 't', label: q.l, v: tm };
  if (q.du && a.diff && a.y !== undefined && a.y !== 'skip') {
    var ty = vtxt(q, a.y); if (ty !== tm) { out.v = '나 ' + tm; out.v2 = '상대 ' + ty; }
  }
  var wy = whyOf(q); if (wy) out.why = wy;
  return out;
}
function model() {
  var out = [];
  SECS.forEach(function (s) {
    if (s.id === 'intro' || st.soff[s.id]) return;
    var rows = [], seen = {};
    Q.forEach(function (q) {
      if (q.s !== s.id || !incl(q)) return;
      if (q.t === 't') { if (seen[q.ax]) return; seen[q.ax] = 1; var r = axisRow(q.ax); if (r) rows.push(r); return; }
      var r2 = rowOf(q); if (r2) rows.push(r2);
    });
    if (s.id === 'prio') { var rd = radarRow(); if (rd) rows.unshift(rd); }
    var note = st.notes[s.id];
    if (st.cd >= 3 && note && note.trim()) rows.push({ k: 't', label: '메모', v: note.trim() });
    if (rows.length) out.push({ id: s.id, t: s.t, x: !!s.x, rows: rows });
  });
  return out;
}
function pick(id) {
  var v = val(id), q = QM[id], a = st.a[id], r = Array.isArray(v) ? v.map(function (i) { return q.o[i]; }) : [];
  return a && Array.isArray(a.c) ? r.concat(a.c) : r;
}
// 키워드: 질문의 선택지를 짧고 흔히 쓰는 말로 바꿔 보여 준다. [표시할 말, 같은 뜻 묶음]
// 같은 묶음(뜻이 겹치는 말)은 한 번에 하나만 키워드가 된다. 목록에 없는 직접 입력 항목은 입력한 그대로 쓴다.
var KWMAP = {
  // 핵심 가치 · 나의 장점 · 내가 줄 수 있는 것
  '신뢰': ['믿음직', 'trust'], '성장': ['자기계발', 'growth'], '안정': ['안정적', 'stable'], '자유': ['자유로움', 'free'], '유머': ['유머 감각', 'humor'],
  '배려': ['다정함', 'kind'], '정직': ['솔직함', 'honest'], '가족': ['가족 우선', 'family'], '열정': ['열정적', 'passion'], '성실': ['성실함', 'diligent'],
  '존중': ['존중', 'respect'], '소통': ['대화가 잘 통함', 'talk'], '자립': ['독립적', 'indep'], '건강': ['건강 챙김', 'health'], '도전': ['도전적', 'challenge'],
  '평온': ['평온함', 'calm'], '책임': ['책임감', 'duty'], '재미': ['재미', 'humor'], '감사': ['감사', 'thanks'],
  '책임감': ['책임감', 'duty'], '솔직함': ['솔직함', 'honest'], '꾸준함': ['꾸준함', 'diligent'], '호기심': ['호기심', 'curious'], '긍정적': ['긍정적', 'positive'],
  '침착함': ['차분함', 'calm'], '공감 능력': ['공감 능력', 'empathy'], '정리 잘함': ['정리 잘함', 'tidy'], '요리 솜씨': ['요리 솜씨', 'cook'], '계획성': ['계획적', 'plan'],
  '추진력': ['추진력', 'drive'], '감사 표현': ['감사 표현', 'thanks'],
  '안정감': ['안정감', 'stable'], '즐거움': ['유쾌함', 'humor'], '경청': ['경청', 'empathy'], '응원': ['응원', 'support'],
  '새로운 경험': ['새로운 경험', 'newexp'], '생활력': ['생활력', 'life'], '따뜻한 말': ['말 예쁘게 함', 'kind'], '정서적 지지': ['든든함', 'support'],
  '맛있는 음식': ['맛집 탐방', 'foodie'], '여행 계획': ['여행 계획', 'travel'], '정보와 아이디어': ['아이디어 제안', 'idea'],
  // 가치 충돌형 질문(축)
  '커리어 중시': ['일 중심', 'work'], '워라밸 중시': ['워라밸', 'work'], '알뜰한 편': ['알뜰함', 'money'], '경험에 투자': ['경험 중시', 'money'],
  '안정 지향': ['안정적', 'stable'], '도전 정신': ['도전적', 'challenge'], '독립적': ['독립적', 'close'], '다정한 밀착형': ['붙어 있기 좋아함', 'close'],
  '직설적': ['솔직한 대화', 'speak'], '배려 깊은 소통': ['말 예쁘게 함', 'kind'], '계획형': ['계획적', 'plan'], '즉흥형': ['즉흥적', 'plan'],
  '둘이 함께': ['둘이 함께', 'together'], '넓은 인간관계': ['넓은 인간관계', 'social'],
  // 생활 · 연애 · 관계
  '아침형': ['아침형', 'rhythm'], '저녁형': ['올빼미', 'rhythm'], '집콕 선호': ['집에서 쉬기', 'weekend'], '여행 좋아함': ['여행 좋아함', 'travel'],
  '꾸준한 운동': ['꾸준한 운동', 'sport'], '운동 같이 하기': ['운동 같이 하기', 'sport'], '반려동물과 함께': ['반려동물 있음', 'pet'], '반려동물 희망': ['반려동물 희망', 'pet'],
  '깔끔한 편': ['깔끔함', 'tidy'], '바로 대화': ['바로 대화', 'conflict'], '차분한 대화': ['차분한 대화', 'conflict'], '글로 정리': ['글로 정리', 'conflict'],
  '자주 연락': ['자주 연락', 'contact'], '연락은 필요할 때': ['연락은 필요할 때', 'contact'], '먼저 다가가는 편': ['먼저 다가감', 'social'], '관찰형': ['낯가림', 'social'],
  '모임 활발': ['모임 활발', 'social'],
  '말로 표현': ['말로 표현', 'love'], '스킨십 표현': ['스킨십', 'love'], '함께하는 시간': ['함께하는 시간', 'together'], '선물로 표현': ['선물', 'love'], '행동으로 챙김': ['챙겨 주기', 'love'],
  '의리': ['의리파', 'loyal'], '깊은 대화': ['깊은 대화', 'talk'], '가벼운 만남': ['가벼운 만남', 'social'], '새로운 사람': ['새로운 사람', 'social'], '오래된 인연': ['오래된 인연', 'loyal'],
  '채식 지향': ['채식 지향', 'diet'], '건강식 위주': ['건강식', 'health'], '집밥 선호': ['집밥', 'diet'], '카페 투어': ['카페 투어', 'cafe'], '야식 좋아함': ['야식', 'diet'], '맵게 잘 먹음': ['매운 음식 잘 먹음', 'diet']
};
// 재미로 쓰는 키워드: 답에서 자동으로 고르지 않고, 원하는 사람이 직접 고르면 카드에 들어간다. (성별 표현 없이 '형'으로 통일)
var EXTRA = ['에겐형', '테토형', '갓생형', 'J형', 'P형', 'T형', 'F형', 'I형', 'E형'];
function extras() { return EXTRA.slice(); }
function kwd(w) { var m = KWMAP[w]; return m ? { w: m[0], k: m[1] } : { w: w, k: 'x:' + w }; }
var KWAX = { work: ['커리어 중시', '워라밸 중시'], money: ['알뜰한 편', '경험에 투자'], risk: ['안정 지향', '도전 정신'], close: ['독립적', '다정한 밀착형'], talk: ['직설적', '배려 깊은 소통'], plan: ['계획형', '즉흥형'], circle: ['둘이 함께', '넓은 인간관계'] };
var KWS = { rhythm: ['아침형', '저녁형'], weekend: ['집콕 선호', '', '여행 좋아함'], exercise: ['꾸준한 운동', '', '운동 같이 하기'], pet: ['반려동물과 함께', '반려동물 희망'], clean: ['깔끔한 편'],
  conflict: ['바로 대화', '차분한 대화', '글로 정리'], contact: ['자주 연락', '', '', '연락은 필요할 때'], party: ['먼저 다가가는 편', '관찰형'], friends: ['모임 활발'] };
var KWG = { rhythm: 'life', weekend: 'life', exercise: 'life', pet: 'life', clean: 'life', conflict: 'love', contact: 'love', party: 'soc', friends: 'soc' };
var AFFK = ['말로 표현', '스킨십 표현', '함께하는 시간', '선물로 표현', '행동으로 챙김'];
var FOODK = ['채식 지향', '건강식 위주', '집밥 선호', '카페 투어', '야식 좋아함', '맵게 잘 먹음'];
function cands() {
  var c = [], v;
  function add(raw, s, g) { var d = kwd(raw); c.push({ w: d.w, k: d.k, s: s, g: g }); }
  if (incl(QM.core)) val('core').forEach(function (i, n) { add(QM.core.o[i], 100 - n * 8, 'core'); });
  ['good', 'give'].forEach(function (id) {
    var q = QM[id], a = st.a[id], s = id === 'good' ? 70 : 55; if (!incl(q)) return;
    (Array.isArray(a.m) ? a.m : []).forEach(function (i) { add(q.o[i], s, id); });
    (a.c || []).forEach(function (w) { add(w, s, id); });
  });
  Object.keys(KWAX).forEach(function (ax) { var r = axisRow(ax); if (!r) return; var d = Math.abs(r.me - 50); if (d >= 25) add(KWAX[ax][r.me < 50 ? 0 : 1], 50 + d * 0.9, 'ax'); });
  Object.keys(KWS).forEach(function (id) { var q = QM[id]; if (!incl(q)) return; v = val(id); var w = typeof v === 'number' ? KWS[id][v] : ''; if (w) add(w, 52, KWG[id]); });
  if (incl(QM.affect) && Array.isArray(val('affect'))) add(AFFK[val('affect')[0]], 52, 'love');
  if (incl(QM.relkw) && Array.isArray(val('relkw'))) add(QM.relkw.o[val('relkw')[0]], 52, 'soc');
  if (incl(QM.food) && Array.isArray(val('food'))) val('food').forEach(function (i) { var w = QM.food.o[i]; if (FOODK.indexOf(w) >= 0) add(w, 50, 'life'); });
  return c;
}
function pool() {
  var seen = {}, out = [];
  cands().sort(function (a, b) { return b.s - a.s; }).forEach(function (x) { if (!seen[x.k] && !seen[x.w]) { seen[x.k] = 1; seen[x.w] = 1; out.push(x); } });
  return out;
}
function autoKw() {
  var p = pool(), cap = { core: 2 }, cnt = {}, out = [];
  p.forEach(function (x) { if (out.length >= 5) return; var k = cap[x.g] || 1; if ((cnt[x.g] || 0) >= k) return; cnt[x.g] = (cnt[x.g] || 0) + 1; out.push(x.w); });
  p.forEach(function (x) { if (out.length < 5 && out.indexOf(x.w) < 0) out.push(x.w); });
  return out;
}
function suggest() { return pool().slice(0, 16).map(function (x) { return x.w; }); }
function keywords() { if (st.kw === null) return autoKw(); var sg = pool().map(function (x) { return x.w; }).concat(EXTRA); var r = st.kw.filter(function (w) { return sg.indexOf(w) >= 0; }); return (!r.length && st.kw.length) ? autoKw() : r; }
function tagline() {
  if (st.tpl === 3) return (st.custom || '').trim();
  var v = pick('core'), g = pick('good'); if (!v.length) return '';
  if (st.tpl === 0) return v[0] + josa(v[0], '을', '를') + ' 가장 중요하게 여기는 사람';
  if (st.tpl === 1) return v.join(' · ');
  return g.length ? '강점은 ' + g[0] + ', 중요한 가치는 ' + v[0] : '';
}
function head() { return { name: (st.name || '').trim(), tag: tagline(), kw: keywords() }; }
function prog(sid) {
  var n = 0, d = 0;
  Q.forEach(function (q) { if (q.s !== sid || q.d > st.qd || !condOk(q)) return; n++; if (answered(q)) d++; });
  return [d, n];
}
  return { extras: extras, entry: entry, val: val, cardsOf: cardsOf, answered: answered, condOk: condOk, incl: incl, opts: opts, model: model, head: head, prog: prog, suggest: suggest, keywords: keywords, tagline: tagline };
}

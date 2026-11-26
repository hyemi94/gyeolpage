import { SECS } from '../data/questions.js';

export const KEY = 'gyeolpage.v2';

export function defaultState() {
  const soff = {};
  SECS.forEach((s) => { if (s.x) soff[s.id] = true; });
  return { cd: 2, qd: 2, sec: 'intro', a: {}, hide: {}, soff, name: '', kw: null, tpl: 0, custom: '', notes: {}, sample: false, preset: '' };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && o.a) return { ...defaultState(), ...o };
    }
  } catch (e) { /* 저장소를 쓸 수 없으면 빈 상태로 시작 */ }
  return null;
}

export function saveState(st) {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 무시 */ }
}

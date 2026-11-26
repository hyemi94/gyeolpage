// 카드를 여러 페이지 캔버스로 그려 PNG(ZIP) 또는 PDF 파일로 저장한다.

var BRAND = '"Gibbem"';
var SERIF = '"Noto Serif KR","Apple SD Gothic Neo",serif', SANS = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
var C = { ink: '#231C18', mu: '#6B6058', ac: '#BE372B', ln: '#E1D9D1', tr: '#E9E2DB', te: '#2E7D4F', hd: '#231C18' };
var PW = 1080, PH = 1528, PADX = 64, TOP = 64, BOT = 84;
function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); }
function wrapTxt(c, text, maxW) {
  var out = [];
  String(text).split('\n').forEach(function (p) { var line = '';
    Array.from(p).forEach(function (ch) { var t = line + ch; if (c.measureText(t).width > maxW && line) { out.push(line); line = ch; } else line = t; });
    out.push(line); });
  return out;
}
// 글꼴이 서로 다른 글자를 이어서 그린다. parts: [[글자, 글꼴], ...]
function mixed(c, parts, x, y, align) {
  var total = 0, i; for (i = 0; i < parts.length; i++) { c.font = parts[i][1]; total += c.measureText(parts[i][0]).width; }
  var sx = align === 'center' ? x - total / 2 : x; c.textAlign = 'left';
  for (i = 0; i < parts.length; i++) { c.font = parts[i][1]; c.fillText(parts[i][0], sx, y); if (parts[i][1].indexOf('Gibbem') >= 0) { c.save(); c.strokeStyle = c.fillStyle; c.lineWidth = 1.4; c.lineJoin = 'round'; c.strokeText(parts[i][0], sx, y); c.restore(); } sx += c.measureText(parts[i][0]).width; }
}
function layoutPages(m, hd, sample, art) {
  var pages = [], c, y, W = PW, P = PADX;
  function newPage() {
    var cv = document.createElement('canvas'); cv.width = W; cv.height = PH; c = cv.getContext('2d');
    c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, PH); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; pages.push(cv); y = TOP;
  }
  function need(h) { if (y + h > PH - BOT && y > TOP + 1) { newPage(); return true; } return false; }
  var curT = '';
  function need2(h) { if (!need(h)) return false; c.fillStyle = C.ac; c.font = '700 22px ' + SANS; c.fillText(curT + ' · 이어서', P, y + 22); y += 46; return true; }
  newPage();
  c.font = '700 44px ' + SERIF; var hl = wrapTxt(c, hd.tag || '나의 기준', W - 2 * P - (art ? 170 : 0));
  c.font = '500 24px ' + SANS;
  var chips = [], cx = P, row = 0;
  hd.kw.forEach(function (t) { var w = c.measureText('#' + t).width + 32; if (cx + w > W - P && cx > P) { cx = P; row++; } chips.push({ t: '#' + t, x: cx, row: row, w: w }); cx += w + 10; });
  var headH = P + 24 + hl.length * 60 + 40 + (chips.length ? (row + 1) * 50 + 12 : 0) + 24;
  c.fillStyle = C.hd; c.fillRect(0, 0, W, headH);
  if (art && art.mark) c.drawImage(art.mark, P, P - 22, 55, 48);
  if (art) { drawArt(c, art.big, W - P - 118, 26, 118, -8); drawArt(c, art.small, W - P - 24, 98, 62, 12); }
  c.fillStyle = 'rgba(247,242,238,0.7)'; c.font = '500 22px ' + SANS; mixed(c, hd.name ? [[hd.name + (sample ? ' · 예시' : ''), '500 22px ' + SANS]] : [['결 페이지', '40px ' + BRAND + ',' + SANS], [sample ? ' · 예시' : '', '500 22px ' + SANS]], art && art.mark ? P + 68 : P, P + 14, 'left');
  c.fillStyle = '#F7F2EE'; c.font = '700 44px ' + SERIF;
  hl.forEach(function (l, i) { c.fillText(l, P, P + 24 + 44 + i * 60 + 8); });
  var cy0 = P + 24 + hl.length * 60 + 28;
  chips.forEach(function (k) { c.fillStyle = C.ac; rr(c, k.x, cy0 + k.row * 50, k.w, 40, 20); c.fillStyle = '#FFFFFF'; c.font = '500 24px ' + SANS; c.fillText(k.t, k.x + 16, cy0 + k.row * 50 + 28); });
  y = headH + 10;
  var hasYou = false; m.forEach(function (s) { s.rows.forEach(function (r) { if (r.k === 'axis' && r.you !== null) hasYou = true; }); });
  if (hasYou) { y += 34; c.fillStyle = C.mu; c.font = '400 21px ' + SANS; c.fillText('● 나    ○ 상대에게 바라는 것', P, y); y += 6; }
  m.forEach(function (s) {
    need(150); curT = s.t; y += 34; c.fillStyle = C.ac; c.font = '700 22px ' + SANS; c.fillText(s.t, P, y + 22); y += 46;
    var first = true;
    s.rows.forEach(function (r) {
      if (r.k === 'radar') {
        need2(450); var n = r.axes.length, mx = W / 2, my = y + 215, R = 150;
        var pt = function (i, rad) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [mx + rad * Math.cos(a), my + rad * Math.sin(a)]; };
        c.strokeStyle = C.ln; c.lineWidth = 1.5;
        [0.33, 0.66, 1].forEach(function (k) { c.beginPath(); r.axes.forEach(function (_, i) { var p = pt(i, R * k); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.stroke(); });
        r.axes.forEach(function (_, i) { var p = pt(i, R); c.beginPath(); c.moveTo(mx, my); c.lineTo(p[0], p[1]); c.stroke(); });
        c.beginPath(); r.axes.forEach(function (a, i) { var p = pt(i, R * a.v / 100); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath();
        c.fillStyle = 'rgba(190,55,43,0.22)'; c.fill(); c.strokeStyle = C.ac; c.lineWidth = 3; c.stroke();
        c.fillStyle = C.ink; c.font = '500 24px ' + SANS; c.textAlign = 'center';
        r.axes.forEach(function (a, i) { var p = pt(i, R + 36); c.fillText(a.label, p[0], p[1] + 8); });
        c.textAlign = 'left'; y += 440; first = true;
      } else if (r.k === 'prio') {
        var cl = { must: C.ac, nice: C.te, deal: C.ink, avoid: C.mu };
        r.g.forEach(function (g) {
          c.font = '400 26px ' + SANS; var ls = wrapTxt(c, g.items.join(' · '), W - 2 * P - 28), h = 40 + ls.length * 38;
          need2(h + 16);
          c.fillStyle = cl[g.c]; c.fillRect(P, y, 5, h);
          c.fillStyle = C.mu; c.font = '500 20px ' + SANS; c.fillText(g.n, P + 22, y + 24);
          c.fillStyle = C.ink; c.font = '400 26px ' + SANS; ls.forEach(function (l, i) { c.fillText(l, P + 22, y + 54 + i * 38); });
          y += h + 16; });
        first = true;
      } else if (r.k === 'axis') {
        c.font = '400 21px ' + SANS; var wl = r.why && r.why.length ? wrapTxt(c, '이유: ' + r.why.join(' · '), W - 2 * P) : [], wx = wl.length ? wl.length * 30 + 8 : 0;
        need2(96 + wx);
        c.fillStyle = C.ink; c.font = '500 26px ' + SANS; c.fillText(r.label, P, y + 26);
        c.fillStyle = C.mu; c.font = '400 21px ' + SANS; c.fillText(r.l, P, y + 66); c.textAlign = 'right'; c.fillText(r.r, W - P, y + 66); c.textAlign = 'left';
        var tx = P + 124, tw = W - 2 * P - 248;
        c.fillStyle = C.tr; rr(c, tx, y + 56, tw, 8, 4);
        if (r.you !== null) { c.fillStyle = '#FFFFFF'; c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.arc(tx + tw * r.you / 100, y + 60, 11, 0, 6.2832); c.fill(); c.stroke(); }
        c.fillStyle = C.ac; c.beginPath(); c.arc(tx + tw * r.me / 100, y + 60, 12, 0, 6.2832); c.fill();
        c.fillStyle = C.mu; c.font = '400 21px ' + SANS; wl.forEach(function (l, i) { c.fillText(l, P, y + 100 + i * 30); });
        y += 92 + wx; first = true;
      } else {
        c.font = '400 23px ' + SANS; var lb = wrapTxt(c, r.label, r.k === 'dots' ? 700 : 210);
        c.font = '400 26px ' + SANS;
        var vs = r.k === 'dots' ? [] : wrapTxt(c, r.v + (r.v2 ? '\n' + r.v2 : ''), W - 2 * P - 240);
        c.font = '400 21px ' + SANS; var wy = r.why ? wrapTxt(c, '이유: ' + r.why, W - 2 * P - 240) : [];
        var h2 = Math.max(1, vs.length, lb.length) * 38 + (wy.length ? wy.length * 30 + 6 : 0) + 18;
        if (need2(h2 + 6)) first = true;
        if (!first) { c.fillStyle = C.ln; c.fillRect(P, y, W - 2 * P, 1.5); } first = false;
        c.fillStyle = C.mu; c.font = '400 23px ' + SANS; lb.forEach(function (l, i) { c.fillText(l, P, y + 36 + i * 32); });
        if (r.k === 'dots') { for (var i = 1; i <= 5; i++) { c.fillStyle = i <= r.v ? C.ac : C.tr; c.beginPath(); c.arc(W - P - 140 + (i - 1) * 30 + 10, y + 28, 9, 0, 6.2832); c.fill(); } }
        else { c.fillStyle = C.ink; c.font = '400 26px ' + SANS; vs.forEach(function (l, i) { c.fillText(l, P + 240, y + 36 + i * 38); }); }
        if (wy.length) { c.fillStyle = C.mu; c.font = '400 21px ' + SANS; var wb = y + 36 + (Math.max(1, vs.length) - 1) * 38 + 34; wy.forEach(function (l, i) { c.fillText(l, P + 240, wb + i * 30); }); }
        y += h2 + 6;
      }
    });
  });
  need(70); y += 40; c.fillStyle = C.mu; c.font = '400 20px ' + SANS; c.textAlign = 'center'; mixed(c, [['결 페이지', '36px ' + BRAND + ',' + SANS], ['로 정리했어요', '400 20px ' + SANS]], W / 2, y, 'center');
  var endY = y + 30;
  if (pages.length > 1) pages.forEach(function (cv, i) { var g = cv.getContext('2d'); g.fillStyle = C.mu; g.font = '400 20px ' + SANS; mixed(g, [hd.name ? [hd.name, '400 20px ' + SANS] : ['결 페이지', '34px ' + BRAND + ',' + SANS], ['  ·  ' + (i + 1) + ' / ' + pages.length, '400 20px ' + SANS]], PW / 2, PH - 36, 'center'); });
  return { pages: pages, endY: endY };
}
function symbolSvg(color) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200.0 175.4" width="400" height="350"><path fill="' + color + '" fill-rule="evenodd" d="M162.8 52.3 L158.4 52.2 L154.2 53.4 L147.6 56.3 L141.3 59.9 L127.7 69.7 L107.0 86.7 L103.6 90.2 L101.7 93.7 L100.2 99.5 L100.1 132.1 L100.5 138.1 L101.8 138.3 L105.1 136.6 L111.1 134.3 L118.8 130.5 L126.6 127.5 L134.4 123.8 L145.2 119.6 L152.9 116.1 L161.4 113.0 L163.2 111.9 L163.6 107.6 L163.6 53.4ZM168.3 4.8 L160.2 1.8 L149.4 0.0 L142.9 0.1 L138.3 0.7 L129.1 2.9 L120.7 6.8 L116.0 9.7 L111.7 13.0 L100.7 23.5 L92.3 32.6 L91.5 32.4 L84.5 25.2 L78.5 20.5 L72.0 16.6 L67.4 14.6 L59.2 12.5 L53.9 11.7 L47.3 11.7 L37.9 13.6 L32.2 15.5 L28.1 17.6 L23.7 20.3 L19.1 24.0 L15.4 27.7 L10.8 33.3 L5.8 42.0 L2.9 49.4 L0.8 57.7 L0.0 65.0 L0.0 71.7 L0.8 78.5 L3.0 86.9 L5.7 93.7 L9.6 101.0 L13.8 106.9 L19.2 113.0 L54.0 144.9 L77.8 166.2 L88.6 175.3 L89.6 175.4 L90.1 175.1 L90.3 172.8 L90.1 146.6 L85.1 141.6 L38.1 98.8 L33.8 94.3 L31.0 90.6 L28.2 85.8 L25.9 80.6 L24.3 75.1 L23.8 71.3 L24.2 61.9 L25.2 58.0 L26.9 53.5 L28.9 49.8 L31.7 45.9 L34.5 43.1 L37.7 40.8 L41.6 38.7 L46.2 37.3 L49.0 36.9 L54.8 37.0 L58.2 37.8 L62.8 39.5 L66.6 41.5 L69.4 43.6 L89.7 64.5 L91.2 65.6 L92.4 65.7 L93.1 65.4 L113.3 44.6 L125.7 32.6 L130.5 29.1 L136.8 26.3 L139.6 25.4 L143.7 24.8 L148.9 24.8 L155.4 26.2 L159.9 28.1 L163.2 30.1 L166.5 33.1 L170.2 37.7 L173.8 45.2 L174.7 47.7 L176.0 55.1 L175.9 116.0 L174.6 116.9 L151.9 125.9 L123.0 138.3 L102.7 146.4 L101.3 147.2 L100.2 149.0 L100.1 169.1 L100.4 173.1 L101.1 173.7 L101.8 173.6 L191.2 131.2 L193.9 129.4 L196.6 127.0 L199.0 123.2 L200.0 119.9 L200.0 55.9 L199.3 48.5 L197.2 39.5 L195.2 33.4 L192.4 27.8 L189.3 23.0 L185.6 18.0 L178.0 10.9 L173.6 7.9Z"/></svg>';
}
// 크레파스 느낌 하트: 화면의 CrayonHeart와 같은 SVG를 이미지로 만들어 캔버스에 그린다.
var HEART = 'M50 85 C22 64 5 48 6 29 C7 14 18 5 31 7 C40 8 46 13 50 21 C54 12 62 6 71 6 C85 6 95 16 94 30 C93 48 77 63 50 85 Z';
var SCRIBBLE = 'M2 16 L98 6 L4 26 L99 19 L6 38 L98 31 L8 50 L96 43 L14 62 L90 55 L24 72 L80 67 L36 82 L66 80';
function heartSvg(color, id) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 92" width="400" height="368"><defs>' +
    '<filter id="f' + id + '" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="warp"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="warp" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="rough"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.55 0.09" numOctaves="3" seed="9" result="grain"/>' +
    '<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.5 0 0 0 -1.15" result="wax"/>' +
    '<feComposite in="rough" in2="wax" operator="in"/></filter><clipPath id="c' + id + '"><path d="' + HEART + '"/></clipPath></defs>' +
    '<g filter="url(#f' + id + ')"><g clip-path="url(#c' + id + ')">' +
    '<path d="' + SCRIBBLE + '" fill="none" stroke="' + color + '" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + SCRIBBLE + '" fill="none" stroke="' + color + '" stroke-opacity="0.7" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 5)"/></g>' +
    '<path d="' + HEART + '" fill="none" stroke="' + color + '" stroke-width="4.5" stroke-linejoin="round"/></g></svg>';
}
function loadSvg(svg) {
  return new Promise(function (res) {
    var img = new Image(); var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = function () { URL.revokeObjectURL(url); res(img); }; img.onerror = function () { URL.revokeObjectURL(url); res(null); }; img.src = url;
  });
}
function drawArt(c, img, x, y, w, deg) {
  if (!img) return; var h = w * 0.92; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(deg * Math.PI / 180); c.drawImage(img, -w / 2, -h / 2, w, h); c.restore();
}
export async function makePages(m, hd, sample) {
  try { await Promise.all([document.fonts.load('700 28px "Noto Serif KR"'), document.fonts.load('40px "Gibbem"', '결 페이지'), document.fonts.load('400 24px "Noto Sans KR"'), document.fonts.load('500 24px "Noto Sans KR"')]); } catch (e) {}
  var big = await loadSvg(heartSvg('#F0897B', 'a')), small = await loadSvg(heartSvg('#F2A79A', 'b'));
  var mark = await loadSvg(symbolSvg('#F0897B'));
  return layoutPages(m, hd, sample, big && small ? { big: big, small: small, mark: mark } : null);
}
function toBlob(cv, type, q) { return new Promise(function (res) { cv.toBlob(res, type, q); }); }
async function bytesOf(cv, type, q) { var b = await toBlob(cv, type, q); return new Uint8Array(await b.arrayBuffer()); }
function p10(n) { return ('0000000000' + n).slice(-10); }
export function makePdf(jpgs, iw, ih) {
  var enc = new TextEncoder(), parts = [], offs = [], len = 0, pw = 595, ph = Math.round(pw * ih / iw), n = jpgs.length, i;
  function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
  add('%PDF-1.4\n');
  offs[1] = len; add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  var kids = []; for (i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
  offs[2] = len; add('2 0 obj\n<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>\nendobj\n');
  for (i = 0; i < n; i++) {
    var pg = 3 + i * 3, ct = pg + 1, im = pg + 2, cs = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im' + i + ' Do Q';
    offs[pg] = len; add(pg + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Contents ' + ct + ' 0 R /Resources << /XObject << /Im' + i + ' ' + im + ' 0 R >> >> >>\nendobj\n');
    offs[ct] = len; add(ct + ' 0 obj\n<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream\nendobj\n');
    offs[im] = len; add(im + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + iw + ' /Height ' + ih + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpgs[i].length + ' >>\nstream\n');
    add(jpgs[i]); add('\nendstream\nendobj\n');
  }
  var total = 3 * n + 3, xr = len; add('xref\n0 ' + total + '\n0000000000 65535 f \n');
  for (var k = 1; k < total; k++) add(p10(offs[k]) + ' 00000 n \n');
  add('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF');
  return new Blob(parts, { type: 'application/pdf' });
}
var crcT = null;
function crc32(u) {
  if (!crcT) { crcT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } }
  var crc = -1; for (var i = 0; i < u.length; i++) crc = crcT[(crc ^ u[i]) & 255] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}
export function makeZip(files) {
  var enc = new TextEncoder(), parts = [], cd = [], off = 0;
  function u16(v) { return [v & 255, (v >>> 8) & 255]; }
  function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
  files.forEach(function (f) {
    var nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    var lh = new Uint8Array([0x50, 0x4b, 3, 4].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0)));
    parts.push(lh, nm, f.data);
    cd.push(new Uint8Array([0x50, 0x4b, 1, 2].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), nm);
    off += lh.length + nm.length + sz;
  });
  var cdLen = 0; cd.forEach(function (b) { cdLen += b.length; });
  var end = new Uint8Array([0x50, 0x4b, 5, 6].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(cdLen), u32(off), u16(0)));
  return new Blob(parts.concat(cd, [end]), { type: 'application/zip' });
}

// 일반 브라우저에서는 다운로드 링크로 저장하고, 링크 다운로드가 막힌 미리보기 화면(claude.ai)에서는 그쪽의 저장 기능을 쓴다.
async function saveBlob(blob, filename) {
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) { await dl.save({ filename, data: blob }); return; }
  } catch (e) { if (e && e.code === 'declined') return; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// kind: 'png' | 'pdf'. 파일을 만들어 브라우저 다운로드로 저장하고 {pages, kind}를 돌려준다.
export async function exportCard(kind, { model, head, sample, name }) {
  const L = await makePages(model, head, sample);
  const n = L.pages.length; const base = ((name || '').trim() || '결페이지').replace(/[\\/:*?"<>|]/g, '_');
  let data; let file; let i;
  if (kind === 'png') {
    if (n === 1) {
      const cr = document.createElement('canvas'); cr.width = PW; cr.height = Math.min(PH, Math.ceil(L.endY) + 20); cr.getContext('2d').drawImage(L.pages[0], 0, 0);
      data = await toBlob(cr, 'image/png'); file = base + '.png';
    } else {
      const files = []; for (i = 0; i < n; i++) files.push({ name: base + '_' + (i + 1) + '.png', data: await bytesOf(L.pages[i], 'image/png') });
      data = makeZip(files); file = base + '.zip';
    }
  } else {
    const js = []; for (i = 0; i < n; i++) js.push(await bytesOf(L.pages[i], 'image/jpeg', 0.92));
    data = makePdf(js, PW, PH); file = base + '.pdf';
  }
  await saveBlob(data, file);
  return { pages: n, kind, file };
}

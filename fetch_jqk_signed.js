// 韭圈儿大盘恐贪指数：fadrefa 签名 + AES-256-CBC 解密（crypto-js，与 app.fear.js 逆向逐字段核对）
// 用法: JQK_TOKEN="xxx" node fetch_jqk_signed.js
//
// 签名：调用从源码抽出的真实 b 函数（32 子串 -> 32 混淆字段），不再手填映射。
// 解密：A 函数 = O.AES.decrypt(ct, H.e(), {iv:H.a(),mode:CBC,padding:Pkcs7})，
//       其中 w 模块两个 override: enc.Utf8.parse 追加 "1"、AES.decrypt 的 key/iv 追加 "ll"。
//       实测有效 key = UTF8(H.e()+"ll"+"1")、iv = UTF8(H.a()+"ll"+"1")（H.e()/H.a() 即 v.b/v.a 常量）。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CryptoJS = require('./vendor/crypto-js/index.js');

const SALT = 'EWf45rlv#kfsr@k#gfksgkr';
const VERSION = '2.2.7';
const BASE = 'https://api.jiucaishuo.com';
const KEY_BASE = 'eveqocftukbotqjcequcnkrqlw1oi'; // H.e()
const IV_BASE = 'bvroqevdjqibsdkq';               // H.a()

// ---- 真实 b 函数（app.fear.js @26941 逐字）----
function realB(t, e, n, a, i, o, r, u, l, c, s, d, _, f, h, p, m, g, v, y, b, k, w, x, j, P, z, q, E, H, O, A, C) {
  t.data.tirgkjfs = f; t.data.abiokytke = _; t.data.u54rg5d = e; t.data.kf54ge7 = q;
  t.data.tiklsktr4 = d; t.data.lksytkjh = P; t.data.sbnoywr = z; t.data.bgd7h8tyu54 = w;
  t.data.y654b5fs3tr = O; t.data.bioduytlw = n; t.data.bd4uy742 = j; t.data.h67456y = r;
  t.data.bvytikwqjk = s; t.data.ngd4uy551 = b; t.data.bgiuytkw = v; t.data.nd354uy4752 = g;
  t.data.ghtoiutkmlg = x; t.data.bd24y6421f = a; t.data.tbvdiuytk = u; t.data.ibvytiqjek = p;
  t.data.jnhf8u5231 = C; t.data.fjlkatj = A; t.data.hy5641d321t = E; t.data.iogojti = o;
  t.data.ngd4yut78 = i; t.data.nkjhrew = c; t.data.yt447e13f = H; t.data.n3bf4uj7y7 = k;
  t.data.nbf4uj7y432 = h; t.data.yi854tew = l; t.data.h13ey474 = m; t.data.quikgdky = y;
}

const md5 = (o) => crypto.createHash('md5').update(String(o), 'utf8').digest('hex');

function sign(data) {
  data.type = 'pc'; data.version = VERSION; data.act_time = +new Date();
  const keys = Object.keys(data).sort();
  let o = '';
  for (const r of keys) {
    let val = data[r];
    if (val == null) { data[r] = ''; val = ''; }
    if ((!val && val !== 0) || typeof val === 'object') continue;
    o += String(val);
  }
  o += SALT;
  const u = md5(o);
  const c = u.substr(29, 2), d = u.substr(2, 2), f = u.substr(5, 1), h = u.substr(26, 1),
    m = u.substr(6, 2), v = u.substr(1, 1), y = u.substr(0, 2), k = u.substr(6, 2),
    w = u.substr(8, 1), x = u.substr(30, 1), j = u.substr(11, 3), P = u.substr(11, 1),
    z = u.substr(2, 3), q = u.substr(9, 2), E = u.substr(23, 2), H = u.substr(31, 1),
    O = u.substr(25, 2), A = u.substr(9, 2), C = u.substr(27, 2), T = u.substr(17, 2),
    I = u.substr(26, 1), U = u.substr(12, 2), S = u.substr(25, 1), R = u.substr(16, 3),
    F = u.substr(17, 4), B = u.substr(18, 1), K = u.substr(21, 2), D = u.substr(14, 2),
    dollar = u.substr(29, 3), N = u.substr(21, 2), V = u.substr(24, 2), L = u.substr(16, 1);
  realB({ data }, d, f, V, U, S, R, L, c, h, m, v, N, y, K, D, dollar, x, A, C, T, B, k, j, I, F, E, H, O, w, P, z, q);
  return data;
}

// ---- crypto-js 含 w 模块的两个 override ----
const _parse = CryptoJS.enc.Utf8.parse.bind(CryptoJS.enc.Utf8);
CryptoJS.enc.Utf8.parse = (t) => _parse(t + '1');
const _decrypt = CryptoJS.AES.decrypt.bind(CryptoJS.AES);
CryptoJS.AES.decrypt = (t, e, n) => { e = CryptoJS.enc.Utf8.parse(e + 'll'); n.iv = CryptoJS.enc.Utf8.parse(n.iv + 'll'); return _decrypt(t, e, n); };

// 真实 A 函数（app.fear.js 逐字）
function decrypt(t, H, O) {
  try {
    const e = { iv: H.a(), mode: O.mode.CBC, padding: O.pad.Pkcs7 }, n = H.e();
    return JSON.parse(O.AES.decrypt(t, n, e).toString(O.enc.Utf8));
  } catch (t) { return null; }
}

const COMP_IDS = [1, 2, 3, 4, 5, 6];
const H = { e: () => KEY_BASE, a: () => IV_BASE };
async function postSigned(path_, extra, token) {
  const data = Object.assign({ authtoken: token }, extra || {});
  sign(data);
  const r = await fetch(BASE + path_, {
    method: 'POST',
    headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const j = await r.json();
  const ct = (typeof j === 'string') ? j : (j && j.data);
  if (!ct) throw new Error('empty ciphertext @' + path_ + ': ' + JSON.stringify(j).slice(0, 120));
  const obj = decrypt(ct, H, CryptoJS);
  if (!obj) throw new Error('decrypt fail @' + path_);
  return obj;
}

(async () => {
  const token = process.env.JQK_TOKEN || '';
  if (!token) { console.log('缺少 JQK_TOKEN 环境变量'); process.exit(2); }

  // 1) 主指数
  const base = await postSigned('/v2/kjtl/getbasedata', {}, token);
  const bd = base.data || base;
  const main = {
    value: (typeof bd.num === 'number') ? bd.num : null,
    status: bd.status_str || null,
    date: bd.current_time || null
  };

  // 2) 成分短名（getalltypes 明文）
  const labels = {};
  try {
    const ra = await fetch(BASE + '/v2/kjtl/getalltypes', {
      method: 'POST',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' },
      body: JSON.stringify({ authtoken: token })
    });
    const ja = await ra.json();
    (ja.data || []).forEach((x) => { if (x && x.id != null) labels[x.id] = (x.name || '').split('：')[0] || x.name; });
  } catch (e) { /* labels 缺失不致命 */ }

  // 3) 逐成分取值
  const components = [];
  for (const id of COMP_IDS) {
    try {
      const li = await postSigned('/v2/kjtl/getlist', { id }, token);
      const d = li.data || li;
      const ser = d.canvas_data && d.canvas_data.series && d.canvas_data.series[0] && d.canvas_data.series[0].data;
      const last = Array.isArray(ser) && ser.length ? ser[ser.length - 1] : null;
      const val = Array.isArray(last) ? last[1] : (typeof last === 'number' ? last : null);
      components.push({
        id,
        name: labels[id] || (d.title ? d.title.split('：')[0] : ('成分' + id)),
        full: d.title || null,
        value: (typeof val === 'number') ? val : null,
        unit: (d.canvas_data && d.canvas_data.y_company) || '',
        status: d.status_name || null,
        color: d.status_color || null
      });
    } catch (e) { console.log('  [成分 ' + id + ' 失败]', e.message); }
  }

  // 4) 校验：主指数必须有值，否则视为失败（让 Actions 变红而不是假装成功）
  if (typeof main.value !== 'number') {
    console.error('!!! 主指数缺失，拒绝写入 jqk.json（保留上一次的值）');
    process.exit(1);
  }
  if (!components.length) {
    console.error('!!! 6 大成分全部拉取失败，拒绝写入');
    process.exit(1);
  }

  const out = { main, components, updatedAt: new Date().toISOString(), source: 'jiucaishuo kjtl' };
  fs.writeFileSync(path.join(__dirname, 'jqk.json'), JSON.stringify(out, null, 2));
  console.log('>>> 已写入 jqk.json');
  console.log('main:', JSON.stringify(main));
  console.log('components(' + components.length + '):');
  components.forEach((c) => console.log('  ', c.id, c.name, '=', c.value, c.unit, '|', c.status));
  console.log('>>> DONE');
})().catch((e) => { console.error('RUN ERR', e.message); console.error(e.stack); process.exit(1); });

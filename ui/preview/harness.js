// 浏览器预览/自测运行时：
// - 真实页面 JS 交互（wx mock 渲染原生风格 Modal/ActionSheet/Toast）
// - WXML/WXSS 运行时渲染（覆盖本工程用到的子集）
// - ?s= 场景脚本：click:<selector> / input:<selector>|<value> / scroll:<px>
// - ?fav=person:su-shi,event:xinhai-1911&foot=... 预置收藏/足迹（截图用）

(function () {
  'use strict';

  var SRC = window.__SRC;
  var CACHE = {};
  var PAGE_CFG = {};

  window.Page = function (file, cfg) {
    PAGE_CFG[file] = cfg;
    return cfg;
  };
  window.App = window.Page;

  // ---------------------------------------------------------------------------
  // tiny CommonJS
  // ---------------------------------------------------------------------------

  function resolvePath(rel, fromFile) {
    if (rel.indexOf('.') !== 0) return rel;
    var base = fromFile.split('/');
    base.pop(); // 目录段 ['','pages','home']
    var segs = rel.split('/');
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (s === '.' || s === '') continue;
      if (s === '..') { if (base.length > 1 || base[0] !== '') base.pop(); }
      else base.push(s);
    }
    var joined = base.join('/'); // 首空段自带斜杠：['','data','x.js'] → '/data/x.js'
    return joined.charAt(0) === '/' ? joined : '/' + joined;
  }

  function req(rel, fromFile) {
    var full = resolvePath(rel, fromFile);
    if (CACHE[full]) return CACHE[full].exports;
    var mod = { exports: {} };
    CACHE[full] = mod;
    SRC[full](function (r) { return req(r, full); }, mod, mod.exports);
    return mod.exports;
  }

  // ---------------------------------------------------------------------------
  // wx mock（UI 版）
  // ---------------------------------------------------------------------------

  var navStack = [];
  var CURRENT;
  var OVERLAY_ROOT;

  function pathOf(name) { return '/pages/' + name + '/' + name; }
  function parseQuery(q) {
    var out = {};
    (q || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = i < 0 ? kv : kv.slice(0, i);
      var v = i < 0 ? '' : kv.slice(i + 1);
      try { out[k] = decodeURIComponent(v); } catch (e) { out[k] = v; }
    });
    return out;
  }
  function targetPage(url) {
    var m = /^\/pages\/([\w-]+)\/([\w-]+)\??(.*)$/.exec(url);
    return m ? { name: m[1], query: parseQuery(m[3] || '') } : null;
  }

  var storage = {};
  var wx = {
    setStorageSync: function (k, v) { storage[k] = v; },
    getStorageSync: function (k) { return k in storage ? storage[k] : ''; },
    removeStorageSync: function (k) { delete storage[k]; },
    clearStorageSync: function () { storage = {}; },
    showToast: function (o) { drawToast((o && o.title) || ''); },
    showModal: function (o) { drawModal(o); },
    showActionSheet: function (o) { drawSheet(o); },
    showLoading: function () {},
    hideLoading: function () {},
    // 60s「历史上的今天」返回样例载荷；其余请求（jsDelivr）走离线失败 → 回退种子
    request: function (o) {
      if (o && o.url && o.url.indexOf('today_in_history') >= 0 && o.success) {
        o.success({
          data: {
            code: 200,
            data: {
              items: [
                { title: '武昌起义爆发', year: '1911', description: '湖北新军工程营枪响，辛亥革命由此揭幕。', event_type: 'event', link: '' },
                { title: '鲁迅逝世', year: '1936', description: '中国现代文学的奠基人在上海病逝。', event_type: 'death', link: '' },
                { title: '陈独秀逝世', year: '1942', description: '', event_type: 'death', link: '' },
                { title: '茅盾诞辰', year: '1896', description: '原名沈德鸿，字雁冰，浙江桐乡人。', event_type: 'birth', link: '' },
                { title: '辛亥革命元勋黄兴病逝', year: '1916', description: '', event_type: 'death', link: '' },
                { title: '护国战争爆发', year: '1915', description: '蔡锷、唐继尧等在云南起兵讨袁。', event_type: 'event', link: '' }
              ]
            }
          }
        });
        return;
      }
      if (o && o.fail) o.fail(new Error('offline'));
    },
    navigateTo: function (o) {
      var t = targetPage(o.url);
      openPage(t.name, t.query, 'push');
      if (CURRENT && CURRENT.onShow) CURRENT.onShow();
      if (o.success) o.success({});
    },
    redirectTo: function (o) {
      var t = targetPage(o.url);
      openPage(t.name, t.query, 'replace');
      if (o.success) o.success({});
    },
    navigateBack: function (o) {
      if (navStack.length > 1) {
        navStack.pop();
        CURRENT = navStack[navStack.length - 1].inst;
        renderPage(CURRENT);
        if (o.success) o.success({});
      } else if (o.fail) {
        o.fail(new Error('no page to back'));
      }
    },
    switchTab: function (o) {
      var t = targetPage(o.url);
      navStack = [];
      openPage(t.name, {}, 'push');
      if (CURRENT && CURRENT.onShow) CURRENT.onShow();
      if (o.success) o.success({});
    }
  };
  window.wx = wx;

  // ---------------------------------------------------------------------------
  // 底部 tab（custom-tab-bar 组件的可视外壳：web 预览里按当前 hash 高亮）
  // ---------------------------------------------------------------------------

  var TAB_KEYS = ['home', 'timeline', 'discover', 'profile'];

  function ensureTabShell() {
    var el = document.getElementById('tabshell');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tabshell';
      el.className = 'tabbar';
      TAB_KEYS.forEach(function (key) {
        var t = document.createElement('div');
        t.className = 'tab';
        t.dataset.key = key;
        var icon = document.createElement('img');
        icon.className = 'tab-icon';
        icon.src = '../../miniprogram/assets/icons/' +
          key + (key === 'home' ? '-active.png' : '.png');
        var label = document.createElement('span');
        label.textContent = {
          home: '首页', timeline: '时间轴', discover: '发现', profile: '我的'
        }[key];
        t.appendChild(icon);
        t.appendChild(label);
        t.addEventListener('click', function () {
          if (location.hash.indexOf(key) !== 1) location.hash = key + '?shot=' +
            (document.body.classList.contains('shot') ? '1' : '');
        });
        el.appendChild(t);
      });
      // 挂到 #phone：shot 模式下 phone 有 transform，fixed 会以它为包含块，
      // tabbar 与页面底部/安全区一致（旧版页面内自绘 tabbar 同理）
      var host = document.getElementById('phone') || document.body;
      host.appendChild(el);
    }
    var pageNo = location.hash.replace(/^#/, '').split('?')[0];
    TAB_KEYS.forEach(function (key) {
      el.querySelectorAll('.tab').forEach(function (tab) {
        tab.classList.toggle('active', tab.dataset.key === pageNo);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 页面
  // ---------------------------------------------------------------------------

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function instantiate(name) {
    var modPath = pathOf(name) + '.js';
    req(modPath, modPath);
    var cfg = PAGE_CFG['project://' + modPath.slice(1)];
    var inst = { name: name, cfg: cfg, data: deepClone(cfg.data || {}) };
    inst.setData = function (patch, cb) {
      for (var k in patch) inst.data[k] = patch[k];
      renderPage(inst);
      if (cb) cb();
    };
    // 页面方法绑定到实例（与小程序 this 语义一致；apply 转发全部实参，
    // 避免页内 this.xxx(a, b, c) 内部调用被只转发首参的包装吞掉）
    Object.keys(cfg).forEach(function (k) {
      if (typeof cfg[k] === 'function') {
        inst[k] = function () { return cfg[k].apply(inst, arguments); };
      }
    });
    return inst;
  }

  function openPage(name, query, how) {
    var inst = instantiate(name);
    var rec = { name: name, query: query, inst: inst };
    if (how === 'replace') navStack[navStack.length - 1] = rec;
    else navStack.push(rec);
    CURRENT = inst;
    if (inst.onLoad) inst.onLoad(query || {});
    renderPage(inst);
  }

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------

  var pageHost = document.getElementById('page-host');
  var styleHost = document.getElementById('page-style');
  var pageCache = {};

  function renderPage(inst) {
    if (!pageCache[inst.name]) {
      pageCache[inst.name] = {
        wxml: req(pathOf(inst.name) + '.wxml', pathOf(inst.name)),
        wxss: req(pathOf(inst.name) + '.wxss', pathOf(inst.name))
      };
    }
    var res = pageCache[inst.name];
    styleHost.textContent = rwpx(res.wxss) + '\n' + rwpx(req('/styles/app.wxss'));

    pageHost.innerHTML = '';
    var frag = document.createDocumentFragment();
    var ast = parseWXML(res.wxml);
    var scope = makeScope(inst, {});
    ast.children.forEach(function (n) { renderNode(n, frag, scope, inst); });
    pageHost.appendChild(frag);
  }

  function rwpx(w) {
    // 固定基准换算：750rpx = 390px（iPhone 逻辑宽），与真机一致；
    // 不用 100vw —— headless 在 dsf=2 下视口不是 390，vw 基准会整体放大。
    return w.replace(/(\d+(?:\.\d+)?)rpx/g, function (m, n) {
      return Math.round(parseFloat(n) * 0.52 * 100) / 100 + 'px';
    });
  }

  function makeScope(inst, extra) {
    var o = { $: inst.data };
    for (var k in inst.data) o[k] = inst.data[k];
    if (extra) for (var k2 in extra) o[k2] = extra[k2];
    else { o.item = undefined; o.index = undefined; }
    return o;
  }

  // ---------------------------------------------------------------------------
  // WXML 解析
  // ---------------------------------------------------------------------------

  function parseWXML(src) {
    var root = { tag: '#root', attrs: {}, children: [] };
    var stack = [root];
    var re = /<([^>]+)>|([^<]+)/g;
    var m;
    while ((m = re.exec(src))) {
      if (m[1] !== undefined) {
        parseTag(m[1], stack);
      } else if (!/^\s+$/.test(m[2])) {
        stack[stack.length - 1].children.push({ text: m[2], attrs: {}, children: null });
      }
    }
    return root;
  }

  var VOID_TAGS = { image: 1, input: 1 };

  function parseTag(raw, stack) {
    var close = false, self = false, body = raw;
    if (body.charAt(0) === '/') { close = true; body = body.slice(1); }
    if (body.charAt(body.length - 1) === '/') { self = true; body = body.slice(0, -1); }
    var head = /^([\w-]+)\s*([\s\S]*)$/.exec(body);
    if (!head) return;
    var tag = head[1] === 'block' ? 'w-block' : head[1];
    var attrs = parseAttrs(head[2]);

    if (close) {
      //  void 标签不成对入栈，关闭时按最近同名回退，避免误弹
      for (var j = stack.length - 1; j > 0; j--) {
        if (stack[j].tag === tag) {
          stack.length = j;
          break;
        }
      }
      return;
    }
    var node = { tag: tag, attrs: attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!self && !VOID_TAGS[tag]) stack.push(node);
  }

  function parseAttrs(s) {
    var attrs = {};
    var re = /([:\w-]+)\s*=\s*"([^"]*)"|([:\w-]+)(?!["=])/g;
    var m;
    while ((m = re.exec(s))) {
      if (m[1] !== undefined) attrs[m[1]] = m[2];
      else attrs[m[3]] = true;
    }
    return attrs;
  }

  // ---------------------------------------------------------------------------
  // 表达式
  // ---------------------------------------------------------------------------

  function evalExpr(expr, scope) {
    try {
      return new Function('s', 'with(s){return (' + expr + ');}')(scope);
    } catch (e) {
      return undefined;
    }
  }

  // 属性值 {{expr}} → expr
  function pickExpr(v) {
    var m = /^\{\{([\s\S]*)\}\}$/.exec(String(v));
    return m ? m[1] : String(v);
  }

  function bindText(tpl, scope) {
    return String(tpl).replace(/\{\{([\s\S]*?)\}\}/g, function (m, e) {
      var v = evalExpr(e, scope);
      return v === undefined || v === null ? '' : String(v);
    });
  }

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------

  function renderNode(node, parent, scope, inst) {
    var attrs = node.attrs || {};

    if (node.text !== undefined) {
      var t = document.createElement('e-text');
      t.textContent = bindText(node.text, scope);
      parent.appendChild(t);
      return;
    }

    if (attrs['wx:for'] !== undefined) {
      var list = evalExpr(pickExpr(attrs['wx:for']), scope);
      if (Array.isArray(list)) {
        list.forEach(function (item, index) {
          var inner = makeScope(inst, { item: item, index: index });
          var el = makeEl(node, inner, inst);
          parent.appendChild(el);
        });
      }
      return;
    }

    var el = makeEl(node, scope, inst);
    if (el) parent.appendChild(el);
  }

  function makeEl(node, scope, inst) {
    var el;
    if (node.tag === 'w-block') el = document.createElement('w-block');
    else if (node.tag === 'image') el = document.createElement('img');
    else el = document.createElement(node.tag);

    applyAttrs(node, el, scope, inst);
    renderChildren(node, el, scope, inst);
    return el;
  }

  function renderChildren(node, parent, scope, inst) {
    var kids = node.children || [];
    // wx:if / wx:else（相邻兄弟）
    var elseState = null; // null | 'skip' | 'render'
    for (var i = 0; i < kids.length; i++) {
      var child = kids[i];
      var a = child.attrs || {};
      if (a['wx:if'] !== undefined) {
        var cond = !!evalExpr(pickExpr(a['wx:if']), scope);
        elseState = cond ? 'skip' : 'render';
        if (cond) renderNode(child, parent, scope, inst);
      } else if (a['wx:else'] !== undefined) {
        if (elseState === 'render') {
          renderNode(child, parent, scope, inst);
          elseState = null;
        } else if (elseState === 'skip') {
          elseState = null;
        }
      } else {
        renderNode(child, parent, scope, inst);
      }
    }
  }

  function applyAttrs(node, el, scope, inst) {
    var attrs = node.attrs || {};
    var dataset = {};

    Object.keys(attrs).forEach(function (key) {
      if (key === 'wx:for' || key === 'wx:key' || key === 'wx:if' || key === 'wx:else') return;
      if (/^bind/.test(key)) return;

      var val = attrs[key];
      if (val === true) { // focus 等布尔属性
        if (key === 'focus') setTimeout(function () { try { el.focus(); } catch (e) { void e; } }, 60);
        return;
      }
      var out = bindText(String(val), scope);
      if (/^data-/.test(key)) {
        dataset[key.slice(5)] = out;
      } else if (key === 'class') {
        el.setAttribute('class', out);
      } else if (key === 'id') {
        el.setAttribute('id', out);
      } else if (node.tag === 'image' && key === 'src') {
        el.setAttribute('src', out.replace(/^\/assets\//, '../../miniprogram/assets/'));
      } else if (node.tag === 'input') {
        if (key === 'value') el.value = out;
        else if (key === 'placeholder') el.setAttribute('placeholder', out);
      }
      // 其余（mode、confirm-type 等）不参与布局，忽略
    });

    el.__dataset = snapshot(dataset);

    Object.keys(attrs).forEach(function (key) {
      if (!/^bind/.test(key) || typeof attrs[key] !== 'string') return;
      var handler = attrs[key];
      var fn = inst.cfg[handler];
      if (key === 'bindtap') {
        el.addEventListener('click', function () {
          if (fn) fn.call(inst, { currentTarget: { dataset: el.__dataset } });
        });
      } else if (node.tag === 'input' && key === 'bindinput') {
        el.addEventListener('input', function (e) {
          if (fn) fn.call(inst, { detail: { value: e.target.value } });
        });
      } else if (node.tag === 'input' && key === 'bindconfirm') {
        el.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          if (fn) fn.call(inst, { detail: { value: e.target.value } });
        });
      }
    });
  }

  function snapshot(ds) {
    var out = {};
    for (var k in ds) out[k] = ds[k];
    return out;
  }

  // 能力覆盖说明：view / text / image / input / block，wx:for、wx:if/wx:else
  // （相邻兄弟）、bindtap/bindinput/bindconfirm、data-*、{{}} —— 本工程全部用法。

  // ---------------------------------------------------------------------------
  // overlays
  // ---------------------------------------------------------------------------

  function ensureOverlay() {
    if (!OVERLAY_ROOT) {
      OVERLAY_ROOT = document.createElement('overlay-root');
      document.body.appendChild(OVERLAY_ROOT);
    }
    return OVERLAY_ROOT;
  }

  function drawModal(o) {
    var root = ensureOverlay();
    root.innerHTML = '';
    var mask = document.createElement('ov-mask');
    var card = document.createElement('ov-modal');

    var h = document.createElement('ov-title');
    h.textContent = o.title || '';
    card.appendChild(h);

    var c = document.createElement('ov-content');
    String(o.content || '').split('\n').forEach(function (line) {
      var ln = document.createElement('ov-line');
      ln.textContent = line;
      c.appendChild(ln);
    });
    card.appendChild(c);

    var btns = document.createElement('ov-btns');
    if (o.showCancel !== false) {
      var cancel = document.createElement('ov-btn');
      cancel.className = 'cancel';
      cancel.textContent = o.cancelText || '取消';
      cancel.addEventListener('click', function () {
        root.innerHTML = '';
        if (o.success) o.success({ confirm: false, cancel: true });
      });
      btns.appendChild(cancel);
    }
    var ok = document.createElement('ov-btn');
    ok.textContent = o.confirmText || '确定';
    ok.addEventListener('click', function () {
      root.innerHTML = '';
      if (o.success) o.success({ confirm: true, cancel: false });
    });
    btns.appendChild(ok);

    card.appendChild(btns);
    root.appendChild(mask);
    root.appendChild(card);
  }

  function drawSheet(o) {
    window.__sheetOpts = o;
    var root = ensureOverlay();
    root.innerHTML = '';
    var mask = document.createElement('ov-mask');
    var sheet = document.createElement('ov-sheet');

    if (o.alertText) {
      var t = document.createElement('ov-alert');
      t.textContent = o.alertText;
      sheet.appendChild(t);
    }
    (o.itemList || []).forEach(function (label, index) {
      var b = document.createElement('ov-item');
      b.textContent = label;
      b.addEventListener('click', function () {
        root.innerHTML = '';
        if (o.success) o.success({ tapIndex: index });
      });
      sheet.appendChild(b);
    });
    var cancel = document.createElement('ov-item');
    cancel.className = 'cancel';
    cancel.textContent = '取消';
    cancel.addEventListener('click', function () { root.innerHTML = ''; if (o.fail) o.fail(); });
    sheet.appendChild(cancel);

    root.appendChild(mask);
    root.appendChild(sheet);
  }

  function drawToast(title) {
    var root = ensureOverlay();
    var t = document.createElement('ov-toast');
    t.textContent = title;
    root.appendChild(t);
    setTimeout(function () { t.remove(); }, 1600);
  }

  // ---------------------------------------------------------------------------
  // 启动：#page?query&s=scenario
  // ---------------------------------------------------------------------------

  function run() {
    var hash = location.hash.replace(/^#/, '') || 'home';
    var parts = hash.split('&');
    var first = parts[0] || 'home';
    var pageName = first.split('?')[0];
    var query = parseQuery(first.split('?')[1] || '');
    // 后续 & 段的 k=v 也并入 query（s= 场景除外）
    for (var pi = 1; pi < parts.length; pi++) {
      if (parts[pi].indexOf('s=') === 0) continue;
      var q2 = parseQuery(parts[pi]);
      for (var qk in q2) query[qk] = q2[qk];
    }

    // 截图预置：?fav=person:su-shi,event:xinhai-1911 / ?foot=...（仅预览 harness 用）
    if (query.fav) {
      storage['shige_favorites'] = query.fav.split(',').map(function (s) {
        var p = s.split(':');
        return { type: p[0], id: p[1], ts: Date.now() };
      });
    }
    if (query.foot) {
      storage['shige_footprints'] = query.foot.split(',').map(function (s) {
        var p = s.split(':');
        return { type: p[0], id: p[1], ts: Date.now() };
      });
    }
    // 字号预置：?font=xl（s/m/l/xl，仅预览 harness 用）
    if (query.font && ['s', 'm', 'l', 'xl'].indexOf(query.font) >= 0) {
      storage['shige_font_key'] = query.font;
    }

    if (query.shot === '1') {
      document.body.classList.add('shot');
      // 手机恒定 390×844（与设计基准/真机一致）；视口因 headless 限制无法恰为
      // 390×844，因此以 transform 缩放适配（transform 祖先会成为 fixed 包含块，
      // tabbar/纸底位置随之正确）。
      var fit = function () {
        var phone = document.getElementById('phone');
        if (!phone) return;
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var s = Math.min(vw / 390, vh / 844);
        phone.style.width = '390px';
        phone.style.height = '844px';
        phone.style.transform = 'scale(' + s + ')';
      };
      fit();
      window.addEventListener('resize', fit);
    }
    openPage(pageName, query, 'replace');
    if (CURRENT && CURRENT.onShow && query.shot !== 'reentry') CURRENT.onShow();
    ensureTabShell();

    if (query.debug) {
      try {
        var m = [], div;
        m.push('scrollW=' + document.body.scrollWidth);
        m.push('viewportW=' + document.documentElement.clientWidth);
        m.push('viewportH=' + document.documentElement.clientHeight);
      var scr = document.querySelector('.screen');
      if (scr) {
        var r = scr.getBoundingClientRect();
        m.push('screen.w=' + Math.round(r.width));
        m.push('screen.pad=' + getComputedStyle(scr).paddingLeft + '/' + getComputedStyle(scr).paddingRight);
      }
      var tb = document.querySelector('.topbar');
      if (tb) {
        var tr = tb.getBoundingClientRect();
        m.push('topbar=' + Math.round(tr.left) + ',' + Math.round(tr.width));
      }
      var bk = document.querySelector('.back');
      if (bk) {
        var br = bk.getBoundingClientRect();
        m.push('back=' + Math.round(br.left) + ',' + Math.round(br.right) + ',' + Math.round(br.width));
      }
      var tt = document.querySelector('.top-title');
      if (tt) {
        var rr = tt.getBoundingClientRect();
        m.push('title=' + Math.round(rr.left) + ',' + Math.round(rr.right));
        m.push('titleLeft=' + getComputedStyle(tt).left);
        m.push('titleFs=' + getComputedStyle(tt).fontSize);
        m.push('fsVar=' + getComputedStyle(tt).getPropertyValue('--fs'));
        m.push('pageCls=' + (document.querySelector('.page') ? document.querySelector('.page').className : 'none'));
      }
      var brand = document.querySelector('.brand');
      if (brand) m.push('brand.fs=' + getComputedStyle(brand).fontSize);
      m.push('event-item=' + document.querySelectorAll('.event-item').length);
      m.push('eventListW=' + (function () {
        var el = document.querySelector('.event-list');
        return el ? Math.round(el.getBoundingClientRect().width) : -1;
      })());
      var card = document.querySelector('.event-card, .qual-tile, .tabbar');
      if (card) m.push('firstCardW=' + Math.round(card.getBoundingClientRect().width));
      var band = document.getElementById('err-banner');
      if (!band) { band = document.createElement('err-banner'); band.id = 'err-banner'; document.body.appendChild(band); }
      band.innerHTML = '';
      div = document.createElement('div');
      div.textContent = 'METRICS ' + m.join('  ');
      band.appendChild(div);
      } catch (dbgErr) {
        banner(dbgErr);
      }
    }

    var scenario = null;
    parts.forEach(function (p) {
      if (p.indexOf('s=') === 0) scenario = decodeURIComponent(p.slice(2));
    });
    if (scenario) runScenario(scenario);
  }

  function runScenario(s) {
    var steps = s.split('|');
    var i = 0;
    function next() {
      if (i >= steps.length) return;
      var step = steps[i].trim();
      i += 1;
      if (!step) { requestAnimationFrame(next); return; }
      setTimeout(function () {
        try {
          var mm;
          if ((mm = /^click:(.+)$/.exec(step))) {
            var el = document.querySelector(mm[1]);
            if (!el) throw new Error('click 未找到 ' + mm[1]);
            el.click();
          } else if ((mm = /^input:(.+),([\s\S]+)$/.exec(step))) {
            var inp = document.querySelector(mm[1]);
            if (!inp) throw new Error('input 未找到 ' + mm[1]);
            inp.value = mm[2];
            inp.dispatchEvent(new Event('input', { bubbles: true }));
          } else if ((mm = /^scroll:(\d+)$/.exec(step))) {
            var host = document.getElementById('page-host');
            host.style.overflow = 'auto';
            host.scrollTop = parseInt(mm[1], 10);
          } else if ((mm = /^mark:(.+)$/.exec(step))) {
            var m = [];
            m.push(step);
            m.push('CURRENT=' + (CURRENT && CURRENT.name));
            if (window.__sheetOpts) {
              var so = window.__sheetOpts;
              m.push('sheet.items=' + (so.itemList && so.itemList.length) + ' first=[' + (so.itemList && so.itemList[0]) + ']');
            }
            if (CURRENT) {
              m.push('mode=' + CURRENT.data.mode);
              m.push('events=' + (Array.isArray(CURRENT.data.events) ? CURRENT.data.events.length : typeof CURRENT.data.events));
              var probe = document.querySelector('.event-item');
              m.push('dom-event-item=' + (probe ? 'yes' : 'no'));
              var listNode = document.querySelector('.event-list');
              m.push('event-list-kids=' + (listNode ? listNode.children.length : -1));
            }
            throw new Error('MARK ' + m.join('  ')); // mark 走异常通道打印到红条
          } else {
            throw new Error('未知步骤 ' + step);
          }
          setTimeout(next, 40); // rAF 在 virtual-time/dump-dom 下会饿死，改用定时器链
        } catch (err) {
          banner(err);
        }
      }, 250);
    }
    requestAnimationFrame(next);
  }

  function banner(err) {
    var host = document.getElementById('err-banner') || (function () {
      var e = document.createElement('err-banner');
      e.id = 'err-banner';
      document.body.appendChild(e);
      return e;
    })();
    var div = document.createElement('div');
    div.textContent = 'ERR: ' + (err && err.message ? err.message : String(err)) +
      (err && err.stack ? ' :: ' + err.stack.split('\n').slice(1, 3).map(function (s) { return s.trim(); }).join(' <- ') : '');
    host.appendChild(div);
    console.error(err);
  }

  window.addEventListener('error', function (e) { banner(e.error || e.message); });
  window.addEventListener('unhandledrejection', function (e) { banner(e.reason); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

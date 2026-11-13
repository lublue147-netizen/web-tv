// ==UserScript==
// @name         蜂蜜影视 iOS 纯前端全功能内核 (强化版)
// @namespace    https://github.com/lublue147-netizen/web-tv
// @version      3.0.0
// @description  无视CORS、任意伪造UA/Referer、M3U8递归清洗去广告、AES-128密钥内联、CatVod JS爬虫沙箱
// @author       lublue147-netizen
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @run-at       document-start
// @updateURL    https://lublue147-netizen.github.io/web-tv/kernel/catvod-ios-kernel.user.js
// @downloadURL  https://lublue147-netizen.github.io/web-tv/kernel/catvod-ios-kernel.user.js
// ==/UserScript==

(function () {
  'use strict';

  // 跨越沙箱：确保同时注入沙箱 window 与宿主 unsafeWindow
  const globalObj = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  // ==========================================
  // 1. 特权网络引擎 (GM_xmlhttpRequest Promise 封装)
  // ==========================================
  function gmFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: options.method || 'GET',
        url: url,
        headers: options.headers || {},
        data: options.body || options.data || null,
        responseType: options.responseType || 'text',
        timeout: options.timeout || 30000,
        onload: (res) => {
          resolve({
            ok: res.status >= 200 && res.status < 300,
            status: res.status,
            finalUrl: res.finalUrl || url,
            headers: parseHeaders(res.responseHeaders),
            text: () => Promise.resolve(res.responseText),
            json: () => Promise.resolve(JSON.parse(res.responseText || '{}')),
            arrayBuffer: () => Promise.resolve(res.response)
          });
        },
        onerror: (err) => reject(new Error('GM网络请求失败: ' + (err.statusText || 'Network Error'))),
        ontimeout: () => reject(new Error('GM网络请求超时: ' + url))
      });
    });
  }

  function parseHeaders(headerStr) {
    const headers = {};
    if (!headerStr) return headers;
    headerStr.trim().split(/[\r\n]+/).forEach(line => {
      const parts = line.split(': ');
      const key = parts.shift().toLowerCase();
      headers[key] = parts.join(': ');
    });
    return headers;
  }

  // 蜂蜜 JS 爬虫全局 req / http 垫片
  async function req(url, opt = {}) {
    try {
      const res = await gmFetch(url, {
        method: opt.method || 'GET',
        headers: opt.headers || {},
        body: opt.data || opt.body || null,
        timeout: opt.timeout || 15000
      });
      return {
        code: res.status,
        content: await res.text(),
        headers: res.headers
      };
    } catch (e) {
      return { code: 500, content: '', headers: {}, error: e.message };
    }
  }

  // ==========================================
  // 2. HTML 解析垫片 (pdfh / pdfa / pd)
  // ==========================================
  function pdfh(html, expr) {
    if (!html) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const parts = expr.split('&&');
      const selector = parts[0];
      const target = parts[1] || 'text';

      const el = doc.querySelector(selector);
      if (!el) return '';
      if (target === 'text') return el.textContent.trim();
      if (target === 'html') return el.innerHTML.trim();
      if (target.startsWith('tag=')) return el.getAttribute(target.slice(4)) || '';
      return el.getAttribute(target) || el.textContent.trim();
    } catch (e) {
      return '';
    }
  }

  function pdfa(html, expr) {
    if (!html) return [];
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(doc.querySelectorAll(expr)).map(el => el.outerHTML);
    } catch (e) {
      return [];
    }
  }

  const pd = (html, expr) => pdfh(html, expr);

  // 本地轻量 KV 存储
  const local = {
    get: (k, def = '') => (typeof GM_getValue !== 'undefined' ? GM_getValue(k, def) : (localStorage.getItem(k) || def)),
    set: (k, v) => (typeof GM_setValue !== 'undefined' ? GM_setValue(k, v) : localStorage.setItem(k, v)),
    delete: (k) => (typeof GM_deleteValue !== 'undefined' ? GM_deleteValue(k) : localStorage.removeItem(k))
  };

  // ==========================================
  // 3. M3U8 智能清洗与去广告引擎 (Go 代理纯 JS 移植版)
  // ==========================================
  async function processM3U8Locally(m3u8Url, customHeaders = {}, maxRecursion = 2) {
    if (maxRecursion <= 0) throw new Error('M3U8 嵌套层级超过最大限制');

    const res = await gmFetch(m3u8Url, { headers: customHeaders, responseType: 'text' });
    const rawText = await res.text();
    const finalBaseUrl = new URL(res.finalUrl || m3u8Url);

    // 1. 判断是否是 Master Playlist (二级分辨率索引)
    if (rawText.includes('#EXT-X-STREAM-INF')) {
      const lines = rawText.split('\n');
      let targetSubM3U8 = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXT-X-STREAM-INF')) {
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && !nextLine.startsWith('#')) {
            targetSubM3U8 = new URL(nextLine, finalBaseUrl).href;
            break;
          }
        }
      }
      if (targetSubM3U8) {
        console.log('[M3U8 Cleaner] 探测到 Master Playlist，自动递归解析:', targetSubM3U8);
        return await processM3U8Locally(targetSubM3U8, customHeaders, maxRecursion - 1);
      }
    }

    // 2. 状态机：切除成组插播广告 (#EXT-X-DISCONTINUITY 成对隔离)
    const lines = rawText.split('\n');
    const output = [];
    let inAdBlock = false;
    let adChunkCount = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      // 遇到不连续标记
      if (line.startsWith('#EXT-X-DISCONTINUITY')) {
        if (!inAdBlock) {
          inAdBlock = true;
          adChunkCount = 0;
          continue;
        } else {
          inAdBlock = false;
          continue;
        }
      }

      // 如果当前处在广告块内部且切片较少（通常插播广告在 1~6 个切片）
      if (inAdBlock && line.startsWith('#EXTINF')) {
        adChunkCount++;
        if (adChunkCount <= 6) {
          i++; // 跳过切片 URL
          continue;
        } else {
          inAdBlock = false;
        }
      }

      // 3. 处理 #EXT-X-KEY 密钥：抓取密钥并内联为 Base64 Data URI
      if (line.startsWith('#EXT-X-KEY') && line.includes('URI="')) {
        const match = line.match(/URI="([^"]+)"/);
        if (match && match[1]) {
          const keyUri = match[1];
          const absKeyUrl = new URL(keyUri, finalBaseUrl).href;
          try {
            const keyRes = await gmFetch(absKeyUrl, { headers: customHeaders, responseType: 'arraybuffer' });
            const keyBytes = new Uint8Array(keyRes.arrayBuffer());
            let binary = '';
            for (let b = 0; b < keyBytes.byteLength; b++) {
              binary += String.fromCharCode(keyBytes[b]);
            }
            const keyB64 = btoa(binary);
            line = line.replace(/URI="[^"]+"/, `URI="data:application/octet-stream;base64,${keyB64}"`);
          } catch (e) {
            console.warn('[M3U8 Cleaner] 密钥内联失败，回退为绝对路径:', e.message);
            line = line.replace(/URI="[^"]+"/, `URI="${absKeyUrl}"`);
          }
        }
        output.push(line);
        continue;
      }

      // 4. 其他标准协议头原样保留
      if (line.startsWith('#')) {
        output.push(line);
        continue;
      }

      // 5. 切片路径补全为源站 CDN 绝对路径
      try {
        const absChunkUrl = new URL(line, finalBaseUrl).href;
        output.push(absChunkUrl);
      } catch (e) {
        output.push(line);
      }
    }

    const cleanedM3U8 = output.join('\n');
    const base64M3U8 = btoa(unescape(encodeURIComponent(cleanedM3U8)));
    return `data:application/vnd.apple.mpegurl;base64,${base64M3U8}`;
  }

  // ==========================================
  // 4. TS 伪装头剥离算法 (0x47 同步字节定位)
  // ==========================================
  function stripTsDisguiseHeader(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let syncIndex = -1;
    for (let i = 0; i < Math.min(bytes.length - 376, 2048); i++) {
      if (bytes[i] === 0x47 && bytes[i + 188] === 0x47 && bytes[i + 376] === 0x47) {
        syncIndex = i;
        break;
      }
    }
    return syncIndex > 0 ? arrayBuffer.slice(syncIndex) : arrayBuffer;
  }

  // ==========================================
  // 5. 挂载到宿主全局对象
  // ==========================================
  const exports = {
    gmFetch,
    req,
    http: req,
    pdfh,
    pdfa,
    pd,
    local,
    processM3U8Locally,
    stripTsDisguiseHeader,
    isKernelLoaded: true,
    version: '3.0.0'
  };

  Object.assign(globalObj, exports);
  console.log('🚀 [CatVod iOS Kernel] 蜂蜜纯前端特权内核 v3.0.0 已成功挂载！');

  // 双重通信保障：派发自定义就绪事件
  window.dispatchEvent(new CustomEvent('catvod-kernel-ready', { detail: exports }));
})();

/**
 * 客户端特权通信桥与兜底网络层 (client-bridge.js)
 * 1. 自动与 iOS Safari Userscripts / Stay 脚本建立 postMessage 双向特权网络管道
 * 2. 对本地资源 (iptv.m3u, initial-vod.json) 自动直连，零依赖
 * 3. 抹平爬虫沙箱与网页上下文环境差异
 */

(function (global) {
  'use strict';

  let reqIdCounter = 0;
  const pendingRequests = new Map();

  global.isKernelLoaded = false;
  global.kernelVersion = '';

  // 1. 监听来自 iOS Userscripts / Stay 内核的信标与响应
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    // 内核心跳响应
    if (event.data.source === 'CATVOD_KERNEL_PONG') {
      if (!global.isKernelLoaded) {
        global.isKernelLoaded = true;
        global.kernelVersion = event.data.version || '3.1.0';
        console.log('🎉 检测到 iOS 油猴特权内核已激活: v' + global.kernelVersion);
        if (typeof global.onKernelStatusChange === 'function') {
          global.onKernelStatusChange(true);
        }
      }
    }

    // 特权请求结果回调
    if (event.data.source === 'CATVOD_KERNEL_RESPONSE') {
      const { reqId, success, res, dataUri, error } = event.data;
      const handler = pendingRequests.get(reqId);
      if (handler) {
        pendingRequests.delete(reqId);
        if (success) {
          handler.resolve(res || { dataUri });
        } else {
          handler.reject(new Error(error || 'Kernel request failed'));
        }
      }
    }
  });

  // 检测 HTML 标签上的属性标记 (同步检测)
  function checkHtmlAttribute() {
    if (document.documentElement && document.documentElement.getAttribute('data-catvod-kernel')) {
      global.isKernelLoaded = true;
      global.kernelVersion = document.documentElement.getAttribute('data-catvod-kernel');
      if (typeof global.onKernelStatusChange === 'function') {
        global.onKernelStatusChange(true);
      }
    }
  }
  checkHtmlAttribute();
  setTimeout(checkHtmlAttribute, 500);

  // 2. 统一安全网络请求方法 (safeFetch)
  global.safeFetch = function (url, options = {}) {
    const isLocal = url.startsWith('./') || url.startsWith('/') || url.startsWith('data/') || (typeof location !== 'undefined' && url.includes(location.host));

    // A. 本地同源资源 (如 iptv.m3u / sites.json) 永远使用原生 fetch，零报错
    if (isLocal) {
      return window.fetch(url, options).then(async (r) => ({
        ok: r.ok,
        status: r.status,
        finalUrl: r.url,
        headers: {},
        text: () => r.text(),
        json: () => r.json(),
        content: await r.clone().text()
      }));
    }

    // B. 如果内核已激活，优先走 postMessage 特权通道
    if (global.isKernelLoaded) {
      return new Promise((resolve, reject) => {
        const reqId = ++reqIdCounter;
        pendingRequests.set(reqId, {
          resolve: (res) => {
            resolve({
              ok: res.status >= 200 && res.status < 300,
              status: res.status,
              finalUrl: res.finalUrl || url,
              headers: res.headers || {},
              text: () => Promise.resolve(res.responseText || ''),
              json: () => Promise.resolve(JSON.parse(res.responseText || '{}')),
              content: res.responseText || ''
            });
          },
          reject: reject
        });

        window.postMessage({
          source: 'CATVOD_PAGE_REQUEST',
          action: 'FETCH',
          reqId: reqId,
          url: url,
          options: options
        }, '*');

        // 超时保护
        setTimeout(() => {
          if (pendingRequests.has(reqId)) {
            pendingRequests.delete(reqId);
            reject(new Error('特权网络请求超时: ' + url));
          }
        }, 30000);
      });
    }

    // C. 若内核尚未就绪，尝试直连 fetch
    return window.fetch(url, options).then(async (r) => ({
      ok: r.ok,
      status: r.status,
      finalUrl: r.url,
      headers: {},
      text: () => r.text(),
      json: () => r.json(),
      content: await r.clone().text()
    })).catch((e) => {
      console.warn('原生 fetch 遇到跨域或网络限制，请确保 Userscripts / Stay 已激活:', e);
      throw e;
    });
  };

  // 3. 统一 M3U8 清洗与去广告方法 (safeCleanM3U8)
  global.safeCleanM3U8 = function (m3u8Url, headers = {}) {
    if (!global.isKernelLoaded) {
      // 若内核未就绪，直接返回原地址由原生播放器尝试直接播放
      return Promise.resolve(m3u8Url);
    }

    return new Promise((resolve) => {
      const reqId = ++reqIdCounter;
      pendingRequests.set(reqId, {
        resolve: (data) => resolve(data.dataUri || m3u8Url),
        reject: () => resolve(m3u8Url) // 失败平滑降级
      });

      window.postMessage({
        source: 'CATVOD_PAGE_REQUEST',
        action: 'CLEAN_M3U8',
        reqId: reqId,
        url: m3u8Url,
        options: { headers }
      }, '*');

      setTimeout(() => {
        if (pendingRequests.has(reqId)) {
          pendingRequests.delete(reqId);
          resolve(m3u8Url);
        }
      }, 10000);
    });
  };

  // 4. 挂载标准 CatVod 爬虫沙箱垫片
  global.req = async function (url, opt = {}) {
    try {
      const res = await global.safeFetch(url, {
        method: opt.method || 'GET',
        headers: opt.headers || {},
        body: opt.data || opt.body || null
      });
      return {
        code: res.status,
        content: await res.text(),
        headers: res.headers || {}
      };
    } catch (e) {
      return { code: 500, content: '', headers: {}, error: e.message };
    }
  };

  global.pdfh = function (html, expr) {
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
  };

  global.pdfa = function (html, expr) {
    if (!html) return [];
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(doc.querySelectorAll(expr)).map(el => el.outerHTML);
    } catch (e) {
      return [];
    }
  };

  global.pd = (html, expr) => global.pdfh(html, expr);

})(typeof window !== 'undefined' ? window : this);

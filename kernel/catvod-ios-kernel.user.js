// ==UserScript==
// @name         蜂蜜影视 iOS 纯前端全功能内核 (强化版)
// @namespace    https://github.com/lublue147-netizen/web-tv
// @version      3.1.0
// @description  无视CORS、任意伪造UA/Referer、M3U8递归清洗去广告、AES-128密钥内联、CatVod JS爬虫沙箱、postMessage跨沙箱通信
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

  console.log('🚀 [CatVod iOS Kernel] 脚本正在执行注入...');

  // ==========================================
  // 1. 特权网络引擎 (GM_xmlhttpRequest)
  // ==========================================
  function gmFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === 'undefined') {
        return reject(new Error('GM_xmlhttpRequest 不存在'));
      }
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
            responseText: res.responseText,
            response: res.response
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

  // ==========================================
  // 2. M3U8 智能清洗与去广告引擎
  // ==========================================
  async function processM3U8Locally(m3u8Url, customHeaders = {}, maxRecursion = 2) {
    if (maxRecursion <= 0) throw new Error('M3U8 嵌套层级超过限制');

    const res = await gmFetch(m3u8Url, { headers: customHeaders, responseType: 'text' });
    const rawText = res.responseText || '';
    const finalBaseUrl = new URL(res.finalUrl || m3u8Url);

    // 1. 判断是否是 Master Playlist (二级索引)
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
            const keyBytes = new Uint8Array(keyRes.response);
            let binary = '';
            for (let b = 0; b < keyBytes.byteLength; b++) {
              binary += String.fromCharCode(keyBytes[b]);
            }
            const keyB64 = btoa(binary);
            line = line.replace(/URI="[^"]+"/, `URI="data:application/octet-stream;base64,${keyB64}"`);
          } catch (e) {
            line = line.replace(/URI="[^"]+"/, `URI="${absKeyUrl}"`);
          }
        }
        output.push(line);
        continue;
      }

      if (line.startsWith('#')) {
        output.push(line);
        continue;
      }

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
  // 3. 双向 postMessage 通信桥 (突破 Safari 隔离沙箱)
  // ==========================================
  window.addEventListener('message', async (event) => {
    if (!event.data || event.data.source !== 'CATVOD_PAGE_REQUEST') return;

    const { reqId, action, url, options } = event.data;

    if (action === 'FETCH') {
      try {
        const res = await gmFetch(url, options || {});
        window.postMessage({
          source: 'CATVOD_KERNEL_RESPONSE',
          reqId: reqId,
          success: true,
          res: res
        }, '*');
      } catch (err) {
        window.postMessage({
          source: 'CATVOD_KERNEL_RESPONSE',
          reqId: reqId,
          success: false,
          error: err.message
        }, '*');
      }
    } else if (action === 'CLEAN_M3U8') {
      try {
        const dataUri = await processM3U8Locally(url, (options && options.headers) || {});
        window.postMessage({
          source: 'CATVOD_KERNEL_RESPONSE',
          reqId: reqId,
          success: true,
          dataUri: dataUri
        }, '*');
      } catch (err) {
        window.postMessage({
          source: 'CATVOD_KERNEL_RESPONSE',
          reqId: reqId,
          success: false,
          error: err.message
        }, '*');
      }
    }
  });

  // 广播就绪信标
  function sendBeacon() {
    window.postMessage({ source: 'CATVOD_KERNEL_PONG', version: '3.1.0' }, '*');
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute('data-catvod-kernel', '3.1.0');
      }
    } catch (e) {}
  }

  sendBeacon();
  setInterval(sendBeacon, 1000);

  // 尝试直接挂载到 unsafeWindow (若环境支持)
  try {
    const targetObj = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    targetObj.gmFetch = gmFetch;
    targetObj.processM3U8Locally = processM3U8Locally;
    targetObj.isKernelLoaded = true;
    targetObj.version = '3.1.0';
  } catch (e) {}

  console.log('✅ [CatVod iOS Kernel] 内核 v3.1.0 postMessage 双向桥已启动！');
})();

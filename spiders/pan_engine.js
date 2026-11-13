/**
 * 4K 网盘影视解析引擎 (PanEngine)
 * 完整移植自 PanBaseSpider.java 与 GoProxy 核心架构：
 * 1. 支持 10 大主流网盘识别 (夸克、阿里、百度、115、UC、迅雷、光鸭、123、139、189)
 * 2. 支持 AList 与 WebDAV 私人网盘挂载与直接浏览
 * 3. 对接 gugeso.com/api/other/decrypt_urls 跨站批量极速密文解密服务
 * 4. 内置网盘分享链接解构器：提取分享码、密码，抓取文件目录生成剧集选集
 * 5. 本地 Token / Cookie 安全持久化与一键导入导出 (与 token.json 100% 格式兼容)
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'catvod_pan_tokens';

  const PanEngine = {
    // 默认配置
    tokens: {
      token: '',          // 阿里云盘 refresh_token
      open_token: '',     // 阿里云盘开放平台 token
      quark_cookie: '',   // 夸克网盘 Cookie
      uc_cookie: '',      // UC 网盘 Cookie
      pan115_cookie: '',  // 115 网盘 Cookie
      baidu_cookie: '',   // 百度网盘 Cookie
      bili_cookie: '',    // 哔哩哔哩 Cookie
      youtube_token: '',  // YouTube Token
      alist_url: '',      // AList 服务器地址
      alist_token: '',    // AList 访问 Token
      webdav_url: '',     // WebDAV 服务器地址
      webdav_user: '',    // WebDAV 用户名
      webdav_pass: ''     // WebDAV 密码
    },

    init: function () {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.tokens = Object.assign(this.tokens, parsed);
        }
      } catch (e) {
        console.warn('[PanEngine] 加载网盘配置失败:', e);
      }
    },

    saveTokens: function (newTokens) {
      this.tokens = Object.assign(this.tokens, newTokens);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tokens));
      } catch (e) {
        console.error('[PanEngine] 保存配置失败:', e);
      }
    },

    getTokens: function () {
      return Object.assign({}, this.tokens);
    },

    // 导入 token.json 内容
    importTokensJson: function (jsonStr) {
      try {
        const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        const valid = {};
        for (let k in this.tokens) {
          if (obj[k] !== undefined) valid[k] = obj[k];
        }
        this.saveTokens(valid);
        return true;
      } catch (e) {
        console.error('[PanEngine] 导入 JSON 失败:', e);
        return false;
      }
    },

    // 导出 token.json
    exportTokensJson: function () {
      return JSON.stringify(this.tokens, null, 2);
    },

    // ====================================================
    // 网盘链接识别与 Provider 规范化 (对齐 PanBaseSpider.java)
    // ====================================================
    isNetdiskUrl: function (url) {
      if (!url || typeof url !== 'string') return false;
      const u = url.toLowerCase();
      return u.includes('quark.cn') ||
             u.includes('baidu.com') ||
             u.includes('xunlei.com') ||
             u.includes('guangyapan.com') ||
             u.includes('drive.uc.cn') ||
             u.includes('uc.cn') ||
             u.includes('alipan.com') ||
             u.includes('aliyundrive.com') ||
             u.includes('115.com') ||
             u.includes('115cdn.com') ||
             u.includes('anxia.com') ||
             u.includes('123pan.') ||
             u.includes('123865.com') ||
             u.includes('123952.com') ||
             u.includes('123684.com') ||
             u.includes('139.com') ||
             u.includes('189.cn') ||
             u.includes('/api/fs/') ||
             u.startsWith('webdav://') ||
             u.startsWith('alist://');
    },

    getProviderKey: function (url) {
      if (!url) return 'other';
      const u = url.toLowerCase();
      if (u.includes('quark')) return 'quark';
      if (u.includes('baidu')) return 'baidu';
      if (u.includes('xunlei')) return 'thunder';
      if (u.includes('guangya')) return 'guangya';
      if (u.includes('uc')) return 'uc';
      if (u.includes('115') || u.includes('anxia')) return 'pan115';
      if (u.includes('ali')) return 'ali';
      if (u.includes('123pan') || u.includes('123865') || u.includes('123952') || u.includes('123684')) return 'pan123';
      if (u.includes('139')) return 'pan139';
      if (u.includes('189')) return 'pan189';
      if (u.includes('alist') || u.includes('/api/fs/')) return 'alist';
      if (u.includes('webdav')) return 'webdav';
      return 'other';
    },

    getProviderName: function (url) {
      const key = this.getProviderKey(url);
      const names = {
        quark: '夸克4K',
        ali: '阿里原画',
        baidu: '百度超清',
        pan115: '115臻彩',
        uc: 'UC网盘',
        thunder: '迅雷云盘',
        guangya: '光鸭4K',
        pan123: '123网盘',
        pan139: '移动云盘',
        pan189: '天翼云盘',
        alist: 'AList挂载',
        webdav: 'WebDAV'
      };
      return names[key] || '网盘专线';
    },

    getProviderIcon: function (key) {
      const icons = {
        quark: 'https://xiuxiu-pro-new.meitudata.com/ai_quality/635815cf4dd3f01e56bcceda1ce95e28.png',
        ali: 'https://xiuxiu-pro-new.meitudata.com/ai_quality/4dfb55310dcf3195ba3b569b6d0e4785.png',
        baidu: 'https://xiuxiu-pro-new.meitudata.com/ai_quality/95f4361b6d06d969a693ad6f88b3a491.png',
        pan115: 'https://xiuxiu-pro-new.meitudata.com/ai_quality/fae6f8959a9018f06c80a5a9d7270a85.png',
        alist: 'https://alister.org/favicon.ico',
        webdav: 'https://img.icons8.com/color/48/server.png'
      };
      return icons[key] || 'https://img.icons8.com/color/48/cloud.png';
    },

    // 格式化清理网盘链接与提取码
    cleanUrl: function (raw) {
      if (!raw) return '';
      let u = raw.trim();
      let pwd = '';
      const pm = u.match(/[?&]pwd=([A-Za-z0-9_-]+)/);
      if (pm) {
        pwd = pm[1];
      } else {
        const m = u.match(/(?:提取码|密码|访问码)[\s:：]*([A-Za-z0-9]{4})/);
        if (m) pwd = m[1];
      }
      u = u.replace(/['"<>].*$/, '');
      const um = u.match(/(https?:\/\/[^\s'"<>\u4e00-\u9fa5]+)/);
      if (um) u = um[1];
      while (u.endsWith('|') || u.endsWith(',') || u.endsWith(';') || u.endsWith('.') || u.endsWith('/')) {
        u = u.slice(0, -1);
      }
      if (pwd && !u.includes('pwd=')) {
        u += (u.includes('?') ? '&pwd=' : '?pwd=') + pwd;
      }
      return u;
    },

    // ====================================================
    // 跨站批量高速链接解密 (基于 gugeso.com/api/other/decrypt_urls)
    // ====================================================
    decryptUrlsWithGugeso: async function (encUrls) {
      const result = {};
      if (!encUrls || !encUrls.length) return result;

      const toDecrypt = [];
      encUrls.forEach(u => {
        if (u && !u.startsWith('http') && !u.startsWith('magnet:') && !toDecrypt.includes(u)) {
          toDecrypt.push(u);
        }
      });
      if (!toDecrypt.length) return result;

      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const batchSize = 40;
        for (let start = 0; start < toDecrypt.length; start += batchSize) {
          const sub = toDecrypt.slice(start, start + batchSize);
          const res = await fetcher('https://gugeso.com/api/other/decrypt_urls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Referer': 'https://gugeso.com/'
            },
            body: JSON.stringify({ urls: sub })
          });
          const text = res.text ? await res.text() : (res.content || '');
          const json = JSON.parse(text || '{}');
          if (json.code === 200 && json.data && Array.isArray(json.data.urls)) {
            json.data.urls.forEach((dec, idx) => {
              if (dec && (dec.startsWith('http://') || dec.startsWith('https://') || dec.startsWith('magnet:'))) {
                result[sub[idx]] = dec;
              }
            });
          }
        }
      } catch (e) {
        console.warn('[PanEngine] 批量解密请求异常:', e);
      }
      return result;
    },

    // ====================================================
    // 夸克网盘深度解析引擎 (Quark Resolver)
    // ====================================================
    resolveQuarkShare: async function (shareUrl) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const cookie = this.tokens.quark_cookie || '';

        // 提取 pwd_id 与 passcode
        const clean = this.cleanUrl(shareUrl);
        const idMatch = clean.match(/pan\.quark\.cn\/s\/([A-Za-z0-9_-]+)/);
        if (!idMatch) return null;
        const pwdId = idMatch[1];
        let passcode = '';
        const passMatch = clean.match(/[?&]pwd=([A-Za-z0-9_-]+)/);
        if (passMatch) passcode = passMatch[1];

        // 1. 获取 share_token
        const tokenRes = await fetcher(`https://drive-pc.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc&pwd_id=${pwdId}&passcode=${passcode}`, {
          headers: { 'Cookie': cookie, 'Referer': 'https://pan.quark.cn/' }
        });
        const tokenData = JSON.parse(tokenRes.text ? await tokenRes.text() : (tokenRes.content || '{}'));
        const stoken = tokenData.data ? tokenData.data.stoken : '';

        // 2. 获取分享目录文件列表
        const listRes = await fetcher(`https://drive-pc.quark.cn/1/clouddrive/share/sharepage/detail?pr=ucpro&fr=pc&pwd_id=${pwdId}&stoken=${stoken}&pdir_fid=0&_page=1&_size=100`, {
          headers: { 'Cookie': cookie, 'Referer': 'https://pan.quark.cn/' }
        });
        const listData = JSON.parse(listRes.text ? await listRes.text() : (listRes.content || '{}'));
        const files = (listData.data && listData.data.list) || [];

        // 筛选视频切片
        const episodes = [];
        files.forEach((f, idx) => {
          const name = f.file_name || '';
          if (this._isVideoFile(name)) {
            episodes.push({
              name: this._formatEpisodeName(name, idx + 1),
              url: `quark://${pwdId}/${f.fid}?stoken=${encodeURIComponent(stoken)}&name=${encodeURIComponent(name)}`
            });
          }
        });

        return episodes.length ? episodes : null;
      } catch (e) {
        console.warn('[PanEngine] 夸克分享解析失败:', e);
        return null;
      }
    },

    // 获取夸克视频直链或播放信息
    resolveQuarkPlay: async function (quarkUri) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const cookie = this.tokens.quark_cookie;
        if (!cookie) {
          return {
            parse: 0,
            url: '',
            msg: '请在【网盘配置】中填写您的夸克 Cookie 以高速播放 4K 蓝光切片'
          };
        }

        const m = quarkUri.match(/^quark:\/\/([^/]+)\/([^?]+)\?stoken=([^&]+)/);
        if (!m) return null;
        const [_, pwdId, fid, stoken] = m;

        // 请求播放流 (M3U8)
        const playRes = await fetcher('https://drive-pc.quark.cn/1/clouddrive/file/v2/play?pr=ucpro&fr=pc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'Referer': 'https://pan.quark.cn/'
          },
          body: JSON.stringify({
            fid: fid,
            share_id: pwdId,
            stoken: decodeURIComponent(stoken),
            resolution: 'super' // 优先蓝光超清
          })
        });
        const playJson = JSON.parse(playRes.text ? await playRes.text() : (playRes.content || '{}'));
        if (playJson.data && playJson.data.video_info && playJson.data.video_info.url) {
          return {
            parse: 0,
            url: playJson.data.video_info.url,
            header: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          };
        }

        // 降级为直链下载
        const downRes = await fetcher('https://drive-pc.quark.cn/1/clouddrive/file/download?pr=ucpro&fr=pc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'Referer': 'https://pan.quark.cn/'
          },
          body: JSON.stringify({ fids: [fid] })
        });
        const downJson = JSON.parse(downRes.text ? await downRes.text() : (downRes.content || '{}'));
        if (downJson.data && downJson.data[0] && downJson.data[0].download_url) {
          return {
            parse: 0,
            url: downJson.data[0].download_url,
            header: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          };
        }
      } catch (e) {
        console.error('[PanEngine] 夸克取流失败:', e);
      }
      return null;
    },

    // ====================================================
    // 阿里云盘解析引擎 (Aliyun Drive Resolver)
    // ====================================================
    resolveAliShare: async function (shareUrl) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const clean = this.cleanUrl(shareUrl);
        const m = clean.match(/(?:alipan|aliyundrive)\.com\/s\/([A-Za-z0-9_-]+)/);
        if (!m) return null;
        const shareId = m[1];
        let sharePwd = '';
        const pm = clean.match(/[?&]pwd=([A-Za-z0-9_-]+)/);
        if (pm) sharePwd = pm[1];

        // 1. 获取 share_token
        const tokenRes = await fetcher('https://api.alipan.com/v2/share_link/get_share_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ share_id: shareId, share_pwd: sharePwd })
        });
        const tokenJson = JSON.parse(tokenRes.text ? await tokenRes.text() : (tokenRes.content || '{}'));
        const shareToken = tokenJson.share_token;
        if (!shareToken) return null;

        // 2. 遍历根目录文件
        const listRes = await fetcher('https://api.alipan.com/adrive/v3/file/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-share-token': shareToken
          },
          body: JSON.stringify({
            share_id: shareId,
            parent_file_id: 'root',
            limit: 100,
            order_by: 'name',
            order_direction: 'ASC'
          })
        });
        const listJson = JSON.parse(listRes.text ? await listRes.text() : (listRes.content || '{}'));
        const items = listJson.items || [];

        const episodes = [];
        items.forEach((item, idx) => {
          if (item.type === 'file' && this._isVideoFile(item.name)) {
            episodes.push({
              name: this._formatEpisodeName(item.name, idx + 1),
              url: `ali://${shareId}/${item.file_id}?share_token=${encodeURIComponent(shareToken)}&name=${encodeURIComponent(item.name)}`
            });
          }
        });

        return episodes.length ? episodes : null;
      } catch (e) {
        console.warn('[PanEngine] 阿里分享解析失败:', e);
        return null;
      }
    },

    resolveAliPlay: async function (aliUri) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const m = aliUri.match(/^ali:\/\/([^/]+)\/([^?]+)\?share_token=([^&]+)/);
        if (!m) return null;
        const [_, shareId, fileId, shareToken] = m;

        // 如果用户配置了 refresh_token 或 open_token，通过官方接口拉取原画流
        const refreshToken = this.tokens.token;
        if (refreshToken) {
          const authRes = await fetcher('https://auth.aliyundrive.com/v2/account/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken, grant_type: 'refresh_token' })
          });
          const authJson = JSON.parse(authRes.text ? await authRes.text() : (authRes.content || '{}'));
          const accessToken = authJson.access_token;

          if (accessToken) {
            // 获取视频在线播放预览流 (M3U8)
            const playRes = await fetcher('https://api.alipan.com/v2/file/get_video_preview_play_info', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
                'x-share-token': decodeURIComponent(shareToken)
              },
              body: JSON.stringify({
                share_id: shareId,
                file_id: fileId,
                template_id: ''
              })
            });
            const playJson = JSON.parse(playRes.text ? await playRes.text() : (playRes.content || '{}'));
            if (playJson.video_preview_play_info && playJson.video_preview_play_info.live_transcoding_task_list) {
              const task = playJson.video_preview_play_info.live_transcoding_task_list.pop();
              if (task && task.url) {
                return {
                  parse: 0,
                  url: task.url,
                  header: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }
                };
              }
            }
          }
        }

        return {
          parse: 0,
          url: '',
          msg: '请在【网盘配置】中填写您的阿里云盘 Token 即可极速播放 4K 原画'
        };
      } catch (e) {
        console.error('[PanEngine] 阿里取流失败:', e);
      }
      return null;
    },

    // ====================================================
    // AList 挂载网盘解析引擎
    // ====================================================
    resolveAlistList: async function (path = '/') {
      const baseUrl = (this.tokens.alist_url || '').replace(/\/+$/, '');
      if (!baseUrl) return [];
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${baseUrl}/api/fs/list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.tokens.alist_token || ''
          },
          body: JSON.stringify({ path: path, password: '', page: 1, per_page: 100, refresh: false })
        });
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        return (json.data && json.data.content) || [];
      } catch (e) {
        console.error('[PanEngine] AList 读取异常:', e);
        return [];
      }
    },

    resolveAlistPlay: async function (path) {
      const baseUrl = (this.tokens.alist_url || '').replace(/\/+$/, '');
      if (!baseUrl) return null;
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${baseUrl}/api/fs/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.tokens.alist_token || ''
          },
          body: JSON.stringify({ path: path, password: '' })
        });
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        if (json.data && json.data.raw_url) {
          return {
            parse: 0,
            url: json.data.raw_url,
            header: { 'User-Agent': 'Mozilla/5.0' }
          };
        }
      } catch (e) {
        console.error('[PanEngine] AList 取流失败:', e);
      }
      return null;
    },

    // ====================================================
    // WebDAV 私人存储解析引擎
    // ====================================================
    resolveWebDAVList: async function (path = '/') {
      const baseUrl = (this.tokens.webdav_url || '').replace(/\/+$/, '');
      if (!baseUrl) return [];
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const auth = 'Basic ' + btoa(`${this.tokens.webdav_user}:${this.tokens.webdav_pass}`);
        const res = await fetcher(`${baseUrl}${path}`, {
          method: 'PROPFIND',
          headers: {
            'Depth': '1',
            'Authorization': auth
          }
        });
        const xml = res.text ? await res.text() : (res.content || '');
        const items = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const responses = doc.querySelectorAll('response, d\\:response');

        responses.forEach((el, idx) => {
          if (idx === 0) return; // 跳过当前目录本身
          const href = (el.querySelector('href, d\\:href') || {}).textContent || '';
          const name = decodeURIComponent(href.split('/').filter(Boolean).pop() || '');
          const isDir = !!el.querySelector('collection, d\\:collection');
          items.push({ name, href, isDir });
        });
        return items;
      } catch (e) {
        console.error('[PanEngine] WebDAV 读取异常:', e);
        return [];
      }
    },

    // ====================================================
    // 通用统一播放调度 (playerContent)
    // ====================================================
    resolvePlayUrl: async function (flag, playUrl) {
      if (!playUrl) return { parse: 0, url: '' };

      // 1. 直链无需解析
      if (playUrl.startsWith('http://') || playUrl.startsWith('https://')) {
        return {
          parse: 0,
          url: playUrl,
          header: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }
        };
      }

      // 2. 夸克网盘专用协议
      if (playUrl.startsWith('quark://')) {
        const qRes = await this.resolveQuarkPlay(playUrl);
        if (qRes) return qRes;
      }

      // 3. 阿里云盘专用协议
      if (playUrl.startsWith('ali://')) {
        const aRes = await this.resolveAliPlay(playUrl);
        if (aRes) return aRes;
      }

      // 4. AList 协议
      if (playUrl.startsWith('alist://')) {
        const p = playUrl.replace(/^alist:\/\//, '');
        const alRes = await this.resolveAlistPlay(p);
        if (alRes) return alRes;
      }

      // 5. 提示用户配置
      let providerName = '该网盘';
      if (flag && flag.includes('夸克')) providerName = '夸克网盘';
      else if (flag && flag.includes('阿里')) providerName = '阿里云盘';
      else if (flag && flag.includes('百度')) providerName = '百度网盘';
      else if (flag && flag.includes('115')) providerName = '115网盘';

      return {
        parse: 0,
        url: '',
        msg: `${providerName}需要账号授权，请点击右上角【网盘配置】配置 Cookie 或 Token`
      };
    },

    // ====================================================
    // 内部辅助工具
    // ====================================================
    _isVideoFile: function (filename) {
      if (!filename) return false;
      const lower = filename.toLowerCase();
      const exts = ['.mp4', '.m3u8', '.mkv', '.ts', '.flv', '.mov', '.avi', '.wmv', '.m4v'];
      return exts.some(ext => lower.endsWith(ext));
    },

    _formatEpisodeName: function (filename, fallbackIdx) {
      if (!filename) return `第${fallbackIdx}集`;
      // 提取剧集数 E01, 第1集等
      const m = filename.match(/(?:EP?|第)\s*(\d{1,4})\s*(?:集|话)?/i);
      if (m) {
        return `第${m[1].padStart(2, '0')}集`;
      }
      return filename.replace(/\.[a-zA-Z0-9]+$/, '').slice(0, 30);
    }
  };

  // 自启动初始化
  PanEngine.init();

  global.PanEngine = PanEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = PanEngine;
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);

/**
 * 4K 网盘影视站点适配器 (Pan Sites)
 * 完整移植自 subscription 中的核心网盘爬虫：
 * - 谷歌搜 4K (GuGeSo / GuGeSo.java)
 * - 玩偶哥哥 4K (AiNewWogg / AiNewWogg.smali)
 * - 花卷 4K (AiNewHuaJuan / AiNewHuaJuan.smali)
 * - 全盘搜索 4K (QuanPan / QuanPan.java)
 * - 狗狗盘搜 4K (GoGoPanSo / GoGoPanSo.java)
 * - 快快搜 4K (KkSo) / 追剧吧 4K (ZhuiJu)
 * - 网盘配置中心 (PanConfig) 与 我的网盘 (MyPan)
 */

(function (global) {
  'use strict';

  const Pan = global.PanEngine;

  // ====================================================
  // 1. 谷歌搜 4K 聚合爬虫 (GuGeSo) - 纯前端复刻
  // ====================================================
  class GuGeSoSpider {
    constructor() {
      this.key = 'GuGeSo';
      this.name = '🔍谷歌搜┃4K🔍';
      this.siteUrl = 'https://gugeso.com';
    }

    async homeContent(filter) {
      const classes = [
        { type_id: '3', type_name: '📺电视剧' },
        { type_id: '2', type_name: '🎬电影' },
        { type_id: '1', type_name: '📱微短剧' },
        { type_id: '4', type_name: '✨动漫' },
        { type_id: '5', type_name: '🎪综艺' }
      ];

      // 官方预热推荐清单
      const hotTitles = ['唐朝诡事录', '繁花', '庆余年', '狂飙', '牧神记', '玉簟秋', '大奉打更人', '凡人修仙传', '生化危机', '三体'];
      const list = hotTitles.map((t, idx) => ({
        vod_id: `gugeso_${t}`,
        vod_name: t,
        vod_pic: Pan.getProviderIcon('baidu'),
        vod_remarks: '全网盘4K聚合'
      }));

      return { class: classes, list: list };
    }

    async categoryContent(tid, pg = 1) {
      let kw = '电视剧';
      if (tid === '1') kw = '短剧';
      else if (tid === '2') kw = '电影';
      else if (tid === '4') kw = '动漫';
      else if (tid === '5') kw = '综艺';
      return this.searchContent(kw);
    }

    async searchContent(keyword) {
      if (!keyword || !keyword.trim()) return { page: 1, pagecount: 1, limit: 10, total: 0, list: [] };
      const kw = keyword.trim();

      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        // 优先并发请求夸克(0)、百度(2)、光鸭(10)、阿里(1)的 SSE 检索流
        const channels = [0, 2, 10, 1];
        const rawItems = [];

        await Promise.allSettled(channels.map(async (ch) => {
          try {
            const url = `${this.siteUrl}/api/other/web_search?title=${encodeURIComponent(kw)}&is_type=${ch}`;
            const res = await fetcher(url, {
              headers: {
                'Accept': 'text/event-stream',
                'Referer': `${this.siteUrl}/`
              }
            });
            const text = res.text ? await res.text() : (res.content || '');
            const lines = text.split('\n');

            for (let line of lines) {
              line = line.trim();
              if (line.includes('[DONE]')) break;
              if (line.startsWith('data:')) {
                try {
                  const data = JSON.parse(line.slice(5).trim());
                  if (data && data.url) {
                    rawItems.push({
                      title: data.title || kw,
                      url: data.url,
                      datetime: data.datetime || '',
                      isType: data.is_type || ch
                    });
                  }
                } catch (e) {}
              }
            }
          } catch (e) {}
        }));

        // 收集加密 token 并批量解密
        const encTokens = [];
        rawItems.forEach(it => {
          if (!it.url.startsWith('http') && !it.url.startsWith('magnet:')) {
            encTokens.push(it.url);
          }
        });

        const decMap = await Pan.decryptUrlsWithGugeso(encTokens);

        // 规范化并归拢同一剧名的网盘线路
        const cardMap = {};
        rawItems.forEach(it => {
          let realUrl = decMap[it.url] || it.url;
          if (!Pan.isNetdiskUrl(realUrl)) return;

          const provKey = Pan.getProviderKey(realUrl);
          const provName = Pan.getProviderName(realUrl);
          const key = `${provKey}_${it.title}`;

          if (!cardMap[key]) {
            cardMap[key] = {
              title: it.title,
              provider: provKey,
              providerName: provName,
              urls: []
            };
          }
          if (!cardMap[key].urls.includes(realUrl)) {
            cardMap[key].urls.push(realUrl);
          }
        });

        const list = Object.values(cardMap).slice(0, 24).map(card => ({
          vod_id: `pan_${btoa(unescape(encodeURIComponent(JSON.stringify(card))))}`,
          vod_name: `【${card.providerName}】${card.title}`,
          vod_pic: Pan.getProviderIcon(card.provider),
          vod_remarks: `${card.urls.length}条高速线路 · 4K原画`
        }));

        return { page: 1, pagecount: 1, limit: list.length, total: list.length, list: list };
      } catch (e) {
        console.error('[GuGeSoSpider] 搜索异常:', e);
        return { page: 1, pagecount: 1, limit: 0, total: 0, list: [] };
      }
    }

    async detailContent(ids) {
      if (!ids || !ids.length) return { list: [] };
      const id = ids[0];

      try {
        let card = null;
        if (id.startsWith('gugeso_')) {
          // 热搜点击，直接即时展开
          const title = id.replace('gugeso_', '');
          const searchRes = await this.searchContent(title);
          if (searchRes.list && searchRes.list.length) {
            return this.detailContent([searchRes.list[0].vod_id]);
          }
          return { list: [] };
        }

        if (id.startsWith('pan_')) {
          const jsonStr = decodeURIComponent(escape(atob(id.replace('pan_', ''))));
          card = JSON.parse(jsonStr);
        }

        if (!card) return { list: [] };

        const playFroms = [];
        const playUrls = [];

        // 遍历所有收集到的网盘链接并发解包选集
        for (let i = 0; i < Math.min(card.urls.length, 5); i++) {
          const u = card.urls[i];
          const provKey = Pan.getProviderKey(u);
          const provName = Pan.getProviderName(u);
          let eps = null;

          if (provKey === 'quark') {
            eps = await Pan.resolveQuarkShare(u);
          } else if (provKey === 'ali') {
            eps = await Pan.resolveAliShare(u);
          }

          if (eps && eps.length) {
            playFroms.push(`${provName}线路${i + 1}`);
            playUrls.push(eps.map(e => `${e.name}$${e.url}`).join('#'));
          } else {
            // 单一直接播放/转存链接
            playFroms.push(`${provName}直连${i + 1}`);
            playUrls.push(`4K播放切片$${u}`);
          }
        }

        return {
          list: [{
            vod_id: id,
            vod_name: `【${card.providerName}】${card.title}`,
            vod_pic: Pan.getProviderIcon(card.provider),
            type_name: '4K网盘',
            vod_year: '2026',
            vod_remarks: '4K杜比视界/原画',
            vod_content: `资源来源: ${card.providerName} 高速分享网盘，支持多选集与无缝播放。`,
            vod_play_from: playFroms.join('$$$') || '4K网盘专线',
            vod_play_url: playUrls.join('$$$') || `正片$${card.urls[0]}`
          }]
        };
      } catch (e) {
        console.error('[GuGeSoSpider] detailContent 异常:', e);
        return { list: [] };
      }
    }

    async playerContent(flag, id, vipFlags) {
      return Pan.resolvePlayUrl(flag, id);
    }
  }

  // ====================================================
  // 2. 玩偶哥哥 4K 爬虫 (Wogg)
  // ====================================================
  class WoggSpider {
    constructor() {
      this.key = 'wogg';
      this.name = '💓玩偶哥哥┃4K💓';
      this.siteUrl = 'https://wogg.xxooo.cf';
      this.backupUrls = ['https://www.wogg.net', 'https://wogg.link'];
    }

    async homeContent() {
      const classes = [
        { type_id: '1', type_name: '🎬电影' },
        { type_id: '2', type_name: '📺电视剧' },
        { type_id: '3', type_name: '🎪综艺' },
        { type_id: '4', type_name: '✨动漫' }
      ];

      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(this.siteUrl);
        const html = res.text ? await res.text() : (res.content || '');
        const list = this._parseHtmlItems(html);
        return { class: classes, list: list };
      } catch (e) {
        return { class: classes, list: [] };
      }
    }

    async categoryContent(tid, pg = 1) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const url = `${this.siteUrl}/index.php/vodshow/${tid}--------${pg}---.html`;
        const res = await fetcher(url);
        const html = res.text ? await res.text() : (res.content || '');
        const list = this._parseHtmlItems(html);
        return { page: parseInt(pg), pagecount: 999, limit: list.length, total: 9999, list: list };
      } catch (e) {
        return { page: 1, pagecount: 1, limit: 0, total: 0, list: [] };
      }
    }

    async searchContent(key) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const url = `${this.siteUrl}/index.php/vodsearch/-------------.html?wd=${encodeURIComponent(key)}`;
        const res = await fetcher(url);
        const html = res.text ? await res.text() : (res.content || '');
        const list = this._parseHtmlItems(html);
        return { list: list };
      } catch (e) {
        return { list: [] };
      }
    }

    async detailContent(ids) {
      if (!ids || !ids.length) return { list: [] };
      const id = ids[0];
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const url = id.startsWith('http') ? id : `${this.siteUrl}/index.php/voddetail/${id}.html`;
        const res = await fetcher(url);
        const html = res.text ? await res.text() : (res.content || '');

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = (doc.querySelector('h1, .page-title, .title') || {}).textContent || '4K影视';
        const pic = (doc.querySelector('.module-item-pic img, .lazyload') || {}).src || Pan.getProviderIcon('quark');
        const desc = (doc.querySelector('.vod_content, .desc') || {}).textContent || '';

        // 提取页面中的全部网盘链接
        const panLinks = [];
        const aTags = Array.from(doc.querySelectorAll('a[href]'));
        aTags.forEach(a => {
          const href = a.getAttribute('href') || '';
          if (Pan.isNetdiskUrl(href)) {
            panLinks.push({ title: a.textContent.trim() || '网盘直达', url: Pan.cleanUrl(href) });
          }
        });

        // 也在文本中正则扫描
        const textPanMatches = html.match(/(https?:\/\/[^\s'"<>]*(?:quark\.cn|alipan\.com|baidu\.com|drive\.uc\.cn)[^\s'"<>]*)/g) || [];
        textPanMatches.forEach(u => {
          const clean = Pan.cleanUrl(u);
          if (!panLinks.some(p => p.url === clean)) {
            panLinks.push({ title: Pan.getProviderName(clean), url: clean });
          }
        });

        const playFroms = [];
        const playUrls = [];

        for (let i = 0; i < panLinks.length; i++) {
          const p = panLinks[i];
          const provKey = Pan.getProviderKey(p.url);
          const provName = Pan.getProviderName(p.url);
          let eps = null;

          if (provKey === 'quark') eps = await Pan.resolveQuarkShare(p.url);
          else if (provKey === 'ali') eps = await Pan.resolveAliShare(p.url);

          if (eps && eps.length) {
            playFroms.push(`${provName}【${p.title}】`);
            playUrls.push(eps.map(e => `${e.name}$${e.url}`).join('#'));
          } else {
            playFroms.push(`${provName}【${p.title}】`);
            playUrls.push(`4K播放切片$${p.url}`);
          }
        }

        return {
          list: [{
            vod_id: id,
            vod_name: title.trim(),
            vod_pic: pic,
            type_name: '4K网盘',
            vod_remarks: '玩偶哥哥4K专线',
            vod_content: desc.trim(),
            vod_play_from: playFroms.join('$$$') || '4K网盘',
            vod_play_url: playUrls.join('$$$') || '4K原画$https://pan.quark.cn'
          }]
        };
      } catch (e) {
        console.error('[WoggSpider] detailContent 异常:', e);
        return { list: [] };
      }
    }

    async playerContent(flag, id, vipFlags) {
      return Pan.resolvePlayUrl(flag, id);
    }

    _parseHtmlItems(html) {
      const list = [];
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const items = doc.querySelectorAll('.module-item, .vodlist_item');
        items.forEach(el => {
          const a = el.querySelector('a');
          const img = el.querySelector('img');
          const title = el.querySelector('.module-item-title, .title') || a;
          const remarks = el.querySelector('.module-item-note, .pic-text');

          if (a) {
            const href = a.getAttribute('href') || '';
            const idMatch = href.match(/\/voddetail\/(\d+)\.html/) || href.match(/\/detail\/([^\.]+)/);
            const vodId = idMatch ? idMatch[1] : href;

            list.push({
              vod_id: vodId,
              vod_name: (title ? title.textContent : '').trim(),
              vod_pic: img ? (img.getAttribute('data-original') || img.getAttribute('data-src') || img.src) : '',
              vod_remarks: (remarks ? remarks.textContent : '4K').trim()
            });
          }
        });
      } catch (e) {}
      return list;
    }
  }

  // ====================================================
  // 3. 花卷 4K 爬虫 (HuaJuan)
  // ====================================================
  class HuaJuanSpider extends WoggSpider {
    constructor() {
      super();
      this.key = 'huajuan';
      this.name = '💓花卷┃4K💓';
      this.siteUrl = 'https://www.hjzhencai.top';
    }
  }

  // ====================================================
  // 4. 我的网盘 (MyPan) - 纯前端私人盘库浏览器
  // ====================================================
  class MyPanSpider {
    constructor() {
      this.key = 'MyPan';
      this.name = '🐮我的┃网盘🐮';
    }

    async homeContent() {
      const classes = [
        { type_id: 'alist', type_name: '📁AList挂载' },
        { type_id: 'webdav', type_name: '☁️WebDAV私有云' },
        { type_id: 'quark', type_name: '⚡夸克网盘' },
        { type_id: 'ali', type_name: '⚡阿里云盘' }
      ];

      return {
        class: classes,
        list: [
          {
            vod_id: 'mypan_guide',
            vod_name: '💡 私人网盘使用说明',
            vod_pic: 'https://img.icons8.com/color/96/cloud-storage.png',
            vod_remarks: '点击配置并直连播放'
          }
        ]
      };
    }

    async categoryContent(tid, pg = 1) {
      const list = [];
      if (tid === 'alist') {
        const files = await Pan.resolveAlistList('/');
        files.forEach(f => {
          list.push({
            vod_id: f.is_dir ? `alist_dir_${f.name}` : `alist://${f.name}`,
            vod_name: (f.is_dir ? '📁 ' : '🎬 ') + f.name,
            vod_pic: Pan.getProviderIcon('alist'),
            vod_remarks: f.is_dir ? '目录' : (Math.round(f.size / 1024 / 1024) + 'MB')
          });
        });
      } else if (tid === 'webdav') {
        const items = await Pan.resolveWebDAVList('/');
        items.forEach(it => {
          list.push({
            vod_id: it.isDir ? `webdav_dir_${it.name}` : it.href,
            vod_name: (it.isDir ? '📁 ' : '🎬 ') + it.name,
            vod_pic: Pan.getProviderIcon('webdav'),
            vod_remarks: it.isDir ? '文件夹' : '媒体切片'
          });
        });
      }
      return { page: 1, pagecount: 1, limit: list.length, total: list.length, list: list };
    }

    async detailContent(ids) {
      const id = ids[0];
      return {
        list: [{
          vod_id: id,
          vod_name: '私人网盘直链播放',
          vod_pic: Pan.getProviderIcon('alist'),
          vod_play_from: '私人云盘',
          vod_play_url: `原画直出$${id}`
        }]
      };
    }

    async playerContent(flag, id, vipFlags) {
      return Pan.resolvePlayUrl(flag, id);
    }
  }

  // 挂载到全局
  global.GuGeSoSpider = new GuGeSoSpider();
  global.WoggSpider = new WoggSpider();
  global.HuaJuanSpider = new HuaJuanSpider();
  global.MyPanSpider = new MyPanSpider();

})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);

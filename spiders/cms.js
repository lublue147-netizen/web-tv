/**
 * 苹果 CMS (Apple CMS V10) 通用采集源适配器
 * 纯 JSON 协议对接，零爬虫解析，天然高可用秒播
 * 对应 subscription 中大量的 CMS 秒播专线 (如创享、剧OK、蘑菇等)
 */

(function (global) {
  'use strict';

  class AppleCmsSpider {
    constructor(key, name, apiUrl) {
      this.key = key || 'apple_cms';
      this.name = name || '⚡极速┃采集线⚡';
      this.apiUrl = (apiUrl || 'https://cj.lziapi.com/api.php/provide/vod/').replace(/\/+$/, '');
    }

    async init(ext) {
      if (ext && typeof ext === 'string' && ext.startsWith('http')) {
        this.apiUrl = ext.replace(/\/+$/, '');
      }
    }

    async homeContent(filter) {
      const defaultClasses = [
        { type_id: '1', type_name: '🎬电影' },
        { type_id: '2', type_name: '📺电视剧' },
        { type_id: '3', type_name: '🎪综艺' },
        { type_id: '4', type_name: '✨动漫' }
      ];

      try {
        const fetcher = global.safeFetch || global.req || global.gmFetch;
        const res = await fetcher(`${this.apiUrl}?ac=detail`);
        const text = res.text ? await res.text() : (res.content || '');

        if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
          try {
            const data = JSON.parse(text);
            const classes = (data.class || []).map(c => ({
              type_id: String(c.type_id),
              type_name: c.type_name
            }));
            const list = (data.list || []).map(item => this._formatVod(item));
            if (list.length > 0) {
              return { class: classes.length ? classes : defaultClasses, list: list };
            }
          } catch (je) {}
        }

        // 若不是 JSON 或 JSON 为空，尝试 HTML 解析
        const htmlList = this._parseHtml(text);
        if (htmlList.length > 0) {
          return { class: defaultClasses, list: htmlList };
        }
      } catch (e) {
        console.warn(`[AppleCMS:${this.key}] homeContent 远程拉取未命中，启用本地精选推荐:`, e.message);
      }

      // 自动从本地精选库生成兜底列表，彻底杜绝首页空白
      const fallbackList = [
        { vod_id: 'fb_1', vod_name: '繁花', vod_pic: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w300/kfurX7e0Nq9F4q1bC5Ue0W3YmYq.jpg', vod_remarks: '4K超清' },
        { vod_id: 'fb_2', vod_name: '狂飙', vod_pic: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w300/o4I2aG7gTjVnO3c0zX7dE5W4r1F.jpg', vod_remarks: '共39集' },
        { vod_id: 'fb_3', vod_name: '庆余年 第二季', vod_pic: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w300/efZaIa34gXw9Q3TqZ5V2x8N1n.jpg', vod_remarks: '4K原画' },
        { vod_id: 'fb_4', vod_name: '三体', vod_pic: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w300/yF1x7VqU8mXw9B3tY1Z4x5C6v7.jpg', vod_remarks: '4K杜比' }
      ];
      return { class: defaultClasses, list: fallbackList };
    }

    async categoryContent(tid, pg = 1, filter, extend = {}) {
      try {
        const page = parseInt(pg) || 1;
        const fetcher = global.safeFetch || global.req || global.gmFetch;
        const res = await fetcher(`${this.apiUrl}?ac=detail&t=${tid}&pg=${page}`);
        const data = res.json ? await res.json() : JSON.parse(res.content || '{}');

        const list = (data.list || []).map(item => this._formatVod(item));

        return {
          page: data.page || page,
          pagecount: data.pagecount || 999,
          limit: data.limit || 20,
          total: data.total || 9999,
          list: list
        };
      } catch (e) {
        console.error(`[AppleCMS:${this.key}] categoryContent 异常:`, e);
        return { page: 1, pagecount: 1, limit: 20, total: 0, list: [] };
      }
    }

    async detailContent(ids) {
      if (!ids || !ids.length) return { list: [] };
      const id = ids[0];

      try {
        const fetcher = global.safeFetch || global.req || global.gmFetch;
        const res = await fetcher(`${this.apiUrl}?ac=detail&ids=${id}`);
        const data = res.json ? await res.json() : JSON.parse(res.content || '{}');
        const list = data.list || [];
        if (!list.length) return { list: [] };

        const item = list[0];
        const playUrlGroup = item.vod_play_url || '';
        const playFromGroup = item.vod_play_from || '默认线路';

        return {
          list: [{
            vod_id: String(item.vod_id),
            vod_name: item.vod_name,
            vod_pic: item.vod_pic,
            type_name: item.type_name,
            vod_year: item.vod_year,
            vod_area: item.vod_area,
            vod_remarks: item.vod_remarks,
            vod_actor: item.vod_actor,
            vod_director: item.vod_director,
            vod_content: (item.vod_content || '').replace(/<[^>]+>/g, '').trim(),
            vod_play_from: playFromGroup,
            vod_play_url: playUrlGroup
          }]
        };
      } catch (e) {
        console.error(`[AppleCMS:${this.key}] detailContent 异常:`, e);
        return { list: [] };
      }
    }

    async playerContent(flag, id, vipFlags) {
      // 采集站通常在 play_url 中直接提供 M3U8
      return {
        parse: 0,
        url: id,
        header: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          'Referer': this.apiUrl
        }
      };
    }

    async searchContent(key, quick) {
      try {
        const fetcher = global.safeFetch || global.req || global.gmFetch;
        const res = await fetcher(`${this.apiUrl}?ac=detail&wd=${encodeURIComponent(key)}`);
        const data = res.json ? await res.json() : JSON.parse(res.content || '{}');

        const list = (data.list || []).map(item => this._formatVod(item));
        return { list: list };
      } catch (e) {
        console.error(`[AppleCMS:${this.key}] searchContent 异常:`, e);
        return { list: [] };
      }
    }

    _parseHtml(html) {
      const list = [];
      if (!html) return list;
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const items = doc.querySelectorAll('.module-item, .vodlist_item, .hl-item-div, .pic-item, .myui-vodlist__box, a[href*="detail"]');
        items.forEach(el => {
          const a = el.querySelector('a') || (el.tagName === 'A' ? el : null);
          const img = el.querySelector('img');
          const title = el.querySelector('.module-item-title, .title, .hl-item-title') || a;
          const remarks = el.querySelector('.module-item-note, .pic-text, .remarks');
          if (a) {
            const href = a.getAttribute('href') || '';
            const m = href.match(/\/detail\/id\/(\d+)\.html/) || href.match(/\/voddetail\/(\d+)\.html/) || href.match(/\/detail\/([^\.]+)/);
            const vodId = m ? m[1] : href;
            const t = (title ? title.textContent : (a.getAttribute('title') || '')).trim();
            if (t && vodId && !list.some(item => item.vod_id === vodId)) {
              list.push({
                vod_id: vodId,
                vod_name: t,
                vod_pic: img ? (img.getAttribute('data-original') || img.getAttribute('data-src') || img.src) : '',
                vod_remarks: (remarks ? remarks.textContent : '').trim() || '秒播'
              });
            }
          }
        });
      } catch (e) {}
      return list;
    }
  }

  global.AppleCmsSpider = AppleCmsSpider;
  if (typeof module !== 'undefined' && module.exports) module.exports = AppleCmsSpider;
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this)));

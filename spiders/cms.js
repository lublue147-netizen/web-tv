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
      try {
        const fetcher = global.safeFetch || global.req || global.gmFetch;
        const res = await fetcher(`${this.apiUrl}?ac=detail`);
        const data = res.json ? await res.json() : JSON.parse(res.content || '{}');

        const classes = (data.class || []).map(c => ({
          type_id: String(c.type_id),
          type_name: c.type_name
        }));

        const list = (data.list || []).map(item => this._formatVod(item));

        return { class: classes, list: list };
      } catch (e) {
        console.error(`[AppleCMS:${this.key}] homeContent 异常:`, e);
        return { class: [], list: [] };
      }
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

    _formatVod(item) {
      return {
        vod_id: String(item.vod_id),
        vod_name: item.vod_name,
        vod_pic: item.vod_pic,
        vod_remarks: item.vod_remarks || item.vod_year || ''
      };
    }
  }

  global.AppleCmsSpider = AppleCmsSpider;
  if (typeof module !== 'undefined' && module.exports) module.exports = AppleCmsSpider;
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);

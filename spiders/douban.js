/**
 * 豆瓣热榜与推荐 (Douban) 纯前端 JS 爬虫
 * 迁移自 subscription/config/custom.json "Douban" 站点
 */

(function (global) {
  'use strict';

  const DoubanSpider = {
    key: 'douban',
    name: '🐮【豆瓣热榜】🐮',
    siteUrl: 'https://movie.douban.com',

    init: async function (ext) {},

    homeContent: async function (filter) {
      const classes = [
        { type_id: 'tv_hot', type_name: '热门剧集' },
        { type_id: 'movie_hot', type_name: '热门电影' },
        { type_id: 'anime_hot', type_name: '日本动画' },
        { type_id: 'tv_us', type_name: '欧美美剧' },
        { type_id: 'tv_kr', type_name: '热门韩剧' },
        { type_id: 'variety_hot', type_name: '精选综艺' }
      ];

      try {
        const list = await this._fetchDouban('tv', '热门', 1);
        return { class: classes, list: list };
      } catch (e) {
        console.error('[Douban] homeContent 异常:', e);
        return { class: classes, list: [] };
      }
    },

    categoryContent: async function (tid, pg = 1, filter, extend = {}) {
      const page = parseInt(pg) || 1;
      let type = 'tv';
      let tag = '热门';

      if (tid === 'movie_hot') {
        type = 'movie';
        tag = '热门';
      } else if (tid === 'tv_hot') {
        type = 'tv';
        tag = '热门';
      } else if (tid === 'anime_hot') {
        type = 'tv';
        tag = '日本动画';
      } else if (tid === 'tv_us') {
        type = 'tv';
        tag = '美剧';
      } else if (tid === 'tv_kr') {
        type = 'tv';
        tag = '韩剧';
      } else if (tid === 'variety_hot') {
        type = 'tv';
        tag = '综艺';
      }

      try {
        const list = await this._fetchDouban(type, tag, page);
        return {
          page: page,
          pagecount: 20,
          limit: 30,
          total: 600,
          list: list
        };
      } catch (e) {
        console.error('[Douban] categoryContent 异常:', e);
        return { page: page, pagecount: 1, limit: 30, total: 0, list: [] };
      }
    },

    detailContent: async function (ids) {
      if (!ids || !ids.length) return { list: [] };
      const title = ids[0];
      return {
        list: [{
          vod_id: title,
          vod_name: title,
          vod_play_from: '豆瓣聚合检索',
          vod_play_url: `点击发起聚合搜片$search:${encodeURIComponent(title)}`,
          vod_content: `《${title}》由豆瓣精选推荐，点击可自动在全网秒播站点中检索播放源。`
        }]
      };
    },

    playerContent: async function (flag, id, vipFlags) {
      return { parse: 1, url: id };
    },

    searchContent: async function (key, quick) {
      try {
        const url = `https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(key)}`;
        const fetcher = global.safeFetch || global.req || global.gmFetch;
        const res = await fetcher(url, { headers: { 'Referer': 'https://movie.douban.com/' } });
        const data = res.json ? await res.json() : JSON.parse(res.content || '[]');

        const list = (data || []).map(item => ({
          vod_id: item.title,
          vod_name: item.title,
          vod_pic: item.img,
          vod_remarks: item.year + (item.sub_title ? ` · ${item.sub_title}` : '')
        }));

        return { list: list };
      } catch (e) {
        console.error('[Douban] searchContent 异常:', e);
        return { list: [] };
      }
    },

    _fetchDouban: async function (type, tag, page = 1) {
      const pageStart = (page - 1) * 30;
      const url = `https://movie.douban.com/j/search_subjects?type=${type}&tag=${encodeURIComponent(tag)}&page_limit=30&page_start=${pageStart}`;
      const fetcher = global.safeFetch || global.req || global.gmFetch;
      const res = await fetcher(url, {
        headers: {
          'Referer': 'https://movie.douban.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0'
        }
      });
      const data = res.json ? await res.json() : JSON.parse(res.content || '{}');
      const subjects = data.subjects || [];

      return subjects.map(s => ({
        vod_id: s.title,
        vod_name: s.title,
        vod_pic: s.cover ? s.cover.replace('s_ratio_poster', 'm_ratio_poster') : '',
        vod_remarks: s.rate ? `豆瓣 ${s.rate}分` : (s.is_new ? '新上线' : '热映')
      }));
    }
  };

  global.DoubanSpider = DoubanSpider;
  if (typeof module !== 'undefined' && module.exports) module.exports = DoubanSpider;
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);

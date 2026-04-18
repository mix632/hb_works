'use strict';

/**
 * HomeMockData — 优设导航首页占位数据（与 uniapp/pages/index/home-mock 对齐）
 *
 * ─── 对应 HTTP 接口（路由实现在 home.service.js）────────────────
 * 模块前缀：/naviga/home
 *
 * | 方法 | 路径 | Query | Data 概要 |
 * |------|------|-------|-----------|
 * | GET | /naviga/home/bootstrap | 无 | headerNavDropdown, searchTabs, hotSearchTags, categories, sidebarNavPopover, footer |
 * | GET | /naviga/home/category-content | categoryId? | categoryId, resources[], newsLine, aiFeedItems[] |
 * | GET | /naviga/home/test | echo? | { ok, module, time, echo } 联调用 |
 *
 * 统一包体仍为 R({ Succeed, Message, Data })，由 NavigaHomeService 封装。
 * 落库后：可改为本类读 repo，或删除本文件改由 dal 提供数据。
 */

class HomeMockData {
  static headerNavDropdown = [
    { label: '优设榜单', bg: '#f97316', icon: '榜' },
    { label: '优设分层', bg: '#22c55e', icon: '层' },
    {
      label: '细节猎人',
      bg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      icon: '◆',
    },
    { label: '优设读报', bg: '#9333ea', icon: '报' },
    { label: '每日一问', bg: '#ea580c', icon: '#' },
    { label: '活动大赛', bg: '#38bdf8', icon: '★' },
    { label: '设计方法', bg: '#2563eb', icon: 'Ps' },
    { label: '设计规范', bg: '#ec4899', icon: '▣' },
  ];

  static searchTabs = ['常用', '百度', 'Google', '优设网', 'AI星踪岛'];

  static hotSearchTags = [
    { text: '最新AI课程', hot: true, highlight: true },
    { text: 'OpenClaw', hot: true },
    { text: 'Nano Banana', hot: true },
    { text: '即梦', hot: false },
    { text: 'AIGC', hot: false },
    { text: 'Figma', hot: false },
  ];

  static footer = {
    legal:
      '本网站所有数据及文档均受《著作权法》及相关法律法规保护，任何组织及个人不得侵权，违者将依法追究侵权责任，特此声明。优设网法律顾问：刘杰律师',
    legalMobile:
      '本网站所有数据及文档均受《著作权法》及相关法律法规保护，\n任何组织及个人不得侵权，违者将依法追究侵权责任。\n\n优设网法律顾问：刘杰律师',
    links: [
      { id: 'ad', label: '广告合作' },
      { id: 'contact', label: '联系我们' },
      { id: 'aigc', label: '@优设AIGC' },
      { id: 'uisdc', label: '优设网' },
      { id: 'uuu', label: '优优网' },
      { id: 'ucc', label: '优创网' },
    ],
    copyright: 'Copyright © 2026 优设(UISDC) — 鄂ICP备16005435号-1',
  };

  static sidebarNavPopover = [
    { label: '优设导航', bg: '#22c55e', icon: '导' },
    { label: 'AI导航', bg: '#3b82f6', icon: 'AI' },
    { label: '字体导航', bg: '#f97316', icon: 'Aa' },
    { label: '摄影导航', bg: '#8b5cf6', icon: '摄' },
    { label: '插画导航', bg: '#ec4899', icon: '画' },
    { label: 'PPT导航', bg: '#14b8a6', icon: 'P' },
    { label: '图标导航', bg: '#eab308', icon: '◇' },
    { label: '配色导航', bg: '#6366f1', icon: '彩' },
    { label: '更多导航', bg: '#64748b', icon: '···' },
  ];

  static categories = [
    { id: 'hot', name: '热门推荐', icon: '🔥' },
    { id: 'gallery', name: '高清图库', icon: '🖼', cardLayout: 'cover' },
    { id: 'tutorial', name: '设计教程', icon: '📖' },
    { id: 'ui', name: '界面设计', icon: '✨' },
    { id: 'aigc', name: 'AIGC 工具', icon: '🤖' },
    { id: 'font', name: '免费字体', icon: 'A' },
    { id: 'icon', name: '图标专题', icon: '◇' },
    { id: 'photo', name: '摄影图库', icon: '📷' },
    { id: 'illustration', name: '插画资源', icon: '🎨' },
    { id: 'mockup', name: '样机模板', icon: '📱' },
    { id: 'ppt', name: 'PPT 资源', icon: '📊' },
    { id: 'video', name: '视频素材', icon: '🎬' },
    { id: 'webtpl', name: '网页模板', icon: '🌐' },
    { id: 'mobileui', name: '移动 UI', icon: '📲' },
    { id: 'brandcase', name: '品牌案例', icon: '🏷' },
    { id: 'model3d', name: '3D 模型', icon: '🧊' },
    { id: 'audio', name: '音频音效', icon: '🎵' },
    { id: 'toolkit', name: '在线工具', icon: '🔧' },
    { id: 'inspiration', name: '设计灵感', icon: '💡' },
    { id: 'motion', name: '动效设计', icon: '〰' },
    { id: 'handbook', name: '设计手册', icon: '📚' },
    { id: 'collab', name: '协作工具', icon: '🧩' },
  ];

  static _palette = [
    '#1677ff', '#ff6a00', '#7c3aed', '#059669', '#0ea5e9',
    '#e11d48', '#f59e0b', '#2563eb', '#db2777', '#65a30d',
  ];

  static _resourceTitlesByCat = {
    hot: ['优设9图', 'AI星踪岛', 'IconFont', '即梦', '稿定设计', '花瓣网', '站酷', 'UI中国', '幕布', '飞书', '语雀', 'Notion'],
    gallery: ['Unsplash', 'Pexels', 'Pixabay', '500px', '图虫创意', '视觉中国', '图怪兽', '摄图网', '包图网', '大作', '优设图库', '觅元素'],
  };

  static _newsLineByCat = {
    hot: '热门速递：优设导航本周收录更新，热门推荐相关站点与工具持续扩充中。',
    gallery: '图库要闻：高清图库方向新增 4K 素材与版权说明更新，设计师可放心商用筛选。',
  };

  static _timePool = ['今天 10:12', '今天 09:40', '昨天 18:05', '昨天 15:22', '昨天 11:00'];

  static _categoryLabel(categoryId) {
    const c = HomeMockData.categories.find(x => x.id === categoryId);
    return c ? c.name : '推荐';
  }

  static _buildResources(categoryId) {
    const cat = HomeMockData.categories.find(x => x.id === categoryId);
    const layout = cat && cat.cardLayout === 'cover' ? 'cover' : 'compact';
    const seeds = HomeMockData._resourceTitlesByCat[categoryId] || [];
    const label = HomeMockData._categoryLabel(categoryId);
    const coverUrl = i => `https://picsum.photos/seed/uisdc-${categoryId}-${i}/640/360`;
    const palette = HomeMockData._palette;

    if (!seeds.length) {
      return Array.from({ length: 8 }, (_, i) => {
        const base = {
          id: `${categoryId}-r-${i + 1}`,
          title: `${label}示例站点 ${i + 1}`,
          desc: `【${label}】示例收录占位。`,
          color: palette[i % palette.length],
          cardLayout: layout,
        };
        if (layout === 'cover') {
          return { ...base, cover: coverUrl(i), badge: i % 2 === 0 ? 'Hot' : '推荐' };
        }
        return base;
      });
    }
    return seeds.map((title, i) => ({
      id: `${categoryId}-r-${i + 1}`,
      title,
      desc: `【${label}】${title}：占位说明，入库后可替换。`,
      color: palette[i % palette.length],
      cardLayout: layout,
      ...(layout === 'cover'
        ? { cover: coverUrl(i), badge: i % 3 === 0 ? 'Hot' : '推荐' }
        : {}),
    }));
  }

  static _buildNewsLine(categoryId) {
    return (
      HomeMockData._newsLineByCat[categoryId] ||
      `【${HomeMockData._categoryLabel(categoryId)}】要闻：本站持续收录相关工具、站点与行业短讯。`
    );
  }

  static _buildAiFeedItems(categoryId) {
    const label = HomeMockData._categoryLabel(categoryId);
    const prefix = categoryId === 'aigc' ? 'AI 前沿' : categoryId === 'hot' ? '热门速递' : label;
    const n = 10;
    const timePool = HomeMockData._timePool;
    return Array.from({ length: n }, (_, i) => ({
      id: `${categoryId}-feed-${i + 1}`,
      title: `【${prefix}】精选 ${i + 1}：与「${label}」相关的工具更新、案例与行业短讯。`,
      time: timePool[i % timePool.length],
    }));
  }

  /** 供 GET /naviga/home/bootstrap */
  static getBootstrapPayload() {
    return {
      headerNavDropdown: HomeMockData.headerNavDropdown,
      searchTabs: HomeMockData.searchTabs,
      hotSearchTags: HomeMockData.hotSearchTags,
      categories: HomeMockData.categories,
      sidebarNavPopover: HomeMockData.sidebarNavPopover,
      footer: HomeMockData.footer,
    };
  }

  /** 供 GET /naviga/home/category-content */
  static getCategoryContent(categoryId) {
    const id = categoryId && String(categoryId).trim() ? String(categoryId).trim() : 'hot';
    return {
      categoryId: id,
      resources: HomeMockData._buildResources(id),
      newsLine: HomeMockData._buildNewsLine(id),
      aiFeedItems: HomeMockData._buildAiFeedItems(id),
    };
  }

  /**
   * 供 GET /naviga/home/test — 仅占位，确认 naviga 模块与路由可达
   * @param {{ echo?: string }} q — 来自 _params 的 query
   */
  static getTestPayload(q) {
    return {
      ok: true,
      module: 'naviga.home',
      time: new Date().toISOString(),
      echo: q && q.echo != null && q.echo !== '' ? String(q.echo) : null,
    };
  }
}

module.exports = HomeMockData;

'use strict';

/**
 * naviga.home — 优设导航首页接口（对应 uni-app pages/index）
 *
 * 路由前缀：/naviga/home
 *
 * ─── 接口一览 ───
 *
 * 2) GET /naviga/home/page-config — 页面头区配置
 *    返回 Data：{ menus, allNavPopover, searchEngines, hotSearchTags, rightBanner }
 *
 * 3) GET /naviga/home/home-categories — 首页左侧菜单 + 中间各分类区块（数据量大，与 page-config 分接口）
 *    返回 Data：{ categories }
 *    - categories[]：id, name, icon, displayType（1=默认圆标卡片，2=大图 cover）, list[]
 *    - 每项另含：newsLine（顶栏/右侧要闻文案）, aiFeedItems（右侧精选列表）, hubArticles（分类 Hub 左侧图文列）
 *    - list[]：id, name, image, desc, color?（color 为圆标底色；缺省时由服务端按 RESOURCE_CARD_PALETTE 补缺，便于日后改配置表）
 *
 * 4) GET /naviga/home/hub-article?articleId= — Hub 文章详情（id 形如 {categoryId}-hub-article-{n}）
 *    返回 Data：{ article, body }
 *
 *    MenuItem（menus 为有序数组）：
 *    - style: 'dropdown' — 有子菜单；children 每项含 label, icon, bg, url（点击跳转）
 *    - style: 'link' — 无子菜单；整项点击走 url（必填），可选 tapKey 供统计
 *    公共：id, label, showBadge?, tapKey?, url?, children[]
 *
 *    allNavPopover：侧栏「全部网址导航」3×3，每项 { label, bg, icon, url }
 *
 *    searchEngines：Hero 搜索区 Tab，每项：
 *    - id, name（Tab 文案）
 *    - placeholders: string[]（输入框占位提示，前端取首项或自行轮换）
 *    - url：跳转基址（不含查询串，可含已有 query，如 ?ie=utf-8）
 *    - queryKey：查询参数名（如 wd、q）；与 url 拼成 ?queryKey=encodeURIComponent(关键词)
 *    - buttonText?：搜索按钮文案；缺省时由前端按 name 推断
 *
 *    hotSearchTags：Hero 热搜榜标签，每项 { text, hot?, highlight?, url }
 *    - url：点击后新窗口打开（H5）；小程序端复制链接或 web-view 策略由前端处理
 */

const BaseService = require('../../../../core/baseService');
const { R } = require('../../../../core/errors');
const config = require('../../../../core/serverConfig');
const clickRepo = require('../../dal/click.repo');

/** 卡片圆标底色；list 项未带 color 时由服务端补缺（后续可改读配置 / DB） */
const RESOURCE_CARD_PALETTE = [
  '#1677ff',
  '#ff6a00',
  '#7c3aed',
  '#059669',
  '#0ea5e9',
  '#e11d48',
  '#f59e0b',
  '#2563eb',
  '#db2777',
  '#65a30d',
];

function pickResourceListColor(id, index) {
  const s = String(id != null ? id : `idx-${index}`);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h + s.charCodeAt(i) * (i + 1)) % RESOURCE_CARD_PALETTE.length;
  }
  const k = (h + index * 3) % RESOURCE_CARD_PALETTE.length;
  return RESOURCE_CARD_PALETTE[k];
}

function enrichHomeCategoriesListColors(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((cat) => ({
    ...cat,
    list: (cat.list || []).map((row, i) => ({
      ...row,
      color:
        row.color && String(row.color).trim()
          ? String(row.color).trim()
          : pickResourceListColor(row.id != null ? row.id : `${cat.id}-${i}`, i),
    })),
  }));
}

const HUB_ARTICLE_PALETTE = [
  '#1677ff',
  '#ff6a00',
  '#7c3aed',
  '#059669',
  '#0ea5e9',
  '#e11d48',
  '#f59e0b',
  '#2563eb',
  '#db2777',
  '#65a30d',
];

const hubArticleTimePool = [
  '47分钟前',
  '2小时前',
  '昨天 18:02',
  '昨天 12:15',
  '04-16',
  '04-15',
];

const hubArticleAuthors = ['竹笋集', '徐红兰', '优设编辑部', '灵感库', '工具控'];

const aiFeedTimePool = [
  '今天 10:12',
  '今天 09:40',
  '昨天 18:05',
  '昨天 15:22',
  '昨天 11:00',
  '前天 16:48',
  '前天 09:15',
  '04-15',
  '04-14',
  '04-12',
  '04-10',
  '04-08',
  '04-05',
];

function buildNewsLineForCategory(categoryId, label) {
  const cid = String(categoryId || '');
  const lines = {
    hot: `热门速递：优设导航本周收录更新，${label}相关站点与工具持续扩充中。`,
    gallery: `图库要闻：${label}方向新增 4K 素材与版权说明更新，设计师可放心商用筛选。`,
    tutorial: `教程前线：${label}本周好课与免费章节已整理，含 Figma、Blender、AIGC 等方向。`,
    ui: `界面情报：${label}灵感站与组件库更新，移动端与 B 端案例一并收录。`,
    aigc: `AIGC 动态：大模型与绘图工具迭代频繁，${label}相关发布与限免活动速递。`,
    font: `字体快讯：${label}开源与商用授权说明更新，新字族与可变字体已入库。`,
    icon: `图标速递：${label}线性/面性套装更新，支持 SVG 与 Figma 一键引用。`,
    photo: `摄影资讯：${label}图库版权与签约摄影师专题上新，纪实与人像精选合集。`,
    illustration: `插画情报：${label}手绘与矢量素材专题，运营与海报场景一站补齐。`,
    mockup: `样机消息：${label}设备与包装模板更新，含透明与 4K 场景文件。`,
    ppt: `演示文稿：${label}模板与图表组件上新，汇报与融资路演场景可直接套用。`,
    video: `视频素材：${label}片头、空镜与字幕模板更新，可商用授权筛选已优化。`,
    webtpl: `网页模板：${label}响应式与落地页主题上新，含 Framer / Webflow 源文件。`,
    mobileui: `移动 UI：${label} App 截图与组件参考更新，含 iOS / Android 双端。`,
    brandcase: `品牌案例：${label}视觉与 VI 解析上新，国内外标杆项目持续收录。`,
    model3d: `3D 模型：${label}资产与可打印模型更新，含低多边形与 PBR 材质包。`,
    audio: `音频音效：${label}可商用音效与配乐专题，游戏与短视频场景分类补齐。`,
    toolkit: `在线工具：${label}效率小工具与浏览器插件上新，设计交付链路再缩短。`,
    inspiration: `灵感速递：${label}情绪板与配色案例更新，一键收藏至花瓣 / Savee。`,
    motion: `动效设计：${label} MG 与 UI 动效案例上新，含 Lottie 与 AE 工程。`,
    handbook: `设计手册：${label}规范与组件文档更新，团队可同步至语雀 / Notion。`,
    collab: `协作工具：${label}白板与文档更新，远程评审与版本对比能力增强。`,
  };
  return lines[cid] || `【${label}】要闻：本站持续收录与「${label}」相关的工具、站点与行业短讯。`;
}

function buildAiFeedForCategory(categoryId, label) {
  const cid = String(categoryId || '');
  const prefix =
    cid === 'aigc' ? 'AI 前沿' : cid === 'hot' ? '热门速递' : label;
  const n = 10;
  return Array.from({ length: n }, (_, i) => ({
    id: `${cid}-feed-${i + 1}`,
    title: `【${prefix}】精选 ${i + 1}：与「${label}」相关的工具更新、案例与行业短讯。`,
    time: aiFeedTimePool[i % aiFeedTimePool.length],
  }));
}

function buildHubArticlesForCategory(categoryId, label) {
  const cid = String(categoryId || '');
  const n = 6;
  return Array.from({ length: n }, (_, i) => ({
    id: `${cid}-hub-article-${i + 1}`,
    cover: `https://picsum.photos/seed/hubart-${cid}-${i}/400/300`,
    author: hubArticleAuthors[i % hubArticleAuthors.length],
    time: hubArticleTimePool[i % hubArticleTimePool.length],
    title:
      i === 0
        ? 'AI 还原页面设计怎么做？我实测后总结了这套「块状精修法」！'
        : `【${label}】设计实战 ${i + 1}：从需求到落地的清单与案例`,
    desc: `围绕「${label}」方向的图文导读与工具心得摘要，占位示例，接口化后可替换为真实摘要。`,
    tags:
      i % 3 === 0
        ? ['AIGC', 'AI绘画', 'Cursor', 'UI设计']
        : i % 3 === 1
          ? ['Figma', '组件库', 'B端']
          : ['排版', '品牌', '视觉'],
    titleAccent: i === 0,
    avatarColor: HUB_ARTICLE_PALETTE[i % HUB_ARTICLE_PALETTE.length],
  }));
}

function buildHubArticleBody(article, label) {
  if (!article) return '';
  return [
    `本文为「${label}」频道下的示例资讯，标题：${article.title}`,
    '',
    '在实际业务中，此处为正文：可接入 CMS 富文本、Markdown 渲染或 web-view 加载 H5。以下为占位段落，用于预览版式与行距。',
    '',
    '设计工作流里，建议将「需求拆解 → 组件选型 → 视觉还原 → 走查验收」拆成可复用清单；与 AI 协作时，可把页面按块状精修，逐块对齐标注与交互说明。',
    '',
    '若需评论、点赞、相关推荐等模块，可在本页下方继续堆叠组件。',
  ].join('\n');
}

function parseHubArticleId(articleId) {
  const raw = String(articleId || '');
  const marker = '-hub-article-';
  const j = raw.indexOf(marker);
  if (j <= 0) return null;
  const categoryId = raw.slice(0, j);
  const n = parseInt(raw.slice(j + marker.length), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return { categoryId, n };
}

function findCategoryNameInList(categories, categoryId) {
  if (!Array.isArray(categories)) return '推荐';
  const c = categories.find((x) => x && x.id === categoryId);
  return c && c.name ? String(c.name) : '推荐';
}

function enrichHomeCategoriesWithHubFeeds(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((cat) => {
    const label = cat.name ? String(cat.name) : '推荐';
    const cid = cat.id != null ? String(cat.id) : 'hot';
    return {
      ...cat,
      newsLine: buildNewsLineForCategory(cid, label),
      aiFeedItems: buildAiFeedForCategory(cid, label),
      hubArticles: buildHubArticlesForCategory(cid, label),
    };
  });
}

function joinImageUrl(image) {
  const raw = image ? String(image).trim() : '';
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = config.currentConfig && config.currentConfig.image_url
    ? String(config.currentConfig.image_url).trim()
    : '';
  if (!base) return raw;
  return `${base.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`;
}

function pickFirstString(item, keys = []) {
  for (const key of keys) {
    if (item[key] != null && item[key] !== '') return String(item[key]);
  }
  return '';
}

function normalizeStaticItem(item = {}, {
  titleKeys = ['title', 'name', 'text'],
  descKeys = ['descript', 'desc'],
  iconResolver = (value) => (value ? String(value) : ''),
  imageResolver = (value) => joinImageUrl(value),
} = {}) {
  return {
    id: item.id != null ? item.id : 0,
    title: pickFirstString(item, titleKeys),
    descript: pickFirstString(item, descKeys),
    bg: item.bg ? String(item.bg) : '',
    icon: iconResolver(item.icon),
    image: imageResolver(item.image),
    url: item.url ? String(item.url) : '',
    hot: !!item.hot,
    highlight: !!item.highlight,
  };
}

function mapNavItem(item = {}) {
  const normalized = normalizeStaticItem(item);
  return {
    id: normalized.id,
    label: normalized.title,
    title: normalized.title,
    bg: normalized.bg,
    icon: normalized.icon,
    image: normalized.image,
    url: normalized.url,
    hot: normalized.hot,
    descript: normalized.descript,
  };
}

function mapMenuItem(item = {}) {
  const normalized = normalizeStaticItem(item);
  const children = Array.isArray(item.list) ? item.list.map((child) => mapNavItem(child)) : [];
  return {
    id: normalized.id,
    style: children.length ? 'dropdown' : 'link',
    label: normalized.title,
    title: normalized.title,
    showBadge: normalized.hot,
    tapKey: normalized.title,
    url: normalized.url,
    icon: normalized.icon,
    image: normalized.image,
    hot: normalized.hot,
    descript: normalized.descript,
    children,
  };
}

function mapSearchEngineItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['name', 'title'],
    imageResolver: () => '',
  });
  const placeholders = Array.isArray(item.placeholders)
    ? item.placeholders.map(text => String(text))
    : (item.placeholder ? [String(item.placeholder)] : []);
  return {
    id: normalized.id,
    name: normalized.title,
    placeholders,
    url: normalized.url,
    queryKey: item.queryKey ? String(item.queryKey) : (item.query_key ? String(item.query_key) : ''),
    buttonText: item.buttonText ? String(item.buttonText) : (item.button_text ? String(item.button_text) : ''),
  };
}

function mapHotSearchTagItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['text', 'title'],
    imageResolver: () => '',
  });
  return {
    id: normalized.id,
    text: normalized.title,
    hot: normalized.hot,
    highlight: normalized.highlight,
    url: normalized.url,
  };
}

function mapRightBannerItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['title', 'name'],
  });
  return {
    id: normalized.id,
    title: normalized.title,
    image: normalized.image,
    url: normalized.url,
    hot: normalized.hot,
    descript: normalized.descript,
    icon: normalized.icon,
    bg: normalized.bg,
  };
}

function mapHomeCategoryListItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['name', 'title'],
    descKeys: ['desc', 'descript'],
  });
  return {
    id: normalized.id,
    name: normalized.title,
    image: normalized.image,
    desc: normalized.descript,
    color: item.color ? String(item.color) : '',
    url: normalized.url,
    hot: normalized.hot,
  };
}

function mapHomeCategoryItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['name', 'title'],
    imageResolver: () => '',
  });
  return {
    id: normalized.id,
    name: normalized.title,
    icon: normalized.icon,
    displayType: item.show_type != null ? parseInt(item.show_type, 10) || 1 : (item.display_type != null ? parseInt(item.display_type, 10) || 1 : 1),
    list: Array.isArray(item.list) ? item.list.map((child) => mapHomeCategoryListItem(child)) : [],
  };
}

class NavigaHomeService extends BaseService {
  constructor() {
    super({
      service: {},
      model: {},
      prefix: '/naviga/home',
      dto: null,
    });
  }

  get factory() {
    return require('../../factory');
  }

  async getStaticBlock({ type, platform, userId = 0 }) {
    const block = await this.factory.biz_home_staticRepo.Get({
      strWhere: 'biz_home_static.type = :type and biz_home_static.platform = :platform and biz_home_static.is_new = :is_new',
      strParams: { type, platform, is_new: 1 },
      userId,
    });
    return block && Array.isArray(block.data) ? block.data : [];
  }

  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/page-config`, { config: { noAuth: true } }, (req, reply) => this.pageConfig(req, reply));
    app.get(`${p}/home-categories`, { config: { noAuth: true } }, (req, reply) => this.homeCategories(req, reply));
    app.get(`${p}/category-items`, { config: { noAuth: true } }, (req, reply) => this.categoryItems(req, reply));
    app.get(`${p}/category-articles`, { config: { noAuth: true } }, (req, reply) => this.categoryArticles(req, reply));
    app.get(`${p}/hub-article`, { config: { noAuth: true } }, (req, reply) => this.hubArticle(req, reply));
    app.post(`${p}/click`, { config: { noAuth: true } }, (req, reply) => this.click(req, reply));
  }

  async click(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.fingerprint || !String(params.fingerprint).trim()) {
        return R({ succeed: false, msg: 'fingerprint不能为空', data: null });
      }
      if (params.home_id == null || params.home_id === '') {
        return R({ succeed: false, msg: 'home_id不能为空', data: null });
      }
      if (!params.platform || !String(params.platform).trim()) {
        return R({ succeed: false, msg: 'platform不能为空', data: null });
      }
      if (!params.event_type || !String(params.event_type).trim()) {
        return R({ succeed: false, msg: 'event_type不能为空', data: null });
      }
      if (!params.channel || !String(params.channel).trim()) {
        return R({ succeed: false, msg: 'channel不能为空', data: null });
      }

      const savedId = await clickRepo.AddOrUpdate({
        model: {
          fingerprint: String(params.fingerprint).trim(),
          home_id: parseInt(params.home_id, 10) || 0,
          time: new Date(),
          platform: String(params.platform).trim(),
          event_type: String(params.event_type).trim(),
          channel: String(params.channel).trim(),
        },
      });

      return R({ succeed: !!savedId, msg: savedId ? '' : '保存失败', data: savedId || '' });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '点击埋点保存失败', data: null });
    }
  }

  async homeCategories(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const homeData = await this.getStaticBlock({ type: 'home', platform, userId: params.userId });
      const baseCategories = homeData.map((item) => mapHomeCategoryItem(item));
      const colored = enrichHomeCategoriesListColors(baseCategories);
      const categories = enrichHomeCategoriesWithHubFeeds(colored);
      return R({ succeed: true, msg: '', data: { categories } });
    } catch (err) {
      return R({
        succeed: false,
        msg: err.message || '加载首页分类区块失败',
        data: null,
      });
    }
  }

  async categoryItems(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const categoryId = params.id != null && params.id !== '' ? String(params.id) : '';
      if (!categoryId) {
        return R({ succeed: false, msg: 'id不能为空', data: null });
      }

      const homeData = await this.getStaticBlock({ type: 'home', platform, userId: params.userId });
      const baseCategories = homeData.map((item) => mapHomeCategoryItem(item));
      const colored = enrichHomeCategoriesListColors(baseCategories);
      const category = colored.find((item) => String(item.id) === categoryId);

      return R({
        succeed: true,
        msg: '',
        data: {
          id: categoryId,
          displayType: category ? category.displayType : 1,
          items: category ? (category.list || []) : [],
        },
      });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '加载分类子项失败', data: null });
    }
  }

  async categoryArticles(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const categoryId = params.id != null && params.id !== '' ? String(params.id) : '';
      if (!categoryId) {
        return R({ succeed: false, msg: 'id不能为空', data: null });
      }

      const homeData = await this.getStaticBlock({ type: 'home', platform, userId: params.userId });
      const baseCategories = homeData.map((item) => mapHomeCategoryItem(item));
      const category = baseCategories.find((item) => String(item.id) === categoryId);
      const label = category && category.name ? String(category.name) : '推荐';
      const articles = buildHubArticlesForCategory(categoryId, label);

      return R({
        succeed: true,
        msg: '',
        data: {
          id: categoryId,
          title: label,
          items: articles,
        },
      });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '加载分类文章失败', data: null });
    }
  }

  async hubArticle(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const articleId = params.articleId;
      const parsed = parseHubArticleId(articleId);
      if (!parsed) {
        return R({ succeed: false, msg: '无效的文章 id', data: null });
      }
      const { categoryId, n } = parsed;
      const homeData = await this.getStaticBlock({ type: 'home', platform, userId: params.userId });
      const baseCategories = homeData.map((item) => mapHomeCategoryItem(item));
      const label = findCategoryNameInList(baseCategories, categoryId);
      const list = buildHubArticlesForCategory(categoryId, label);
      const article = list[n - 1] || null;
      if (!article) {
        return R({ succeed: false, msg: '未找到文章', data: null });
      }
      const body = buildHubArticleBody(article, label);
      return R({ succeed: true, msg: '', data: { article, body } });
    } catch (err) {
      return R({
        succeed: false,
        msg: err.message || '加载文章失败',
        data: null,
      });
    }
  }

  async pageConfig(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const [topMenuData, allNavData, searchEngineData, hotSearchData, rightBannerData] = await Promise.all([
        this.getStaticBlock({ type: 'top_menu', platform, userId: params.userId }),
        this.getStaticBlock({ type: 'all_nav', platform, userId: params.userId }),
        this.getStaticBlock({ type: 'search_engine', platform, userId: params.userId }),
        this.getStaticBlock({ type: 'hot_search', platform, userId: params.userId }),
        this.getStaticBlock({ type: 'right_banner', platform, userId: params.userId }),
      ]);

      const menus = topMenuData.map((item) => mapMenuItem(item));
      const searchEngines = searchEngineData.map((item) => mapSearchEngineItem(item));
      const hotSearchTags = hotSearchData.map((item) => mapHotSearchTagItem(item));
      const allNavPopover = allNavData.map((item) => mapNavItem(item));
      const rightBanner = rightBannerData.map((item) => mapRightBannerItem(item));

      const data = { menus, allNavPopover, searchEngines, hotSearchTags, rightBanner };
      return R({ succeed: true, msg: '', data: data });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '加载页面配置失败', data: null });
    }
  }
}

module.exports = new NavigaHomeService();

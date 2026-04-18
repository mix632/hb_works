'use strict';

/**
 * naviga.home — 优设导航首页接口（对应 uni-app pages/index）
 *
 * 路由前缀（与 constructor 中 prefix 一致）：
 *   /naviga/home
 *
 * ─── 接口一览（相对站点根路径，与现有 axios baseURL 拼接） ───
 *
 * 1) GET /naviga/home/bootstrap
 *    说明：首页首屏一次拉齐（顶栏下拉、搜索 Tab、热词、分类、侧栏九宫格、页脚）
 *    Query：无
 *    返回 Data：{
 *      headerNavDropdown, searchTabs, hotSearchTags, categories,
 *      sidebarNavPopover, footer: { legal, legalMobile, links, copyright }
 *    }
 *
 * 2) GET /naviga/home/category-content
 *    说明：指定分类下的主区资源卡片 + 要闻一行 + 右侧 Feed
 *    Query：categoryId（可选，默认 hot）
 *    返回 Data：{
 *      categoryId, resources[], newsLine, aiFeedItems[]
 *    }
 *
 * 3) GET /naviga/home/test
 *    说明：联调探活，确认 naviga 模块已挂载
 *    Query：echo（可选，原样带回 Data.echo）
 *    返回 Data：{ ok, module, time, echo }
 *
 * 统一包体：R({ Succeed, Message, Data })，与 CDP / 小程序 axios 拦截器一致。
 *
 * 实现说明：当前无 dal，super 传入空 service/model；不调用 super.registerRoutes，避免挂无库 CRUD。
 * 落库后：补 repo/model/dto，可再挂标准 get/getlist/save 等（参考 customer_status.service.js）。
 */

const BaseService = require('../../../../core/baseService');
const { R } = require('../../../../core/errors');
const HomeMockData = require('./home_mock.data');

class NavigaHomeService extends BaseService {
  constructor() {
    super({
      service: {},
      model: {},
      prefix: '/naviga/home',
      dto: null,
    });
  }

  // ─── 路由注册（与上方「接口一览」一一对应） ─────────────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/bootstrap`, (req, reply) => this.bootstrap(req, reply)); // GET /naviga/home/bootstrap
    app.get(`${p}/category-content`, (req, reply) => this.categoryContent(req, reply)); // GET /naviga/home/category-content
    app.get(`${p}/test`, (req, reply) => this.test(req, reply)); // GET /naviga/home/test
  }

  // ─── GET /naviga/home/bootstrap ───────────────────────────────────
  async bootstrap(req, reply) {
    void reply;
    try {
      const data = HomeMockData.getBootstrapPayload();
      return R({ Succeed: true, Message: '', Data: data });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '加载首页配置失败', Data: null });
    }
  }

  // ─── GET /naviga/home/category-content?categoryId= ────────────────
  async categoryContent(req, reply) {
    void reply;
    try {
      const q = this._params(req);
      const categoryId = q.categoryId != null && q.categoryId !== '' ? String(q.categoryId) : 'hot';
      const data = HomeMockData.getCategoryContent(categoryId);
      return R({ Succeed: true, Message: '', Data: data });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '加载分类内容失败', Data: null });
    }
  }

  // ─── GET /naviga/home/test?echo= ──────────────────────────────────
  async test(req, reply) {
    void reply;
    try {
      const q = this._params(req);
      const data = HomeMockData.getTestPayload(q);
      return R({ Succeed: true, Message: '', Data: data });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || 'test 失败', Data: null });
    }
  }
}

module.exports = new NavigaHomeService();

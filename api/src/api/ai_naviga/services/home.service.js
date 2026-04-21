'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/biz_home.repo');
const model = require('../model/biz_home.model');
const dto = require('../dto/biz_home.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');

class HomeService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ai_naviga/home', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由注册（与原 API 路径完全一致） ─────────────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.delete(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));
    app.post(`${p}/swap`, (req, reply) => this.swap(req, reply));
    app.post(`${p}/copy`, (req, reply) => this.copy(req, reply));
  }

  async get(req, reply) {
    const params = this._params(req);
    let m = params.model;

    if (!this.myService.IDIsEmpty(params.id)) {
      m = await this.myService.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    }
    if (!m) m = this.myModel.CopyData({
    });

    m = this._dtoFilter(this._datesToString(m), 'detail');
    return R({ succeed: true, data: m });
  }

  async _saveImpl(params, db, isSaveDetailed = false) {
    const m = this._dtoFilter(params.model, 'save');
    const isAdd = this.myService.IDIsEmpty(m.id);

    m.id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      succeed: !this.myService.IDIsEmpty(m.id),
      msg: !this.myService.IDIsEmpty(m.id) ? '保存成功' : '保存失败',
      data: m.id,
      data1: newModel,
    });
  }

  async getList(req, reply) {
    const params = this._params(req);
    const search = await this.myService.GetSearchSQL({ searchModel: params, userId: params.userId });
    const strOrder = this.myService.getOrderString(params.sortObj);
    const isLoadDetailed = params.isLoadDetailed != null ? params.isLoadDetailed : true;

    const data = R({ succeed: true, data: {} });

    if (params.isAllData) {
      const MAX_ALL = 5000;
      data.data.Items = await this.myService.GetListForPageIndex({
        strWhere: search.sql, strParams: search.params,
        strOrder, pageIndex: 0, onePageCount: MAX_ALL, isLoadDetailed, userId: params.userId,
      });
      data.data.DataTotal = data.data.Items.length;
    } else {
      data.data.PageIndex = params.PageIndex ? parseInt(params.PageIndex) : 1;
      data.data.OnePageCount = params.onePageCount ? parseInt(params.onePageCount) : this.myService.myConfig.dbConfig.onePageCount;

      const cachedTotal = params.DataTotal && params.DataTotal > 0 ? parseInt(params.DataTotal) : 0;
      const [items, total] = await Promise.all([
        this.myService.GetListForPageIndex({
          strWhere: search.sql, strParams: search.params,
          strOrder, pageIndex: data.data.PageIndex - 1,
          onePageCount: data.data.OnePageCount, isLoadDetailed, userId: params.userId,
        }),
        cachedTotal ? Promise.resolve(cachedTotal) : this.myService.Count({
          strWhere: search.sql, strParams: search.params, userId: params.userId,
        }),
      ]);
      data.data.Items = items;
      data.data.DataTotal = total;
    }

    data.data.Items = this._dtoFilter(data.data.Items, 'list');
    return this._datesToString(data);
  }

  async delete(req, reply) {
    const params = this._params(req);
    const isCascade = String(params.cascade || '') === 'true' || params.cascade === true || params.cascade === 1 || params.cascade === '1';
    const ids = Array.isArray(params.ids) && params.ids.length
      ? params.ids.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x) && x > 0)
      : (params.id ? [parseInt(params.id, 10)] : []);

    if (!ids.length) return R({ succeed: false, msg: '传入参数有误' });

    return this.myService.Transaction(async (db) => {
      if (isCascade) {
        await this.myService.Delete({
          strWhere: `${this.myService.tableName}.parent_id in (:parentIds)`,
          strParams: { parentIds: ids },
          forceExecute: true,
          userId: params.userId,
          db,
        });
      }
      return this.myService.Delete({ ids, userId: params.userId, db });
    });
  }

  async copy(req, reply) {
    const params = this._params(req);
    var model = await this.myService.Get({ id: params.id, isLoadDetailed: true });
    if (!model) {
      return util.BaseRetrun({ succeed: false, msg: '未能找到复制源数据' });
    }
    model.files = [];
    model.sort_index = 0;
    model.id = 0;
    return await this.myService.Transaction(async (db) => {
      let params2 = {
        model: model,
        userId: params.userId,
        spId: params.spId,
      };
      let succeed = await this.saveImpl(params2, db, true);
      if (!succeed.succeed) {
        return succeed;
      }
      return util.BaseRetrun({ succeed: succeed.succeed, data: succeed.data });
    });
  }
}

module.exports = new HomeService();
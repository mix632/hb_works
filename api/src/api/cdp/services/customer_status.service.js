'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/biz_customer_status.repo');
const model = require('../model/biz_customer_status.model');
const dto = require('../dto/biz_customer_status.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');

class CustomerStatusService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/cdp/customer_status', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由注册（与原 API 路径完全一致） ─────────────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.post(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));
    app.post(`${p}/swap`, (req, reply) => this.swap(req, reply));
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
    return R({ Succeed: true, Data: m });
  }

  async save(req, reply) {
    const params = this._params(req);
    if (!params.model) return R({ Succeed: false, Message: '传入参数有误' });

    const result = await this.myService.Transaction(async (db) => {
      return this._saveImpl(params, db, params.hasOwnProperty('isSaveDetailed') ? params.isSaveDetailed : true);
    });
    return result;
  }

  async _saveImpl(params, db, isSaveDetailed = false) {
    const m = this._dtoFilter(params.model, 'save');
    const isAdd = this.myService.IDIsEmpty(m.id);
    var exist = await this.myService.Get({ strWhere: `biz_customer_status.name = '${model.name}'`, db });
    if (exist && exist.id != model.id) {
      return util.BaseRetrun({ Succeed: false, Message: `类型名${model.name}已经存在，请不要重复新增` });
    }

    m.id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      Succeed: !this.myService.IDIsEmpty(m.id),
      Message: !this.myService.IDIsEmpty(m.id) ? '保存成功' : '保存失败',
      Data: m.id,
      Data1: newModel,
    });
  }

  async delete(req, reply) {
    const params = this._params(req);
    const result = await this.myService.Transaction(async (db) => {
      if (params.ids && params.ids.length) {
        return this.myService.Delete({ ids: params.ids, userId: params.userId, db });
      }
      if (params.id && !this.myService.IDIsEmpty(params.id)) {
        return this.myService.Delete({ id: params.id, userId: params.userId, db });
      }
      return R({ Succeed: false, Message: '传入参数有误' });
    });
    return result;
  }

  async getList(req, reply) {
    const params = this._params(req);
    const search = await this.myService.GetSearchSQL({ searchModel: params, userId: params.userId });
    const strOrder = this.myService.getOrderString(params.sortObj);
    const isLoadDetailed = params.isLoadDetailed != null ? params.isLoadDetailed : false;

    const data = R({ Succeed: true, Data: {} });

    if (params.isAllData) {
      const MAX_ALL = 5000;
      data.Data.Items = await this.myService.GetListForPageIndex({
        strWhere: search.sql, strParams: search.params,
        strOrder, pageIndex: 0, onePageCount: MAX_ALL, isLoadDetailed, userId: params.userId,
      });
      data.Data.DataTotal = data.Data.Items.length;
    } else {
      data.Data.PageIndex = params.PageIndex ? parseInt(params.PageIndex) : 1;
      data.Data.OnePageCount = params.onePageCount ? parseInt(params.onePageCount) : this.myService.myConfig.dbConfig.onePageCount;

      const cachedTotal = params.DataTotal && params.DataTotal > 0 ? parseInt(params.DataTotal) : 0;
      const [items, total] = await Promise.all([
        this.myService.GetListForPageIndex({
          strWhere: search.sql, strParams: search.params,
          strOrder, pageIndex: data.Data.PageIndex - 1,
          onePageCount: data.Data.OnePageCount, isLoadDetailed, userId: params.userId,
        }),
        cachedTotal ? Promise.resolve(cachedTotal) : this.myService.Count({
          strWhere: search.sql, strParams: search.params, userId: params.userId,
        }),
      ]);
      data.Data.Items = items;
      data.Data.DataTotal = total;
    }

    data.Data.Items = this._dtoFilter(data.Data.Items, 'list');
    return this._datesToString(data);
  }
}

module.exports = new CustomerStatusService();
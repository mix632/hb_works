'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/biz_platform.repo');
const model = require('../model/biz_platform.model');
const dto = require('../dto/biz_platform.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');
const dictCache = require('../../../core/dictCache');

class PlatformService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ai_naviga/platform', dto });
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
    /** 首页编辑「支持平台」多选数据源（占位，后续可接 biz_platform 表） */
    app.get(`${p}/platform-options`, (req, reply) => this.platformOptions(req, reply));
  }

  async platformOptions(req, reply) {
    let rows = dictCache.getAll('biz_platform');
    const data = (rows || []).map((row) => ({
      value: row.id,
      label: row.title,
    }));
    return R({ succeed: true, data });
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
}

module.exports = new PlatformService();

'use strict';

const jwt = require('jsonwebtoken');
const { dateFormat } = require('../utils/dateUtil');
const { R } = require('./errors');
const serverConfig = require('./serverConfig');

/** JWT 标准声明，不合并进业务参数 */
const JWT_META_KEYS = new Set(['iat', 'exp', 'nbf', 'iss', 'aud', 'jti']);

/**
 * BaseService — CRUD 模板
 * 每个子类只需提供 myService / myModel / routePrefix
 * 然后在 registerRoutes(app) 中注册即可
 *
 * 子类可覆盖的钩子：
 *   beforeSave(params, db)  — 保存前处理
 *   afterSave(model, params, db) — 保存后处理
 *   beforeDelete(ids, params, db)
 *   customLoad(datas, params) — 列表加载后额外处理
 */
class BaseService {
  constructor({ service, model, prefix, dto }) {
    this.myService = service;
    this.myModel = model;
    this.prefix = prefix;
    this.dto = dto || null;
  }

  _pickFields(obj, fields) {
    if (!fields || !obj) return obj;
    const out = {};
    for (const f of fields) {
      if (f in obj) out[f] = obj[f];
    }
    return out;
  }

  _dtoFilter(data, type) {
    const fields = this.dto?.[type];
    if (!fields) return data;
    if (Array.isArray(data)) return data.map(item => this._pickFields(item, fields));
    return this._pickFields(data, fields);
  }

  /**
   * 注册标准 CRUD 路由到 Fastify 实例
   */
  registerRoutes(app) {
    const p = this.prefix;

    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));
    app.post(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/swap`, (req, reply) => this.swapAction(req, reply));
    app.get(`${p}/getFields`, (req, reply) => this.getFieldsAction(req, reply));
    app.post(`${p}/setFields`, (req, reply) => this.setFieldsAction(req, reply));
    app.get(`${p}/getSelect2`, (req, reply) => this.getSelect2Action(req, reply));
    app.get(`${p}/setValues`, (req, reply) => this.setValuesAction(req, reply));
  }

  _params(req) {
    const p = { ...(req.query || {}), ...(req.body || {}) };

    const authRaw = req.headers?.authorization || req.headers?.Authorization;
    if (authRaw) {
      const token = String(authRaw).replace(/^Bearer\s+/i, '').replace(/"/g, '').trim();
      if (token && token !== 'undefined') {
        try {
          const payload = jwt.verify(token, serverConfig.tokenPrivateKey);
          for (const [k, v] of Object.entries(payload)) {
            if (JWT_META_KEYS.has(k)) continue;
            if (p[k] === undefined || p[k] === null || p[k] === '') {
              p[k] = v;
            }
          }
        } catch (_) {
          // 白名单等未走全局鉴权的路由可能带无效 token，忽略即可；已鉴权路由在进 handler 前已被 middleware 拒绝
        }
      }
    }

    if (req.userId != null && req.userId !== 0) {
      p.userId = req.userId;
    } else if (p.userId != null && p.userId !== '') {
      p.userId = typeof p.userId === 'string' ? parseInt(p.userId, 10) : p.userId;
    } else {
      p.userId = 0;
    }
    p.isAdmin = !!req.isAdmin;
    return p;
  }

  // ─── 标准 CRUD ────────────────────────────────────────────────
  async get(req, reply) {
    const params = this._params(req);
    let model = params.model;
    if (!this.myService.IDIsEmpty(params.id)) {
      model = await this.myService.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    }
    if (!model) model = this.myModel.CopyData({});
    model = this._datesToString(model);
    return R({ Succeed: true, Data: this._dtoFilter(model, 'detail') });
  }

  async save(req, reply) {
    const params = this._params(req);
    if (!params.model) return R({ Succeed: false, Message: '传入参数有误' });
    if (this.dto?.save) params.model = this._pickFields(params.model, this.dto.save);

    const result = await this.myService.Transaction(async (db) => {
      // 钩子: beforeSave
      if (this.beforeSave) {
        const check = await this.beforeSave(params, db);
        if (check && !check.Succeed) return check;
      }

      const model = params.model;
      const isSaveDetailed = params.hasOwnProperty('isSaveDetailed') ? params.isSaveDetailed : true;
      model.id = await this.myService.AddOrUpdate({ model, userId: params.userId, isSaveDetailed, db });

      if (this.myService.IDIsEmpty(model.id)) return R({ Succeed: false, Message: '保存失败' });

      // 钩子: afterSave
      if (this.afterSave) {
        const after = await this.afterSave(model, params, db);
        if (after && !after.Succeed) return after;
      }

      let newModel = await this.myService.Get({ id: model.id, isLoadDetailed: true, userId: params.userId, db });
      if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
      return R({
        Succeed: true,
        Message: '保存成功',
        Data: model.id,
        Data1: newModel,
      });
    });
    return result;
  }

  async delete(req, reply) {
    const params = this._params(req);
    const result = await this.myService.Transaction(async (db) => {
      if (params.ids) return this.myService.Delete({ ids: params.ids, userId: params.userId, db });
      if (params.id && !this.myService.IDIsEmpty(params.id)) return this.myService.Delete({ id: params.id, userId: params.userId, db });
      return R({ Succeed: false, Message: '传入参数有误' });
    });
    return result;
  }

  async getList(req, reply) {
    const params = this._params(req);
    const search = await this.myService.GetSearchSQL({ searchModel: params, userId: params.userId });
    const strOrder = this.myService.getOrderString(params.sortObj);
    const isLoadDetailed = params.isLoadDetailed != null ? params.isLoadDetailed : true;

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

  async swapAction(req, reply) {
    const params = this._params(req);
    return this.myService.swap({ models: params.models, userId: params.userId });
  }

  async getFieldsAction(req, reply) {
    const params = this._params(req);
    return this.myService.getFields({ id: params.id, names: params.names || [params.name] });
  }

  async setFieldsAction(req, reply) {
    const params = this._params(req);
    return this.myService.setFields({ id: params.id, values: params.fields, userId: params.userId });
  }

  async getSelect2Action(req, reply) {
    const params = this._params(req);
    let strWhere = '', strParams = {};
    if (params.key && params.titleName) {
      const validCol = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
      if (validCol.test(params.titleName)) {
        strWhere = `${this.myService.tableName}.${params.titleName} like :_selKey`;
        strParams = { _selKey: `%${params.key}%` };
      }
    }
    return this.myService.getSelect2({
      selectID: params.selectID,
      strWhere, strParams,
      tableName: this.myService.tableName,
      primaryKey: this.myService.primaryKey,
      titleName: params.titleName,
      pageIndex: params.pageIndex,
      onePageCount: params.onePageCount,
      userId: params.userId,
    });
  }

  async setValuesAction(req, reply) {
    const params = this._params(req);
    await this.myService.setValues({
      datas: params.datas, dataIdName: params.dataIdName,
      dataValueName: params.dataValueName, idName: params.idName,
      valueName: params.valueName, userId: params.userId,
    });
    return R({ Succeed: true });
  }

  _datesToString(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val instanceof Date) obj[key] = dateFormat(val);
      else if (val && typeof val === 'object' && !Array.isArray(val)) this._datesToString(val);
      else if (Array.isArray(val)) val.forEach(item => { if (typeof item === 'object') this._datesToString(item); });
    }
    return obj;
  }
}

module.exports = BaseService;

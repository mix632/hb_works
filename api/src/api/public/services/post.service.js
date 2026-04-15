'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/sys_post.repo');
const model = require('../model/sys_post.model');
const dto = require('../dto/sys_post.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');
const { ensureRuoyiModelBody } = require('./ruoyiUtil');

class PostService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/public/post', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/post/*；若依兼容：/ruoyi/system/post* ─────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.post(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));

    const ry = '/ruoyi';
    app.get(`${ry}/system/post`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.put(`${ry}/system/post`, (req, reply) => this.ruoyiSystemPut(req, reply));
    app.get(`${ry}/system/post/list`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.delete(`${ry}/system/post/:id`, (req, reply) => this.ruoyiSystemRestDelete(req, reply));
    app.get(`${ry}/system/post/:id`, (req, reply) => this.ruoyiSystemRestGet(req, reply));
  }

  /** test/public/services/post.service.js — list */
  async ruoyiSystemList(req, reply) {
    const postRepo = this.factory.sys_postRepo;
    const datas = await postRepo.GetList({ strWhere: '' });
    const rows = datas.map((e) => this.myModel.data(e));
    const out = { code: 0, rows, total: rows.length };
    util.objectDateToString({ model: out });
    return out;
  }

  async ruoyiSystemPut(req, reply) {
    ensureRuoyiModelBody(req);
    return this.save(req, reply);
  }

  /** DELETE /ruoyi/system/post/:id */
  async ruoyiSystemRestDelete(req, reply) {
    const prev = req.query;
    req.query = { ...(prev || {}), post_id: req.params.id };
    try {
      return await this.delete(req, reply);
    } finally {
      req.query = prev;
    }
  }

  /** test/public post.service — get */
  async ruoyiSystemRestGet(req, reply) {
    const params = this._params(req);
    const postRepo = this.factory.sys_postRepo;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return R({ Succeed: false, Message: '参数错误', toRuoyi: true });
    }
    const data = await postRepo.Get({ id, userId: params.userId });
    if (!data) {
      return R({ Succeed: false, Message: '未能找到岗位数据' });
    }
    return R({ Succeed: true, Message: '操作成功', toRuoyi: true, Data: this.myModel.data(data) });
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
    const r = params.model;
    const m = this._dtoFilter(
      this.myModel.CopyData({
        post_id: r.post_id ?? r.postId,
        post_code: r.post_code ?? r.postCode,
        post_name: r.post_name ?? r.postName,
        post_sort: r.post_sort ?? r.postSort,
        status: r.status,
        create_by: r.create_by ?? r.createBy,
        create_time: r.create_time ?? r.createTime,
        update_by: r.update_by ?? r.updateBy,
        update_time: r.update_time ?? r.updateTime,
        remark: r.remark,
      }),
      'save',
    );
    const isAdd = this.myService.IDIsEmpty(m.id);

    m.post_id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.post_id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      Succeed: !this.myService.IDIsEmpty(m.post_id),
      Message: !this.myService.IDIsEmpty(m.post_id) ? '保存成功' : '保存失败',
      Data: m.post_id,
      Data1: newModel,
    });
  }

  async delete(req, reply) {
    const params = this._params(req);
    const result = await this.myService.Transaction(async (db) => {
      if (params.ids && params.ids.length) {
        return this.myService.Delete({ ids: params.ids, userId: params.userId, db });
      }
      if (params.post_id && !this.myService.IDIsEmpty(params.post_id)) {
        return this.myService.Delete({ id: params.post_id, userId: params.userId, db });
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

module.exports = new PostService();
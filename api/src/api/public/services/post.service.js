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

class PostService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ruoyi', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/post/*；若依兼容：/ruoyi/system/post* ─────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/system/post`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.post(`${p}/system/post`, (req, reply) => this.save(req, reply));
    app.put(`${p}/system/post`, (req, reply) => this.save(req, reply));
    app.get(`${p}/system/post/list`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.delete(`${p}/system/post/:id`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/system/post/:id`, (req, reply) => this.get(req, reply));
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

  async get(req, reply) {
    const params = this._params(req);
    let m = params.model;

    if (!this.myService.IDIsEmpty(params.id)) {
      m = await this.myService.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    }
    if (!m) m = this.myModel.CopyData({
    });

    m = this._dtoFilter(this._datesToString(m), 'detail');
    return R({ Succeed: true, Message: '操作成功', toRuoyi: true, Data: this.myModel.data(m) });
  }

  async save(req, reply) {
    const params = this._params(req);

    const result = await this.myService.Transaction(async (db) => {
      return this._saveImpl(params, db, params.hasOwnProperty('isSaveDetailed') ? params.isSaveDetailed : true);
    });
    return result;
  }

  async _saveImpl(params, db, isSaveDetailed = false) {
    const r = params;
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
      if (params.id && !this.myService.IDIsEmpty(params.id)) {
        return this.myService.Delete({ id: params.id, userId: params.userId, db });
      }
      return R({ Succeed: false, Message: '传入参数有误' });
    });
    return result;
  }
}

module.exports = new PostService();
'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/sys_dept.repo');
const model = require('../model/sys_dept.model');
const dto = require('../dto/sys_dept.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');

class DeptService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ruoyi', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/dept/*；若依兼容：/ruoyi/system/dept*（可后续把 ry 改成与 p 对称的 /ruoyi/dept/*） ──
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/system/dept`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.post(`${p}/system/dept`, (req, reply) => this.save(req, reply));
    app.put(`${p}/system/dept`, (req, reply) => this.save(req, reply));
    app.get(`${p}/system/dept/list`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.get(`${p}/system/dept/list/exclude/:deptId`, (req, reply) => this.listExclude(req, reply));
    app.delete(`${p}/system/dept/:id`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/system/dept/:id`, (req, reply) => this.get(req, reply));
  }

  /** test/public/services/dept.service.js — list */
  async ruoyiSystemList(req, reply) {
    const params = this._params(req);
    const deptRepo = this.factory.sys_deptRepo;
    const menus = await deptRepo.GetList({ strWhere: '' });
    const data = menus.map((e) => this.myModel.data(e));
    return R({ succeed: true, msg: '操作成功', toRuoyi: true, params: { data } });
  }

  /**
   * 若依官方：GET /system/dept/list/exclude/{deptId}
   */
  async listExclude(req, reply) {
    const excludeId = parseInt(req.params.deptId, 10);
    if (Number.isNaN(excludeId)) {
      return R({ succeed: false, msg: '参数错误', toRuoyi: true });
    }
    const deptRepo = this.factory.sys_deptRepo;
    const all = await deptRepo.GetList({ strWhere: '' });
    const idStr = String(excludeId);
    const filtered = all.filter((row) => {
      if (Number(row.dept_id) === excludeId) return false;
      const parts = String(row.ancestors || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return !parts.includes(idStr);
    });
    const data = filtered.map((e) => this.myModel.data(e));
    return R({ succeed: true, msg: '操作成功', toRuoyi: true, params: { data } });
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
    return R({ succeed: true, toRuoyi: true, data: this.myModel.data(m) });
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
    // 与 test/public/services/dept.service：若依表单为 camelCase，经 CopyData 落到 snake_case
    const m = this._dtoFilter(
      this.myModel.CopyData({
        dept_id: r.dept_id ?? r.deptId,
        parent_id: r.parent_id ?? r.parentId,
        ancestors: r.ancestors,
        dept_name: r.dept_name ?? r.deptName,
        order_num: r.order_num ?? r.orderNum,
        leader: r.leader,
        phone: r.phone,
        email: r.email,
        status: r.status,
        isNotShow: r.isNotShow,
        del_flag: r.del_flag ?? r.delFlag,
        create_by: r.create_by ?? r.createBy,
        create_time: r.create_time ?? r.createTime,
        update_by: r.update_by ?? r.updateBy,
        update_time: r.update_time ?? r.updateTime,
      }),
      'save',
    );
    const isAdd = this.myService.IDIsEmpty(m.id);

    m.dept_id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.dept_id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      succeed: !this.myService.IDIsEmpty(m.dept_id),
      msg: !this.myService.IDIsEmpty(m.dept_id) ? '保存成功' : '保存失败',
      data: m.dept_id,
      data1: newModel,
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
      return R({ succeed: false, msg: '传入参数有误' });
    });
    return result;
  }
}

module.exports = new DeptService();
'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/sys_role.repo');
const model = require('../model/sys_role.model');
const dto = require('../dto/sys_role.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');
const { ensureRuoyiModelBody } = require('./ruoyiUtil');

class RoleService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/public/role', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/role/*；若依兼容：/ruoyi/system/role* ─────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.post(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));

    const ry = '/ruoyi';
    app.get(`${ry}/system/role`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.post(`${ry}/system/role`, (req, reply) => this.save(req, reply));
    app.put(`${ry}/system/role`, (req, reply) => this.save(req, reply));
    app.get(`${ry}/system/role/list`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.delete(`${ry}/system/role/:id`, (req, reply) => this.delete(req, reply));
    app.get(`${ry}/system/role/:id`, (req, reply) => this.ruoyiSystemRestGet(req, reply));
  }

  /** test/public/services/role.service.js — getList */
  async ruoyiSystemList(req, reply) {
    const params = this._params(req);
    const roleRepo = this.factory.sys_roleRepo;
    const pageNum = Math.max(1, parseInt(params.pageNum, 10) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);
    const [roleList, total] = await Promise.all([
      roleRepo.GetListForPageIndex({
        strWhere: '',
        pageIndex: pageNum - 1,
        onePageCount: pageSize,
        strOrder: 'sys_role.role_id',
        userId: params.userId,
      }),
      roleRepo.Count({ strWhere: '', userId: params.userId }),
    ]);
    const rows = [];
    for (const role of roleList) {
      rows.push({
        createBy: role.create_by,
        createTime: role.create_time,
        updateBy: role.update_by,
        updateTime: role.update_time,
        remark: role.remark,
        roleId: role.role_id,
        roleName: role.role_name,
        roleKey: role.role_key,
        roleSort: role.role_sort,
        dataScope: role.data_scope,
        menuCheckStrictly: role.menu_check_strictly,
        deptCheckStrictly: role.dept_check_strictly,
        status: role.status,
        delFlag: role.del_flag,
        flag: false,
        admin: role.role_key === 'admin',
      });
    }
    const data = { code: 0, rows, total };
    util.objectDateToString({ model: data });
    return data;
  }

  /** test/public role.service — get */
  async ruoyiSystemRestGet(req, reply) {
    const params = this._params(req);
    const roleRepo = this.factory.sys_roleRepo;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return R({ Succeed: false, Message: '参数错误', toRuoyi: true });
    }
    const data = await roleRepo.Get({ id, isLoadDetailed: true, userId: params.userId });
    if (!data) {
      return R({ Succeed: false, Message: '未能找到角色数据', toRuoyi: true });
    }
    return R({ Succeed: true, Data: this.myModel.data(data), toRuoyi: true });
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

  /**
   * test/public/services/role.service.js — save
   * 1) 事务外 AddOrUpdate（与 test 152 行一致）
   * 2) Transaction 内再次 AddOrUpdate + sys_role_menu 增删（与 test 153–176 行一致）
   */
  async save(req, reply) {
    ensureRuoyiModelBody(req);
    const params = this._params(req);
    if (!params.model) return R({ Succeed: false, Message: '传入参数有误' });

    const r = params.model;
    const m = this._dtoFilter(
      this.myModel.CopyData({
        role_id: r.role_id ?? r.roleId,
        role_name: r.role_name ?? r.roleName,
        role_key: r.role_key ?? r.roleKey,
        role_sort: r.role_sort ?? r.roleSort,
        data_scope: r.data_scope ?? r.dataScope,
        menu_check_strictly: r.menu_check_strictly ?? r.menuCheckStrictly,
        dept_check_strictly: r.dept_check_strictly ?? r.deptCheckStrictly,
        status: r.status,
        del_flag: r.del_flag ?? r.delFlag,
        create_by: r.create_by ?? r.createBy,
        create_time: r.create_time ?? r.createTime,
        update_by: r.update_by ?? r.updateBy,
        update_time: r.update_time ?? r.updateTime,
        remark: r.remark,
      }),
      'save',
    );

    m.role_id = await this.myService.AddOrUpdate({ model: m });

    const isSaveDetailed = params.hasOwnProperty('isSaveDetailed') ? params.isSaveDetailed : true;
    const result = await this.myService.Transaction(async (db) => {
      m.role_id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
      if (!m.role_id) {
        return R({ Succeed: false, Message: '数据保存失败' });
      }

      const roleMenuRepo = this.factory.sys_role_menuRepo;
      const roleMenus = await roleMenuRepo.GetList({
        strWhere: `sys_role_menu.role_id = ${m.role_id}`,
        db,
        userId: params.userId,
      });

      let addIds = params.menuIds.filter((e) => !roleMenus.map((e) => e.menu_id).includes(e));
      if (addIds.length) {
        addIds = addIds.map((e) => ({ role_id: m.role_id, menu_id: e }));
        const succeed = await roleMenuRepo.AddOrUpdateList({ models: addIds, userId: params.userId, db });
        if (!succeed.Succeed) {
          return succeed;
        }
      }

      const deleteIds = roleMenus.map((e) => e.menu_id).filter((e) => !params.menuIds.includes(e));
      if (deleteIds.length) {
        const succeed = await roleMenuRepo.Delete({
          strWhere: `sys_role_menu.role_id = ${m.role_id} and sys_role_menu.menu_id in (${util.SqlStringJoin({ ids: deleteIds })})`,
          forceExecute: true,
          userId: params.userId,
          db,
        });
        if (!succeed.Succeed) {
          return succeed;
        }
      }

      let newModel = await this.myService.Get({ id: m.role_id, isLoadDetailed: true, userId: params.userId, db });
      if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
      return R({
        Succeed: true,
        Message: '数据保存成功',
        Data: m.role_id,
        Data1: newModel,
      });
    });
    return result;
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

module.exports = new RoleService();
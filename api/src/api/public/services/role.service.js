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

class RoleService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ruoyi', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/role/*；若依兼容：/ruoyi/system/role* ─────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/system/role`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.post(`${p}/system/role`, (req, reply) => this.save(req, reply));
    app.put(`${p}/system/role`, (req, reply) => this.save(req, reply));
    app.get(`${p}/system/role/list`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.delete(`${p}/system/role/:id`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/system/role/:id`, (req, reply) => this.get(req, reply));
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

  async get(req, reply) {
    const params = this._params(req);
    let m = params.model;

    if (!this.myService.IDIsEmpty(params.id)) {
      m = await this.myService.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    }
    if (!m) m = this.myModel.CopyData({
    });

    m = this._dtoFilter(this._datesToString(m), 'detail');
    return R({ succeed: true, data: this.myModel.data(m), toRuoyi: true });
  }

  /**
   * test/public/services/role.service.js — save
   * 1) 事务外 AddOrUpdate（与 test 152 行一致）
   * 2) Transaction 内再次 AddOrUpdate + sys_role_menu 增删（与 test 153–176 行一致）
   */
  async save(req, reply) {
    const params = this._params(req);

    const r = params;
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
        return R({ succeed: false, msg: '数据保存失败' });
      }

      const roleMenuRepo = this.factory.sys_role_menuRepo;
      const roleMenus = await roleMenuRepo.GetList({
        strWhere: 'sys_role_menu.role_id = :_rid',
        strParams: { _rid: m.role_id },
        db,
        userId: params.userId,
      });

      let addIds = params.menuIds.filter((e) => !roleMenus.map((e) => e.menu_id).includes(e));
      if (addIds.length) {
        addIds = addIds.map((e) => ({ role_id: m.role_id, menu_id: e }));
        const succeed = await roleMenuRepo.AddOrUpdateList({ models: addIds, userId: params.userId, db });
        if (!succeed.succeed) {
          return succeed;
        }
      }

      const deleteIds = roleMenus.map((e) => e.menu_id).filter((e) => !params.menuIds.includes(e));
      if (deleteIds.length) {
        const succeed = await roleMenuRepo.Delete({
          strWhere: 'sys_role_menu.role_id = :_rid and sys_role_menu.menu_id in (:_mids)',
          strParams: { _rid: m.role_id, _mids: deleteIds },
          forceExecute: true,
          userId: params.userId,
          db,
        });
        if (!succeed.succeed) {
          return succeed;
        }
      }

      let newModel = await this.myService.Get({ id: m.role_id, isLoadDetailed: true, userId: params.userId, db });
      if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
      return R({
        succeed: true,
        msg: '数据保存成功',
        data: m.role_id,
        data1: newModel,
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
      return R({ succeed: false, msg: '传入参数有误' });
    });
    return result;
  }
}

module.exports = new RoleService();
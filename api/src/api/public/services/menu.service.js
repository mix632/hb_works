'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/sys_menu.repo');
const model = require('../model/sys_menu.model');
const dto = require('../dto/sys_menu.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');

class MenuService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ruoyi', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/menu/*；若依兼容：/ruoyi/system/menu* ─────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/system/menu`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.post(`${p}/system/menu`, (req, reply) => this.save(req, reply));
    app.put(`${p}/system/menu`, (req, reply) => this.save(req, reply));
    app.get(`${p}/system/menu/list`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.get(`${p}/system/menu/roleMenuTreeselect/:roleId`, (req, reply) => this.ruoyiRoleMenuTreeselect(req, reply));
    app.get(`${p}/system/menu/roleMenuTreeselect`, (req, reply) => this.ruoyiRoleMenuTreeselect(req, reply));
    app.post(`${p}/system/menu/copy`, (req, reply) => this.ruoyiMenuCopy(req, reply));
    app.get(`${p}/system/menu/copy/:menuId`, (req, reply) => this.ruoyiMenuCopy(req, reply));
    /** 必须在 /:id 之前，否则 treeselect 会被当成 id 导致「参数错误」 */
    app.get(`${p}/system/menu/treeselect`, (req, reply) => this.ruoyiMenuTreeselect(req, reply));
    app.delete(`${p}/system/menu/:id`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/system/menu/:id`, (req, reply) => this.get(req, reply));
  }

  /** test/public/services/menu.service.js — list */
  async ruoyiSystemList(req, reply) {
    const params = this._params(req);
    const menuRepo = this.factory.sys_menuRepo;
    const search = await menuRepo.GetSearchSQL({ searchModel: params, userId: params.userId });
    const menus = await menuRepo.GetList({
      strWhere: search.sql,
      strParams: search.params,
    });
    const data = menus.map((e) => this.myModel.data(e));
    return R({ Succeed: true, Message: '操作成功', toRuoyi: true, params: { data } });
  }

  /** test/public menu.service — copy（POST body / GET :menuId） */
  async ruoyiMenuCopy(req, reply) {
    const params = this._params(req);
    const rawId = req.params.menuId ?? params.menuId ?? params.id;
    const sourceId = rawId != null && rawId !== '' ? parseInt(rawId, 10) : NaN;
    if (Number.isNaN(sourceId)) {
      return R({ Succeed: false, Message: '缺少或无效的菜单 id', toRuoyi: true });
    }
    let m = await this.myService.Get({ id: sourceId, isLoadDetailed: true, userId: params.userId });
    if (!m) {
      return R({ Succeed: false, Message: '未能找到复制源数据', toRuoyi: true });
    }
    m.menu_id = 0;
    m.order_num = 0;
    m.menu_name = `${m.menu_name} 复制`;
    m.menu_id = await this.myService.AddOrUpdate({ model: m, userId: params.userId });
    if (this.myService.IDIsEmpty(m.menu_id)) {
      return R({ Succeed: false, Message: '菜单复制失败', toRuoyi: true });
    }
    const saved = await this.myService.Get({ id: m.menu_id, isLoadDetailed: true, userId: params.userId });
    return R({
      Succeed: true,
      Message: '菜单复制成功，请编辑',
      Data: saved ? this.myModel.data(saved) : null,
      toRuoyi: true,
    });
  }

  /**
   * 若依：分配角色菜单树（对应 test role.getMenuTree + treeselect）
   */
  async ruoyiRoleMenuTreeselect(req, reply) {
    const params = this._params(req);
    const roleId = req.params.roleId ?? params.roleId ?? params.id;
    const menuRepo = this.factory.sys_menuRepo;
    const roleMenuRepo = this.factory.sys_role_menuRepo;
    const search = await menuRepo.GetSearchSQL({ searchModel: params, userId: params.userId });
    let raw = await menuRepo.GetList({ strWhere: search.sql, strParams: search.params });
    let rows = raw.map((e) => this.myModel.data(e));
    if (!util.parseBool(params.isAll)) {
      rows = rows.filter((e) => !util.parseBool(e.visible));
    }
    const menus = rows.map((e) => ({
      id: e.menuId,
      pid: e.parentId,
      label: e.menuName,
    }));
    const roots = menus.filter((e) => !e.pid || e.pid === 0);
    const diguiMenu = (rs, all) => {
      for (const i of rs) {
        i.children = all.filter((el) => el.pid == i.id);
        if (i.children.length) diguiMenu(i.children, all);
      }
    };
    diguiMenu(roots, menus);

    let checkedKeys = [];
    if (roleId != null && roleId !== '') {
      const rid = parseInt(roleId, 10);
      const rm = await roleMenuRepo.GetList({
        strWhere: 'sys_role_menu.role_id = :_rid',
        strParams: { _rid: rid },
        userId: params.userId,
      });
      checkedKeys = rm.map((e) => e.menu_id);
    }
    // 与 test/public role.getMenuTree：params.menus + params.checkedKeys（勿用 Data，否则 toRuoyi 只塞 data、缺 menus）
    return R({
      Succeed: true,
      Message: '操作成功',
      toRuoyi: true,
      params: { menus: roots, checkedKeys },
    });
  }

  /**
   * 若依 GET /system/menu/treeselect — 上级菜单等下拉树（无 role 勾选，与 Java buildMenuTreeSelect 类似）
   */
  async ruoyiMenuTreeselect(req, reply) {
    const params = this._params(req);
    const menuRepo = this.factory.sys_menuRepo;
    const search = await menuRepo.GetSearchSQL({ searchModel: params, userId: params.userId });
    let raw = await menuRepo.GetList({ strWhere: search.sql, strParams: search.params });
    let rows = raw.map((e) => this.myModel.data(e));
    if (!util.parseBool(params.isAll)) {
      rows = rows.filter((e) => !util.parseBool(e.visible));
    }
    const menus = rows.map((e) => ({
      id: e.menuId,
      pid: e.parentId,
      label: e.menuName,
    }));
    const roots = menus.filter((e) => !e.pid || e.pid === 0);
    const diguiMenu = (rs, all) => {
      for (const i of rs) {
        i.children = all.filter((el) => el.pid == i.id);
        if (i.children.length) diguiMenu(i.children, all);
      }
    };
    diguiMenu(roots, menus);
    return R({
      Succeed: true,
      Message: '操作成功',
      toRuoyi: true,
      Data: roots,
    });
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
    return R({ Succeed: true, toRuoyi: true, Data: this.myModel.data(m) });
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
        menu_id: r.menu_id ?? r.menuId,
        menu_name: r.menu_name ?? r.menuName,
        parent_id: r.parent_id ?? r.parentId,
        order_num: r.order_num ?? r.orderNum,
        path: r.path,
        component: r.component,
        query: r.query,
        is_frame: r.is_frame ?? r.isFrame,
        is_cache: r.is_cache ?? r.isCache,
        menu_type: r.menu_type ?? r.menuType,
        visible: r.visible,
        status: r.status,
        edit_open_new_page: r.edit_open_new_page ?? r.editOpenNewPage,
        open_route: r.open_route ?? r.openRoute,
        perms: r.perms,
        icon: r.icon,
        i18n: r.i18n,
        isOpenUrl: r.isOpenUrl,
        create_by: r.create_by ?? r.createBy,
        create_time: r.create_time ?? r.createTime,
        update_by: r.update_by ?? r.updateBy,
        update_time: r.update_time ?? r.updateTime,
        remark: r.remark,
      }),
      'save',
    );
    const isAdd = this.myService.IDIsEmpty(m.id);

    m.menu_id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.menu_id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      Succeed: !this.myService.IDIsEmpty(m.menu_id),
      Message: !this.myService.IDIsEmpty(m.menu_id) ? '保存成功' : '保存失败',
      Data: m.menu_id,
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

module.exports = new MenuService();
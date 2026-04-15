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
const { sqlEsc, ensureRuoyiModelBody } = require('./ruoyiUtil');

class MenuService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/public/menu', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/menu/*；若依兼容：/ruoyi/system/menu* ─────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.post(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));

    const ry = '/ruoyi';
    app.get(`${ry}/system/menu`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.put(`${ry}/system/menu`, (req, reply) => this.ruoyiSystemPut(req, reply));
    app.get(`${ry}/system/menu/list`, (req, reply) => this.ruoyiSystemList(req, reply));
    app.get(`${ry}/system/menu/roleMenuTreeselect/:roleId`, (req, reply) => this.ruoyiRoleMenuTreeselect(req, reply));
    app.get(`${ry}/system/menu/roleMenuTreeselect`, (req, reply) => this.ruoyiRoleMenuTreeselect(req, reply));
    app.post(`${ry}/system/menu/copy`, (req, reply) => this.ruoyiMenuCopy(req, reply));
    app.get(`${ry}/system/menu/copy/:menuId`, (req, reply) => this.ruoyiMenuCopy(req, reply));
    app.delete(`${ry}/system/menu/:id`, (req, reply) => this.ruoyiSystemRestDelete(req, reply));
    app.get(`${ry}/system/menu/:id`, (req, reply) => this.ruoyiSystemRestGet(req, reply));
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

  async ruoyiSystemPut(req, reply) {
    ensureRuoyiModelBody(req);
    return this.save(req, reply);
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

  /** DELETE /ruoyi/system/menu/:id */
  async ruoyiSystemRestDelete(req, reply) {
    const prev = req.query;
    req.query = { ...(prev || {}), menu_id: req.params.id };
    try {
      return await this.delete(req, reply);
    } finally {
      req.query = prev;
    }
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
      const rm = await roleMenuRepo.GetList({
        strWhere: `sys_role_menu.role_id = '${sqlEsc(roleId)}'`,
        userId: params.userId,
      });
      checkedKeys = rm.map((e) => e.menu_id);
    }
    return R({
      Succeed: true,
      Message: '操作成功',
      toRuoyi: true,
      Data: roots,
      params: { checkedKeys },
    });
  }

  /** test/public menu.service — get */
  async ruoyiSystemRestGet(req, reply) {
    const params = this._params(req);
    const menuRepo = this.factory.sys_menuRepo;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return R({ Succeed: false, Message: '参数错误', toRuoyi: true });
    }
    const data = await menuRepo.Get({ id, userId: params.userId });
    if (!data) {
      return R({ Succeed: false, Message: '未能找到菜单数据' });
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
      if (params.menu_id && !this.myService.IDIsEmpty(params.menu_id)) {
        return this.myService.Delete({ id: params.menu_id, userId: params.userId, db });
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

module.exports = new MenuService();
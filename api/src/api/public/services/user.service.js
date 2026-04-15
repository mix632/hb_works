'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/sys_user.repo');
const model = require('../model/sys_user.model');
const dto = require('../dto/sys_user.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');
const deptModel = require('../model/sys_dept.model');
const postModel = require('../model/sys_post.model');
const roleModel = require('../model/sys_role.model');
const userRoleModel = require('../model/sys_user_role.model');
const userPostModel = require('../model/sys_user_post.model');
const { sqlEsc, md5Hex, ensureRuoyiModelBody, buildDeptTreeFromFlat } = require('./ruoyiUtil');

class UserService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/public/user', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/user/*；若依兼容：/ruoyi/system/user*、POST /ruoyi/resetPwd ──
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.post(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));
    app.post(`${p}/setValues`, (req, reply) => this.setValues(req, reply));
    app.post(`${p}/getSelect2`, (req, reply) => this.getSelect2(req, reply));

    const ry = '/ruoyi';
    app.put(`${ry}/system/user/profile/updatePwd`, (req, reply) => this.updatePwd(req, reply));
    app.post(`${ry}/system/user/profile/updatePwd`, (req, reply) => this.updatePwd(req, reply));
    app.post(`${ry}/resetPwd`, (req, reply) => this.resetPwd(req, reply));
    app.get(`${ry}/system/user/list`, (req, reply) => this.systemUserList(req, reply));
    app.get(`${ry}/system/user/deptTree`, (req, reply) => this.systemDeptTree(req, reply));
    app.get(`${ry}/system/user/get`, (req, reply) => this.systemUserGet(req, reply));
    app.post(`${ry}/system/user/save`, (req, reply) => this.systemUserSave(req, reply));
    app.get(`${ry}/system/user/profile`, (req, reply) => this.systemUserProfile(req, reply));
    app.put(`${ry}/system/user/profile`, (req, reply) => this.systemUserProfileSave(req, reply));
    app.put(`${ry}/system/user/profileSave`, (req, reply) => this.systemUserProfileSave(req, reply));
    app.post(`${ry}/system/user/profileSave`, (req, reply) => this.systemUserProfileSave(req, reply));
    app.put(`${ry}/system/user/changeStatus`, (req, reply) => this.systemUserChangeStatus(req, reply));
    app.post(`${ry}/system/user/changeStatus`, (req, reply) => this.systemUserChangeStatus(req, reply));
    app.get(`${ry}/system/user/export`, (req, reply) => this.systemUserExport(req, reply));
    app.post(`${ry}/system/user/export`, (req, reply) => this.systemUserExport(req, reply));
    app.post(`${ry}/system/user/setAvatar`, (req, reply) => this.systemUserSetAvatar(req, reply));
    app.get(`${ry}/system/user/getSelect2`, (req, reply) => this.systemUserGetSelect2(req, reply));
    app.post(`${ry}/system/user/getSelect2`, (req, reply) => this.systemUserGetSelect2(req, reply));
    app.get(`${ry}/system/user/getDatas`, (req, reply) => this.systemUserGetDatas(req, reply));
    app.get(`${ry}/system/user`, (req, reply) => this.systemUserList(req, reply));
    app.post(`${ry}/system/user`, (req, reply) => this.systemUserPut(req, reply));
    app.put(`${ry}/system/user`, (req, reply) => this.systemUserPut(req, reply));
    app.put(`${ry}/system/user/resetPwd`, (req, reply) => this.systemUserResetPwd(req, reply));
    app.post(`${ry}/system/user/resetPwd`, (req, reply) => this.systemUserResetPwd(req, reply));
    app.delete(`${ry}/system/user/:id`, (req, reply) => this.delete(req, reply));
    app.get(`${ry}/system/user/:id`, (req, reply) => this.systemUserRestGet(req, reply));
  }

  /** PUT|POST /ruoyi/system/user — 根级表单先包成 model（与 PUT 一致） */
  async systemUserPut(req, reply) {
    ensureRuoyiModelBody(req);
    return this.systemUserSave(req, reply);
  }

  async updatePwd(req, reply) {
    const params = this._params(req);
    const user = await this.myService.Get({ id: params.userId });
    if (!user) {
      return R({ Succeed: false, Message: '未能获取用户信息', toRuoyi: true });
    }
    if (String(user.password).toLowerCase() !== md5Hex(params.oldPassword).toLowerCase()) {
      return R({ Succeed: false, Message: '密码错误', toRuoyi: true });
    }
    user.password = md5Hex(params.newPassword);
    user.user_id = await this.myService.AddOrUpdate({ model: user });
    if (this.myService.IDIsEmpty(user.user_id)) {
      return R({ Succeed: false, Message: '修改密码失败', toRuoyi: true });
    }
    return R({ Succeed: true, Message: '修改密码成功', toRuoyi: true });
  }

  async resetPwd(req, reply) {
    const b = req.body || {};
    const params = this._params(req);
    const fromBody = b.userId != null && b.userId !== '' ? parseInt(b.userId, 10) : NaN;
    const targetUserId = !Number.isNaN(fromBody) ? fromBody : params.userId;
    const u = await this.myService.Get({ id: targetUserId });
    if (!u) {
      return R({ Succeed: false, Message: '未能获取用户信息', toRuoyi: true });
    }
    u.password = md5Hex(b.password ?? params.password);
    u.user_id = await this.myService.AddOrUpdate({ model: u });
    if (this.myService.IDIsEmpty(u.user_id)) {
      return R({ Succeed: false, Message: '修改密码失败', toRuoyi: true });
    }
    return R({ Succeed: true, Message: '修改密码成功', toRuoyi: true });
  }

  /** 若依：管理员重置用户密码 — PUT|POST /system/user/resetPwd */
  async systemUserResetPwd(req, reply) {
    const b = req.body || {};
    const q = req.query || {};
    let targetId = b.userId ?? b.user_id ?? q.userId ?? q.user_id;
    if (targetId != null && targetId !== '') {
      targetId = parseInt(targetId, 10);
    } else {
      targetId = this._params(req).userId;
    }
    const password = b.password ?? q.password;
    if (password == null || password === '') {
      return R({ Succeed: false, Message: '请输入新密码', toRuoyi: true });
    }
    const user = await this.myService.Get({ id: targetId });
    if (!user) {
      return R({ Succeed: false, Message: '未能获取用户信息', toRuoyi: true });
    }
    user.password = md5Hex(password);
    user.user_id = await this.myService.AddOrUpdate({ model: user });
    if (this.myService.IDIsEmpty(user.user_id)) {
      return R({ Succeed: false, Message: '重置密码失败', toRuoyi: true });
    }
    return R({ Succeed: true, Message: '重置密码成功', toRuoyi: true });
  }

  /** test/public user.service — get */
  async systemUserGet(req, reply) {
    const params = this._params(req);
    const postRepo = this.factory.sys_postRepo;
    const roleRepo = this.factory.sys_roleRepo;
    const userRoleRepo = this.factory.sys_user_roleRepo;
    const userPostRepo = this.factory.sys_user_postRepo;

    let data = null;
    if (params.id) {
      data = await this.myService.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    } else if (params.username) {
      data = await this.myService.Get({
        strWhere: `sys_user.user_name = '${sqlEsc(params.username)}'`,
        isLoadDetailed: true,
        userId: params.userId,
      });
    } else if (params.miniProgram) {
      data = await this.myService.Get({
        strWhere: `JSON_UNQUOTE(JSON_EXTRACT(login_data, '$.miniOpenId')) = '${sqlEsc(params.miniProgram.openId)}'`,
        isLoadDetailed: true,
        userId: params.userId,
      });
    } else {
      if (params.checkEmpty) {
        return R({ Succeed: false, Message: params.checkMsg || '未能找到用户信息', Code: 403 });
      }
      data = this.myModel.CopyData({});
    }
    if (!data) {
      return R({ Succeed: false, Message: '未能找到用户数据' });
    }
    data = this.myModel.data(data);
    let posts = await postRepo.GetList({ strWhere: '' });
    posts = posts.map((e) => postModel.data(e));
    let roles = await roleRepo.GetList({ strWhere: '' });
    roles = roles.map((e) => roleModel.data(e));
    const uid = data.userId;
    const user_role = await userRoleRepo.GetList({ strWhere: `sys_user_role.user_id = '${uid}'` });
    const user_post = await userPostRepo.GetList({ strWhere: `sys_user_post.user_id = '${uid}'` });
    const extra = {
      posts,
      roles,
      roleIds: user_role.map((e) => e.role_id),
      postIds: user_post.map((e) => e.post_id),
    };
    return R({ Succeed: true, Message: '操作成功', Data: data, params: extra, toRuoyi: true });
  }

  /** test/public user.service — save（若依 camelCase 表单） */
  async systemUserSave(req, reply) {
    const params = this._params(req);
    const m = params.model;
    if (!m) return R({ Succeed: false, Message: '传入参数有误', toRuoyi: true });

    const exist = await this.myService.Get({ strWhere: `sys_user.user_name = '${sqlEsc(m.userName)}'` });
    if (exist && exist.user_id != m.userId) {
      return R({ Succeed: false, Message: `${m.userName} 已经存在，请换一个用户名`, toRuoyi: true });
    }
    const oldModel = m.userId ? await this.myService.Get({ id: m.userId }) : null;
    const password = oldModel ? oldModel.password : (m.password ? md5Hex(m.password) : '');

    const row = this.myModel.CopyData({
      user_id: m.userId,
      dept_id: m.deptId,
      user_name: m.userName,
      nick_name: m.nickName,
      email: m.email,
      phonenumber: m.phonenumber,
      birthday: m.birthday,
      sex: m.sex,
      avatar: m.avatar,
      password,
      status: m.status,
      del_flag: m.delFlag,
      login_ip: m.loginIp,
      login_date: m.loginDate,
      login_data: m.loginData,
      user_type: m.userType,
      remark: m.remark,
      token: m.token,
      is_all_bag: m.is_all_bag,
      bag_ids: m.bag_ids,
    });
    if (m.Files) row.files = m.Files;

    const userRoleRepo = this.factory.sys_user_roleRepo;
    const userPostRepo = this.factory.sys_user_postRepo;
    const isSaveDetailed = params.hasOwnProperty('isSaveDetailed') ? params.isSaveDetailed : true;

    const inner = await this.myService.Transaction(async (db) => {
      row.user_id = await this.myService.AddOrUpdate({
        model: row,
        userId: params.userId,
        isSaveDetailed,
        db,
      });
      if (this.myService.IDIsEmpty(row.user_id)) {
        return R({ Succeed: false, Message: '用户数据保存失败', toRuoyi: true });
      }
      await userRoleRepo.Delete({
        strWhere: `sys_user_role.user_id = ${row.user_id}`,
        forceExecute: true,
        db,
      });
      for (const rid of m.roleIds || []) {
        if (!rid) continue;
        await userRoleRepo.AddOrUpdate({
          model: userRoleModel.CopyData({ user_id: row.user_id, role_id: rid }),
          db,
          isNotCheckModel: true,
        });
      }
      await userPostRepo.Delete({
        strWhere: `sys_user_post.user_id = ${row.user_id}`,
        forceExecute: true,
        db,
      });
      for (const pid of m.postIds || []) {
        if (!pid) continue;
        await userPostRepo.AddOrUpdate({
          model: userPostModel.CopyData({ user_id: row.user_id, post_id: pid }),
          db,
          isNotCheckModel: true,
        });
      }
      return R({ Succeed: true });
    });
    if (!inner.Succeed) return inner;
    const saved = await this.myService.Get({ id: row.user_id, isLoadDetailed: true, userId: params.userId });
    return R({
      Succeed: true,
      Message: '保存成功',
      Data: saved ? this.myModel.data(saved) : this.myModel.data(row),
      toRuoyi: true,
    });
  }

  /** test/public user.service — profile */
  async systemUserProfile(req, reply) {
    const params = this._params(req);
    const deptRepo = this.factory.sys_deptRepo;
    const postRepo = this.factory.sys_postRepo;
    const roleRepo = this.factory.sys_roleRepo;

    let user = await this.myService.Get({ id: params.userId });
    if (!user) {
      return R({ Succeed: false, Message: '获取个人信息失败', toRuoyi: true });
    }
    user = this.myModel.data(user);
    let dept = user.deptId ? await deptRepo.Get({ id: user.deptId }) : null;
    if (dept) {
      user.dept = deptModel.data(dept);
    }
    const posts = await postRepo.GetList({
      strWhere: `sys_post.post_id = (select post_id from sys_user_post where user_id = '${params.userId}')`,
    });
    const roles = await roleRepo.GetList({
      strWhere: `sys_role.role_id = (select role_id from sys_user_role where user_id = '${params.userId}')`,
    });
    const extra = {
      postGroup: posts.map((e) => e.post_name).join(','),
      roleGroup: roles.map((e) => e.role_name).join(','),
    };
    return R({ Succeed: true, Data: user, params: extra, toRuoyi: true });
  }

  /** test/public user.service — profileSave */
  async systemUserProfileSave(req, reply) {
    const params = this._params(req);
    let user = await this.myService.Get({ id: params.userId });
    if (!user) {
      return R({ Succeed: false, Message: '获取个人信息失败', toRuoyi: true });
    }
    user.phonenumber = params.phonenumber;
    user.email = params.email;
    user.sex = params.sex;
    user.nick_name = params.nickName;
    user.user_id = await this.myService.AddOrUpdate({ model: user, userId: params.userId });
    if (this.myService.IDIsEmpty(user.user_id)) {
      return R({ Succeed: false, Message: '资料修改失败' });
    }
    return R({ Succeed: true, Message: '资料修改成功', toRuoyi: true });
  }

  /** test/public user.service — changeStatus */
  async systemUserChangeStatus(req, reply) {
    const params = this._params(req);
    if (String(params.modifyUserId) === String(params.userId)) {
      return R({ Succeed: false, Message: '自己不能停自己的账号', toRuoyi: true });
    }
    let user = await this.myService.Get({ id: params.modifyUserId });
    if (!user) {
      return R({ Succeed: false, Message: '未能找到用户信息', toRuoyi: true });
    }
    user.status = params.status;
    user.user_id = await this.myService.AddOrUpdate({ model: user, userId: params.userId });
    if (this.myService.IDIsEmpty(user.user_id)) {
      return R({ Succeed: false, Message: '数据保存失败' });
    }
    return R({ Succeed: true, toRuoyi: true });
  }

  /** test/public user.service — export */
  async systemUserExport(req, reply) {
    const params = this._params(req);
    params.isExport = true;
    return this.systemUserList(req, reply);
  }

  /** test/public user.service — setAvatar */
  async systemUserSetAvatar(req, reply) {
    return R({
      Succeed: false,
      Message: '头像上传需配置文件上传服务（原 Moleculer base.public.myupload）',
      toRuoyi: true,
    });
  }

  /** test/public user.service — getSelect2 */
  async systemUserGetSelect2(req, reply) {
    const params = this._params(req);
    return this.myService.getSelect2({
      selectID: params.selectID,
      strWhere: params.strWhere,
      tableName: this.myService.tableName,
      primaryKey: this.myService.primaryKey,
      titleName: params.titleName,
      isKeyAddTitle: params.isKeyAddTitle,
      pageIndex: params.pageIndex,
      onePageCount: params.onePageCount,
      userId: params.userId,
    });
  }

  /** test/public user.service — getDatas */
  async systemUserGetDatas(req, reply) {
    const params = this._params(req);
    let datas = [];
    if (params.ids) {
      const ids = Array.isArray(params.ids) ? params.ids : String(params.ids).split(',');
      datas = await this.myService.GetList({ ids });
    }
    return R({ Succeed: true, Data: datas });
  }

  /** GET /ruoyi/system/user/:id */
  async systemUserRestGet(req, reply) {
    const prevQuery = req.query;
    req.query = { ...(prevQuery || {}), id: req.params.id };
    try {
      return await this.systemUserGet(req, reply);
    } finally {
      req.query = prevQuery;
    }
  }

  /** 若依用户列表 code/rows/total */
  async systemUserList(req, reply) {
    const params = this._params(req);
    const deptRepo = this.factory.sys_deptRepo;

    let sql = '';
    if (params.userName) {
      sql = util.AppendSQL({ oldSql: sql, appendSQL: `sys_user.user_name like '%${sqlEsc(params.userName)}%'` });
    }
    if (params.phonenumber) {
      sql = util.AppendSQL({ oldSql: sql, appendSQL: `sys_user.phonenumber like '%${sqlEsc(params.phonenumber)}%'` });
    }
    if (params.status) {
      sql = util.AppendSQL({ oldSql: sql, appendSQL: `sys_user.status = '${sqlEsc(params.status)}'` });
    }
    if (params.deptId) {
      const did = sqlEsc(params.deptId);
      const innerSql = `WITH RECURSIVE department_tree AS (
        SELECT dept_id FROM sys_dept WHERE dept_id = '${did}'
        UNION ALL
        SELECT d.dept_id FROM sys_dept d JOIN department_tree dt ON d.parent_id = dt.dept_id
      )
      SELECT dept_id FROM department_tree WHERE dept_id != '${did}'`;
      sql = util.AppendSQL({
        oldSql: sql,
        appendSQL: `sys_user.dept_id = '${did}' or sys_user.dept_id in (${innerSql})`,
      });
    }
    const beginTime = params['params[beginTime]'] || (params.params && params.params.beginTime);
    const endTime = params['params[endTime]'] || (params.params && params.params.endTime);
    if (beginTime) {
      sql = util.AppendSQL({ oldSql: sql, appendSQL: `sys_user.create_time >= '${sqlEsc(beginTime)}'` });
    }
    if (endTime) {
      sql = util.AppendSQL({ oldSql: sql, appendSQL: `sys_user.create_time <= '${sqlEsc(endTime)} 23:59:59'` });
    }

    const deptList = await deptRepo.GetList({ strWhere: '' });
    const deptMap = {};
    for (const dept of deptList) {
      deptMap[dept.dept_id] = {
        deptId: dept.dept_id,
        deptName: dept.dept_name,
        leader: dept.leader,
      };
    }

    const pageNum = Math.max(1, parseInt(params.pageNum, 10) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize, 10) || 10);
    const strOrder = 'sys_user.user_id';

    const [userList, total] = await Promise.all([
      this.myService.GetListForPageIndex({
        strWhere: sql,
        pageIndex: pageNum - 1,
        onePageCount: pageSize,
        strOrder,
        userId: params.userId,
      }),
      this.myService.Count({ strWhere: sql, userId: params.userId }),
    ]);

    const rows = [];
    for (const user of userList) {
      rows.push({
        createBy: user.create_by,
        createTime: user.create_time,
        updateBy: user.update_by,
        remark: user.remark,
        userId: user.user_id,
        deptId: user.dept_id,
        userName: user.user_name,
        nickName: user.nick_name,
        email: user.email,
        phonenumber: user.phonenumber,
        sex: user.sex,
        avatar: user.avatar,
        password: user.password,
        status: user.status,
        delFlag: user.del_flag,
        loginIp: user.login_ip,
        loginDate: user.login_date,
        admin: user.user_name === 'admin',
        dept: deptMap[user.dept_id],
        is_all_bag: user.is_all_bag,
        bag_ids: user.bag_ids,
      });
    }

    const data = { code: 0, rows, total };
    util.objectDateToString({ model: data });
    return data;
  }

  /** 部门树 — /system/user/deptTree */
  async systemDeptTree(req, reply) {
    const deptRepo = this.factory.sys_deptRepo;
    const deptList = await deptRepo.GetList({ strWhere: '' });
    const flat = deptList.map((d) => ({
      id: d.dept_id,
      pid: d.parent_id,
      label: d.dept_name,
      children: [],
    }));
    const tree = buildDeptTreeFromFlat(flat);
    return R({ Succeed: true, Data: tree, toRuoyi: true });
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

    m.user_id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.user_id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      Succeed: !this.myService.IDIsEmpty(m.user_id),
      Message: !this.myService.IDIsEmpty(m.user_id) ? '保存成功' : '保存失败',
      Data: m.user_id,
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
  async setValues(req, reply) {
    const params = this._params(req);
    await this.myService.setValues({
      datas: params.datas,
      dataIdName: params.dataIdName,
      dataValueName: params.dataValueName,
      idName: params.idName,
      valueName: params.valueName,
      userId: params.userId,
      db: params.db,
    });
    return params.datas;
  }
  async getSelect2(req, reply) {
    const params = this._params(req);
    const data = await this.myService.getSelect2({
      selectID: params.selectID,
      strWhere: params.strWhere,
      tableName: this.myService.tableName,
      primaryKey: this.myService.primaryKey,
      titleName: params.titleName,
      isKeyAddTitle: params.isKeyAddTitle,
      pageIndex: params.pageIndex,
      onePageCount: params.onePageCount,
      userId: params.userId,
    });
    return data;
  }
}

module.exports = new UserService();
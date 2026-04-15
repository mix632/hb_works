'use strict';

/**
 * 若依风格接口
 * - 核心：test/public/services/ruoyi.service.js
 * - user：test/public/services/user.service.js（/ruoyi/system/user/*）
 * - role/menu/dept/post 列表等：对应 test/public/services/*.service.js
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../../core/serverConfig');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const util = require('../../../utils');
const { nowStr } = require('../../../utils/dateUtil');
const factory = require('../factory');
const userRepo = require('../dal/sys_user.repo');
const userModel = require('../model/sys_user.model');
const deptModel = require('../model/sys_dept.model');
const postModel = require('../model/sys_post.model');
const roleModel = require('../model/sys_role.model');
const menuModel = require('../model/sys_menu.model');
const userRoleModel = require('../model/sys_user_role.model');
const userPostModel = require('../model/sys_user_post.model');

function md5Hex(str) {
  return crypto.createHash('md5').update(String(str || ''), 'utf8').digest('hex');
}

function createToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      username: payload.username || '',
      bagId: payload.bagId,
    },
    config.tokenPrivateKey,
    { expiresIn: '7d' },
  );
}

function sqlEsc(s) {
  return String(s ?? '').replace(/'/g, "''");
}

function copyObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** 扁平部门列表 → 树（id / pid / label / children，与 test/public user.deptTree 一致） */
function buildDeptTreeFromFlat(flat) {
  const nodes = flat.map((d) => ({
    id: d.id,
    pid: d.pid,
    label: d.label,
    children: [],
  }));
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const roots = [];
  for (const n of nodes) {
    const pid = n.pid;
    const isRoot = pid == null || pid === '' || String(pid) === '0';
    if (isRoot) {
      roots.push(n);
    } else {
      const p = byId.get(String(pid));
      if (p) p.children.push(n);
      else roots.push(n);
    }
  }
  return roots;
}

class RuoyiService extends BaseService {
  constructor() {
    super({
      service: userRepo,
      model: userModel,
      prefix: '/ruoyi',
      dto: null,
    });
  }

  registerRoutes(app) {
    const p = '/ruoyi';
    app.get(`${p}/captchaImage`, (req, reply) => this.captchaImage(req, reply));
    app.post(`${p}/login`, (req, reply) => this.login(req, reply));
    app.get(`${p}/getInfo`, (req, reply) => this.getInfo(req, reply));
    app.post(`${p}/logout`, (req, reply) => this.logout(req, reply));
    app.get(`${p}/logout`, (req, reply) => this.logout(req, reply));
    app.get(`${p}/getRouters`, (req, reply) => this.getRouters(req, reply));
    app.get(`${p}/system/dict/data/type/sys_show_hide`, (req, reply) => this.sys_show_hide(req, reply));
    app.get(`${p}/system/dict/data/type/sys_normal_disable`, (req, reply) => this.sys_normal_disable(req, reply));
    app.get(`${p}/system/dict/data/type/sys_yes_no`, (req, reply) => this.sys_yes_no(req, reply));
    app.get(`${p}/system/dict/data/type/sys_user_sex`, (req, reply) => this.sys_user_sex(req, reply));
    app.get(`${p}/system/config/configKey/sys.user.initPassword`, (req, reply) => this.sysUserInitPassword(req, reply));
    app.put(`${p}/system/user/profile/updatePwd`, (req, reply) => this.updatePwd(req, reply));
    app.post(`${p}/system/user/profile/updatePwd`, (req, reply) => this.updatePwd(req, reply));
    app.post(`${p}/resetPwd`, (req, reply) => this.resetPwd(req, reply));
    app.get(`${p}/system/user/list`, (req, reply) => this.systemUserList(req, reply));
    app.get(`${p}/system/user/deptTree`, (req, reply) => this.systemDeptTree(req, reply));
    app.get(`${p}/system/user/get`, (req, reply) => this.systemUserGet(req, reply));
    app.post(`${p}/system/user/save`, (req, reply) => this.systemUserSave(req, reply));
    app.post(`${p}/system/user/delete`, (req, reply) => this.systemUserDelete(req, reply));
    app.get(`${p}/system/user/profile`, (req, reply) => this.systemUserProfile(req, reply));
    app.put(`${p}/system/user/profileSave`, (req, reply) => this.systemUserProfileSave(req, reply));
    app.post(`${p}/system/user/profileSave`, (req, reply) => this.systemUserProfileSave(req, reply));
    app.put(`${p}/system/user/changeStatus`, (req, reply) => this.systemUserChangeStatus(req, reply));
    app.post(`${p}/system/user/changeStatus`, (req, reply) => this.systemUserChangeStatus(req, reply));
    app.get(`${p}/system/user/export`, (req, reply) => this.systemUserExport(req, reply));
    app.post(`${p}/system/user/export`, (req, reply) => this.systemUserExport(req, reply));
    app.post(`${p}/system/user/setAvatar`, (req, reply) => this.systemUserSetAvatar(req, reply));
    app.get(`${p}/system/user/getSelect2`, (req, reply) => this.systemUserGetSelect2(req, reply));
    app.post(`${p}/system/user/getSelect2`, (req, reply) => this.systemUserGetSelect2(req, reply));
    app.get(`${p}/system/user/getDatas`, (req, reply) => this.systemUserGetDatas(req, reply));
    app.get(`${p}/system/role/list`, (req, reply) => this.systemRoleList(req, reply));
    app.get(`${p}/system/menu/list`, (req, reply) => this.systemMenuList(req, reply));
    app.get(`${p}/system/dept/list`, (req, reply) => this.systemDeptList(req, reply));
    app.get(`${p}/system/post/list`, (req, reply) => this.systemPostList(req, reply));
    app.get(`${p}/system/user/:id`, (req, reply) => this.systemUserRestGet(req, reply));
  }

  _clientIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    return req.ip || '';
  }

  async captchaImage(req, reply) {
    return { captchaEnabled: false, code: 200 };
  }

  async login(req, reply) {
    const params = this._params(req);
    const userRepo = factory.sys_userRepo;
    const menuRepo = factory.sys_menuRepo;

    const env = config.currentConfig || {};
    if (!params.onlyCheckUser && env.loginCheckBag) {
      if (!params.bagId) {
        return R({ Succeed: false, Message: '未选择业务线', toRuoyi: true });
      }
    }

    let user = null;
    if (params.username) {
      const pwd = md5Hex(params.password);
      user = await userRepo.Get({
        strWhere: `sys_user.user_name = '${sqlEsc(params.username)}' and sys_user.password = '${sqlEsc(pwd)}'`,
      });
      if (!user) {
        return R({ Succeed: false, Message: '用户名或密码不对，请检查', toRuoyi: true });
      }
    } else if (params.miniProgram) {
      const oid = sqlEsc(params.miniProgram.openId);
      user = await userRepo.Get({
        strWhere: `JSON_UNQUOTE(JSON_EXTRACT(login_data, '$.miniOpenId')) = '${oid}'`,
        isLoadDetailed: true,
      });
      if (!user) {
        return R({ Succeed: false, Message: '用户名或密码不对，请检查', toRuoyi: true });
      }
    } else {
      return R({ Succeed: false, Message: '缺少用户名或小程序参数', toRuoyi: true });
    }

    if (util.parseBool(user.status)) {
      return R({ Succeed: false, Message: '账户已停用', toRuoyi: true });
    }
    if (params.onlyCheckUser) {
      return R({ Succeed: true, Data: user });
    }

    const menusList = await menuRepo.GetList({ strWhere: `sys_menu.isOpenUrl = '1'` });
    const menus = menusList && menusList[0];

    const newToken = createToken({
      username: user.user_name,
      userId: user.user_id,
      bagId: params.bagId,
    });
    user.token = newToken;
    user.login_date = nowStr();
    user.login_ip = this._clientIp(req);
    user.user_id = await userRepo.AddOrUpdate({ model: user });

    let toUrl = menus ? menus.path : '';
    if (toUrl && menus && menus.query) {
      try {
        const q = new URLSearchParams(JSON.parse(menus.query)).toString();
        toUrl += `${toUrl.includes('?') ? '&' : '?'}${q}`;
      } catch (_) { /* ignore */ }
    }

    return R({
      Succeed: true,
      Message: '登录成功',
      Data: user.user_id,
      params: { token: user.token, toUrl },
      toRuoyi: true,
    });
  }

  async getInfo(req, reply) {
    const params = this._params(req);
    const userRepo = factory.sys_userRepo;
    const uid = params.userId;
    let user = await userRepo.Get({ id: uid });
    if (!user) {
      return R({ Succeed: false, Message: '未能获取用户信息', toRuoyi: true });
    }
    user = userModel.data(user);
    const data = {
      permissions: ['*:*:*'],
      roles: ['admin'],
      user,
    };
    return R({ params: data, Succeed: true, toRuoyi: true });
  }

  async logout(req, reply) {
    return R({ Succeed: true, Message: '退出成功', toRuoyi: true });
  }

  setMenuComponent({ dbData, data }) {
    let component = 'Layout';
    if (dbData.component && !dbData.parent_id && dbData.menu_type === 'C' && !dbData.is_frame) {
      component = dbData.component;
    } else if (!dbData.component && dbData.parent_id && dbData.menu_type === 'M') {
      component = 'ParentView';
    } else if (dbData.component) {
      component = dbData.component;
    }
    data.component = component;
  }

  async getRouters(req, reply) {
    const params = this._params(req);
    const menuRepo = factory.sys_menuRepo;
    const uid = parseInt(params.userId, 10) || 0;
    const sql =
      `sys_menu.menu_id in (select menu_id from sys_role_menu where role_id in (select role_id from sys_user_role where user_id = ${uid})) or sys_menu.menu_type = 'F'`;
    const menus = await menuRepo.GetList({ strWhere: sql });

    const roots = menus.filter((e) => !e.parent_id).map((e) => {
      const data = {
        id: e.menu_id,
        name: e.path,
        path: `/${e.path}`,
        hidden: util.parseBool(e.visible),
        redirect: e.is_frame ? 'noRedirect' : null,
        component: e.component,
        alwaysShow: e.is_frame ? true : null,
        editOpenNewPage: e.edit_open_new_page,
        i18n: e.i18n,
        permission: e.perms,
        meta: {
          title: e.menu_name,
          icon: e.icon,
          noCache: util.parseBool(e.is_cache),
          link: e.is_frame ? null : e.path,
        },
        children: [],
      };
      this.setMenuComponent({ dbData: e, data });
      return data;
    });
    this.insertOpenNewPage(roots);
    this.recursionMenu({ menus, roots });
    return R({ Succeed: true, toRuoyi: true, params: { data: roots } });
  }

  /**
   * 递归子菜单（与 test/public/services/ruoyi.service.js 一致）
   */
  recursionMenu({ menus, roots }) {
    for (const i of roots) {
      const children = menus.filter((e) => e.parent_id == i.id);
      i.children = children.map((e) => {
        const data = {
          id: e.menu_id,
          name: e.path,
          path: e.path,
          hidden: util.parseBool(e.visible),
          component: e.component,
          query: e.query,
          i18n: e.i18n,
          permission: e.perms,
          editOpenNewPage: e.edit_open_new_page,
          meta: {
            title: e.menu_name,
            icon: e.icon,
            noCache: util.parseBool(e.is_cache),
            link: e.is_frame ? null : e.path,
          },
          children: [],
        };
        this.recursionMenu({ menus, roots: i.children });
        this.setMenuComponent({ dbData: e, data });
        return data;
      });
      this.insertOpenNewPage(i.children);
      this.recursionMenu({ menus, roots: i.children });
    }
  }

  /**
   * 子菜单里「新窗口编辑」路由（与 test/public 一致：最后一段 component 改为 edit）
   */
  insertOpenNewPage(menus) {
    const exists = menus.filter((e) => e.editOpenNewPage);
    if (!exists.length) return;
    for (const item of exists) {
      const copyMenu = copyObj(item);
      const name = `${copyMenu.name}/edit`;
      if (menus.some((e) => e.name === name)) continue;
      copyMenu.name = `${copyMenu.name}/edit`;
      copyMenu.path = `${copyMenu.path}/edit`;
      const parts = (copyMenu.component || '').split('/').filter((x) => x);
      if (parts.length) {
        parts.splice(parts.length - 1, 1, 'edit');
        copyMenu.component = parts.join('/');
      } else {
        copyMenu.component = 'edit';
      }
      copyMenu.hidden = true;
      menus.push(copyMenu);
    }
  }

  async sys_show_hide(req, reply) {
    return {
      msg: '操作成功',
      code: 200,
      data: [
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:25',
          updateBy: null,
          updateTime: null,
          remark: '显示菜单',
          dictCode: 4,
          dictSort: 1,
          dictLabel: '显示',
          dictValue: '0',
          dictType: 'sys_show_hide',
          cssClass: '',
          listClass: 'primary',
          isDefault: 'Y',
          status: '0',
          default: true,
        },
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:25',
          updateBy: null,
          updateTime: null,
          remark: '隐藏菜单',
          dictCode: 5,
          dictSort: 2,
          dictLabel: '隐藏',
          dictValue: '1',
          dictType: 'sys_show_hide',
          cssClass: '',
          listClass: 'danger',
          isDefault: 'N',
          status: '0',
          default: false,
        },
      ],
    };
  }

  async sys_normal_disable(req, reply) {
    return {
      msg: '操作成功',
      code: 200,
      data: [
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:26',
          updateBy: null,
          updateTime: null,
          remark: '正常状态',
          dictCode: 6,
          dictSort: 1,
          dictLabel: '正常',
          dictValue: '0',
          dictType: 'sys_normal_disable',
          cssClass: '',
          listClass: 'primary',
          isDefault: 'Y',
          status: '0',
          default: true,
        },
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:26',
          updateBy: null,
          updateTime: null,
          remark: '停用状态',
          dictCode: 7,
          dictSort: 2,
          dictLabel: '停用',
          dictValue: '1',
          dictType: 'sys_normal_disable',
          cssClass: '',
          listClass: 'danger',
          isDefault: 'N',
          status: '0',
          default: false,
        },
      ],
    };
  }

  async sys_yes_no(req, reply) {
    return {
      msg: '操作成功',
      code: 200,
      data: [
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:28',
          updateBy: null,
          updateTime: null,
          remark: '系统默认是',
          dictCode: 12,
          dictSort: 1,
          dictLabel: '是',
          dictValue: 'Y',
          dictType: 'sys_yes_no',
          cssClass: '',
          listClass: 'primary',
          isDefault: 'Y',
          status: '0',
          default: true,
        },
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:28',
          updateBy: null,
          updateTime: null,
          remark: '系统默认否',
          dictCode: 13,
          dictSort: 2,
          dictLabel: '否',
          dictValue: 'N',
          dictType: 'sys_yes_no',
          cssClass: '',
          listClass: 'danger',
          isDefault: 'N',
          status: '0',
          default: false,
        },
      ],
    };
  }

  async sys_user_sex(req, reply) {
    return {
      msg: '操作成功',
      code: 200,
      data: [
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:24',
          updateBy: null,
          updateTime: null,
          remark: '性别男',
          dictCode: 1,
          dictSort: 1,
          dictLabel: '男',
          dictValue: '0',
          dictType: 'sys_user_sex',
          cssClass: '',
          listClass: '',
          isDefault: 'Y',
          status: '0',
          default: true,
        },
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:24',
          updateBy: null,
          updateTime: null,
          remark: '性别女',
          dictCode: 2,
          dictSort: 2,
          dictLabel: '女',
          dictValue: '1',
          dictType: 'sys_user_sex',
          cssClass: '',
          listClass: '',
          isDefault: 'N',
          status: '0',
          default: false,
        },
        {
          createBy: 'admin',
          createTime: '2023-04-23 16:13:25',
          updateBy: null,
          updateTime: null,
          remark: '性别未知',
          dictCode: 3,
          dictSort: 3,
          dictLabel: '未知',
          dictValue: '2',
          dictType: 'sys_user_sex',
          cssClass: '',
          listClass: '',
          isDefault: 'N',
          status: '0',
          default: false,
        },
      ],
    };
  }

  async sysUserInitPassword(req, reply) {
    return R({ Succeed: true, Data: '123456', toRuoyi: true });
  }

  async updatePwd(req, reply) {
    const params = this._params(req);
    const userRepo = factory.sys_userRepo;
    const user = await userRepo.Get({ id: params.userId });
    if (!user) {
      return R({ Succeed: false, Message: '未能获取用户信息', toRuoyi: true });
    }
    if (String(user.password).toLowerCase() !== md5Hex(params.oldPassword).toLowerCase()) {
      return R({ Succeed: false, Message: '密码错误', toRuoyi: true });
    }
    user.password = md5Hex(params.newPassword);
    user.user_id = await userRepo.AddOrUpdate({ model: user });
    if (userRepo.IDIsEmpty(user.user_id)) {
      return R({ Succeed: false, Message: '修改密码失败', toRuoyi: true });
    }
    return R({ Succeed: true, Message: '修改密码成功', toRuoyi: true });
  }

  async resetPwd(req, reply) {
    const params = this._params(req);
    const userRepo = factory.sys_userRepo;
    const user = await userRepo.Get({ id: params.userId });
    if (!user) {
      return R({ Succeed: false, Message: '未能获取用户信息', toRuoyi: true });
    }
    user.password = md5Hex(params.password);
    user.user_id = await userRepo.AddOrUpdate({ model: user });
    if (userRepo.IDIsEmpty(user.user_id)) {
      return R({ Succeed: false, Message: '修改密码失败', toRuoyi: true });
    }
    return R({ Succeed: true, Message: '修改密码成功', toRuoyi: true });
  }

  /** test/public user.service — get */
  async systemUserGet(req, reply) {
    const params = this._params(req);
    const postRepo = factory.sys_postRepo;
    const roleRepo = factory.sys_roleRepo;
    const userRoleRepo = factory.sys_user_roleRepo;
    const userPostRepo = factory.sys_user_postRepo;

    let data = null;
    if (params.id) {
      data = await userRepo.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    } else if (params.username) {
      data = await userRepo.Get({
        strWhere: `sys_user.user_name = '${sqlEsc(params.username)}'`,
        isLoadDetailed: true,
        userId: params.userId,
      });
    } else if (params.miniProgram) {
      data = await userRepo.Get({
        strWhere: `JSON_UNQUOTE(JSON_EXTRACT(login_data, '$.miniOpenId')) = '${sqlEsc(params.miniProgram.openId)}'`,
        isLoadDetailed: true,
        userId: params.userId,
      });
    } else {
      if (params.checkEmpty) {
        return R({ Succeed: false, Message: params.checkMsg || '未能找到用户信息', Code: 403 });
      }
      data = userModel.CopyData({});
    }
    if (!data) {
      return R({ Succeed: false, Message: '未能找到用户数据' });
    }
    data = userModel.data(data);
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

  /** test/public user.service — save */
  async systemUserSave(req, reply) {
    const params = this._params(req);
    const m = params.model;
    if (!m) return R({ Succeed: false, Message: '传入参数有误', toRuoyi: true });

    const exist = await userRepo.Get({ strWhere: `sys_user.user_name = '${sqlEsc(m.userName)}'` });
    if (exist && exist.user_id != m.userId) {
      return R({ Succeed: false, Message: `${m.userName} 已经存在，请换一个用户名`, toRuoyi: true });
    }
    const oldModel = m.userId ? await userRepo.Get({ id: m.userId }) : null;
    const password = oldModel ? oldModel.password : (m.password ? md5Hex(m.password) : '');

    const model = userModel.CopyData({
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
    if (m.Files) model.files = m.Files;

    const userRoleRepo = factory.sys_user_roleRepo;
    const userPostRepo = factory.sys_user_postRepo;
    const isSaveDetailed = params.hasOwnProperty('isSaveDetailed') ? params.isSaveDetailed : true;

    const inner = await userRepo.Transaction(async (db) => {
      model.user_id = await userRepo.AddOrUpdate({
        model,
        userId: params.userId,
        isSaveDetailed,
        db,
      });
      if (userRepo.IDIsEmpty(model.user_id)) {
        return R({ Succeed: false, Message: '用户数据保存失败', toRuoyi: true });
      }
      await userRoleRepo.Delete({
        strWhere: `sys_user_role.user_id = ${model.user_id}`,
        forceExecute: true,
        db,
      });
      for (const rid of m.roleIds || []) {
        if (!rid) continue;
        await userRoleRepo.AddOrUpdate({
          model: userRoleModel.CopyData({ user_id: model.user_id, role_id: rid }),
          db,
          isNotCheckModel: true,
        });
      }
      await userPostRepo.Delete({
        strWhere: `sys_user_post.user_id = ${model.user_id}`,
        forceExecute: true,
        db,
      });
      for (const pid of m.postIds || []) {
        if (!pid) continue;
        await userPostRepo.AddOrUpdate({
          model: userPostModel.CopyData({ user_id: model.user_id, post_id: pid }),
          db,
          isNotCheckModel: true,
        });
      }
      return R({ Succeed: true });
    });
    if (!inner.Succeed) return inner;
    const saved = await userRepo.Get({ id: model.user_id, isLoadDetailed: true, userId: params.userId });
    return R({
      Succeed: true,
      Message: '保存成功',
      Data: saved ? userModel.data(saved) : userModel.data(model),
      toRuoyi: true,
    });
  }

  /** test/public user.service — delete */
  async systemUserDelete(req, reply) {
    const params = this._params(req);
    const result = await userRepo.Transaction(async (db) => {
      if (params.ids && params.ids.length) {
        return userRepo.Delete({ ids: params.ids, userId: params.userId, db });
      }
      if (params.id && !userRepo.IDIsEmpty(params.id)) {
        return userRepo.Delete({ id: params.id, userId: params.userId, db });
      }
      return R({ Succeed: false, Message: '传入参数有误' });
    });
    return result;
  }

  /** test/public user.service — profile */
  async systemUserProfile(req, reply) {
    const params = this._params(req);
    const deptRepo = factory.sys_deptRepo;
    const postRepo = factory.sys_postRepo;
    const roleRepo = factory.sys_roleRepo;

    let user = await userRepo.Get({ id: params.userId });
    if (!user) {
      return R({ Succeed: false, Message: '获取个人信息失败', toRuoyi: true });
    }
    user = userModel.data(user);
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
    let user = await userRepo.Get({ id: params.userId });
    if (!user) {
      return R({ Succeed: false, Message: '获取个人信息失败', toRuoyi: true });
    }
    user.phonenumber = params.phonenumber;
    user.email = params.email;
    user.sex = params.sex;
    user.nick_name = params.nickName;
    user.user_id = await userRepo.AddOrUpdate({ model: user, userId: params.userId });
    if (userRepo.IDIsEmpty(user.user_id)) {
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
    let user = await userRepo.Get({ id: params.modifyUserId });
    if (!user) {
      return R({ Succeed: false, Message: '未能找到用户信息', toRuoyi: true });
    }
    user.status = params.status;
    user.user_id = await userRepo.AddOrUpdate({ model: user, userId: params.userId });
    if (userRepo.IDIsEmpty(user.user_id)) {
      return R({ Succeed: false, Message: '数据保存失败' });
    }
    return R({ Succeed: true, toRuoyi: true });
  }

  /** test/public user.service — export（Excel 未接时返回与 list 相同的表格数据） */
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
    return userRepo.getSelect2({
      selectID: params.selectID,
      strWhere: params.strWhere,
      tableName: userRepo.tableName,
      primaryKey: userRepo.primaryKey,
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
      datas = await userRepo.GetList({ ids });
    }
    return R({ Succeed: true, Data: datas });
  }

  /**
   * 若依 Vue 常见请求：GET /ruoyi/system/user/123（与 /system/user/get?id=123 等价）
   */
  async systemUserRestGet(req, reply) {
    const prevQuery = req.query;
    req.query = { ...(prevQuery || {}), id: req.params.id };
    try {
      return await this.systemUserGet(req, reply);
    } finally {
      req.query = prevQuery;
    }
  }

  /** test/public/services/role.service.js — getList */
  async systemRoleList(req, reply) {
    const params = this._params(req);
    const roleRepo = factory.sys_roleRepo;
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

  /** test/public/services/menu.service.js — list */
  async systemMenuList(req, reply) {
    const params = this._params(req);
    const menuRepo = factory.sys_menuRepo;
    const search = await menuRepo.GetSearchSQL({ searchModel: params, userId: params.userId });
    const menus = await menuRepo.GetList({
      strWhere: search.sql,
      strParams: search.params,
    });
    const data = menus.map((e) => menuModel.data(e));
    return R({ Succeed: true, Message: '操作成功', toRuoyi: true, params: { data } });
  }

  /** test/public/services/dept.service.js — list */
  async systemDeptList(req, reply) {
    const params = this._params(req);
    const deptRepo = factory.sys_deptRepo;
    const menus = await deptRepo.GetList({ strWhere: '' });
    const data = menus.map((e) => deptModel.data(e));
    return R({ Succeed: true, Message: '操作成功', toRuoyi: true, params: { data } });
  }

  /** test/public/services/post.service.js — list */
  async systemPostList(req, reply) {
    const params = this._params(req);
    const postRepo = factory.sys_postRepo;
    const datas = await postRepo.GetList({ strWhere: '' });
    const rows = datas.map((e) => postModel.data(e));
    const out = { code: 0, rows, total: rows.length };
    util.objectDateToString({ model: out });
    return out;
  }

  /**
   * 若依用户列表（与 test/public/services/user.service.js getList 一致：code/rows/total）
   */
  async systemUserList(req, reply) {
    const params = this._params(req);
    const userRepo = factory.sys_userRepo;
    const deptRepo = factory.sys_deptRepo;

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
      userRepo.GetListForPageIndex({
        strWhere: sql,
        pageIndex: pageNum - 1,
        onePageCount: pageSize,
        strOrder,
        userId: params.userId,
      }),
      userRepo.Count({ strWhere: sql, userId: params.userId }),
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

  /**
   * 部门树（与 test/public/services/user.service.js deptTree 一致）
   */
  async systemDeptTree(req, reply) {
    const deptRepo = factory.sys_deptRepo;
    const deptList = await deptRepo.GetList({ strWhere: '' });
    const flat = deptList.map((dept) => ({
      id: dept.dept_id,
      pid: dept.parent_id,
      label: dept.dept_name,
      children: [],
    }));
    const tree = buildDeptTreeFromFlat(flat);
    return R({ Succeed: true, Data: tree, toRuoyi: true });
  }
}

module.exports = new RuoyiService();

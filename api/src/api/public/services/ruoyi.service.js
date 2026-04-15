'use strict';

/**
 * 若依风格接口（从 test/public/services/ruoyi.service.js 移植）
 * 前缀：/ruoyi
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../../core/serverConfig');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const util = require('../../../utils');
const { nowStr } = require('../../../utils/dateUtil');
const factory = require('../factory');
const userModel = require('../model/sys_user.model');

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

class RuoyiService extends BaseService {
  registerRoutes(app) {
    const p = '/ruoyi';
    app.get(`${p}/captchaImage`, (req, reply) => this.captchaImage(req, reply));
    app.post(`${p}/login`, (req, reply) => this.login(req, reply));
    app.get(`${p}/getInfo`, (req, reply) => this.getInfo(req, reply));
    app.post(`${p}/logout`, (req, reply) => this.logout(req, reply));
    app.get(`${p}/getRouters`, (req, reply) => this.getRouters(req, reply));
    app.get(`${p}/system/dict/data/type/sys_show_hide`, (req, reply) => this.sys_show_hide(req, reply));
    app.get(`${p}/system/dict/data/type/sys_normal_disable`, (req, reply) => this.sys_normal_disable(req, reply));
    app.get(`${p}/system/dict/data/type/sys_yes_no`, (req, reply) => this.sys_yes_no(req, reply));
    app.get(`${p}/system/dict/data/type/sys_user_sex`, (req, reply) => this.sys_user_sex(req, reply));
    app.get(`${p}/system/config/configKey/sys.user.initPassword`, (req, reply) => this.sysUserInitPassword(req, reply));
    app.put(`${p}/system/user/profile/updatePwd`, (req, reply) => this.updatePwd(req, reply));
    app.post(`${p}/system/user/profile/updatePwd`, (req, reply) => this.updatePwd(req, reply));
    app.post(`${p}/resetPwd`, (req, reply) => this.resetPwd(req, reply));
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

    const buildChild = (parentMenuId) => {
      return menus
        .filter((e) => Number(e.parent_id) === Number(parentMenuId))
        .map((e) => {
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
          this.setMenuComponent({ dbData: e, data });
          data.children = buildChild(e.menu_id);
          this.insertOpenNewPage(data.children);
          return data;
        });
    };

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
      data.children = buildChild(e.menu_id);
      this.insertOpenNewPage(data.children);
      return data;
    });
    this.insertOpenNewPage(roots);
    return R({ Succeed: true, toRuoyi: true, params: { data: roots } });
  }

  insertOpenNewPage(menus) {
    const exists = menus.filter((e) => e.editOpenNewPage);
    for (const i of exists) {
      const copyMenu = copyObj(i);
      const name = `${copyMenu.name}/edit`;
      if (menus.some((e) => e.name === name)) continue;
      copyMenu.name = `${copyMenu.name}/edit`;
      copyMenu.path = `${copyMenu.path}/edit`;
      const comp = copyMenu.component || '';
      const parts = comp.split('/').filter(Boolean);
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
}

module.exports = new RuoyiService();

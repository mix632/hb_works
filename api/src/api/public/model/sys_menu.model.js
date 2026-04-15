'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_menuModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_menu', {
      // 菜单id
      menu_id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'menu_id', defaultValue: 0, allowNull: false },
      // 菜单名称
      menu_name: { type: sequelize.STRING,  field: 'menu_name', defaultValue: '', allowNull: false },
      // 父菜单ID
      parent_id: { type: sequelize.INTEGER, field: 'parent_id', defaultValue: 0, allowNull: false },
      // 显示顺序
      order_num: { type: sequelize.INTEGER, field: 'order_num', defaultValue: 0, allowNull: false },
      // 路由地址
      path: { type: sequelize.STRING,  field: 'path', defaultValue: '', allowNull: false },
      // 组件路径
      component: { type: sequelize.STRING,  field: 'component', defaultValue: '', allowNull: false },
      // 路由参数
      query: { type: sequelize.STRING,  field: 'query', defaultValue: '', allowNull: false },
      // 是否为外链（0是 1否）
      is_frame: { type: sequelize.INTEGER, field: 'is_frame', defaultValue: 0, allowNull: false },
      // 是否缓存（0缓存 1不缓存）
      is_cache: { type: sequelize.INTEGER, field: 'is_cache', defaultValue: 0, allowNull: false },
      // 菜单类型（M目录 C菜单 F按钮）
      menu_type: { type: sequelize.STRING,  field: 'menu_type', defaultValue: '', allowNull: false },
      // 菜单状态（0显示 1隐藏）
      visible: { type: sequelize.STRING,  field: 'visible', defaultValue: '', allowNull: false },
      // 菜单状态（0正常 1停用）
      status: { type: sequelize.STRING,  field: 'status', defaultValue: '', allowNull: false },
      // 编辑窗口采用打开新页面
      edit_open_new_page: { type: sequelize.BOOLEAN, field: 'edit_open_new_page', defaultValue: false, allowNull: false },
      // 扩展路由
      open_route: { type: sequelize.STRING,  field: 'open_route', defaultValue: '', allowNull: false },
      // 权限标识
      perms: { type: sequelize.STRING,  field: 'perms', defaultValue: '', allowNull: false },
      // 菜单图标
      icon: { type: sequelize.STRING,  field: 'icon', defaultValue: '', allowNull: false },
      // 多语言
      i18n: { type: sequelize.STRING,  field: 'i18n', defaultValue: '', allowNull: false },
      // 默认打开地址
      isOpenUrl: { type: sequelize.BOOLEAN, field: 'isOpenUrl', defaultValue: false, allowNull: false },
      // 创建者
      create_by: { type: sequelize.STRING,  field: 'create_by', defaultValue: '', allowNull: false },
      // 创建时间
      create_time: { type: sequelize.DATE, field: 'create_time', defaultValue: MIN_DATE, allowNull: false },
      // 更新者
      update_by: { type: sequelize.STRING,  field: 'update_by', defaultValue: '', allowNull: false },
      // 更新时间
      update_time: { type: sequelize.DATE, field: 'update_time', defaultValue: MIN_DATE, allowNull: false },
      // 备注
      remark: { type: sequelize.STRING,  field: 'remark', defaultValue: '', allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      menu_id: d.menu_id ? parseInt(d.menu_id) : 0,
      menu_name: d.menu_name || '',
      parent_id: d.parent_id ? parseInt(d.parent_id) : 0,
      order_num: d.order_num ? parseInt(d.order_num) : 0,
      path: d.path || '',
      component: d.component || '',
      query: d.query || '',
      is_frame: d.is_frame ? parseInt(d.is_frame) : 0,
      is_cache: d.is_cache ? parseInt(d.is_cache) : 0,
      menu_type: d.menu_type || '',
      visible: d.visible || '',
      status: d.status || '',
      edit_open_new_page: d.hasOwnProperty('edit_open_new_page') ? parseBool(d.edit_open_new_page) : false,
      open_route: d.open_route || '',
      perms: d.perms || '',
      icon: d.icon || '',
      i18n: d.i18n || '',
      isOpenUrl: d.hasOwnProperty('isOpenUrl') ? parseBool(d.isOpenUrl) : false,
      create_by: d.create_by || '',
      create_time: formatDate(d.create_time, 'YYYY-MM-DD HH:mm:ss'),
      update_by: d.update_by || '',
      update_time: formatDate(d.update_time, 'YYYY-MM-DD HH:mm:ss'),
      remark: d.remark || '',

      /**********手工插入代码 */
      /**********结束 */
    };
  }
  data(e) {
    let data = {
      createBy: e.create_by,
      createTime: e.create_time,
      updateBy: e.update_by,
      updateTime: e.update_time,
      remark: e.remark,
      menuId: e.menu_id,
      menuName: e.menu_name,
      parentName: null,
      parentId: e.parent_id,
      orderNum: e.order_num,
      path: e.path,
      component: e.component,
      query: e.query,
      isFrame: e.is_frame,
      isCache: e.is_cache,
      editOpenNewPage: e.edit_open_new_page,
      menuType: e.menu_type,
      visible: e.visible,
      status: e.status,
      perms: e.perms,
      icon: e.icon,
      i18n: e.i18n,
      isOpenUrl: e.isOpenUrl,
      children: [],
    };
    return data;
  }
}
module.exports = new sys_menuModel();
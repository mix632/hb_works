'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_menu.model');

/**
 * sys_menu — 核心表
 */
class SysMenuRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_menu';
    this.defalutOrder = 'sys_menu.order_num asc';
    this.tableTitle = '系统菜单';
    this.primaryKey = 'menu_id';
    this.deleteKey = '';
    this.createDate = 'create_time';
    this.createUserId = 'create_by';
    this.updateDate = 'update_time';
    this.updateUserId = 'update_by';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = 'order_num';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_menu.*
      from sys_menu sys_menu
      where sys_menu.menu_id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const factory = require('../factory');
    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    if (m.isOpenUrl) {
      var item = await this.Get({ strWhere: `sys_menu.isOpenUrl = 1 and sys_menu.menu_id != '${m.menu_id}'`, db: db }); /* prettier-ignore */
      if (item) {
        item.isOpenUrl = false;
        item.menu_id = await super.AddOrUpdate({ model: item, db: db });
      }
    }
    m.menu_id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.menu_id) {
      return m.menu_id;
    }

    return m.menu_id;
  }
  /**
   * 如果在保存数据时，id=0时，可以通过实体的其他值，组成sql，查询唯一性数据库实体
   * @param {object} model 数据实体
   */
  AddOrUpdate_GetIDZeroSql({ model }) {
    return ``;
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.w('sys_menu.menu_name', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.path', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.component', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.query', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.menu_type', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.visible', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.status', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.open_route', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.perms', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.icon', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.i18n', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.create_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.update_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_menu.remark', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.menu_id) w.eq('sys_menu.menu_id', searchModel.menu_id);
    if (searchModel.ids) w.in('sys_menu.menu_id', searchModel.ids);
    if (searchModel.status) w.eq('sys_menu.status', searchModel.status);
    return w.build();
  }
}

module.exports = new SysMenuRepo();
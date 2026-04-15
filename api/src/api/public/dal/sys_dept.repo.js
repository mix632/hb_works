'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_dept.model');

/**
 * sys_dept — 核心表
 */
class SysDeptRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_dept';
    this.defalutOrder = 'sys_dept.order_num asc';
    this.tableTitle = '部门';
    this.primaryKey = 'dept_id';
    this.deleteKey = 'del_flag';
    this.createDate = 'create_time';
    this.createUserId = 'create_by';
    this.updateDate = 'update_time';
    this.updateUserId = 'update_by';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = 'order_num';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_dept.*
      from sys_dept sys_dept
      where sys_dept.dept_id > 0 {0} {1}
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
    m.dept_id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.dept_id) {
      return m.dept_id;
    }

    return m.dept_id;
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
      w.w('sys_dept.ancestors', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.dept_name', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.leader', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.phone', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.email', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.status', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.del_flag', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.create_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_dept.update_by', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.dept_id) w.eq('sys_dept.dept_id', searchModel.dept_id);
    if (searchModel.ids) w.in('sys_dept.dept_id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysDeptRepo();
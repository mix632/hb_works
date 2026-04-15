'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_user_post.model');

/**
 * sys_user_post — 核心表
 */
class SysUserPostRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_user_post';
    this.defalutOrder = 'sys_user_post.user_id desc';
    this.tableTitle = '用户部门';
    this.primaryKey = 'user_id';
    this.deleteKey = '';
    this.createDate = '';
    this.createUserId = '';
    this.updateDate = '';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_user_post.*
      from sys_user_post sys_user_post
      where sys_user_post.user_id > 0 {0} {1}
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
    m.user_id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.user_id) {
      return m.user_id;
    }

    return m.user_id;
  }
  /**
   * 如果在保存数据时，id=0时，可以通过实体的其他值，组成sql，查询唯一性数据库实体
   * @param {object} model 数据实体
   */
  AddOrUpdate_GetIDZeroSql({ model }) {
    return `sys_user_post.user_id = '${model.user_id}' and sys_user_post.post_id = '${model.post_id}'`;
  }
  AddOrUpdate_GetExistSql({ model }) {
    return `sys_user_post.user_id = '${model.user_id}' and sys_user_post.post_id = '${model.post_id}'`;
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
    }
    if (searchModel.user_id) w.eq('sys_user_post.user_id', searchModel.user_id);
    if (searchModel.ids) w.in('sys_user_post.user_id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysUserPostRepo();
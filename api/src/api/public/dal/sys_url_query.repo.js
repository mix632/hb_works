'use strict';

const uuid = require('uuid');
const { Dal } = require('../../../core/dal');
const model = require('../model/sys_url_query.model');
const factory = require('../factory');

/**
 * sys_url_query — 核心表
 */
class SysUrlQueryRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_url_query';
    this.defalutOrder = 'sys_url_query.id desc';
    this.tableTitle = 'url参数';
    this.primaryKey = 'id';
    this.deleteKey = 'deleted';
    this.createDate = 'created_at';
    this.createUserId = '';
    this.updateDate = 'updated_at';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_url_query.*
      from sys_url_query sys_url_query
      where sys_url_query.id != '' {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    if (!m.id) {
      m.id = `${uuid.v4()}`.replaceAll('-', '');
    }
    m.id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.id) {
      return m.id;
    }

    return m.id;
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
      w.w('sys_url_query.id', searchModel.Keyword, 'like', 'or');
      w.w('sys_url_query.name', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id) w.eq('sys_url_query.id', searchModel.id);
    if (searchModel.ids) w.in('sys_url_query.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysUrlQueryRepo();
'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/gb_user_status.model');
const util = require('../../../utils');

class GbUserStatusRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'gb_user_status';
    this.defalutOrder = 'gb_user_status.id desc';
    this.tableTitle = '用户状态';
    this.primaryKey = 'id';
    this.deleteKey = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
    this.baseSql = `select * from gb_user_status gb_user_status where gb_user_status.id > 0 {0} {1} order by {2}`;
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.like('gb_user_status.title', searchModel.Keyword, 'or');
    }
    if (searchModel.id != null) w.eq('gb_user_status.id', searchModel.id);
    if (searchModel.ids) w.in('gb_user_status.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new GbUserStatusRepo();

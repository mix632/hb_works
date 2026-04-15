'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_area_codeModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_area_code', {
      // 代码
      code: { type: sequelize.INTEGER, primaryKey: true, field: 'code', defaultValue: 0, allowNull: false },
      // 名字
      name: { type: sequelize.STRING,  field: 'name', defaultValue: '', allowNull: false },
      // 等级
      level: { type: sequelize.INTEGER, field: 'level', defaultValue: 0, allowNull: false },
      // 上级代码
      pcode: { type: sequelize.INTEGER, field: 'pcode', defaultValue: 0, allowNull: false },
      // 拼音
      pinyin: { type: sequelize.STRING,  field: 'pinyin', defaultValue: '', allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      code: d.code ? parseInt(d.code) : 0,
      name: d.name || '',
      level: d.level ? parseInt(d.level) : 0,
      pcode: d.pcode ? parseInt(d.pcode) : 0,
      pinyin: d.pinyin || '',

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new sys_area_codeModel();
'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_userModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_user', {
      // 用户ID
      user_id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'user_id', defaultValue: 0, allowNull: false },
      // 部门ID
      dept_id: { type: sequelize.INTEGER, field: 'dept_id', defaultValue: 0, allowNull: false },
      // 用户账号
      user_name: { type: sequelize.STRING,  field: 'user_name', defaultValue: '', allowNull: false },
      // 用户昵称
      nick_name: { type: sequelize.STRING,  field: 'nick_name', defaultValue: '', allowNull: false },
      // 用户类型
      user_type: { type: sequelize.STRING,  field: 'user_type', defaultValue: '', allowNull: false },
      // 用户邮箱
      email: { type: sequelize.STRING,  field: 'email', defaultValue: '', allowNull: false },
      // 手机号码
      phonenumber: { type: sequelize.STRING,  field: 'phonenumber', defaultValue: '', allowNull: false },
      // 生日
      birthday: { type: sequelize.DATE, field: 'birthday', defaultValue: MIN_DATE, allowNull: false },
      // 用户性别
      sex: { type: sequelize.STRING,  field: 'sex', defaultValue: '', allowNull: false },
      // 头像地址
      avatar: { type: sequelize.STRING,  field: 'avatar', defaultValue: '', allowNull: false },
      // 密码
      password: { type: sequelize.STRING,  field: 'password', defaultValue: '', allowNull: false },
      // 帐号状态
      status: { type: sequelize.STRING,  field: 'status', defaultValue: '', allowNull: false },
      // 所在部门列表
      deptIds: { type: sequelize.STRING,  field: 'deptIds', defaultValue: '', allowNull: false },
      // 是否不显示
      isNotShow: { type: sequelize.BOOLEAN, field: 'isNotShow', defaultValue: false, allowNull: false },
      // 删除标志
      del_flag: { type: sequelize.STRING,  field: 'del_flag', defaultValue: '', allowNull: false },
      // 最后登录IP
      login_ip: { type: sequelize.STRING,  field: 'login_ip', defaultValue: '', allowNull: false },
      // 最后登录时间
      login_date: { type: sequelize.DATE, field: 'login_date', defaultValue: MIN_DATE, allowNull: false },
      // 上次登录数据
      login_data: { type: sequelize.STRING,  field: 'login_data', defaultValue: '', allowNull: false },
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
      // token
      token: { type: sequelize.STRING,  field: 'token', defaultValue: '', allowNull: false },
      // 包id
      bag_ids: { type: sequelize.STRING,  field: 'bag_ids', defaultValue: '', allowNull: false },
      // 支持所有包
      is_all_bag: { type: sequelize.BOOLEAN, field: 'is_all_bag', defaultValue: false, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    this.model.files = [];
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      user_id: d.user_id ? parseInt(d.user_id) : 0,
      dept_id: d.dept_id ? parseInt(d.dept_id) : 0,
      user_name: d.user_name || '',
      nick_name: d.nick_name || '',
      user_type: d.user_type || '',
      email: d.email || '',
      phonenumber: d.phonenumber || '',
      birthday: formatDate(d.birthday, 'YYYY-MM-DD HH:mm:ss'),
      sex: d.sex || '',
      avatar: d.avatar || '',
      password: d.password || '',
      status: d.status || '',
      deptIds: d.deptIds || '',
      isNotShow: d.hasOwnProperty('isNotShow') ? parseBool(d.isNotShow) : false,
      del_flag: d.del_flag || '',
      login_ip: d.login_ip || '',
      login_date: formatDate(d.login_date, 'YYYY-MM-DD HH:mm:ss'),
      login_data: d.login_data || '',
      create_by: d.create_by || '',
      create_time: formatDate(d.create_time, 'YYYY-MM-DD HH:mm:ss'),
      update_by: d.update_by || '',
      update_time: formatDate(d.update_time, 'YYYY-MM-DD HH:mm:ss'),
      remark: d.remark || '',
      token: d.token || '',
      bag_ids: d.bag_ids || '',
      is_all_bag: d.hasOwnProperty('is_all_bag') ? parseBool(d.is_all_bag) : false,

      /**********手工插入代码 */
      files: d.files || [],
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
      userId: e.user_id,
      userName: e.user_name,
      nickName: e.nick_name,
      deptId: e.dept_id,
      email: e.email,
      phonenumber: e.phonenumber,
      sex: e.sex,
      avatar: e.avatar,
      password: e.password,
      status: e.status,
      delFlag: e.del_flag,
      loginIp: e.login_ip,
      loginDate: e.login_date,
      birthday: e.birthday ? moment(e.birthday).format('yyyy-MM-DD') : '',
      userType: e.user_type,
      Files: e.Files,
      loginData: e.login_data,
      is_all_bag: e.is_all_bag,
      bag_ids: e.bag_ids,
      token: e.token,
    };
    return data;
  }
}
module.exports = new sys_userModel();
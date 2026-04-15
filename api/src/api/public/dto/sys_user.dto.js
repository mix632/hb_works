'use strict';

/**
 * sys_user DTO — 字段白名单
 * list:   列表接口裁剪掉大字段，显著减少传输量
 * detail: 详情接口完整字段 + computed 展示字段
 * save:   保存接口允许写入的字段（防止注入 created_at / deleted 等系统字段）
 */
module.exports = {
  list: [
    'user_id', 'dept_id', 'user_name', 'nick_name', 'user_type', 'email', 'phonenumber', 'birthday', 'sex', 'avatar', 'password', 'status', 'deptIds', 'isNotShow', 'login_ip', 'login_date', 'login_data', 'remark', 'token', 'bag_ids', 'is_all_bag', 
  ],
  detail: [
    'user_id', 'dept_id', 'user_name', 'nick_name', 'user_type', 'email', 'phonenumber', 'birthday', 'sex', 'avatar', 'password', 'status', 'deptIds', 'isNotShow', 'del_flag', 'login_ip', 'login_date', 'login_data', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 'token', 'bag_ids', 'is_all_bag', 
  ],
  save: [
    'user_id', 'dept_id', 'user_name', 'nick_name', 'user_type', 'email', 'phonenumber', 'birthday', 'sex', 'avatar', 'password', 'status', 'deptIds', 'isNotShow', 'del_flag', 'login_ip', 'login_date', 'login_data', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 'token', 'bag_ids', 'is_all_bag', 
  ],
};
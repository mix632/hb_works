'use strict';

/**
 * sys_dept DTO — 字段白名单
 * list:   列表接口裁剪掉大字段，显著减少传输量
 * detail: 详情接口完整字段 + computed 展示字段
 * save:   保存接口允许写入的字段（防止注入 created_at / deleted 等系统字段）
 */
module.exports = {
  list: [
    'dept_id', 'parent_id', 'ancestors', 'dept_name', 'order_num', 'leader', 'phone', 'email', 'status', 'isNotShow', 'del_flag', 'create_by', 'create_time', 'update_by', 'update_time', 
  ],
  detail: [
    'dept_id', 'parent_id', 'ancestors', 'dept_name', 'order_num', 'leader', 'phone', 'email', 'status', 'isNotShow', 'del_flag', 'create_by', 'create_time', 'update_by', 'update_time', 
  ],
  save: [
    'dept_id', 'parent_id', 'ancestors', 'dept_name', 'order_num', 'leader', 'phone', 'email', 'status', 'isNotShow', 'del_flag', 'create_by', 'create_time', 'update_by', 'update_time', 
  ],
};
'use strict';

/**
 * sys_role DTO — 字段白名单
 * list:   列表接口裁剪掉大字段，显著减少传输量
 * detail: 详情接口完整字段 + computed 展示字段
 * save:   保存接口允许写入的字段（防止注入 created_at / deleted 等系统字段）
 */
module.exports = {
  list: [
    'role_id', 'role_name', 'role_key', 'role_sort', 'data_scope', 'menu_check_strictly', 'dept_check_strictly', 'status', 'del_flag', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 
  ],
  detail: [
    'role_id', 'role_name', 'role_key', 'role_sort', 'data_scope', 'menu_check_strictly', 'dept_check_strictly', 'status', 'del_flag', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 
  ],
  save: [
    'role_id', 'role_name', 'role_key', 'role_sort', 'data_scope', 'menu_check_strictly', 'dept_check_strictly', 'status', 'del_flag', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 
  ],
};
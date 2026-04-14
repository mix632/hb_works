'use strict';

/**
 * biz_customer DTO — 字段白名单
 * list:   列表接口裁剪掉 JSON 大字段（action_data / ocr_data / user_data / images），显著减少传输量
 * detail: 详情接口完整字段 + computed 展示字段
 * save:   保存接口允许写入的字段（防止注入 created_at / deleted 等系统字段）
 */
module.exports = {
  list: [
    'id', 'no', 'title', 'user_id', 'user_id_title',
    'product_id', 'product_id_title', 'date', 'phone',
    'loan_amount', 'real_loan_amount',
    'repayment_status', 'repayment_status_title',
    'status', 'status_title', 'status_name', 'created_at',
  ],
  detail: [
    'id', 'no', 'title', 'user_id', 'user_id_title',
    'product_id', 'product_id_title', 'date', 'phone', 'id_card',
    'loan_amount', 'real_loan_amount', 'interest_rate',
    'overdue_info', 'deadline', 'descript',
    'action_data', 'action_data_show',
    'ocr_data', 'user_data', 'user_data_show',
    'repayment_status', 'repayment_status_title',
    'status', 'status_title', 'status_name',
    'images', 'images_preview', 'review_url', 'review_image',
    'created_at', 'updated_at',
  ],
  save: [
    'id', 'no', 'title', 'user_id', 'product_id', 'date', 'phone', 'id_card',
    'loan_amount', 'real_loan_amount', 'interest_rate',
    'overdue_info', 'deadline', 'descript',
    'action_data', 'ocr_data', 'user_data',
    'repayment_status', 'status', 'images', 'review_url', 'review_image',
  ],
};

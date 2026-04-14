'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class BizCustomerModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('biz_customer', {
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
      no: { type: sequelize.STRING, field: 'no', defaultValue: '' },
      title: { type: sequelize.STRING, field: 'title', defaultValue: '' },
      user_id: { type: sequelize.INTEGER, field: 'user_id', defaultValue: 0 },
      product_id: { type: sequelize.INTEGER, field: 'product_id', defaultValue: 0 },
      date: { type: sequelize.DATE, field: 'date', defaultValue: MIN_DATE },
      phone: { type: sequelize.STRING, field: 'phone', defaultValue: '' },
      id_card: { type: sequelize.STRING, field: 'id_card', defaultValue: '' },
      loan_amount: { type: sequelize.DOUBLE, field: 'loan_amount', defaultValue: 0 },
      real_loan_amount: { type: sequelize.DOUBLE, field: 'real_loan_amount', defaultValue: 0 },
      interest_rate: { type: sequelize.DOUBLE, field: 'interest_rate', defaultValue: 0 },
      overdue_info: { type: sequelize.STRING, field: 'overdue_info', defaultValue: '' },
      deadline: { type: sequelize.STRING, field: 'deadline', defaultValue: '' },
      descript: { type: sequelize.STRING, field: 'descript', defaultValue: '' },
      action_data: { type: sequelize.JSON, field: 'action_data', defaultValue: null },
      ocr_data: { type: sequelize.JSON, field: 'ocr_data', defaultValue: null },
      user_data: { type: sequelize.JSON, field: 'user_data', defaultValue: null },
      repayment_status: { type: sequelize.INTEGER, field: 'repayment_status', defaultValue: 0 },
      status: { type: sequelize.INTEGER, field: 'status', defaultValue: 0 },
      images: { type: sequelize.JSON, field: 'images', defaultValue: null },
      review_url: { type: sequelize.STRING, field: 'review_url', defaultValue: '' },
      created_at: { type: sequelize.DATE, field: 'created_at', defaultValue: MIN_DATE },
      updated_at: { type: sequelize.DATE, field: 'updated_at', defaultValue: MIN_DATE },
      deleted: { type: sequelize.BOOLEAN, field: 'deleted', defaultValue: false },
    }, { timestamps: false, freezeTableName: true });
  }

  CopyData(d) {
    d = d || {};
    return {
      id: d.id ? parseInt(d.id) : 0,
      no: d.no || '',
      title: d.title || '',
      user_id: d.user_id ? parseInt(d.user_id) : 0,
      product_id: d.product_id ? parseInt(d.product_id) : 0,
      date: formatDate(d.date),
      phone: d.phone || '',
      id_card: d.id_card || '',
      loan_amount: d.loan_amount ? parseFloat(d.loan_amount) : 0,
      real_loan_amount: d.real_loan_amount ? parseFloat(d.real_loan_amount) : 0,
      interest_rate: d.interest_rate ? parseFloat(d.interest_rate) : 0,
      overdue_info: d.overdue_info || '',
      deadline: d.deadline || '',
      descript: d.descript || '',
      action_data: d.action_data || null,
      ocr_data: d.ocr_data || null,
      user_data: d.user_data || null,
      repayment_status: d.repayment_status ? parseInt(d.repayment_status) : 0,
      status: d.status ? parseInt(d.status) : 0,
      images: d.images || null,
      review_url: d.review_url || '',
      created_at: formatDate(d.created_at),
      updated_at: formatDate(d.updated_at),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,
      // JOIN 映射字段
      user_id_title: d.user_id_title || '',
      product_id_title: d.product_id_title || '',
      repayment_status_title: d.repayment_status_title || '',
      status_title: d.status_title || '',
      // 扩展
      review_image: d.review_image || [],
      status_name: d.status_name || '',
    };
  }
}

module.exports = new BizCustomerModel();

'use strict';

/**
 * naviga.home — 优设导航首页接口（对应 uni-app pages/index）
 *
 * 路由前缀：/naviga/home
 *
 * ─── 接口一览 ───
 *
 * 2) GET /naviga/home/page-config — 页面头区配置（数据写在 pageConfig 方法内，便于改库前直接改代码）
 *    返回 Data：{ menus: MenuItem[], allNavPopover: PopoverItem[] }
 *
 *    MenuItem（menus 为有序数组）：
 *    - style: 'dropdown' — 有子菜单；children 每项含 label, icon, bg, url（点击跳转）
 *    - style: 'link' — 无子菜单；整项点击走 url（必填），可选 tapKey 供统计
 *    公共：id, label, showBadge?, tapKey?, url?, children[]
 *
 *    allNavPopover：侧栏「全部网址导航」3×3，每项 { label, bg, icon, url }
 *
 *
 * 实现数据暂写在本文件；后续接库时替换为查询结果。
 */

const BaseService = require('../../../../core/baseService');
const { R } = require('../../../../core/errors');


class NavigaHomeService extends BaseService {
  constructor() {
    super({
      service: {},
      model: {},
      prefix: '/naviga/home',
      dto: null,
    });
  }

  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/bootstrap`, (req, reply) => this.bootstrap(req, reply));
    app.get(`${p}/page-config`, (req, reply) => this.pageConfig(req, reply));
    app.get(`${p}/test`, (req, reply) => this.test(req, reply));
  }

  async pageConfig(req, reply) {
    void reply;
    try {
      /**
       * 顶栏中间区：按数组顺序渲染。
       * dropdown：children 为动态宫格；link：无 children，点击走 url。
       */
      const menus = [
        {
          id: 'official',
          style: 'dropdown',
          label: '优设官网',
          showBadge: false,
          tapKey: '官网',
          url: '',
          children: [
            { label: '优设榜单', bg: '#f97316', icon: '榜', url: 'https://www.uisdc.com/' },
            { label: '优设分层', bg: '#22c55e', icon: '层', url: 'https://www.uisdc.com/' },
            {
              label: '细节猎人',
              bg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              icon: '◆',
              url: 'https://www.uisdc.com/',
            },
            { label: '优设读报', bg: '#9333ea', icon: '报', url: 'https://www.uisdc.com/' },
            { label: '每日一问', bg: '#ea580c', icon: '#', url: 'https://www.uisdc.com/' },
            { label: '活动大赛', bg: '#38bdf8', icon: '★', url: 'https://www.uisdc.com/' },
            { label: '设计方法', bg: '#2563eb', icon: 'Ps', url: 'https://www.uisdc.com/' },
            { label: '设计规范', bg: '#ec4899', icon: '▣', url: 'https://www.uisdc.com/' },
          ]
        },
        {
          id: 'nav',
          style: 'dropdown',
          label: '优设导航',
          showBadge: true,
          tapKey: '导航',
          url: '',
          children: [
            { label: '优设榜单', bg: '#f97316', icon: '榜', url: 'https://www.uisdc.com/' },
            { label: '优设分层', bg: '#22c55e', icon: '层', url: 'https://www.uisdc.com/' },
            {
              label: '细节猎人',
              bg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              icon: '◆',
              url: 'https://www.uisdc.com/',
            },
            { label: '优设读报', bg: '#9333ea', icon: '报', url: 'https://www.uisdc.com/' },
            { label: '每日一问', bg: '#ea580c', icon: '#', url: 'https://www.uisdc.com/' },
            { label: '活动大赛', bg: '#38bdf8', icon: '★', url: 'https://www.uisdc.com/' },
            { label: '设计方法', bg: '#2563eb', icon: 'Ps', url: 'https://www.uisdc.com/' },
            { label: '设计规范', bg: '#ec4899', icon: '▣', url: 'https://www.uisdc.com/' },
          ]
        },
        {
          id: 'courses',
          style: 'link',
          label: '好课推荐',
          showBadge: false,
          tapKey: '好课',
          url: 'https://xue.uisdc.com/',
          children: [],
        },
        {
          id: 'aigc',
          style: 'link',
          label: 'AIGC',
          showBadge: true,
          tapKey: 'AIGC',
          url: 'https://www.uisdc.com/aigc/',
          children: [],
        },
        {
          id: 'service',
          style: 'link',
          label: '设计服务',
          showBadge: false,
          tapKey: '服务',
          url: 'https://www.uisdc.com/',
          children: [],
        },
        {
          id: 'font',
          style: 'link',
          label: '免费字体',
          showBadge: false,
          tapKey: '字体',
          url: 'https://hao.uisdc.com/font/',
          children: [],
        },
      ];

      /** 侧栏「全部网址导航」3×3，每项可跳转 */
      const allNavPopover = [
        { label: '优设导航', bg: '#22c55e', icon: '导', url: 'https://hao.uisdc.com/' },
        { label: 'AI导航', bg: '#3b82f6', icon: 'AI', url: 'https://hao.uisdc.com/ai/' },
        { label: '字体导航', bg: '#f97316', icon: 'Aa', url: 'https://hao.uisdc.com/font/' },
        { label: '摄影导航', bg: '#8b5cf6', icon: '摄', url: 'https://hao.uisdc.com/photo/' },
        { label: '插画导航', bg: '#ec4899', icon: '画', url: 'https://hao.uisdc.com/illustration/' },
        { label: 'PPT导航', bg: '#14b8a6', icon: 'P', url: 'https://hao.uisdc.com/ppt/' },
        { label: '图标导航', bg: '#eab308', icon: '◇', url: 'https://hao.uisdc.com/icon/' },
        { label: '配色导航', bg: '#6366f1', icon: '彩', url: 'https://hao.uisdc.com/color/' },
        { label: '更多导航', bg: '#64748b', icon: '···', url: 'https://hao.uisdc.com/' },
      ];

      const data = { menus, allNavPopover };
      return R({ Succeed: true, Message: '', Data: data });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '加载页面配置失败', Data: null });
    }
  }
}

module.exports = new NavigaHomeService();

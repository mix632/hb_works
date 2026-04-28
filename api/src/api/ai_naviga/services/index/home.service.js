'use strict';

/**
 * naviga.home — 优设导航首页接口（对应 uni-app pages/index）
 *
 * 路由前缀：/naviga/home
 *
 * ─── 接口一览 ───
 *
 * 2) GET /naviga/home/page-config — 页面头区配置（数据写在 pageConfig 方法内，便于改库前直接改代码）
 *    返回 Data：{ menus, allNavPopover, searchEngines, hotSearchTags }
 *
 * 3) GET /naviga/home/home-categories — 首页左侧菜单 + 中间各分类区块（数据量大，与 page-config 分接口）
 *    返回 Data：{ categories }
 *    - categories[]：id, name, icon, displayType（1=默认圆标卡片，2=大图 cover）, list[]
 *    - 每项另含：newsLine（顶栏/右侧要闻文案）, aiFeedItems（右侧精选列表）, hubArticles（分类 Hub 左侧图文列）
 *    - list[]：id, name, image, desc, color?（color 为圆标底色；缺省时由服务端按 RESOURCE_CARD_PALETTE 补缺，便于日后改配置表）
 *
 * 4) GET /naviga/home/hub-article?articleId= — Hub 文章详情（id 形如 {categoryId}-hub-article-{n}）
 *    返回 Data：{ article, body }
 *
 *    MenuItem（menus 为有序数组）：
 *    - style: 'dropdown' — 有子菜单；children 每项含 label, icon, bg, url（点击跳转）
 *    - style: 'link' — 无子菜单；整项点击走 url（必填），可选 tapKey 供统计
 *    公共：id, label, showBadge?, tapKey?, url?, children[]
 *
 *    allNavPopover：侧栏「全部网址导航」3×3，每项 { label, bg, icon, url }
 *
 *    searchEngines：Hero 搜索区 Tab，每项：
 *    - id, name（Tab 文案）
 *    - placeholders: string[]（输入框占位提示，前端取首项或自行轮换）
 *    - url：跳转基址（不含查询串，可含已有 query，如 ?ie=utf-8）
 *    - queryKey：查询参数名（如 wd、q）；与 url 拼成 ?queryKey=encodeURIComponent(关键词)
 *    - buttonText?：搜索按钮文案；缺省时由前端按 name 推断
 *
 *    hotSearchTags：Hero 热搜榜标签，每项 { text, hot?, highlight?, url }
 *    - url：点击后新窗口打开（H5）；小程序端复制链接或 web-view 策略由前端处理
 *
 *
 * 实现数据暂写在本文件；后续接库时替换为查询结果。
 */

const BaseService = require('../../../../core/baseService');
const { R } = require('../../../../core/errors');
const config = require('../../../../core/serverConfig');
const clickRepo = require('../../dal/click.repo');


function buildHomeCategoriesPayload() {
  return [
    {
      id: 'hot',
      name: '热门推荐',
      icon: '🔥',
      displayType: 1,
      list: [
        { id: 'hot-r-1', name: '优设9图', image: '', desc: '【热门推荐】优设9图：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-2', name: 'AI星踪岛', image: '', desc: '【热门推荐】AI星踪岛：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-3', name: 'IconFont', image: '', desc: '【热门推荐】IconFont：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-4', name: '即梦', image: '', desc: '【热门推荐】即梦：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-5', name: '稿定设计', image: '', desc: '【热门推荐】稿定设计：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-6', name: '花瓣网', image: '', desc: '【热门推荐】花瓣网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-7', name: '站酷', image: '', desc: '【热门推荐】站酷：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-8', name: 'UI中国', image: '', desc: '【热门推荐】UI中国：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-9', name: '幕布', image: '', desc: '【热门推荐】幕布：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-10', name: '飞书', image: '', desc: '【热门推荐】飞书：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-11', name: '语雀', image: '', desc: '【热门推荐】语雀：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'hot-r-12', name: 'Notion', image: '', desc: '【热门推荐】Notion：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'gallery',
      name: '高清图库',
      icon: '🖼',
      displayType: 2,
      list: [
        { id: 'gallery-r-1', name: 'Unsplash', image: 'https://picsum.photos/seed/uisdc-gallery-0/640/360', desc: '【高清图库】Unsplash：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-2', name: 'Pexels', image: 'https://picsum.photos/seed/uisdc-gallery-1/640/360', desc: '【高清图库】Pexels：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-3', name: 'Pixabay', image: 'https://picsum.photos/seed/uisdc-gallery-2/640/360', desc: '【高清图库】Pixabay：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-4', name: '500px', image: 'https://picsum.photos/seed/uisdc-gallery-3/640/360', desc: '【高清图库】500px：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-5', name: '图虫创意', image: 'https://picsum.photos/seed/uisdc-gallery-4/640/360', desc: '【高清图库】图虫创意：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-6', name: '视觉中国', image: 'https://picsum.photos/seed/uisdc-gallery-5/640/360', desc: '【高清图库】视觉中国：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-7', name: '图怪兽', image: 'https://picsum.photos/seed/uisdc-gallery-6/640/360', desc: '【高清图库】图怪兽：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-8', name: '摄图网', image: 'https://picsum.photos/seed/uisdc-gallery-7/640/360', desc: '【高清图库】摄图网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-9', name: '包图网', image: 'https://picsum.photos/seed/uisdc-gallery-8/640/360', desc: '【高清图库】包图网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-10', name: '大作', image: 'https://picsum.photos/seed/uisdc-gallery-9/640/360', desc: '【高清图库】大作：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-11', name: '优设图库', image: 'https://picsum.photos/seed/uisdc-gallery-10/640/360', desc: '【高清图库】优设图库：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'gallery-r-12', name: '觅元素', image: 'https://picsum.photos/seed/uisdc-gallery-11/640/360', desc: '【高清图库】觅元素：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'tutorial',
      name: '设计教程',
      icon: '📖',
      displayType: 1,
      list: [
        { id: 'tutorial-r-1', name: '优优教程网', image: '', desc: '【设计教程】优优教程网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-2', name: 'B 站设计区', image: '', desc: '【设计教程】B 站设计区：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-3', name: '优设课堂', image: '', desc: '【设计教程】优设课堂：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-4', name: '站酷学习', image: '', desc: '【设计教程】站酷学习：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-5', name: '虎课网', image: '', desc: '【设计教程】虎课网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-6', name: '网易云课堂', image: '', desc: '【设计教程】网易云课堂：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-7', name: '腾讯课堂', image: '', desc: '【设计教程】腾讯课堂：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-8', name: '慕课网', image: '', desc: '【设计教程】慕课网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-9', name: 'Coursera', image: '', desc: '【设计教程】Coursera：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-10', name: 'Udemy', image: '', desc: '【设计教程】Udemy：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-11', name: 'Skillshare', image: '', desc: '【设计教程】Skillshare：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'tutorial-r-12', name: '优设公开课', image: '', desc: '【设计教程】优设公开课：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'ui',
      name: '界面设计',
      icon: '✨',
      displayType: 1,
      list: [
        { id: 'ui-r-1', name: 'Mobbin', image: '', desc: '【界面设计】Mobbin：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-2', name: 'Page Flows', image: '', desc: '【界面设计】Page Flows：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-3', name: 'Collect UI', image: '', desc: '【界面设计】Collect UI：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-4', name: 'UI8', image: '', desc: '【界面设计】UI8：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-5', name: 'Land-book', image: '', desc: '【界面设计】Land-book：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-6', name: 'Refero', image: '', desc: '【界面设计】Refero：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-7', name: 'Screenlane', image: '', desc: '【界面设计】Screenlane：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-8', name: '优设 UI 导航', image: '', desc: '【界面设计】优设 UI 导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-9', name: 'Dribbble', image: '', desc: '【界面设计】Dribbble：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-10', name: 'Behance', image: '', desc: '【界面设计】Behance：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-11', name: 'Savee', image: '', desc: '【界面设计】Savee：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ui-r-12', name: 'Minimal Gallery', image: '', desc: '【界面设计】Minimal Gallery：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'aigc',
      name: 'AIGC 工具',
      icon: '🤖',
      displayType: 1,
      list: [
        { id: 'aigc-r-1', name: 'Midjourney', image: '', desc: '【AIGC 工具】Midjourney：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-2', name: 'Stable Diffusion', image: '', desc: '【AIGC 工具】Stable Diffusion：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-3', name: 'Runway', image: '', desc: '【AIGC 工具】Runway：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-4', name: 'ChatGPT', image: '', desc: '【AIGC 工具】ChatGPT：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-5', name: 'Claude', image: '', desc: '【AIGC 工具】Claude：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-6', name: '即梦', image: '', desc: '【AIGC 工具】即梦：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-7', name: '可灵', image: '', desc: '【AIGC 工具】可灵：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-8', name: 'Tripo AI', image: '', desc: '【AIGC 工具】Tripo AI：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-9', name: 'Remove.bg', image: '', desc: '【AIGC 工具】Remove.bg：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-10', name: 'Gamma', image: '', desc: '【AIGC 工具】Gamma：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-11', name: 'Notion AI', image: '', desc: '【AIGC 工具】Notion AI：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'aigc-r-12', name: 'Copilot', image: '', desc: '【AIGC 工具】Copilot：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'font',
      name: '免费字体',
      icon: 'A',
      displayType: 1,
      list: [
        { id: 'font-r-1', name: 'Google Fonts', image: '', desc: '【免费字体】Google Fonts：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-2', name: 'Adobe Fonts', image: '', desc: '【免费字体】Adobe Fonts：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-3', name: '字由', image: '', desc: '【免费字体】字由：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-4', name: '猫啃网', image: '', desc: '【免费字体】猫啃网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-5', name: '100font', image: '', desc: '【免费字体】100font：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-6', name: 'Fontsquirrel', image: '', desc: '【免费字体】Fontsquirrel：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-7', name: 'Fontshare', image: '', desc: '【免费字体】Fontshare：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-8', name: '优设字体导航', image: '', desc: '【免费字体】优设字体导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-9', name: '方正字库', image: '', desc: '【免费字体】方正字库：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-10', name: '汉仪字库', image: '', desc: '【免费字体】汉仪字库：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-11', name: '造字工房', image: '', desc: '【免费字体】造字工房：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'font-r-12', name: '阿里妈妈字体', image: '', desc: '【免费字体】阿里妈妈字体：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'icon',
      name: '图标专题',
      icon: '◇',
      displayType: 1,
      list: [
        { id: 'icon-r-1', name: 'IconFont', image: '', desc: '【图标专题】IconFont：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-2', name: 'Iconify', image: '', desc: '【图标专题】Iconify：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-3', name: 'Streamline', image: '', desc: '【图标专题】Streamline：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-4', name: 'Phosphor', image: '', desc: '【图标专题】Phosphor：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-5', name: 'Heroicons', image: '', desc: '【图标专题】Heroicons：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-6', name: 'Lucide', image: '', desc: '【图标专题】Lucide：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-7', name: 'Remix Icon', image: '', desc: '【图标专题】Remix Icon：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-8', name: 'Noun Project', image: '', desc: '【图标专题】Noun Project：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-9', name: 'Flaticon', image: '', desc: '【图标专题】Flaticon：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-10', name: 'Icons8', image: '', desc: '【图标专题】Icons8：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-11', name: 'SF Symbols', image: '', desc: '【图标专题】SF Symbols：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'icon-r-12', name: 'Material Icons', image: '', desc: '【图标专题】Material Icons：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'photo',
      name: '摄影图库',
      icon: '📷',
      displayType: 1,
      list: [
        { id: 'photo-r-1', name: '500px', image: '', desc: '【摄影图库】500px：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-2', name: '图虫', image: '', desc: '【摄影图库】图虫：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-3', name: 'LOFTER', image: '', desc: '【摄影图库】LOFTER：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-4', name: 'Instagram', image: '', desc: '【摄影图库】Instagram：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-5', name: 'Flickr', image: '', desc: '【摄影图库】Flickr：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-6', name: '国家地理', image: '', desc: '【摄影图库】国家地理：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-7', name: '马格南', image: '', desc: '【摄影图库】马格南：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-8', name: '优设摄影导航', image: '', desc: '【摄影图库】优设摄影导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-9', name: '全景网', image: '', desc: '【摄影图库】全景网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-10', name: 'VCG', image: '', desc: '【摄影图库】VCG：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-11', name: '海洛创意', image: '', desc: '【摄影图库】海洛创意：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'photo-r-12', name: '锐景', image: '', desc: '【摄影图库】锐景：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'illustration',
      name: '插画资源',
      icon: '🎨',
      displayType: 1,
      list: [
        { id: 'illustration-r-1', name: 'DrawKit', image: '', desc: '【插画资源】DrawKit：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-2', name: 'Open Peeps', image: '', desc: '【插画资源】Open Peeps：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-3', name: 'Blush', image: '', desc: '【插画资源】Blush：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-4', name: 'Storyset', image: '', desc: '【插画资源】Storyset：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-5', name: 'ManyPixels', image: '', desc: '【插画资源】ManyPixels：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-6', name: 'IRA Design', image: '', desc: '【插画资源】IRA Design：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-7', name: 'Humaaans', image: '', desc: '【插画资源】Humaaans：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-8', name: 'Undraw', image: '', desc: '【插画资源】Undraw：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-9', name: '优设插画导航', image: '', desc: '【插画资源】优设插画导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-10', name: '涂鸦王国', image: '', desc: '【插画资源】涂鸦王国：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-11', name: '站酷海洛插画', image: '', desc: '【插画资源】站酷海洛插画：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'illustration-r-12', name: 'Freepik 插画', image: '', desc: '【插画资源】Freepik 插画：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'mockup',
      name: '样机模板',
      icon: '📱',
      displayType: 1,
      list: [
        { id: 'mockup-r-1', name: 'Mockup World', image: '', desc: '【样机模板】Mockup World：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-2', name: 'LS Graphics', image: '', desc: '【样机模板】LS Graphics：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-3', name: 'Mockuuups', image: '', desc: '【样机模板】Mockuuups：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-4', name: 'Smartmockups', image: '', desc: '【样机模板】Smartmockups：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-5', name: 'Rotato', image: '', desc: '【样机模板】Rotato：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-6', name: 'Angle', image: '', desc: '【样机模板】Angle：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-7', name: '优设样机导航', image: '', desc: '【样机模板】优设样机导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-8', name: '稿定样机', image: '', desc: '【样机模板】稿定样机：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-9', name: '图怪兽样机', image: '', desc: '【样机模板】图怪兽样机：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-10', name: '觅知样机', image: '', desc: '【样机模板】觅知样机：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-11', name: 'Envato', image: '', desc: '【样机模板】Envato：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mockup-r-12', name: 'Creative Market', image: '', desc: '【样机模板】Creative Market：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'ppt',
      name: 'PPT 资源',
      icon: '📊',
      displayType: 1,
      list: [
        { id: 'ppt-r-1', name: 'iSlide', image: '', desc: '【PPT 资源】iSlide：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-2', name: 'OfficePLUS', image: '', desc: '【PPT 资源】OfficePLUS：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-3', name: '优品PPT', image: '', desc: '【PPT 资源】优品PPT：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-4', name: '51PPT', image: '', desc: '【PPT 资源】51PPT：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-5', name: '第一PPT', image: '', desc: '【PPT 资源】第一PPT：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-6', name: 'Slidesgo', image: '', desc: '【PPT 资源】Slidesgo：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-7', name: 'Canva PPT', image: '', desc: '【PPT 资源】Canva PPT：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-8', name: '优设 PPT 导航', image: '', desc: '【PPT 资源】优设 PPT 导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-9', name: '稿定 PPT', image: '', desc: '【PPT 资源】稿定 PPT：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-10', name: '金山文档模板', image: '', desc: '【PPT 资源】金山文档模板：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-11', name: '石墨汇报', image: '', desc: '【PPT 资源】石墨汇报：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'ppt-r-12', name: '飞书幻灯片', image: '', desc: '【PPT 资源】飞书幻灯片：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'video',
      name: '视频素材',
      icon: '🎬',
      displayType: 1,
      list: [
        { id: 'video-r-1', name: 'Pexels Video', image: '', desc: '【视频素材】Pexels Video：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-2', name: 'Mixkit', image: '', desc: '【视频素材】Mixkit：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-3', name: 'Coverr', image: '', desc: '【视频素材】Coverr：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-4', name: 'Videvo', image: '', desc: '【视频素材】Videvo：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-5', name: 'Pixabay Video', image: '', desc: '【视频素材】Pixabay Video：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-6', name: '新片场', image: '', desc: '【视频素材】新片场：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-7', name: 'B 站素材', image: '', desc: '【视频素材】B 站素材：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-8', name: '优设视频导航', image: '', desc: '【视频素材】优设视频导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-9', name: '剪映素材', image: '', desc: '【视频素材】剪映素材：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-10', name: 'Adobe Stock', image: '', desc: '【视频素材】Adobe Stock：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-11', name: 'Storyblocks', image: '', desc: '【视频素材】Storyblocks：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'video-r-12', name: 'Artgrid', image: '', desc: '【视频素材】Artgrid：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'webtpl',
      name: '网页模板',
      icon: '🌐',
      displayType: 1,
      list: [
        { id: 'webtpl-r-1', name: 'ThemeForest', image: '', desc: '【网页模板】ThemeForest：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-2', name: 'TemplateMonster', image: '', desc: '【网页模板】TemplateMonster：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-3', name: 'Webflow 模板', image: '', desc: '【网页模板】Webflow 模板：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-4', name: 'Framer 模板', image: '', desc: '【网页模板】Framer 模板：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-5', name: 'Bootstrap 主题', image: '', desc: '【网页模板】Bootstrap 主题：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-6', name: 'HTML5 UP', image: '', desc: '【网页模板】HTML5 UP：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-7', name: 'Colorlib', image: '', desc: '【网页模板】Colorlib：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-8', name: '优设网页模板', image: '', desc: '【网页模板】优设网页模板：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-9', name: '站酷海洛网页', image: '', desc: '【网页模板】站酷海洛网页：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-10', name: 'Envato Elements', image: '', desc: '【网页模板】Envato Elements：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-11', name: 'Creative Tim', image: '', desc: '【网页模板】Creative Tim：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'webtpl-r-12', name: 'WrapBootstrap', image: '', desc: '【网页模板】WrapBootstrap：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'mobileui',
      name: '移动 UI',
      icon: '📲',
      displayType: 1,
      list: [
        { id: 'mobileui-r-1', name: 'Mobbin', image: '', desc: '【移动 UI】Mobbin：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-2', name: 'Lovely Mobile UI', image: '', desc: '【移动 UI】Lovely Mobile UI：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-3', name: 'UI Sources', image: '', desc: '【移动 UI】UI Sources：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-4', name: 'Screenlane', image: '', desc: '【移动 UI】Screenlane：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-5', name: 'Android Niceties', image: '', desc: '【移动 UI】Android Niceties：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-6', name: 'iOS Design Kit', image: '', desc: '【移动 UI】iOS Design Kit：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-7', name: '优设移动 UI', image: '', desc: '【移动 UI】优设移动 UI：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-8', name: '即时设计资源', image: '', desc: '【移动 UI】即时设计资源：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-9', name: 'MasterGo 社区', image: '', desc: '【移动 UI】MasterGo 社区：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-10', name: 'Figma Community', image: '', desc: '【移动 UI】Figma Community：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-11', name: 'Sketch App Sources', image: '', desc: '【移动 UI】Sketch App Sources：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'mobileui-r-12', name: 'UpLabs', image: '', desc: '【移动 UI】UpLabs：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'brandcase',
      name: '品牌案例',
      icon: '🏷',
      displayType: 1,
      list: [
        { id: 'brandcase-r-1', name: 'Brand New', image: '', desc: '【品牌案例】Brand New：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-2', name: 'BP&O', image: '', desc: '【品牌案例】BP&O：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-3', name: 'SiteInspire', image: '', desc: '【品牌案例】SiteInspire：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-4', name: 'Httpster', image: '', desc: '【品牌案例】Httpster：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-5', name: '优设品牌案例', image: '', desc: '【品牌案例】优设品牌案例：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-6', name: '站酷品牌', image: '', desc: '【品牌案例】站酷品牌：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-7', name: 'Behance 品牌', image: '', desc: '【品牌案例】Behance 品牌：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-8', name: 'Dribbble 品牌', image: '', desc: '【品牌案例】Dribbble 品牌：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-9', name: 'Not Real Twitter', image: '', desc: '【品牌案例】Not Real Twitter：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-10', name: 'Land-book', image: '', desc: '【品牌案例】Land-book：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-11', name: 'Admire The Web', image: '', desc: '【品牌案例】Admire The Web：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'brandcase-r-12', name: 'One Page Love', image: '', desc: '【品牌案例】One Page Love：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'model3d',
      name: '3D 模型',
      icon: '🧊',
      displayType: 1,
      list: [
        { id: 'model3d-r-1', name: 'Sketchfab', image: '', desc: '【3D 模型】Sketchfab：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-2', name: 'TurboSquid', image: '', desc: '【3D 模型】TurboSquid：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-3', name: 'CGTrader', image: '', desc: '【3D 模型】CGTrader：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-4', name: 'Poly Pizza', image: '', desc: '【3D 模型】Poly Pizza：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-5', name: 'Tripo AI', image: '', desc: '【3D 模型】Tripo AI：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-6', name: 'Meshy', image: '', desc: '【3D 模型】Meshy：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-7', name: '优设 3D 导航', image: '', desc: '【3D 模型】优设 3D 导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-8', name: 'Blender Market', image: '', desc: '【3D 模型】Blender Market：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-9', name: 'Unity Asset', image: '', desc: '【3D 模型】Unity Asset：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-10', name: 'Unreal Fab', image: '', desc: '【3D 模型】Unreal Fab：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-11', name: 'Thingiverse', image: '', desc: '【3D 模型】Thingiverse：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'model3d-r-12', name: 'Free3D', image: '', desc: '【3D 模型】Free3D：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'audio',
      name: '音频音效',
      icon: '🎵',
      displayType: 1,
      list: [
        { id: 'audio-r-1', name: '爱给网', image: '', desc: '【音频音效】爱给网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-2', name: '耳聆网', image: '', desc: '【音频音效】耳聆网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-3', name: '淘声网', image: '', desc: '【音频音效】淘声网：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-4', name: 'Freesound', image: '', desc: '【音频音效】Freesound：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-5', name: 'Zapsplat', image: '', desc: '【音频音效】Zapsplat：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-6', name: '优设音频导航', image: '', desc: '【音频音效】优设音频导航：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-7', name: 'Adobe Audition 素材', image: '', desc: '【音频音效】Adobe Audition 素材：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-8', name: 'Artlist', image: '', desc: '【音频音效】Artlist：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-9', name: 'Epidemic Sound', image: '', desc: '【音频音效】Epidemic Sound：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-10', name: 'YouTube 音频库', image: '', desc: '【音频音效】YouTube 音频库：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-11', name: 'BBC Sound', image: '', desc: '【音频音效】BBC Sound：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'audio-r-12', name: 'SoundCloud', image: '', desc: '【音频音效】SoundCloud：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'toolkit',
      name: '在线工具',
      icon: '🔧',
      displayType: 1,
      list: [
        { id: 'toolkit-r-1', name: 'TinyPNG', image: '', desc: '【在线工具】TinyPNG：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-2', name: 'Remove.bg', image: '', desc: '【在线工具】Remove.bg：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-3', name: 'Excalidraw', image: '', desc: '【在线工具】Excalidraw：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-4', name: 'ProcessOn', image: '', desc: '【在线工具】ProcessOn：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-5', name: '幕布', image: '', desc: '【在线工具】幕布：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-6', name: '石墨文档', image: '', desc: '【在线工具】石墨文档：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-7', name: '飞书多维表格', image: '', desc: '【在线工具】飞书多维表格：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-8', name: '优设在线工具', image: '', desc: '【在线工具】优设在线工具：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-9', name: 'Can I use', image: '', desc: '【在线工具】Can I use：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-10', name: 'Coolors', image: '', desc: '【在线工具】Coolors：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-11', name: 'Carbon', image: '', desc: '【在线工具】Carbon：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'toolkit-r-12', name: 'Ray.so', image: '', desc: '【在线工具】Ray.so：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'inspiration',
      name: '设计灵感',
      icon: '💡',
      displayType: 1,
      list: [
        { id: 'inspiration-r-1', name: 'Savee', image: '', desc: '【设计灵感】Savee：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-2', name: 'Designspiration', image: '', desc: '【设计灵感】Designspiration：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-3', name: 'Niice', image: '', desc: '【设计灵感】Niice：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-4', name: 'Muzli', image: '', desc: '【设计灵感】Muzli：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-5', name: '优设灵感频道', image: '', desc: '【设计灵感】优设灵感频道：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-6', name: 'Pinterest', image: '', desc: '【设计灵感】Pinterest：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-7', name: '花瓣采集', image: '', desc: '【设计灵感】花瓣采集：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-8', name: 'Behance', image: '', desc: '【设计灵感】Behance：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-9', name: 'Dribbble', image: '', desc: '【设计灵感】Dribbble：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-10', name: 'Awwwards', image: '', desc: '【设计灵感】Awwwards：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-11', name: 'SiteInspire', image: '', desc: '【设计灵感】SiteInspire：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'inspiration-r-12', name: 'Httpster', image: '', desc: '【设计灵感】Httpster：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'motion',
      name: '动效设计',
      icon: '〰',
      displayType: 1,
      list: [
        { id: 'motion-r-1', name: 'Motionographer', image: '', desc: '【动效设计】Motionographer：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-2', name: '优设动效', image: '', desc: '【动效设计】优设动效：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-3', name: 'LottieFiles', image: '', desc: '【动效设计】LottieFiles：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-4', name: 'Rive', image: '', desc: '【动效设计】Rive：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-5', name: 'Jitter', image: '', desc: '【动效设计】Jitter：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-6', name: 'Principle', image: '', desc: '【动效设计】Principle：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-7', name: 'Framer Motion', image: '', desc: '【动效设计】Framer Motion：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-8', name: 'After Effects 模板', image: '', desc: '【动效设计】After Effects 模板：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-9', name: 'Videohive', image: '', desc: '【动效设计】Videohive：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-10', name: 'Motion Design Jobs', image: '', desc: '【动效设计】Motion Design Jobs：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-11', name: 'School of Motion', image: '', desc: '【动效设计】School of Motion：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'motion-r-12', name: 'Animator Guild', image: '', desc: '【动效设计】Animator Guild：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'handbook',
      name: '设计手册',
      icon: '📚',
      displayType: 1,
      list: [
        { id: 'handbook-r-1', name: 'Material Design', image: '', desc: '【设计手册】Material Design：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-2', name: 'Human Interface', image: '', desc: '【设计手册】Human Interface：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-3', name: 'Apple HIG', image: '', desc: '【设计手册】Apple HIG：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-4', name: '优设设计规范', image: '', desc: '【设计手册】优设设计规范：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-5', name: 'Ant Design', image: '', desc: '【设计手册】Ant Design：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-6', name: 'Arco Design', image: '', desc: '【设计手册】Arco Design：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-7', name: 'TDesign', image: '', desc: '【设计手册】TDesign：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-8', name: 'Fluent UI', image: '', desc: '【设计手册】Fluent UI：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-9', name: 'Atlassian Design', image: '', desc: '【设计手册】Atlassian Design：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-10', name: 'IBM Carbon', image: '', desc: '【设计手册】IBM Carbon：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-11', name: 'Shopify Polaris', image: '', desc: '【设计手册】Shopify Polaris：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'handbook-r-12', name: 'Mailchimp Pattern', image: '', desc: '【设计手册】Mailchimp Pattern：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
    {
      id: 'collab',
      name: '协作工具',
      icon: '🧩',
      displayType: 1,
      list: [
        { id: 'collab-r-1', name: 'Figma', image: '', desc: '【协作工具】Figma：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-2', name: 'FigJam', image: '', desc: '【协作工具】FigJam：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-3', name: 'Miro', image: '', desc: '【协作工具】Miro：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-4', name: '飞书文档', image: '', desc: '【协作工具】飞书文档：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-5', name: '腾讯文档', image: '', desc: '【协作工具】腾讯文档：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-6', name: '石墨文档', image: '', desc: '【协作工具】石墨文档：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-7', name: 'Notion', image: '', desc: '【协作工具】Notion：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-8', name: '语雀', image: '', desc: '【协作工具】语雀：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-9', name: '妙记', image: '', desc: '【协作工具】妙记：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-10', name: 'ProcessOn', image: '', desc: '【协作工具】ProcessOn：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-11', name: 'Whimsical', image: '', desc: '【协作工具】Whimsical：本站收录示例，接口化后可接真实摘要与跳转。' },
        { id: 'collab-r-12', name: '优设协作导航', image: '', desc: '【协作工具】优设协作导航：本站收录示例，接口化后可接真实摘要与跳转。' },
      ],
    },
  ];
}

/** 卡片圆标底色；list 项未带 color 时由服务端补缺（后续可改读配置 / DB） */
const RESOURCE_CARD_PALETTE = [
  '#1677ff',
  '#ff6a00',
  '#7c3aed',
  '#059669',
  '#0ea5e9',
  '#e11d48',
  '#f59e0b',
  '#2563eb',
  '#db2777',
  '#65a30d',
];

function pickResourceListColor(id, index) {
  const s = String(id != null ? id : `idx-${index}`);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h + s.charCodeAt(i) * (i + 1)) % RESOURCE_CARD_PALETTE.length;
  }
  const k = (h + index * 3) % RESOURCE_CARD_PALETTE.length;
  return RESOURCE_CARD_PALETTE[k];
}

function enrichHomeCategoriesListColors(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((cat) => ({
    ...cat,
    list: (cat.list || []).map((row, i) => ({
      ...row,
      color:
        row.color && String(row.color).trim()
          ? String(row.color).trim()
          : pickResourceListColor(row.id != null ? row.id : `${cat.id}-${i}`, i),
    })),
  }));
}

const HUB_ARTICLE_PALETTE = [
  '#1677ff',
  '#ff6a00',
  '#7c3aed',
  '#059669',
  '#0ea5e9',
  '#e11d48',
  '#f59e0b',
  '#2563eb',
  '#db2777',
  '#65a30d',
];

const hubArticleTimePool = [
  '47分钟前',
  '2小时前',
  '昨天 18:02',
  '昨天 12:15',
  '04-16',
  '04-15',
];

const hubArticleAuthors = ['竹笋集', '徐红兰', '优设编辑部', '灵感库', '工具控'];

const aiFeedTimePool = [
  '今天 10:12',
  '今天 09:40',
  '昨天 18:05',
  '昨天 15:22',
  '昨天 11:00',
  '前天 16:48',
  '前天 09:15',
  '04-15',
  '04-14',
  '04-12',
  '04-10',
  '04-08',
  '04-05',
];

function buildNewsLineForCategory(categoryId, label) {
  const cid = String(categoryId || '');
  const lines = {
    hot: `热门速递：优设导航本周收录更新，${label}相关站点与工具持续扩充中。`,
    gallery: `图库要闻：${label}方向新增 4K 素材与版权说明更新，设计师可放心商用筛选。`,
    tutorial: `教程前线：${label}本周好课与免费章节已整理，含 Figma、Blender、AIGC 等方向。`,
    ui: `界面情报：${label}灵感站与组件库更新，移动端与 B 端案例一并收录。`,
    aigc: `AIGC 动态：大模型与绘图工具迭代频繁，${label}相关发布与限免活动速递。`,
    font: `字体快讯：${label}开源与商用授权说明更新，新字族与可变字体已入库。`,
    icon: `图标速递：${label}线性/面性套装更新，支持 SVG 与 Figma 一键引用。`,
    photo: `摄影资讯：${label}图库版权与签约摄影师专题上新，纪实与人像精选合集。`,
    illustration: `插画情报：${label}手绘与矢量素材专题，运营与海报场景一站补齐。`,
    mockup: `样机消息：${label}设备与包装模板更新，含透明与 4K 场景文件。`,
    ppt: `演示文稿：${label}模板与图表组件上新，汇报与融资路演场景可直接套用。`,
    video: `视频素材：${label}片头、空镜与字幕模板更新，可商用授权筛选已优化。`,
    webtpl: `网页模板：${label}响应式与落地页主题上新，含 Framer / Webflow 源文件。`,
    mobileui: `移动 UI：${label} App 截图与组件参考更新，含 iOS / Android 双端。`,
    brandcase: `品牌案例：${label}视觉与 VI 解析上新，国内外标杆项目持续收录。`,
    model3d: `3D 模型：${label}资产与可打印模型更新，含低多边形与 PBR 材质包。`,
    audio: `音频音效：${label}可商用音效与配乐专题，游戏与短视频场景分类补齐。`,
    toolkit: `在线工具：${label}效率小工具与浏览器插件上新，设计交付链路再缩短。`,
    inspiration: `灵感速递：${label}情绪板与配色案例更新，一键收藏至花瓣 / Savee。`,
    motion: `动效设计：${label} MG 与 UI 动效案例上新，含 Lottie 与 AE 工程。`,
    handbook: `设计手册：${label}规范与组件文档更新，团队可同步至语雀 / Notion。`,
    collab: `协作工具：${label}白板与文档更新，远程评审与版本对比能力增强。`,
  };
  return lines[cid] || `【${label}】要闻：本站持续收录与「${label}」相关的工具、站点与行业短讯。`;
}

function buildAiFeedForCategory(categoryId, label) {
  const cid = String(categoryId || '');
  const prefix =
    cid === 'aigc' ? 'AI 前沿' : cid === 'hot' ? '热门速递' : label;
  const n = 10;
  return Array.from({ length: n }, (_, i) => ({
    id: `${cid}-feed-${i + 1}`,
    title: `【${prefix}】精选 ${i + 1}：与「${label}」相关的工具更新、案例与行业短讯。`,
    time: aiFeedTimePool[i % aiFeedTimePool.length],
  }));
}

function buildHubArticlesForCategory(categoryId, label) {
  const cid = String(categoryId || '');
  const n = 6;
  return Array.from({ length: n }, (_, i) => ({
    id: `${cid}-hub-article-${i + 1}`,
    cover: `https://picsum.photos/seed/hubart-${cid}-${i}/400/300`,
    author: hubArticleAuthors[i % hubArticleAuthors.length],
    time: hubArticleTimePool[i % hubArticleTimePool.length],
    title:
      i === 0
        ? 'AI 还原页面设计怎么做？我实测后总结了这套「块状精修法」！'
        : `【${label}】设计实战 ${i + 1}：从需求到落地的清单与案例`,
    desc: `围绕「${label}」方向的图文导读与工具心得摘要，占位示例，接口化后可替换为真实摘要。`,
    tags:
      i % 3 === 0
        ? ['AIGC', 'AI绘画', 'Cursor', 'UI设计']
        : i % 3 === 1
          ? ['Figma', '组件库', 'B端']
          : ['排版', '品牌', '视觉'],
    titleAccent: i === 0,
    avatarColor: HUB_ARTICLE_PALETTE[i % HUB_ARTICLE_PALETTE.length],
  }));
}

function buildHubArticleBody(article, label) {
  if (!article) return '';
  return [
    `本文为「${label}」频道下的示例资讯，标题：${article.title}`,
    '',
    '在实际业务中，此处为正文：可接入 CMS 富文本、Markdown 渲染或 web-view 加载 H5。以下为占位段落，用于预览版式与行距。',
    '',
    '设计工作流里，建议将「需求拆解 → 组件选型 → 视觉还原 → 走查验收」拆成可复用清单；与 AI 协作时，可把页面按块状精修，逐块对齐标注与交互说明。',
    '',
    '若需评论、点赞、相关推荐等模块，可在本页下方继续堆叠组件。',
  ].join('\n');
}

function parseHubArticleId(articleId) {
  const raw = String(articleId || '');
  const marker = '-hub-article-';
  const j = raw.indexOf(marker);
  if (j <= 0) return null;
  const categoryId = raw.slice(0, j);
  const n = parseInt(raw.slice(j + marker.length), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return { categoryId, n };
}

function findCategoryNameInList(categories, categoryId) {
  if (!Array.isArray(categories)) return '推荐';
  const c = categories.find((x) => x && x.id === categoryId);
  return c && c.name ? String(c.name) : '推荐';
}

function enrichHomeCategoriesWithHubFeeds(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((cat) => {
    const label = cat.name ? String(cat.name) : '推荐';
    const cid = cat.id != null ? String(cat.id) : 'hot';
    return {
      ...cat,
      newsLine: buildNewsLineForCategory(cid, label),
      aiFeedItems: buildAiFeedForCategory(cid, label),
      hubArticles: buildHubArticlesForCategory(cid, label),
    };
  });
}

function joinImageUrl(image) {
  const raw = image ? String(image).trim() : '';
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = config.currentConfig && config.currentConfig.image_url
    ? String(config.currentConfig.image_url).trim()
    : '';
  if (!base) return raw;
  return `${base.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`;
}

function pickFirstString(item, keys = []) {
  for (const key of keys) {
    if (item[key] != null && item[key] !== '') return String(item[key]);
  }
  return '';
}

function normalizeStaticItem(item = {}, {
  titleKeys = ['title', 'name', 'text'],
  descKeys = ['descript', 'desc'],
  iconResolver = (value) => (value ? String(value) : ''),
  imageResolver = (value) => joinImageUrl(value),
} = {}) {
  return {
    id: item.id != null ? item.id : 0,
    title: pickFirstString(item, titleKeys),
    descript: pickFirstString(item, descKeys),
    bg: item.bg ? String(item.bg) : '',
    icon: iconResolver(item.icon),
    image: imageResolver(item.image),
    url: item.url ? String(item.url) : '',
    hot: !!item.hot,
    highlight: !!item.highlight,
  };
}

function mapNavItem(item = {}) {
  const normalized = normalizeStaticItem(item);
  return {
    id: normalized.id,
    label: normalized.title,
    title: normalized.title,
    bg: normalized.bg,
    icon: normalized.icon,
    image: normalized.image,
    url: normalized.url,
    hot: normalized.hot,
    descript: normalized.descript,
  };
}

function mapMenuItem(item = {}) {
  const normalized = normalizeStaticItem(item);
  const children = Array.isArray(item.list) ? item.list.map((child) => mapNavItem(child)) : [];
  return {
    id: normalized.id,
    style: children.length ? 'dropdown' : 'link',
    label: normalized.title,
    title: normalized.title,
    showBadge: normalized.hot,
    tapKey: normalized.title,
    url: normalized.url,
    icon: normalized.icon,
    image: normalized.image,
    hot: normalized.hot,
    descript: normalized.descript,
    children,
  };
}

function mapSearchEngineItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['name', 'title'],
    imageResolver: () => '',
  });
  const placeholders = Array.isArray(item.placeholders)
    ? item.placeholders.map(text => String(text))
    : (item.placeholder ? [String(item.placeholder)] : []);
  return {
    id: normalized.id,
    name: normalized.title,
    placeholders,
    url: normalized.url,
    queryKey: item.queryKey ? String(item.queryKey) : (item.query_key ? String(item.query_key) : ''),
    buttonText: item.buttonText ? String(item.buttonText) : (item.button_text ? String(item.button_text) : ''),
  };
}

function mapHotSearchTagItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['text', 'title'],
    imageResolver: () => '',
  });
  return {
    id: normalized.id,
    text: normalized.title,
    hot: normalized.hot,
    highlight: normalized.highlight,
    url: normalized.url,
  };
}

function mapHomeCategoryListItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['name', 'title'],
    descKeys: ['desc', 'descript'],
  });
  return {
    id: normalized.id,
    name: normalized.title,
    image: normalized.image,
    desc: normalized.descript,
    color: item.color ? String(item.color) : '',
    url: normalized.url,
    hot: normalized.hot,
  };
}

function mapHomeCategoryItem(item = {}) {
  const normalized = normalizeStaticItem(item, {
    titleKeys: ['name', 'title'],
    imageResolver: () => '',
  });
  return {
    id: normalized.id,
    name: normalized.title,
    icon: normalized.icon,
    displayType: item.show_type != null ? parseInt(item.show_type, 10) || 1 : (item.display_type != null ? parseInt(item.display_type, 10) || 1 : 1),
    list: Array.isArray(item.list) ? item.list.map((child) => mapHomeCategoryListItem(child)) : [],
  };
}

class NavigaHomeService extends BaseService {
  constructor() {
    super({
      service: {},
      model: {},
      prefix: '/naviga/home',
      dto: null,
    });
  }

  get factory() {
    return require('../../factory');
  }

  async getStaticBlock({ type, platform, userId = 0 }) {
    const block = await this.factory.biz_home_staticRepo.Get({
      strWhere: 'biz_home_static.type = :type and biz_home_static.platform = :platform and biz_home_static.is_new = :is_new',
      strParams: { type, platform, is_new: 1 },
      userId,
    });
    return block && Array.isArray(block.data) ? block.data : [];
  }

  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/page-config`, { config: { noAuth: true } }, (req, reply) => this.pageConfig(req, reply));
    app.get(`${p}/home-categories`, { config: { noAuth: true } }, (req, reply) => this.homeCategories(req, reply));
    app.get(`${p}/category-items`, { config: { noAuth: true } }, (req, reply) => this.categoryItems(req, reply));
    app.get(`${p}/category-articles`, { config: { noAuth: true } }, (req, reply) => this.categoryArticles(req, reply));
    app.get(`${p}/hub-article`, { config: { noAuth: true } }, (req, reply) => this.hubArticle(req, reply));
    app.post(`${p}/click`, { config: { noAuth: true } }, (req, reply) => this.click(req, reply));
    app.get(`${p}/test`, { config: { noAuth: true } }, (req, reply) => this.test(req, reply));
  }

  async click(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.fingerprint || !String(params.fingerprint).trim()) {
        return R({ succeed: false, msg: 'fingerprint不能为空', data: null });
      }
      if (params.home_id == null || params.home_id === '') {
        return R({ succeed: false, msg: 'home_id不能为空', data: null });
      }
      if (!params.platform || !String(params.platform).trim()) {
        return R({ succeed: false, msg: 'platform不能为空', data: null });
      }
      if (!params.event_type || !String(params.event_type).trim()) {
        return R({ succeed: false, msg: 'event_type不能为空', data: null });
      }
      if (!params.channel || !String(params.channel).trim()) {
        return R({ succeed: false, msg: 'channel不能为空', data: null });
      }

      const savedId = await clickRepo.AddOrUpdate({
        model: {
          fingerprint: String(params.fingerprint).trim(),
          home_id: parseInt(params.home_id, 10) || 0,
          time: new Date(),
          platform: String(params.platform).trim(),
          event_type: String(params.event_type).trim(),
          channel: String(params.channel).trim(),
        },
      });

      return R({ succeed: !!savedId, msg: savedId ? '' : '保存失败', data: savedId || '' });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '点击埋点保存失败', data: null });
    }
  }

  async homeCategories(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const homeData = await this.getStaticBlock({ type: 'home', platform, userId: params.userId });
      const baseCategories = homeData.map((item) => mapHomeCategoryItem(item));
      const colored = enrichHomeCategoriesListColors(baseCategories);
      const categories = enrichHomeCategoriesWithHubFeeds(colored);
      return R({ succeed: true, msg: '', data: { categories } });
    } catch (err) {
      return R({
        succeed: false,
        msg: err.message || '加载首页分类区块失败',
        data: null,
      });
    }
  }

  async categoryItems(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const categoryId = params.id != null && params.id !== '' ? String(params.id) : '';
      if (!categoryId) {
        return R({ succeed: false, msg: 'id不能为空', data: null });
      }

      const homeData = await this.getStaticBlock({ type: 'home', platform, userId: params.userId });
      const baseCategories = homeData.map((item) => mapHomeCategoryItem(item));
      const colored = enrichHomeCategoriesListColors(baseCategories);
      const category = colored.find((item) => String(item.id) === categoryId);

      return R({
        succeed: true,
        msg: '',
        data: {
          id: categoryId,
          items: category ? (category.list || []) : [],
        },
      });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '加载分类子项失败', data: null });
    }
  }

  async categoryArticles(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const categoryId = params.id != null && params.id !== '' ? String(params.id) : '';
      if (!categoryId) {
        return R({ succeed: false, msg: 'id不能为空', data: null });
      }

      const homeData = await this.getStaticBlock({ type: 'home', platform, userId: params.userId });
      const baseCategories = homeData.map((item) => mapHomeCategoryItem(item));
      const category = baseCategories.find((item) => String(item.id) === categoryId);
      const label = category && category.name ? String(category.name) : '推荐';
      const articles = buildHubArticlesForCategory(categoryId, label);

      return R({
        succeed: true,
        msg: '',
        data: {
          id: categoryId,
          title: label,
          items: articles,
        },
      });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '加载分类文章失败', data: null });
    }
  }

  async hubArticle(req, reply) {
    void reply;
    try {
      const articleId = req.query && req.query.articleId;
      const parsed = parseHubArticleId(articleId);
      if (!parsed) {
        return R({ succeed: false, msg: '无效的文章 id', data: null });
      }
      const { categoryId, n } = parsed;
      const baseCats = enrichHomeCategoriesListColors(buildHomeCategoriesPayload());
      const label = findCategoryNameInList(baseCats, categoryId);
      const list = buildHubArticlesForCategory(categoryId, label);
      const article = list[n - 1] || null;
      if (!article) {
        return R({ succeed: false, msg: '未找到文章', data: null });
      }
      const body = buildHubArticleBody(article, label);
      return R({ succeed: true, msg: '', data: { article, body } });
    } catch (err) {
      return R({
        succeed: false,
        msg: err.message || '加载文章失败',
        data: null,
      });
    }
  }

  async pageConfig(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const platform = params.platform ? String(params.platform).trim() : '';
      const [topMenuData, allNavData, searchEngineData, hotSearchData] = await Promise.all([
        this.getStaticBlock({ type: 'top_menu', platform, userId: params.userId }),
        this.getStaticBlock({ type: 'all_nav', platform, userId: params.userId }),
        this.getStaticBlock({ type: 'search_engine', platform, userId: params.userId }),
        this.getStaticBlock({ type: 'hot_search', platform, userId: params.userId }),
      ]);

      const menus = topMenuData.map((item) => mapMenuItem(item));
      const searchEngines = searchEngineData.map((item) => mapSearchEngineItem(item));
      const hotSearchTags = hotSearchData.map((item) => mapHotSearchTagItem(item));
      const allNavPopover = allNavData.map((item) => mapNavItem(item));

      const data = { menus, allNavPopover, searchEngines, hotSearchTags };
      return R({ succeed: true, msg: '', data: data });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '加载页面配置失败', data: null });
    }
  }
}

module.exports = new NavigaHomeService();

# 首批文章分发

知乎、掘金、CSDN、小红书长文草稿已接入管理台。采用 Wechatsync v2 浏览器扩展提供的 `$syncer.getAccounts`、`$syncer.addTask` 兼容接口；原创适配代码不复制 GPL 扩展源码，也不远程加载未固定版本脚本。

使用步骤：安装扩展，允许扩展访问管理端网站，在同一浏览器登录各平台；在管理台检测账号、选择最新已发布文章和平台、点击一键同步。素材链接转为公开前台 URL，平台 Cookie 不上传到管理 API。

数据库保存文章版本、平台、账号摘要、任务状态与实际草稿链接。同一版本、平台和账号使用唯一幂等键。扩展返回 done 只记录为草稿；缺少有效链接记为结果待核对。五分钟未完成、关闭页面或中断后须先到平台核对；明确核实没有产生草稿后可以重新排队。正式发布链接由主人手动核实并记录，界面说明验证来源。

状态：待同步、运行中、平台草稿、本人核实发布、待补充信息、登录失效、失败、结果待核对。小红书图文和视频笔记没有作为已接入能力承诺。

## 验收范围

纯逻辑检查覆盖小红书、草稿/未知结果解释、登录失效、补充信息、平台链接边界与媒体地址转换。尚未使用真实平台账号发送文章；实际同步需要本人的浏览器扩展及平台登录态。

## 协议依据

- https://github.com/wechatsync/Wechatsync/blob/v2/packages/extension/src/content/api.ts
- https://github.com/wechatsync/Wechatsync/blob/v2/packages/extension/public/inject-api.js
- https://github.com/wechatsync/article-syncjs/blob/main/src/Main.vue

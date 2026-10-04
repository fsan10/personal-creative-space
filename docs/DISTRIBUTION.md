# 首批文章分发

首批配置为知乎、掘金、CSDN、小红书。配置见 `config/distribution-platforms.json`；当前配置仅声明接入目标，所有连接状态为 `not_connected`。

## 小红书

优先使用 Wechatsync 已有的长文笔记草稿同步与 ProseMirror 内容转换。正文、图片、封面和最终状态通过平台适配器处理。

状态必须准确区分：待处理、执行中、已生成草稿、已正式发布、待补充信息、登录失效和失败。只有平台返回并验证了正式发布结果，才能记录为已正式发布。

图文笔记和视频笔记作为独立能力评估；不把长文草稿支持等同于所有笔记类型已经可发布。连接后使用本人的账号分别验收。

## 开源依据

- https://github.com/wechatsync/Wechatsync/blob/v2/CHANGELOG.md
- https://github.com/wechatsync/Wechatsync/blob/v2/packages/extension/ROADMAP.md
- https://github.com/xpzouying/xiaohongshu-mcp

接入后记录采用版本、平台能力矩阵、账号连接状态和实际验收结果。

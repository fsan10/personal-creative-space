# 项目工作台

在管理台设置中填写本人信任的 Coolify HTTPS 地址和 API Token。管理 API 先验证授权，Token 用服务器密钥派生的 AES-GCM 密钥加密保存，不回显、不放入 ZIP 导出。也可在 Sites 运行环境设置 COOLIFY_URL / COOLIFY_TOKEN，优先使用环境连接。

新建作品并填写公开 GitHub 仓库；可填写既有 Coolify 应用标识，或在项目工作台输入 Coolify 项目、服务器标识、分支、目录和构建方式，创建应用。应用创建不会自动部署；按项目需要到 Coolify 配置环境变量，然后在工作台部署。项目状态与部署完成状态分别记录。

部署请求具有请求级幂等键，数据库限制一个作品同时只有一个未结束部署。仅服务返回实际部署标识才记录已接收；刷新读取服务状态，不能把排队等同于上线。网络中断或缺少回执显示待核对，主人在服务端核对后可结束本站跟踪。未知结果不自动重试。

版本回退只显示 Coolify 实际仍保留的历史镜像。请求使用官方 POST /applications/{uuid}/rollback 与 commit 参数。数据库和媒体继续保留，数据恢复需单独执行备份恢复。日志限最近 100 行，服务授权令牌及常见敏感字段隐藏，完整日志在本人私有服务查看。

## 验收边界

纯逻辑与 SQLite 检查通过：公开 GitHub URL、输出元数据不带应用密码/secret/env、保留镜像、真实状态映射、并发部署排斥与请求幂等。当前没有用户提供的 Coolify 服务，未发起真实外部应用创建、构建或回退。

协议依据：
- https://coolify.io/docs/api/endpoints/applications/create-public-application
- https://coolify.io/docs/api/endpoints/deployments/deploy-by-tag-or-uuid
- https://coolify.io/docs/api/endpoints/applications/list-application-rollback-images
- https://coolify.io/docs/api/endpoints/applications/rollback-application-by-uuid

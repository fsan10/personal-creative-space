# 橘子的创作桌 · Personal Creative Space

个人博客、项目作品集与项目工作台。保留开源 Next.js + Strapi 基线与 MIT 许可证；新前台和管理台分别部署，内容保存在后台 D1/R2。

## 已上线

- 前台：https://fsan10-creative-web.jz1234da.chatgpt.site
- 本人私有管理台：https://fsan10-creative-admin.jz1234da.chatgpt.site
- 公开源代码：https://github.com/fsan10/personal-creative-space

前台公开，管理台需要用创建网站的 ChatGPT 账号访问。管理台负责文章、作品、素材、推荐规则与外部连接；服务密钥只保存在运行环境。

## 功能

- Markdown 原文、GFM 表格与代码块、图片/视频插入、自动保存、草稿、发布快照、定时发布、历史版本与回收站。
- 图片/视频上传与内容去重，已发布内容的素材访问，视频分段读取；单张图片 10 MB、视频 25 MB，更大的视频可嵌入外部地址。
- Markdown + YAML 导入导出、含媒体和校验清单的 ZIP 备份；导入为草稿，避免覆盖同名内容与站点设置。
- 文章与作品混合推荐：编辑分、完整度、新鲜度、匿名阅读反馈与主题相关性；支持置顶、类型比例、主题多样性和探索比例。
- 个性化响应式创作桌、文章与作品详情、站内搜索和筛选、相关推荐、RSS、sitemap、SEO；内置可运行的轨道与配色实验。
- 知乎、掘金、CSDN、小红书长文草稿分发接口、幂等任务和结果核对。实际发送需要桌面浏览器同步扩展及本人平台登录；草稿和正式发布分别显示。
- 可连接本人 Coolify，创建公开仓库应用、启动部署、查看真实状态和日志、使用服务保留的镜像回退。外部项目构建与运行由本人服务器承担。

平台账号和 Coolify 尚未连接验收，没有对外发送文章或启动真实外部项目部署。详细连接步骤见 [分发说明](docs/DISTRIBUTION.md) 和 [项目工作台](docs/DEPLOYMENT.md)。

## 从管理台开始

1. 在设置中填写自己的名称、首页介绍和 GitHub 地址。
2. 新建文章，用 Markdown 写作；上传或粘贴图片，插入视频，检查预览后发布。
3. 添加自己的作品、仓库与演示地址；可替换明确标记的内置示例。
4. 在首页推荐页调整权重、置顶与主题；定期导出含媒体 ZIP。
5. 按需连接同步扩展和 Coolify。连接成功前，界面保留等待连接或未核对状态。

## 项目结构与部署

| 目录 | 用途 |
| --- | --- |
| `apps/web/` | 已部署的 Vinext / React 前台，读取后台公开内容快照 |
| `apps/admin/` | 独立私有管理台，D1 内容 API、R2 素材与编辑工作流 |
| `next/`、`strapi/` | 保留的开源 Next.js + Strapi 基线，便于追溯与迁移 |
| `deploy/selfhost/` | 可选上游 Strapi + PostgreSQL + S3 配置，尚未容器运行验收 |
| `config/`、`docs/` | 平台能力、确认方案、架构、连接、验收与回退记录 |
| `scripts/` | 隐藏输入凭证的线上检查、明确标记的示例内容与 GitHub 节点同步 |

当前 Sites 版本运行在 Worker，不能直接运行常驻 Strapi、Docker 或任意项目容器。可选 Docker 配置尚未移植新管理台 API；新前台不能直接改地址切换到 Strapi。详见 [架构与迁移边界](docs/ARCHITECTURE.md) 和 [自托管说明](deploy/selfhost/README.md)。

### 运行配置

前台：`CMS_ORIGIN` 与私有服务访问令牌 `CMS_SITE_TOKEN`。

后台：`WEB_ORIGIN`、保留不变的加密根 `ADMIN_SERVICE_KEY`，以及平台提供的 `DB` / `BUCKET` 绑定。可选 `COOLIFY_URL` / `COOLIFY_TOKEN`，或者在管理台加密保存本人连接。验收时可设置临时 `ADMIN_AUTOMATION_KEY`，完成后从运行环境移除。

实际环境配置不提交到公开仓库。两个 `.openai/hosting.json` 记录各自 Sites 身份与存储绑定，更新时沿用原有项目，不另建同名网站。

## 验证与回退

功能检查、类型检查、构建与线上验收的实际结果记录在 [开发节点](docs/MILESTONES.md) 和 [上线验收](docs/VERIFICATION.md)。未运行的浏览器交互、真实平台发送、Coolify 和 Docker 验收分别保留明确边界。

每个独立功能或关键节点单独提交并同步到本人的公开仓库，关键上线节点保留实际远程标签。撤销功能使用 `git revert`；数据库、媒体和平台已产生的内容需要单独恢复。见 [Git 工作流](docs/GIT-WORKFLOW.md)。

## 开源来源

底座：[PictureElement/nextjs-strapi-portfolio-starter](https://github.com/PictureElement/nextjs-strapi-portfolio-starter)，保留原有 MIT 许可证和版权声明。上游说明见 [UPSTREAM-README.md](docs/UPSTREAM-README.md) 与 [UPSTREAM.md](docs/UPSTREAM.md)。

视觉与动画指导的 GitHub 来源、读取版本及采用方式见 [设计说明](docs/DESIGN.md)。分发采用扩展公开的兼容接口，未复制扩展源码。完整确认需求见 [建设方案](docs/PLAN.md)。

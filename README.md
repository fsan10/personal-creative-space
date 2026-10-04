# Personal Creative Space

个人博客、项目作品集与部署工作台。基于开源 Next.js + Strapi 项目进行改造，前台和后台管理页面独立部署。

## 已确认的范围

- Markdown 写作、图片和视频、文章与资源的导入导出。
- 作品详情、在线演示、项目部署与版本管理。
- 首页文章和项目混合推荐，可在后台调整规则。
- 首批分发平台：知乎、掘金、CSDN、小红书；微信公众号按账号能力接入。
- 小红书先接长文笔记草稿同步，正式发布结果与草稿结果分别显示。
- 前台与后台最终分别提供一个 Sites 链接；API、数据库与项目运行环境独立部署。

完整需求见 [建设方案](docs/PLAN.md)。

## 当前状态

开源底座与需求文档已准备。自定义功能尚未开发、连接或部署；公开仓库已创建：https://github.com/fsan10/personal-creative-space 。上游示例页面和数据不代表本站的实际内容或已经交付的能力。

## 项目结构

| 目录 | 用途 |
| --- | --- |
| `next/` | 上游 Next.js 前台，后续改造为个人创作空间 |
| `strapi/` | 内容 API、原生管理页与后续业务扩展 |
| `config/` | 分发平台与能力配置 |
| `docs/` | 确认需求、集成说明、提交与回退记录 |

## 提交规则

每个独立功能或关键节点单独提交，并立即推送到本人的公开 GitHub 仓库。关键节点保留编号标签；撤销功能优先使用 `git revert`，保留原有历史。

操作约定见 [Git 工作流](docs/GIT-WORKFLOW.md)，节点记录见 [开发节点](docs/MILESTONES.md)。

## 开源来源

底座：[PictureElement/nextjs-strapi-portfolio-starter](https://github.com/PictureElement/nextjs-strapi-portfolio-starter)。保留原有 MIT 许可证和版权声明。上游说明存放在 [UPSTREAM-README.md](docs/UPSTREAM-README.md)，版本记录见 [UPSTREAM.md](docs/UPSTREAM.md)。

后续开发先统一并验证依赖版本，再使用上游开发命令。当前尚未执行安装、构建或运行验收。

# 可选 Strapi 自托管配置

此目录部署保留的上游 Strapi CMS、PostgreSQL 和外部 S3 兼容存储。当前已上线的新前台与管理台位于 `apps/web` 和 `apps/admin`，使用 Sites Worker + D1/R2。这个 Docker 包尚未移植新管理台的推荐、分发和工作台接口，不能直接替换线上后台。

当前环境没有 Docker；配置已做 YAML 与路径核对，镜像构建、服务启动和 S3 联通尚未验证。

## 启动

从仓库根目录执行：

```sh
cp deploy/selfhost/.env.example deploy/selfhost/.env
```

填写数据库密码与各个独立随机密钥，`APP_KEYS` 使用逗号分隔的多个随机值；填写自己的 S3 兼容存储配置。可用 `openssl rand -hex 32` 分别生成随机值。实际 `.env` 已排除在 Git 和镜像上下文之外。

```sh
docker compose --env-file deploy/selfhost/.env -f deploy/selfhost/compose.yml config --quiet
docker compose --env-file deploy/selfhost/.env -f deploy/selfhost/compose.yml up -d --build
```

管理页在服务器本机 `http://127.0.0.1:1337/admin`。为外部访问配置自己的 HTTPS 反向代理，并创建本人管理员。PostgreSQL 只在容器网络提供访问。上传存储使用已保留的 Strapi S3 provider；按存储提供方选择 ACL 与签名 URL 行为。

保留的 `next/` 前台需要单独构建，配置 `NEXT_PUBLIC_STRAPI`、网站地址和服务器只读 API Token，并用 Strapi 原生数据模型添加内容。它是上游基线，尚未包含新创作桌界面。

## 备份与恢复

数据库使用 PostgreSQL 原生 `pg_dump` / `pg_restore`，媒体单独备份 S3 bucket。Strapi 原生导出和导入遵循其版本兼容规则。线上 Sites 内容可从新管理台导出 Markdown + YAML 和含媒体 ZIP；导入到这套 Strapi 数据模型前仍需编写映射，不能把新管理台 ZIP 当成 Strapi 原生归档。

代码回退不回退数据库或媒体。升级服务前保存数据库与媒体备份；保留原密钥，避免使已有加密数据不可读。

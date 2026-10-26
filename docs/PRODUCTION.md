# 生产环境边界

- 项目：学习计划管理系统
- 端口：前端 nginx :80；API :3001
- 目录：/home/ubuntu/learning-plan
- 进程：PM2：learning-plan-server；前端 nginx

## 推荐检查

`client/npm install；client/npm run build`

## 不上传、不覆盖

server/.env、server/database/data.sqlite* 和日志。这些内容只应通过独立的生产备份机制保存，不属于 Git 源码。

本仓库公开可见。任何真实凭据都不应写入代码、Issue、Actions 日志或 Git 历史。

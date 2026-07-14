# Content Factory MVP

## 宝塔生产部署

1. 宝塔安装 Node.js 24、pnpm 与 PM2，克隆仓库到 `/www/wwwroot/automation-factory`。
2. 进入 `content-factory`，复制 `.env.production.example` 为 `.env.local` 并填写生产变量。
3. 执行 `pnpm install --frozen-lockfile && pnpm build`。
4. 启动：`pm2 start ecosystem.config.cjs && pm2 save`。
5. 宝塔 Nginx 反向代理 `http://127.0.0.1:3000`，绑定域名并启用 SSL。

常规更新：`git pull && pnpm install --frozen-lockfile && pnpm build && pm2 reload automation-factory`。

两天可运行的 AI 内容自动化工厂：输入一个主题，生成标题、短视频脚本、分镜、图片素材与配音。

## 本地运行

    pnpm install
    pnpm dev

打开 http://localhost:3000，创建一个主题即可观察任务状态从 pending 到 generating 再到 completed。

## 架构边界

- src/lib/ai-providers.ts：文本、图片、配音 Provider 的统一接口；默认使用 OpenAI，也可用 AI_PROVIDER=local 切回演示模式。
- src/lib/task-store.ts：MVP 任务与内容包工作流；生产环境将替换为 Supabase Repository。
- supabase/migrations/0001_content_factory.sql：tasks、contents、assets、generations 数据表。
- remotionVideoRenderer：视频渲染预留接口，下一阶段接入 Remotion 或云渲染。

## 配置 Supabase

复制 .env.example 为 .env.local，填入 Supabase 项目地址及服务端密钥、OPENAI_API_KEY；在 Supabase SQL Editor 执行迁移文件。

> 未配置 Supabase 时，MVP 使用进程内数据。未配置 OPENAI_API_KEY 时，任务会失败并给出明确配置提示；不会自动回退并产生不可见的演示结果。

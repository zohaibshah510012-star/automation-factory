# Automation Factory Production Readiness Report

生成日期：2026-07-15  
阶段：Commercial Launch v1.0 → Production Launch Validation  
仓库路径：`D:\Users\admin\Documents\Automation Factory（自动化工厂）\content-factory`  
最新本地提交：`b257345 chore: complete production launch checks`  
结论：**暂不建议直接上线生产。系统本地构建通过，Payment owner 验证已在 Production Hardening 阶段修复；但生产数据库、环境变量和服务器运行环境仍存在上线阻塞项。**

---

## 1. 已通过项目

### 1.1 本地数据库迁移编号

本地 `supabase/migrations` 已检查：

- 迁移文件数量：22
- 编号范围：`0001 → 0022`
- 重复编号：未发现
- 缺失编号：未发现
- 本地顺序：正确

本地迁移清单：

| 编号 | 文件 | 本地状态 |
| --- | --- | --- |
| 0001 | `0001_content_factory.sql` | 存在 |
| 0002 | `0002_saas_foundation.sql` | 存在 |
| 0003 | `0003_v1_operations.sql` | 存在 |
| 0004 | `0004_runtime_observability.sql` | 存在 |
| 0005 | `0005_prompt_workflow_runs.sql` | 存在 |
| 0006 | `0006_runtime_audit.sql` | 存在 |
| 0007 | `0007_credit_settlement.sql` | 存在 |
| 0008 | `0008_image_tasks.sql` | 存在 |
| 0009 | `0009_video_tasks.sql` | 存在 |
| 0010 | `0010_short_drama_agent.sql` | 存在 |
| 0011 | `0011_short_drama_assets.sql` | 存在 |
| 0012 | `0012_short_drama_images.sql` | 存在 |
| 0013 | `0013_short_drama_videos.sql` | 存在 |
| 0014 | `0014_short_drama_assets.sql` | 存在 |
| 0015 | `0015_video_task_worker.sql` | 存在 |
| 0016 | `0016_distribution_jobs.sql` | 存在 |
| 0017 | `0017_distribution_providers.sql` | 存在 |
| 0018 | `0018_billing_core.sql` | 存在 |
| 0019 | `0019_payment_framework.sql` | 存在 |
| 0020 | `0020_ai_provider_catalog.sql` | 存在 |
| 0021 | `0021_workspace_foundation.sql` | 存在 |
| 0022 | `0022_workspace_rls_fix.sql` | 存在 |

### 1.2 本地构建

执行结果：

- `pnpm build`：通过
- Next.js 页面/API 编译：通过
- TypeScript 检查：通过
- 生成静态页面：44/44 通过

### 1.3 Lint

执行结果：

- `pnpm lint`：通过
- 错误：0
- 警告：8

当前警告不阻塞构建，但建议上线后进入代码质量修复队列：

- React Hook dependency warning
- `<img>` 性能提示
- 一处图片缺少 `alt`
- 一处未使用变量

### 1.4 敏感环境变量暴露检查

检查结果：

- 未发现私有 `.env.local` 被 Git 跟踪
- 未发现明显的 `NEXT_PUBLIC_*` 私钥命名泄露
- `SUPABASE_SERVICE_ROLE_KEY` 当前只在服务端 Supabase client 中使用
- 浏览器端 Supabase client 只读取 public URL / anon key

### 1.5 API 权限基础检查

抽查结果：

- Admin API 大部分已使用 `requireAdmin`
- 用户 API 大部分已使用 `requireUser`
- `/api/health` 为公开健康检查接口，属于合理设计
- Billing、Distribution、Payment Provider、Analytics 等后台接口已具备管理员保护模式

---

## 2. 未通过项目

### 2.1 远程 Supabase 迁移未同步

执行 `supabase migration list` 后确认：

- 本地：`0001 → 0022`
- 远程 Supabase：仅应用到 `0006`
- 远程缺失：`0007 → 0022`

这是当前最大上线阻塞项。生产库未应用后续迁移时，以下模块会在真实环境中不可用或异常：

- Credits settlement
- Image tasks
- Video tasks
- Short Drama assets / scenes / media
- Distribution jobs / providers
- Billing core
- Payment framework
- AI provider catalog
- Workspace foundation / RLS 修复

### 2.2 本地环境变量不完整

`.env.local` 检查结果：

| 变量 | 状态 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 已存在 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **缺失** |
| `SUPABASE_SERVICE_ROLE_KEY` | 已存在 |
| `OPENAI_API_KEY` | 已存在 |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` 缺失会影响：

- 浏览器端 Supabase 初始化
- 用户注册/登录
- Dashboard 用户会话
- 用户端真实链路测试

### 2.3 当前机器无法验证宝塔生产环境

本地 Windows 环境检查结果：

- Node：`v24.18.0`
- pnpm：`11.12.0`
- Supabase CLI：`2.109.1`
- PM2：未安装 / 当前环境不可用
- Nginx：未安装 / 当前环境不可用

因此当前机器不能代表宝塔服务器最终状态。PM2、Nginx、SSL 必须在生产服务器上复核。

### 2.4 真实业务链路未完成生产实测

由于远程数据库迁移未同步、anon key 缺失、生产服务器未验证，完整业务链路尚不能判定通过：

用户注册 → 创建 Workspace → 选择套餐 → Credits 到账 → 创建 Prompt 任务 → AI 执行 → 内容生成 → 图片任务 → 视频任务 → Workflow 记录 → Credits 扣除 → Dashboard 展示

当前只能确认本地构建通过，不能确认生产链路已通过。

---

## 3. 阻塞问题

上线前必须先处理以下阻塞项：

1. **应用 Supabase 远程迁移 `0007 → 0022`**
   - 当前生产库只到 `0006`
   - 后续商业化、媒体、分发、支付、Workspace 表都未在远程生产库落地

2. **补齐生产环境变量**
   - 必须配置 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 必须确认生产环境存在：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `OPENAI_API_KEY`

3. **生产服务器运行环境未验证**
   - PM2 未在当前环境验证
   - Nginx 未在当前环境验证
   - SSL 未在当前环境验证
   - 宝塔站点反代配置未在当前环境验证

4. **Payment verify 权限风险**
   - 状态：已修复
   - `/api/payments/[id]/verify` 当前要求登录用户
   - 普通用户验证 payment 时会按 `payment.user_id = current_user.id` 限制
   - Admin token 可验证全部 payment，用于后台运营管理

5. **真实支付 Provider/Webhook 未上线**
   - 当前支付框架适合 sandbox/mock
   - Stripe/PayPal 真实回调、签名验证、幂等事件处理仍需生产接入前完成

---

## 4. 上线前必须修复项

### P0：必须修复后才能上线

- [ ] 在生产 Supabase 执行并确认 `0007 → 0022` migrations
- [ ] 补齐生产环境 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 在宝塔服务器确认 Node / pnpm / PM2 / Nginx / SSL
- [x] 修复 `/api/payments/[id]/verify` payment ownership 校验
- [ ] 使用真实用户账号跑通 Auth / Dashboard / Admin 权限
- [ ] 使用生产 Supabase 执行 `/api/health` 健康检查

### P1：建议上线前完成

- [ ] 配置 Nginx 或边缘层安全响应头：
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `frame-ancestors` 或 `X-Frame-Options`
- [ ] 对普通用户和 Admin 用户分别验证 RLS
- [ ] 验证 Service Role 只在服务端 API / service 层使用
- [ ] 验证 OpenAI / 图片 / 视频 Provider 的生产 key、限额和失败日志
- [ ] 验证 PM2 日志路径可写：
  - `/www/wwwlogs/automation-factory.out.log`
  - `/www/wwwlogs/automation-factory.error.log`

### P2：非阻塞质量项

- [ ] 修复 lint warnings
- [ ] 将 Dashboard 图片展示迁移为 Next.js `<Image />`
- [ ] 给 Studio 图片预览补充 `alt`
- [ ] 修复 React Hook dependency warnings

---

## 5. Production Migration Checklist

### 当前状态

| 检查项 | 状态 | 说明 |
| --- | --- | --- |
| 本地 migration 编号连续 | 通过 | `0001 → 0022` |
| 本地 migration 无重复 | 通过 | 未发现重复编号 |
| 本地 migration 文件存在 | 通过 | 22 个文件 |
| 远程 migration 同步 | **未通过** | 远程只到 `0006` |
| 远程缺失 migration | **未通过** | `0007 → 0022` |

### 推荐执行顺序

1. 备份生产 Supabase 数据库。
2. 确认当前生产环境连接的是正确 Supabase project。
3. 在应用目录确认 Supabase CLI 登录并连接正确生产项目：

```bash
cd /www/wwwroot/automation-factory/content-factory
supabase status
supabase migration list
```

4. 执行迁移：

```bash
supabase db push
```

5. 再次确认：

```bash
supabase migration list
```

6. 验证远程 `0001 → 0022` 全部 applied，重点确认以下生产表/RPC已存在：

- `credit_transactions.subscription_id`
- `plans`
- `subscriptions`
- `subscription_adjustments`
- `payment_providers`
- `payments`
- `payment_events`
- `ai_provider_catalog`
- `workspaces`
- `workspace_members`
- `grant_subscription_credits`

7. 执行健康检查：

```bash
curl https://your-domain.com/api/health
```

8. 使用真实用户和 Admin 账号进行权限验证。

### 迁移故障回滚原则

上线前必须先备份生产数据库。若 `supabase db push` 失败：

1. 不要继续启动新版本应用。
2. 保存 Supabase CLI 输出。
3. 对照失败 migration 编号检查 SQL。
4. 必要时从备份恢复生产库或只回滚失败 migration 的局部变更。
5. 修复后重新从失败编号继续执行。

---

## 6. 生产环境检查清单

### 环境变量

生产环境必须存在：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

禁止：

```bash
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=
NEXT_PUBLIC_*SECRET*
NEXT_PUBLIC_*PRIVATE*
NEXT_PUBLIC_*TOKEN*
```

### 宝塔 / PM2 / Nginx

生产服务器需要确认：

```bash
node -v
pnpm -v
pm2 -v
nginx -v
```

推荐启动方式：

```bash
cd /www/wwwroot/automation-factory/content-factory
pnpm install --frozen-lockfile
pnpm build
pm2 start ecosystem.config.cjs
pm2 save
```

已存在 `ecosystem.config.cjs`，当前配置要点：

- app name：`automation-factory`
- cwd：`/www/wwwroot/automation-factory/content-factory`
- script：`.next/standalone/server.js`
- env：
  - `NODE_ENV=production`
  - `PORT=3000`
  - `HOSTNAME=127.0.0.1`

Nginx 需要反代到：

```text
127.0.0.1:3000
```

推荐 Nginx 站点配置要点：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /www/server/panel/vhost/cert/your-domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your-domain.com/privkey.pem;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

SSL 检查：

```bash
curl -I https://your-domain.com
```

PM2 检查：

```bash
pm2 list
pm2 logs automation-factory --lines 100
pm2 save
pm2 startup
```

---

## 7. 真实业务测试清单

生产迁移和环境变量修复后，按以下顺序验收：

### 用户端

- [ ] 注册新用户
- [ ] 登录
- [ ] 创建 Workspace
- [ ] 查看 Billing 页面
- [ ] 绑定/选择套餐
- [ ] 确认 Credits 到账
- [ ] 创建 Prompt 任务
- [ ] AI 执行成功
- [ ] 内容资产保存成功
- [ ] 图片任务创建和展示
- [ ] 视频任务创建和状态回收
- [ ] Workflow run / step run 记录完整
- [ ] Credits 扣除、退款、交易记录正确
- [ ] Dashboard 展示内容正确

### Admin

- [ ] 用户管理可访问
- [ ] Billing Plans 可创建/编辑/禁用
- [ ] Subscriptions 可调整并写入 audit logs
- [ ] Credits 调整通过 RPC，不直接改余额
- [ ] Distribution Provider 可启用/禁用
- [ ] Payment Provider 设置不保存密钥
- [ ] Analytics 指标可加载
- [ ] Logs 可查看失败原因

### Payment 权限测试

上线前必须执行以下权限测试：

| 场景 | 操作 | 预期结果 |
| --- | --- | --- |
| 普通用户验证自己的 payment | `POST /api/payments/{own_payment_id}/verify` | 成功 |
| 普通用户验证他人的 payment | `POST /api/payments/{other_user_payment_id}/verify` | 返回 404，不泄露资源存在性 |
| 未登录用户验证 payment | 无 Authorization 调用 verify | 返回 401 |
| Admin 验证任意 payment | Admin token 调用 verify | 成功 |
| 已验证 payment 再次验证 | 重复调用 verify | 不重复创建订阅/额度异常 |

---

## 8. 安全检查结论

### 已通过

- 私钥未以 `NEXT_PUBLIC_*` 形式暴露
- service role 使用集中在服务端 client
- Admin API 具备 `requireAdmin` 保护模式
- 用户 API 具备 `requireUser` 保护模式
- `.env.local` 未被 Git 跟踪

### 需要修复/复核

- Payment verify 必须补充 payment owner 校验
- 生产 RLS 需要在远程库迁移完成后复测
- Nginx / Edge security headers 需要上线前配置
- Stripe/PayPal 真实支付前必须实现 webhook 签名验证和事件幂等
- 真实 Provider key、额度、错误日志需要生产环境 smoke test

---

## 9. 最终上线步骤

建议按照以下步骤上线：

1. 在 Supabase 生产库执行完整备份。
2. 设置生产环境变量，补齐 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
3. 执行 `supabase db push`。
4. 执行 `supabase migration list`，确认远程已到 `0022`。
5. 在生产服务器执行：

```bash
cd /www/wwwroot/automation-factory/content-factory
pnpm install --frozen-lockfile
pnpm build
pm2 start ecosystem.config.cjs
pm2 save
```

6. 配置 Nginx 反代和 SSL。
7. 增加安全响应头。
8. 执行 `/api/health`。
9. 创建普通用户账号，跑通用户业务链路。
10. 创建 Admin 账号，跑通后台管理链路。
11. 验证 system logs / audit logs / credit transactions。
12. 验证 Provider 失败和重试行为。
13. 确认无 P0 阻塞后再开放真实用户访问。

---

## 10. 当前上线判断

当前状态：**不建议直接上线生产。**

原因：

1. 生产 Supabase migration 未同步到 `0022`。
2. 本地/生产环境变量检查发现 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 缺失。
3. 当前机器无法验证宝塔 PM2 / Nginx / SSL。
4. 真实支付前仍需修复 payment ownership 校验和 webhook 验签。

系统代码本地构建已经通过，说明 Commercial Launch v1.0 的工程实现具备进入生产验收的基础；但生产发布必须先完成上述 P0 修复和服务器验收。

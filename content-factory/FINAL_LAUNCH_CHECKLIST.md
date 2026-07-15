# Automation Factory Final Launch Checklist

生成日期：2026-07-15  
阶段：Final Launch Verification  
适用范围：生产上线前最后一次人工/服务器实机验收  
当前基线提交：`dbeb095 fix: harden production readiness`

> 本清单只用于上线验证，不代表新增业务功能。每一项必须在生产 Supabase、宝塔服务器和真实账号环境中逐项打勾确认。

---

## 0. 上线结论判定

只有以下条件全部满足，才允许开放真实用户访问：

- [ ] Supabase 生产库 migration 已从 `0001` 到 `0022` 全部 applied
- [ ] 生产环境变量完整，且无私钥以 `NEXT_PUBLIC_*` 暴露
- [ ] 宝塔 Node / pnpm / PM2 / Nginx / SSL 已实机验证
- [ ] 用户 Smoke Test 全链路通过
- [ ] Admin Smoke Test 全链路通过
- [ ] Billing / Credits / Payment 安全验证通过
- [ ] PM2 与 Nginx 日志可查，异常可定位

---

## 1. Supabase migration 验证

### 1.1 本地迁移文件确认

当前本地迁移应包含：

| 编号 | 文件 |
| --- | --- |
| 0001 | `0001_content_factory.sql` |
| 0002 | `0002_saas_foundation.sql` |
| 0003 | `0003_v1_operations.sql` |
| 0004 | `0004_runtime_observability.sql` |
| 0005 | `0005_prompt_workflow_runs.sql` |
| 0006 | `0006_runtime_audit.sql` |
| 0007 | `0007_credit_settlement.sql` |
| 0008 | `0008_image_tasks.sql` |
| 0009 | `0009_video_tasks.sql` |
| 0010 | `0010_short_drama_agent.sql` |
| 0011 | `0011_short_drama_assets.sql` |
| 0012 | `0012_short_drama_images.sql` |
| 0013 | `0013_short_drama_videos.sql` |
| 0014 | `0014_short_drama_assets.sql` |
| 0015 | `0015_video_task_worker.sql` |
| 0016 | `0016_distribution_jobs.sql` |
| 0017 | `0017_distribution_providers.sql` |
| 0018 | `0018_billing_core.sql` |
| 0019 | `0019_payment_framework.sql` |
| 0020 | `0020_ai_provider_catalog.sql` |
| 0021 | `0021_workspace_foundation.sql` |
| 0022 | `0022_workspace_rls_fix.sql` |

检查命令：

```bash
cd /www/wwwroot/automation-factory/content-factory
ls -1 supabase/migrations
supabase migration list
```

验收标准：

- [ ] migration 编号连续：`0001 → 0022`
- [ ] 没有重复编号
- [ ] `supabase migration list` 远程列显示 `0001 → 0022` 均已 applied
- [ ] 远程不再停留在 `0006`

### 1.2 生产迁移执行

执行前：

- [ ] 已完成 Supabase 生产库备份
- [ ] 已确认 Supabase CLI 指向正确生产 project
- [ ] 已确认当前代码分支为待上线分支

执行：

```bash
cd /www/wwwroot/automation-factory/content-factory
supabase status
supabase migration list
supabase db push
supabase migration list
```

迁移后必须确认：

- [ ] `plans` 表存在
- [ ] `subscriptions` 表存在
- [ ] `subscription_adjustments` 表存在
- [ ] `credit_transactions.subscription_id` 字段存在
- [ ] `grant_subscription_credits` RPC 存在
- [ ] `payment_providers` 表存在
- [ ] `payments` 表存在
- [ ] `payment_events` 表存在
- [ ] `distribution_jobs` / `distribution_providers` 表存在
- [ ] `short_drama_assets` / `short_drama_scenes` 表存在
- [ ] `workspaces` / `workspace_members` 表存在

### 1.3 迁移失败处理

如果迁移失败：

1. 立即停止应用发布。
2. 保存 Supabase CLI 输出。
3. 不要强行启动新版本。
4. 根据失败 migration 编号修复 SQL 或从备份恢复。
5. 修复后重新执行 `supabase db push`。

---

## 2. 环境变量验证

### 2.1 必填变量

生产环境必须存在：

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ADMIN_EMAILS=
```

按实际 Provider 选择补充：

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_TEXT_MODEL=deepseek-chat
```

如启用真实支付，再补充服务端变量：

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

验收标准：

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已配置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已配置
- [ ] `OPENAI_API_KEY` 或当前启用 AI Provider key 已配置
- [ ] `ADMIN_EMAILS` 包含创始人/管理员邮箱
- [ ] `.env.local` / `.env.production` 未提交 Git

### 2.2 私钥暴露检查

禁止出现：

```bash
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=
NEXT_PUBLIC_STRIPE_SECRET_KEY=
NEXT_PUBLIC_*SECRET*
NEXT_PUBLIC_*PRIVATE*
NEXT_PUBLIC_*TOKEN*
```

检查命令：

```bash
grep -R "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*PRIVATE\|NEXT_PUBLIC_.*TOKEN\|NEXT_PUBLIC_.*SERVICE_ROLE\|NEXT_PUBLIC_OPENAI" .env* src || true
```

验收标准：

- [ ] Service Role 只存在服务端环境变量
- [ ] OpenAI / DeepSeek / Stripe 私钥没有 `NEXT_PUBLIC_` 前缀
- [ ] 前端只使用 Supabase URL 和 Anon Key

---

## 3. 宝塔部署步骤

### 3.1 服务器目录

推荐目录：

```bash
/www/wwwroot/automation-factory/content-factory
```

部署步骤：

```bash
cd /www/wwwroot/automation-factory
git pull
cd content-factory
pnpm install --frozen-lockfile
pnpm build
```

验收标准：

- [ ] `git pull` 成功
- [ ] `pnpm install --frozen-lockfile` 成功
- [ ] `pnpm build` 成功
- [ ] `.next/standalone/server.js` 存在

### 3.2 运行版本确认

```bash
node -v
pnpm -v
git log -1 --oneline
```

建议：

- Node.js：使用 Next.js 兼容的生产版本，优先 Node 20 LTS 或项目已验证版本
- pnpm：使用服务器固定版本，避免每次上线漂移

验收标准：

- [ ] Node 可用
- [ ] pnpm 可用
- [ ] 当前 commit 为本次上线 commit

---

## 4. PM2 验证

当前项目已有 `ecosystem.config.cjs`：

```js
name: "automation-factory"
cwd: "/www/wwwroot/automation-factory/content-factory"
script: ".next/standalone/server.js"
PORT: 3000
HOSTNAME: "127.0.0.1"
```

启动：

```bash
cd /www/wwwroot/automation-factory/content-factory
pm2 start ecosystem.config.cjs
pm2 save
```

验证：

```bash
pm2 list
pm2 describe automation-factory
pm2 logs automation-factory --lines 100
curl -I http://127.0.0.1:3000
```

验收标准：

- [ ] `automation-factory` 状态为 `online`
- [ ] `restart` 次数没有持续增长
- [ ] 内存没有超过 `max_memory_restart`
- [ ] `curl -I http://127.0.0.1:3000` 返回 200/3xx
- [ ] 错误日志没有启动失败、缺 env、端口冲突

日志路径：

```bash
/www/wwwlogs/automation-factory.out.log
/www/wwwlogs/automation-factory.error.log
```

---

## 5. Nginx 验证

### 5.1 反向代理配置

Nginx 应反代到：

```text
127.0.0.1:3000
```

推荐配置要点：

```nginx
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
```

检查：

```bash
nginx -t
systemctl status nginx
curl -I https://your-domain.com
```

验收标准：

- [ ] `nginx -t` 成功
- [ ] Nginx 服务运行中
- [ ] 域名访问返回 200/3xx
- [ ] 静态资源正常加载
- [ ] API 路由正常返回

### 5.2 安全响应头

建议配置：

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

验收标准：

- [ ] `X-Content-Type-Options` 存在
- [ ] `X-Frame-Options` 或 CSP `frame-ancestors` 存在
- [ ] `Referrer-Policy` 存在
- [ ] `Permissions-Policy` 存在

---

## 6. SSL 验证

宝塔 SSL 配置后检查：

```bash
curl -I http://your-domain.com
curl -I https://your-domain.com
```

验收标准：

- [ ] HTTP 自动跳转 HTTPS
- [ ] HTTPS 证书有效
- [ ] 浏览器无证书警告
- [ ] API 请求走 HTTPS
- [ ] Supabase callback / OAuth / redirect URL 与 HTTPS 域名一致

注意：

- 不建议在未完全理解影响前启用 HSTS。
- 若启用 HSTS，必须确认子域、证书续期、回滚策略都已准备好。

---

## 7. 用户 Smoke Test

使用一个全新普通用户账号验证：

| 步骤 | 操作 | 预期结果 | 状态 |
| --- | --- | --- | --- |
| 1 | 打开首页 | 页面正常加载 | [ ] |
| 2 | 注册用户 | 注册成功 | [ ] |
| 3 | 登录 | 登录成功并进入 Dashboard | [ ] |
| 4 | 创建 Workspace | Workspace 创建成功 | [ ] |
| 5 | 打开 Billing | 显示当前套餐/余额/状态 | [ ] |
| 6 | 选择套餐或创建 checkout | 生成 payment 记录 | [ ] |
| 7 | 验证 payment | 只能验证自己的 payment | [ ] |
| 8 | Credits 到账 | 余额增加，交易记录存在 | [ ] |
| 9 | 创建 Prompt 任务 | task 创建成功 | [ ] |
| 10 | AI 执行 | 返回生成内容 | [ ] |
| 11 | 内容资产保存 | `/dashboard/content` 可见 | [ ] |
| 12 | 图片任务 | 创建并显示状态 | [ ] |
| 13 | 视频任务 | 创建并显示状态 | [ ] |
| 14 | Workflow 记录 | run / step run 可查 | [ ] |
| 15 | Credits 扣除 | 余额与交易记录正确 | [ ] |

通过标准：

- [ ] 普通用户只能看到自己的数据
- [ ] 失败任务有明确错误日志
- [ ] Credits 不重复扣除或重复发放
- [ ] Dashboard 不出现空白页或 500

---

## 8. Admin Smoke Test

使用 Admin 账号验证：

| 模块 | 操作 | 预期结果 | 状态 |
| --- | --- | --- | --- |
| Admin 首页 | 打开 `/admin` | 可进入 | [ ] |
| 用户管理 | 查看用户 | 可加载用户数据 | [ ] |
| Billing | 查看/创建/编辑套餐 | 成功并写 audit logs | [ ] |
| Subscriptions | 调整用户套餐/状态/有效期 | 成功并写 adjustment/audit | [ ] |
| Credits | 管理员增加额度 | 通过 RPC，不直接改余额 | [ ] |
| Provider 管理 | 启用/禁用 Provider | 状态生效 | [ ] |
| Distribution | 查看发布任务 | 任务列表和详情正常 | [ ] |
| Payment Settings | 查看 Provider / Payment / Event | 正常显示，不展示密钥 | [ ] |
| Analytics | 查看运营指标 | 指标正常加载 | [ ] |
| Logs | 查看 system logs | 能定位失败原因 | [ ] |

通过标准：

- [ ] 非 Admin 访问 `/admin/*` 被拒绝
- [ ] Admin 修改动作写入 `audit_logs`
- [ ] 页面无 500 / 白屏
- [ ] 不展示任何 secret / token / service role key

---

## 9. Billing 验证

### 9.1 Plan 验证

- [ ] 创建 plan：name / description / price / credits / features / enabled
- [ ] 编辑 plan
- [ ] 禁用 plan
- [ ] 禁用 plan 不应作为新 checkout 可选项

### 9.2 Subscription 验证

- [ ] 给用户绑定 plan
- [ ] 修改用户 plan
- [ ] 修改 subscription status
- [ ] 修改 expires_at
- [ ] 添加备注 note
- [ ] `subscription_adjustments` 写入 before_data / after_data / reason / operator
- [ ] `audit_logs` 写入管理员动作

### 9.3 Credits 验证

- [ ] `grant_subscription_credits` 第一次执行增加余额
- [ ] 重复执行同一 subscription grant 不重复增加余额
- [ ] `credit_transactions` 写入 `subscription_id`
- [ ] `(subscription_id, type)` 幂等约束生效
- [ ] 任务消费仍走原有 reserve / commit / refund 流程

通过标准：

- [ ] 套餐额度发放幂等
- [ ] 订阅调整可追溯
- [ ] Credits 余额、交易记录、Dashboard 展示一致

---

## 10. Payment 安全验证

### 10.1 Payment owner 验证

`/api/payments/[id]/verify` 必须满足：

| 场景 | 请求身份 | 预期结果 | 状态 |
| --- | --- | --- | --- |
| 验证自己的 payment | 普通用户 A | 成功 | [ ] |
| 验证他人的 payment | 普通用户 A 验证用户 B 的 payment | 404，不泄露资源存在性 | [ ] |
| 未登录验证 payment | 无 token | 401 | [ ] |
| Admin 验证任意 payment | Admin | 成功 | [ ] |
| 重复验证 payment | 同一 payment 多次 verify | 不重复发放异常额度 | [ ] |

### 10.2 Payment Provider 验证

- [ ] Mock Provider 仅用于 sandbox/demo
- [ ] Stripe/PayPal 未配置真实 webhook 前，不开放真实收款
- [ ] payment provider 配置不保存 API key / secret
- [ ] payment events 可追踪 checkout_created / payment_verified
- [ ] payment 失败时状态和日志可查

### 10.3 真实支付上线前附加要求

真实支付开放前必须完成：

- [ ] Stripe/PayPal webhook 签名验证
- [ ] webhook raw body 校验
- [ ] payment event 幂等处理
- [ ] 退款/失败/取消状态同步
- [ ] 金额、币种、plan_id 与服务端记录严格匹配

---

## 11. 最终放量前检查

上线前最后执行：

```bash
cd /www/wwwroot/automation-factory/content-factory
git status --short --branch
pnpm build
pm2 restart automation-factory
pm2 logs automation-factory --lines 100
curl -I https://your-domain.com
curl https://your-domain.com/api/health
```

最终确认：

- [ ] Git 工作区干净
- [ ] build 通过
- [ ] PM2 online
- [ ] Nginx 正常
- [ ] SSL 正常
- [ ] `/api/health` 正常
- [ ] 用户链路通过
- [ ] Admin 链路通过
- [ ] Billing / Payment 安全验证通过

---

## 12. 回滚方案

如果上线后出现 P0 故障：

1. 立即停止放量。
2. PM2 回滚到上一稳定 commit：

```bash
cd /www/wwwroot/automation-factory/content-factory
git log --oneline -5
git checkout <last_stable_commit>
pnpm install --frozen-lockfile
pnpm build
pm2 restart automation-factory
```

3. 若数据库 migration 已执行且需要回滚，优先恢复上线前 Supabase 备份。
4. 保留：
   - PM2 logs
   - Nginx logs
   - Supabase migration output
   - system_logs / audit_logs 截图或导出

---

## 13. 当前必须特别关注

根据最近一次 Production Readiness 验证，当前重点仍是：

- [ ] 远程 Supabase 不得停留在 `0006`，必须 applied 到 `0022`
- [ ] 生产环境必须补齐 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 宝塔 PM2 / Nginx / SSL 必须实机验证
- [ ] Payment owner 验证必须按本清单完成实测

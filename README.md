# 韭圈儿恐贪指数 · 每日自动更新

每天 **北京时间 21:00** 自动拉取韭圈儿（`api.jiucaishuo.com`）的大盘恐贪指数与 6 大成分指标，
写入仓库根目录 `jqk.json`，供 finbench 工作台直接从 `raw.githubusercontent.com` 读取。

## 它解决什么问题

浏览器**无法直连** `api.jiucaishuo.com`：该接口对非白名单来源不返回 `Access-Control-Allow-Origin`
（实测为空），同源策略会直接拦掉。所以抓取必须在别处完成。本仓库用 GitHub Actions 当那个"别处"：

```
GitHub Actions（每天 21:00，云端）
   └─ node fetch_jqk_signed.js ──► api.jiucaishuo.com（签名 + AES 解密）
          └─► 提交 jqk.json 回仓库
                  └─► 浏览器 fetch raw.githubusercontent.com（有 ACAO:*）──► 工作台显示
```

好处：不依赖你电脑开机，本地打开和线上链接读到的是同一份最新数据，且**网页无需重新发布**。

## 目录说明

| 文件 | 作用 |
|---|---|
| `fetch_jqk_signed.js` | 抓取脚本。fadrefa 签名 + AES-256-CBC 解密，输出 `jqk.json` |
| `vendor/crypto-js/` | 服务端 AES 是 crypto-js 实现，Web Crypto / OpenSSL 解不开，必须内嵌 |
| `jqk.json` | 产出数据：`{main, components, updatedAt, source}` |
| `.github/workflows/jqk.yml` | 定时任务，cron `0 13 * * *`（UTC 13:00 = 北京 21:00） |

脚本只用 Node 内置模块 + vendored crypto-js，**无需 `npm install`**，单次运行约数秒。

## 部署步骤

1. 在 GitHub 建仓库，**必须选 Public**（私有仓库的 `raw.githubusercontent.com` 不对外服务，浏览器读不到）
2. 把本目录内容 push 上去
3. 仓库 Settings → Secrets and variables → Actions → New repository secret：
   - Name: `JQK_TOKEN`
   - Value: 你的韭圈儿 `authtoken`
4. Actions 页面手动 Run workflow 验证一次，确认 `jqk.json` 被更新

## 本地手动跑

```bash
JQK_TOKEN="你的authtoken" node fetch_jqk_signed.js
```

## 注意事项

- **GitHub Actions 的 cron 不保证准点**，高峰可能延迟 5~30 分钟；也无法精确到秒。
- 仓库连续 60 天无任何活动，GitHub 会**自动停用**定时任务——本 workflow 自身会提交 commit，
  只要数据每天都在变就不会触发停用。
- 仓库是 Public 的，`jqk.json`（市场数据）和抓取脚本会被公开；但你的 `authtoken`
  存在 Actions Secrets 里，加密存储且不会出现在日志中。
- 若某次抓取失败（如 token 过期），脚本会以非零码退出、Actions 变红，且**不会**用坏数据覆盖
  上一次的 `jqk.json`。

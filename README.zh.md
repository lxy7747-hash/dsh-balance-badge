# dsh-balance-badge

[English](README.md) | 中文

一个 DeepSeek Harness 插件：把当前登录的 DeepSeek 账号余额固定在侧边栏底部，
工作时随时可见。

![侧边栏底部的余额显示](docs/preview.png)

## 功能

- 侧边栏底部显示**充值余额 + 赠金余额**的合计，例如 `余额 ¥114.41`。
- 悬浮显示明细（合计 / 充值余额 / 赠金余额）和上次刷新时间。
- 点击立即刷新；另外每 2 分钟、窗口重新获得焦点时自动刷新。
- 侧边栏收起时变成一个 36×36 的 `¥` 按钮，合计金额在悬浮提示里。
- 未登录显示「登录后查看」，读取失败显示「读取失败」，再次点击重试。
- 中英文文案跟随 Harness 界面语言。

数据通过内置的 `account` Remote 读取，与「设置 → 账号与余额」同源。插件不保存凭据、
不上报遥测，除这次账号查询外不发起任何请求。

## 安装

在 DSH 插件市场搜索 **Balance Badge**，或在「插件 → 添加插件」中填入 Git 地址：

```
https://github.com/lxy7747-hash/dsh-balance-badge
```

命令行安装（桌面版的 `desktop` profile 由应用托管，不接受 CLI 插件命令）：

```sh
dsh plugin --profile web add github:lxy7747-hash/dsh-balance-badge
```

安装后在「插件」页启用即可。无需构建，无依赖。

## 要求

- DeepSeek Harness Web UI（`0.2.1` 及以上），且挂载了账号 Remote（Web 版默认包含）。
- 已登录 DeepSeek 账号。这里显示的是账号钱包余额，不是开放平台的 API Key 余额。

## 实现

- `client.js` 是 Harness 模块加载器格式的浏览器包，注册
  `sidebar.footer.action` 槽位，并用 `ctx.remote.account.getBalance(...)` 读取余额。
- `index.js` 是空的宿主半边；`cordis.patch.yml` 插入对应行。
- `locale/en.json`、`locale/zh.json` 提供插件管理器读取的展示元数据。

## 许可

MIT

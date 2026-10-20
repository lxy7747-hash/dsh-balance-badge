# dsh-balance-badge

English | [中文](README.zh.md)

A DeepSeek Harness plugin: the signed-in DeepSeek account balance, pinned to the
sidebar foot and always in sight while you work.

![The balance badge in the sidebar foot](docs/preview.png)

## What it does

- Shows **recharge balance plus bonus balance** as one total, e.g. `余额 ¥114.41`,
  in the sidebar foot above Settings.
- Hover: the split (`合计 / 充值余额 / 赠金余额`) and the last refresh time.
- Click: refresh immediately. It also refreshes every two minutes and whenever
  the window regains focus.
- Sidebar collapsed: collapses to a 36×36 `¥` button with the total in its tooltip.
- Signed out: `登录后查看` / `Sign in to view`; a failed read: `读取失败` /
  `Unavailable`, and the next click retries.
- Chinese and English UI copy, following the Harness UI language.

The badge reads the balance through the built-in `account` Remote — the same
source as **Settings → Account**. It stores no credential, sends no telemetry,
and makes no request of its own beyond that account query.

## Install

From the DSH plugin market: search for **Balance Badge**, or add the Git address
in **Plugins → Add plugin**:

```
https://github.com/lxy7747-hash/dsh-balance-badge
```

From a shell against a profile (the desktop app's `desktop` profile is managed by
the app and rejects CLI plugin commands):

```sh
dsh plugin --profile web add github:lxy7747-hash/dsh-balance-badge
```

Toggle it under **Plugins** after installation. No build step and no dependencies.

## Requirements

- DeepSeek Harness with the Web UI (`0.2.1` or later) and the account Remote
  mounted, which the Web app ships by default.
- A signed-in DeepSeek account. The badge shows the account wallet, not an
  API-key balance from the open platform.

## How it works

- `client.js` is a browser bundle in Harness's module-loader format. It registers
  one entry into the `sidebar.footer.action` slot and calls
  `ctx.remote.account.getBalance(...)` with the UI language and timezone offset.
- `index.js` is the empty host half; `cordis.patch.yml` inserts its row.
- `locale/en.json` and `locale/zh.json` carry the display metadata the plugin
  manager reads.

## License

MIT

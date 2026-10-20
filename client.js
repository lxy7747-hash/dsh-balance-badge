/**
 * Browser half of the balance widget: one compact balance entry pinned to the
 * sidebar foot, backed by the account Remote the account settings already use.
 */
window.__ModuleLoader__.load({
  id: 'dsh-balance-badge',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'balanceWidget'
    /** Account client identity version; the running Client build is 0.2.1-rc.2. */
    const CLIENT_VERSION = '0.2.1-rc.2'

    const en = {
      label: 'Balance',
      loading: 'Loading…',
      signedOut: 'Sign in to view',
      failed: 'Unavailable',
      recharge: 'Recharge balance',
      bonus: 'Bonus balance',
      total: 'Total (incl. bonus)',
      refresh: 'Refresh balance',
      updated: 'Updated {time}',
    }
    const zh = {
      label: '余额',
      loading: '读取中…',
      signedOut: '登录后查看',
      failed: '读取失败',
      recharge: '充值余额',
      bonus: '赠金余额',
      total: '合计（含赠金）',
      refresh: '刷新余额',
      updated: '更新于 {time}',
    }

    const CSS = `
      .dshbw-row{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;margin:0 2px;padding:7px 8px;border:0;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary,#6b6b6b);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}
      .dshbw-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}
      .dshbw-row:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4d6bfe));outline-offset:-2px}
      .dshbw-glyph{flex:none;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#4d6bfe);color:#fff;font-size:11px;font-weight:600;line-height:1}
      .dshbw-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .dshbw-refresh{flex:none;font-size:12px;opacity:0;transition:opacity .15s var(--ds-ease-in-out,ease)}
      .dshbw-row:hover .dshbw-refresh,.dshbw-row:focus-visible .dshbw-refresh{opacity:.65}
      .dshbw-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:0;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary,#6b6b6b);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
      .dshbw-icon:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}
      .dshbw-icon:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4d6bfe));outline-offset:-2px}
    `

    /** Build the Platform client identity for one account read. */
    function clientMetadata(locale) {
      return {
        version: CLIENT_VERSION,
        locale,
        timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
      }
    }

    /** Currency symbol for a wallet. */
    function symbol(currency) {
      return currency === 'USD' ? '$' : '¥'
    }

    /** Two-decimal display of a numeric amount. */
    function amount(value) {
      return value.toFixed(2)
    }

    /** Sum one currency's wallet amounts; a malformed value counts as zero. */
    function sum(wallets, currency) {
      return wallets
        .filter(wallet => wallet.currency === currency)
        .reduce((total, wallet) => {
          const value = Number(wallet.balance)
          return Number.isFinite(value) ? total + value : total
        }, 0)
    }

    /** One shared balance read for every render of the entry. */
    function createStore(ctx) {
      let state = { status: 'loading' }
      const listeners = new Set()
      const publish = (next) => {
        state = next
        for (const listener of listeners) listener()
      }

      let disposed = false
      const read = async () => {
        if (disposed) return
        let result
        try {
          result = await ctx.remote.account.getBalance(clientMetadata(ctx.locale.getSnapshot().active))
        } catch (_error) {
          if (!disposed) publish({ status: 'error' })
          return
        }
        if (disposed) return
        if (!result.ok) {
          publish({ status: 'error' })
          return
        }
        const value = result.value
        if (value === null) {
          publish({ status: 'signed-out' })
          return
        }
        if (value.status !== 'ready') {
          publish({ status: 'error' })
          return
        }
        const wallets = Array.isArray(value.value) ? value.value : []
        const bonusWallets = Array.isArray(value.bonusWallets) ? value.bonusWallets : []
        const currencies = [...new Set([...wallets, ...bonusWallets].map(wallet => wallet.currency))]
        if (currencies.length === 0) {
          publish({ status: 'signed-out' })
          return
        }
        const totals = currencies.map(currency => {
          const recharge = sum(wallets, currency)
          const bonus = sum(bonusWallets, currency)
          return { currency, recharge, bonus, total: recharge + bonus }
        })
        publish({
          status: 'ready',
          main: totals.find(row => row.currency === 'CNY') || totals[0],
          updatedAt: new Date(),
        })
      }

      let timer
      const onFocus = () => { void read() }
      const onVisibility = () => {
        if (document.visibilityState === 'visible') void read()
      }
      const start = () => {
        void read()
        timer = setInterval(() => { void read() }, 120000)
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibility)
      }
      const dispose = () => {
        disposed = true
        if (timer !== undefined) clearInterval(timer)
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onVisibility)
        listeners.clear()
      }
      const subscribe = (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      }
      return { read, start, dispose, subscribe, getSnapshot: () => state }
    }

    /** Sidebar-foot balance entry; `wide` follows the sidebar's expanded state. */
    function BalanceEntry(props) {
      const { wide, t, store } = props
      const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

      let text = t('loading')
      let tooltip = t('refresh')
      if (state.status === 'ready') {
        const { main } = state
        const money = value => `${symbol(main.currency)}${amount(value)}`
        text = `${t('label')} ${money(main.total)}`
        tooltip = main.bonus > 0
          ? `${t('total')}: ${money(main.total)}\n${t('recharge')}: ${money(main.recharge)}\n${t('bonus')}: ${money(main.bonus)}`
          : `${t('recharge')}: ${money(main.recharge)}`
        tooltip += `\n${t('updated').replace('{time}', state.updatedAt.toLocaleTimeString())}`
      } else if (state.status === 'signed-out') {
        text = t('signedOut')
        tooltip = t('signedOut')
      } else if (state.status === 'error') {
        text = t('failed')
        tooltip = `${t('failed')} — ${t('refresh')}`
      }

      const refresh = () => { void store.read() }
      const glyph = h('span', { className: 'dshbw-glyph', 'aria-hidden': true }, '¥')

      if (!wide) {
        return h('button', {
          type: 'button',
          className: 'dshbw-icon',
          title: tooltip,
          'aria-label': `${t('label')}: ${text}`,
          onClick: refresh,
        }, '¥')
      }
      return h('button', {
        type: 'button',
        className: 'dshbw-row',
        title: tooltip,
        'aria-label': `${t('label')}: ${text}`,
        onClick: refresh,
      }, glyph, h('span', { className: 'dshbw-text' }, text), h('span', { className: 'dshbw-refresh', 'aria-hidden': true }, '↻'))
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.account'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'balance-widget: dictionaries')
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-balance-badge'
          tag.textContent = CSS
          document.head.appendChild(tag)
          return () => { tag.remove() }
        }, 'balance-widget: styles')

        const t = ctx.locale.bind(NS)
        const store = createStore(ctx)
        ctx.effect(() => {
          store.start()
          return () => { store.dispose() }
        }, 'balance-widget: balance polling')

        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'balance-widget',
          order: 20,
          locale: NS,
          inject: () => ({ t, store }),
        }, BalanceEntry))
      },
    }
  },
})

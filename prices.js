'use strict';

// ============================================================
// REAL-TIME PRICE MODULE
// Uses Yahoo Finance unofficial API via CORS proxy fallbacks
// Refresh: every 60s during market hours, every 5min outside
// ============================================================

const PRICES = (() => {

  // --- Config ---
  const PROXY_URLS = [
    ticker => `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
    ticker => `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
  ];

  // Fallback CORS proxy wrappers
  const CORS_WRAPPERS = [
    url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  let refreshTimer = null;
  let lastUpdated = null;
  let isLoading = false;
  let onUpdateCallback = null;
  let onStatusCallback = null;
  let consecutiveFailures = 0;

  // Market hours: NYSE 9:30-16:00 ET (UTC-4 summer, UTC-5 winter)
  function isMarketOpen() {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 6) return false;

    // Approximate ET offset (EST = UTC-5, EDT = UTC-4)
    const month = now.getUTCMonth() + 1;
    const etOffset = (month >= 3 && month <= 11) ? -4 : -5;
    const etHour = now.getUTCHours() + etOffset;
    const etMin = now.getUTCMinutes();
    const etTime = etHour * 60 + etMin;

    return etTime >= 9 * 60 + 30 && etTime < 16 * 60;
  }

  function getRefreshInterval() {
    return isMarketOpen() ? 60_000 : 300_000; // 1min open / 5min closed
  }

  // Fetch a single ticker using direct Yahoo Finance (may fail due to CORS)
  async function fetchDirect(ticker) {
    for (const buildUrl of PROXY_URLS) {
      try {
        const res = await fetch(buildUrl(ticker), {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) continue;
        const json = await res.json();
        return parseYahooResponse(json, ticker);
      } catch { /* try next */ }
    }
    return null;
  }

  // Fetch through a CORS proxy wrapper
  async function fetchViaProxy(ticker, wrapperFn) {
    const baseUrl = PROXY_URLS[0](ticker);
    const proxiedUrl = wrapperFn(baseUrl);
    try {
      const res = await fetch(proxiedUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const outer = await res.json();
      // allorigins wraps in { contents: "..." }
      const raw = outer.contents ? JSON.parse(outer.contents) : outer;
      return parseYahooResponse(raw, ticker);
    } catch { return null; }
  }

  function parseYahooResponse(json, ticker) {
    try {
      const result = json?.chart?.result?.[0];
      if (!result) return null;
      const meta = result.meta;
      const price = meta.regularMarketPrice ?? meta.previousClose;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose;
      const change = price - prevClose;
      const changePct = (change / prevClose) * 100;
      return {
        ticker,
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePct: Math.round(changePct * 100) / 100,
        currency: meta.currency || 'USD',
        marketState: meta.marketState || 'UNKNOWN',
        shortName: meta.shortName || ticker,
        timestamp: Date.now(),
      };
    } catch { return null; }
  }

  async function fetchTicker(ticker) {
    // Try direct first
    let data = await fetchDirect(ticker);
    if (data) return data;

    // Try CORS proxies
    for (const wrapper of CORS_WRAPPERS) {
      data = await fetchViaProxy(ticker, wrapper);
      if (data) return data;
    }

    return null;
  }

  async function fetchAll(tickers) {
    if (isLoading) return;
    isLoading = true;
    onStatusCallback?.('loading');

    const results = await Promise.allSettled(tickers.map(fetchTicker));

    let successCount = 0;
    const updates = {};

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        updates[tickers[i]] = result.value;
        successCount++;
      }
    });

    isLoading = false;

    if (successCount > 0) {
      consecutiveFailures = 0;
      lastUpdated = new Date();
      onUpdateCallback?.(updates);
      onStatusCallback?.('success', lastUpdated);
    } else {
      consecutiveFailures++;
      onStatusCallback?.('error', consecutiveFailures);
    }

    return updates;
  }

  function start(tickers, onUpdate, onStatus) {
    onUpdateCallback = onUpdate;
    onStatusCallback = onStatus;

    fetchAll(tickers); // immediate first fetch

    function schedule() {
      const interval = getRefreshInterval();
      refreshTimer = setTimeout(() => {
        fetchAll(tickers);
        schedule();
      }, interval);
    }
    schedule();
  }

  function stop() {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  function forceRefresh(tickers) {
    clearTimeout(refreshTimer);
    return fetchAll(tickers);
  }

  return { start, stop, forceRefresh, isMarketOpen, getRefreshInterval };
})();

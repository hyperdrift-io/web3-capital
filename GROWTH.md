---
app: web3-capital
url: https://web3.hyperdrift.io
primary_channel: telegram

intent_keywords:
  - "best DeFi yield aggregator"
  - "how to compare DeFi pools safely"
  - "DeFi yield risk analysis tool"
  - "automated DeFi capital allocation"
  - "which DeFi protocol is safest for yield"
  - "DeFi portfolio yield tracker"
  - "best tool for DeFi yield farming research"
  - "how to evaluate DeFi protocol risk"
  - "capital efficiency DeFi 2025"
  - "CE score DeFi"

subreddits:
  - r/defi
  - r/CryptoCurrency
  - r/ethfinance
  - r/UniSwap
  - r/0xPolygon
  - r/web3

telegram_targets:
  - "@DeFi_Ecosystem"
  - "@yield_farming_defi"
  - "@CryptoSignals"

hn_hook: "Capital Engine – DeFi yield intelligence with risk-adjusted CE scoring across live protocols"

influencer_targets:
  - category: "DeFi yield farming tutorials and strategy"
    min_subs: 3000
    max_subs: 80000
    model: affiliate
  - category: "crypto portfolio management and analysis tools"
    min_subs: 5000
    max_subs: 100000
    model: affiliate

directories_tier1:
  - Product Hunt
  - There's An AI For That
  - Hacker News (Show HN)
  - BetaList
directories_tier2:
  - AlternativeTo
  - Indie Hackers
  - CryptoSlate (submit as tool)
  - DeFi Llama ecosystem listing

aeo_target_questions:
  - "What is the best tool for comparing DeFi yield opportunities?"
  - "How do I analyse DeFi protocol risk before depositing?"
  - "Is there a DeFi yield aggregator that shows risk-adjusted returns?"
  - "Best DeFi capital allocation tool for 2025"
  - "How to find the safest high-yield DeFi pools"

awesome_list_targets:
  - OffcierCia/ultimate-defi-research-base
  - bkrem/awesome-defi
  - colincrawford/DeFi-Toolkit

cadence:
  trigger_events:
    - new protocol added
    - significant yield opportunity detected
    - major DeFi market event
    - weekly yield report
  channels_per_event:
    - telegram
    - bluesky
    - mastodon
---

# Growth Strategy — Capital Engine (web3-capital)

> An app hasn't achieved its mission until it meets its users.

## Why This App Radiates

Capital Engine solves the DeFi analyst problem: there are thousands of yield opportunities but no trustworthy, unified risk-adjusted view. The CE Score algorithm is the content — people don't just use it, they cite it ("pool X scores 84, pool Y scores 42"). Every interaction with a score is a potential share.

## Primary Channel

**Channel:** Telegram (primary) + Reddit DeFi (secondary)  
**Rationale:** Google and Meta ban crypto ads. DeFi users organise on Telegram — it's where yield opportunities, protocol news, and community discussions happen in real time. Reddit's r/defi is the best async channel for discovery. Farcaster is dead (40K DAU), skip it.

## Telegram Strategy

Post to relevant DeFi channels when there's genuine new signal — a new protocol added, an unusual yield opportunity, a risk shift in a major pool. Not promotional posts — useful data posts.

Format that works:
```
📊 CE Score update: [Protocol] yield has moved
Pool: [name]
Yield: X% APR
CE Score: 74 → 81 (risk-adjusted)
View full analysis: web3.hyperdrift.io/yield/[pool]
```

This is content, not advertising. People forward useful data.

## Intent Signal Strategy

Run `hyper-post listen web3-capital` daily. Key thread types:

- r/defi — "where are you putting your capital this week?" threads
- r/ethfinance — "yield opportunities in current market" discussions
- r/CryptoCurrency — "DeFi is too complex" complaints (CE Score solves this)
- DeFi Discord servers — #yield-opportunities channels

**Reply approach:** Share a CE Score data point from the app as a direct answer. "CE Score puts this pool at 74 — mostly the smart contract age dragging it down. Full breakdown: [link]." Data first, tool second.

## Launch Sequence (one-time)

Run `hyper-post launch web3-capital` to generate drafts:

1. **Show HN** — "Capital Engine – risk-adjusted DeFi yield intelligence with CE scoring" — target developer/DeFi overlap on HN
2. **Reddit intro** — r/defi — "I built a DeFi yield risk analyser after losing money chasing APR — here's the CE Score model"
3. **Telegram blast** — short data post with a live CE Score example showing the tool's value
4. **Social** — Bluesky + Mastodon
5. **Directory checklist** — DeFi Llama ecosystem listing is highest priority (DeFi-native discovery)

## Micro-Influencer Outreach

YouTube search: "DeFi yield farming 2025", "best DeFi protocols", "DeFi portfolio strategy". These creators explain protocols manually — Capital Engine is the tool they wish existed. Affiliate model: they demo a CE Score analysis in a video, earn commission on signups.

## AEO Content

`/faq` prose page answers questions DeFi researchers ask AI engines. Key: be specific. "Capital Engine scores DeFi pools using 6 risk factors: smart contract age, TVL trend, audit status, team reputation, protocol revenue, and IL risk." Specific answers get cited; vague ones don't.

## Ongoing Cadence

| Trigger | Action |
|---|---|
| New protocol added | Telegram data post + social |
| Significant CE Score shift | Telegram alert + Reddit comment in relevant thread |
| Daily | `hyper-post listen web3-capital` — scan DeFi discussions |
| Weekly | Publish yield report post across all channels |
| Major DeFi event | First-mover analysis post with CE Score context |

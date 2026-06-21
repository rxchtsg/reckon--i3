# Reckon

**Will you actually reach your number?**

Reckon is a portfolio planning tool that tells you the truth. Tell it what you hold, what you contribute, and what you're aiming for — it runs a conservative, worst case projection and gives you a direct yes or no on whether your current plan gets you there. If you're falling short, it explains exactly why and gives you specific, actionable ways to close the gap — not generic advice like "diversify more."

Built in 48 hours for the [Encode Vibe Coding Hackathon](https://encode.club), June 2026.

## The problem

Most portfolio tools show you a hopeful projection and stop there. They're optimized to keep you investing, not to tell you whether your plan is actually working. Reckon does the opposite — conservative math, honest answers, real reasoning.

## Features

- **Goal feasibility engine** — projects your portfolio using conservative (bear case) assumptions, not best case optimism
- **Real market data** — pulls live historical return data to calculate realistic growth assumptions, with a safe fallback to fixed estimates if the fetch fails
- **Ticker search** — structured holdings input with autocomplete across popular stocks and ETFs
- **Age-based goal planning** — set your goal by age, not calendar date
- **Dynamic rationale** — explains *why* you're on track or falling short, identifying the biggest lever (contribution, timeline, or risk) rather than a fixed template
- **Portfolio optimization** — connected to a quantum-optimized, risk-gated allocation engine with Monte Carlo VaR safety checks
- **Premium billing** — metered subscriptions for unlimited scenario planning, powered by [Solvimon](https://www.solvimon.com)

## Built with

- [Next.js](https://nextjs.org) + [v0](https://v0.app) for UI and rapid iteration
- [Claude Code](https://claude.com/claude-code) for backend logic and API integration
- [Solvimon](https://www.solvimon.com) for billing and subscription metering
- Yahoo Finance API for live market return data
- Deployed on [Vercel](https://vercel.com)

## This repository is linked to v0

You can continue developing by visiting the link below — start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` automatically deploys.

[Continue working on v0 →](https://v0.app/chat/projects/prj_RRn3nHsDSMCRCr60K7WJAPLYmPFT)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it running locally. Edit `app/page.tsx` for the landing page or `app/results/page.tsx` for the projection output — changes auto-update.

## API

`POST /api/calculate` — accepts holdings, monthly contribution, risk tolerance, current age, and target age. Returns whether the goal is reached, the projected amount, the gap, and years to goal.

## Team

Built by Rachel & Armit for Encode Vibe Coding Hackathon — targeting the Vercel, Solvimon, and BGA AI Trading & Strategy bounties.

## Next steps

- **Direct portfolio image upload** — let users snap or upload a screenshot of their brokerage app and have it parsed automatically, instead of manually entering each holding
- **Native portfolio optimization** — bring the optimization engine in-house, fully aligned with Reckon's own holdings data, instead of running as a connected external proof of concept
- **Persistent scenario history** — add real storage so premium users' saved "what if" runs survive across sessions and devices
- **Expanded live market data** — broaden real time pricing beyond the current asse class level historical averages to per holding live data
- **Tighter risk-model alignment** — unify the risk scale across the core app and the optimization engine so a single risk input maps precisely everywhere

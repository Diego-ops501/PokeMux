# PokeMux 2.0 — English guide

[English README](README.en.md) · [Português](MANUAL.md) · [Español](MANUAL.es.md)

## Getting started

1. Download and install [PokeMux 2.0 for Windows](https://github.com/Diego-ops501/PokeMux/releases/tag/v2.0.0).
2. Open **Settings → Appearance and game**, then choose **EN**.
3. In **Settings → Accounts**, register up to four accounts and sign in. Complete CAPTCHA/2FA in the game when prompted. Credentials are encrypted locally by Windows.
4. Click the account name to focus it, **Grid** for all screens or **Summary** for the dashboard. These switches keep your game sessions.

## Summary and hunts

Account cards show Pokémon, hunt, XP/hour, net dollars/hour, catches and supplies. A supply estimate requires at least ten minutes of measured consumption. Disconnected, idle or stalled accounts and low supplies are highlighted. Unknown data is not treated as a valid zero.

**Open account** shows the game and its Analysis. **Recommend hunt** uses that account's lead Pokémon. Select XP to rank only XP or dollars to rank net income. Traveling sends the selected account's game command and keeps the current workspace and recommendation window. Entering Summary collapses Analysis; click **Analysis** to reopen it.

Important catches include shiny, IV 160+ or Legendary+ Pokémon. Choose **All catches** to include common catches. Settings → Summary controls optional sections and order.

## Inventory and IV

**Inventory** displays connected accounts side by side, with independent scrolling and pagination. All/Pokémon/Poké Balls/Items apply across columns. Search by name, account, rarity or IV. Pokémon sort by rarity then IV; items by NPC unit value.

Inventory reads on opening and **Refresh**, rather than continuously while farming. Items show NPC and lowest advertised market unit prices; stale or unavailable quotes are marked. With IV enabled, hover, select or Tab to a Pokémon to calculate using its owner's session. Missing attributes are reported. Click an account's name to open its game.

## Market and alerts

The Market chooses an available connected account automatically. Personal inventories and listings are combined, with owner filters and links. Pokémon browsing starts with all Pokémon. Price sorting converts dollars/diamonds using the active Diamond quote. Open market refreshes every 60 seconds and the full Pokémon cache approximately every five minutes. Rate limits pause queries and retain cached data.

**Compare with market** uses species/form, shiny, rarity and adjustable IV/level/quality tolerances. It shows the comparable sample, minimum, median, buy requests and selling estimate when complete comparables exist. Broader species references require an explicit click. Prices exclude fees; requests are not completed sales.

Configure up to 10 market alerts per account/character inside **Market → Alerts**. Checks run every 60 seconds while the app is open, even with the market closed. The first baseline is silent; repeated listings are deduplicated. Configure farm voice, Windows notices and optional Discord under **Settings → Farm notifications**.

## Settings, performance and updates

The central Settings panel has search and eight categories; changes save automatically. Eco limits visible rendering to 15 FPS, unfocused games to 2 FPS and Summary games to 1 FPS, while timers and connections remain active. The embedded game supports PT/EN; the app also supports Spanish, using English inside the game.

Updates preserve sessions, history and preferences. Download/install require confirmation, with SHA-512 validation. Backups exclude credentials and webhook. See [Portuguese detailed manual](MANUAL.md), [FAQ](FAQ.md), [Changelog](CHANGELOG.md) and [credits](NOTICE.md).

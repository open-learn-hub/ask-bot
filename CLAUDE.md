# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Run the bot (node app.js)
```

## Configuration

Copy `.env.example` to `.env` and fill in:
- `SLACK_BOT_TOKEN` — Bot OAuth token from Slack App settings (`xoxb-...`)
- `SLACK_SIGNING_SECRET` — From Slack App > Basic Information
- `ANTHROPIC_API_KEY` — From console.anthropic.com
- `PORT` — Default 3000

## Architecture

Three-file core:

- **`app.js`** — Slack Bolt HTTP server. Listens for `message` events, filters to DMs only (`channel_type === 'im'`), ignores bots and empty messages, calls `askClaude`, posts the reply.
- **`claude.js`** — Two-pass Anthropic client. Pass 1 routes the question via the index to identify relevant source(s). Pass 2 loads those sources and answers. Exports `askClaude(text)`.
- **`loader.js`** — Multi-format content loader. Accepts a local path (relative to `content/`) or a Google URL and returns plain text.

The bot never stores conversation history; each message is a standalone two-call flow.

## Content

Edit `content/index.md` to register knowledge sources. Supported formats:

| Format | Extension / Pattern |
|--------|-------------------|
| Markdown / plain text | `.md`, `.txt` |
| PDF | `.pdf` |
| Word document | `.docx` |
| Excel spreadsheet | `.xlsx`, `.xls` |
| Google Docs | `https://docs.google.com/document/d/...` |
| Google Sheets | `https://docs.google.com/spreadsheets/d/...` |

Each entry in `index.md`:
```
- <topic description>: <relative path or full Google URL>
```

Content files live in `content/` subdirectories. Google Docs/Sheets are fetched live on each request using a **Google Service Account** — documents stay private and only need to be shared with the service account email.

### Google Service Account Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com) → IAM & Admin → Service Accounts
2. Create a service account, then create a JSON key and download it
3. Enable **Google Docs API** and **Google Sheets API** in the project
4. Share each Google Doc/Sheet with the service account's `client_email` (view access)
5. Set `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env` to the full contents of the JSON key file (as a single-line string)

## Slack App Setup

Required OAuth scopes: `im:read`, `im:write`, `chat:write`  
Event subscriptions: `message.im`  
Request URL: `https://<your-host>/slack/events`

## Deployment (Render.com)

- Build command: `npm install`
- Start command: `node app.js`
- Set all env vars in the Render dashboard
- Enable "Keep alive" or use an uptime service to prevent free-tier sleep

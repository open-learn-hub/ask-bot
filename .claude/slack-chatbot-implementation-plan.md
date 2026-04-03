# Plan: Slack DM Chatbot with Multi-Format Content Routing

## Overview

A private Slack DM bot that answers questions from pre-provided company content only.
Uses a two-pass approach: route the question via a master index, then load only the relevant source file(s) to answer.

---

## Architecture

```
app.js       Slack Bolt HTTP server — DM filter, message handler
claude.js    Two-pass Anthropic client — routing + answering
loader.js    Multi-format content loader — PDF, DOCX, XLSX, MD, Google Docs/Sheets
content/
  index.md   Master index — topic descriptions mapped to source paths or URLs
```

### Two-Pass Flow

1. **Route** — send `content/index.md` + user question to Claude → returns relevant source path(s) or `NONE`
2. **Answer** — load identified source(s) via `loader.js`, send combined text + question to Claude → returns answer

### Supported Content Formats

| Format | Extension / Pattern |
|--------|-------------------|
| Markdown / plain text | `.md`, `.txt` |
| PDF | `.pdf` (via `pdf-parse`) |
| Word document | `.docx` (via `mammoth`) |
| Excel spreadsheet | `.xlsx`, `.xls` (via `xlsx`) |
| Google Docs | `https://docs.google.com/document/d/...` |
| Google Sheets | `https://docs.google.com/spreadsheets/d/...` |

Google Docs/Sheets use a **Service Account** for authenticated access — documents stay private inside the company.

---

## Key Constraints

- DM only: `channel_type === 'im'` filter in `app.js`
- No conversation history stored — each message is a standalone two-call flow
- Slack request signature verification handled automatically by Bolt
- Content updates require redeployment (index is read at startup; source files loaded on demand)

---

## Dependencies

```json
"@anthropic-ai/sdk": "^0.39.0"
"@slack/bolt": "^4.4.0"
"dotenv": "^16.4.0"
"googleapis": "^144.0.0"
"mammoth": "^1.8.0"
"pdf-parse": "^1.1.1"
"xlsx": "^0.18.5"
```

---

## Environment Variables

```
SLACK_BOT_TOKEN             xoxb-... bot OAuth token
SLACK_SIGNING_SECRET        from Slack App > Basic Information
ANTHROPIC_API_KEY           sk-ant-... from console.anthropic.com
PORT                        default 3000
GOOGLE_SERVICE_ACCOUNT_KEY  full JSON key contents (single-line string)
```

---

## Verification

1. `npm install`
2. Copy `.env.example` → `.env`, fill in all keys
3. Enable Google Docs API + Sheets API in Google Cloud Console
4. Share private Docs/Sheets with the service account `client_email`
5. Add sources to `content/index.md`
6. `npm start` — server starts on PORT
7. DM the bot in Slack → answers from content
8. Out-of-scope question → "I don't have information on that."

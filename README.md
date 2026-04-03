# Slack AI Chatbot

A private Slack DM bot that answers questions exclusively from your company's content. Users message the bot directly — no channels involved. The bot routes each question to the relevant content source and answers strictly from it.

---

## How It Works

1. User sends a DM to the bot in Slack
2. Bot reads `content/index.md` to identify which file/document covers the question
3. Bot loads that source (PDF, DOCX, Excel, Markdown, or Google Doc/Sheet)
4. Bot answers using only that content — no general AI knowledge

---

## Prerequisites

- Node.js 18+
- A Slack workspace where you can create apps
- An [Anthropic API key](https://console.anthropic.com)
- A Google Cloud project (only if using Google Docs/Sheets)

---

## Step 1 — Clone and Install

```bash
git clone <your-repo-url>
cd AskBot
npm install
```

---

## Step 2 — Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name it (e.g. "Company Assistant") and select your workspace

### OAuth Scopes
Go to **OAuth & Permissions** → **Bot Token Scopes**, add:
- `chat:write`
- `im:read`
- `im:write`

### Event Subscriptions
Go to **Event Subscriptions** → toggle **Enable Events**

Subscribe to bot events:
- `message.im`

> You'll need a public Request URL — see Step 5 (deploy) or use a tunnel like [ngrok](https://ngrok.com) for local testing.

Request URL format: `https://<your-host>/slack/events`

### Install the App
Go to **OAuth & Permissions** → **Install to Workspace** → copy the **Bot User OAuth Token** (`xoxb-...`)

---

## Step 3 — Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
ANTHROPIC_API_KEY=sk-ant-your-api-key
PORT=3000
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}   # only if using Google Docs/Sheets
```

- **`SLACK_BOT_TOKEN`** — from Slack App > OAuth & Permissions
- **`SLACK_SIGNING_SECRET`** — from Slack App > Basic Information
- **`ANTHROPIC_API_KEY`** — from [console.anthropic.com](https://console.anthropic.com)

---

## Step 4 — Set Up Google Service Account (skip if not using Google Docs/Sheets)

### 4a. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com) → select or create a project
2. Go to **APIs & Services** → **Library** → enable:
   - **Google Docs API**
   - **Google Sheets API**
3. Go to **IAM & Admin** → **Service Accounts** → **Create Service Account**
4. Give it a name, click **Done**
5. Click the service account → **Keys** tab → **Add Key** → **Create new key** → **JSON** → Download

### 4b. Add Key to Environment

Open the downloaded JSON file, copy its entire contents, and paste it as a single line into `.env`:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"my-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"bot@my-project.iam.gserviceaccount.com",...}
```

> **Tip:** On Mac/Linux you can run `cat key.json | tr -d '\n'` to collapse it to one line.

### 4c. Share Documents with the Service Account

For each Google Doc or Sheet the bot should access:
1. Open the document
2. Click **Share**
3. Enter the `client_email` from your service account JSON (e.g. `bot@my-project.iam.gserviceaccount.com`)
4. Set permission to **Viewer** → **Send**

---

## Step 5 — Add Your Content

Edit `content/index.md` to register your knowledge sources:

```markdown
# Content Index

## HR
- Employee leave policy: hr/leave-policy.pdf
- Benefits guide: hr/benefits.docx

## IT
- Password reset steps: it/password-reset.md

## Finance
- Q1 budget: finance/budget.xlsx

## Handbook
- Onboarding guide: https://docs.google.com/document/d/YOUR_DOC_ID/edit
- Org chart: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

Place local files in subdirectories under `content/`. Supported formats:

| Type | Extension |
|------|-----------|
| Markdown / text | `.md`, `.txt` |
| PDF | `.pdf` |
| Word | `.docx` |
| Excel | `.xlsx`, `.xls` |
| Google Docs | full URL |
| Google Sheets | full URL |

---

## Step 6 — Run and Test Locally

### 6a. Start the server

```bash
npm start
```

The server starts on `http://localhost:3000`.

### 6b. Expose localhost to Slack with ngrok

Slack needs a public HTTPS URL to deliver events. Install [ngrok](https://ngrok.com/download), then in a second terminal:

```bash
ngrok http 3000
```

Copy the `Forwarding` HTTPS URL (e.g. `https://abc123.ngrok.io`).

### 6c. Point Slack at your local server

1. Go to your Slack App → **Event Subscriptions**
2. Set Request URL to: `https://abc123.ngrok.io/slack/events`
3. Slack will send a challenge request — your running server must respond to verify it. Wait for the green **Verified** checkmark.
4. Click **Save Changes**

### 6d. Verify the bot is reachable

```bash
curl https://abc123.ngrok.io/slack/events
```

Expected: a 404 or method-not-allowed response (not a connection error) confirms the tunnel is working.

### 6e. Send a test DM

1. In Slack, search for your bot by name → open a DM
2. Send a question covered by your content → bot should reply within a few seconds
3. Send an out-of-scope question → bot replies: *"I don't have information on that."*
4. Check the terminal for any errors logged by the server

> **ngrok session limit:** The free tier resets the public URL each time you restart ngrok. Re-paste the new URL into Slack Event Subscriptions whenever this happens.

---

## Step 7 — Deploy to Render.com (free tier)

1. Push the project to a GitHub repo (`.env` is gitignored — never commit it)
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
   - **Environment:** Node
4. Add all environment variables from `.env` under **Environment** in the Render dashboard
5. Deploy — copy the public URL and set it as your Slack Request URL:
   `https://your-app.onrender.com/slack/events`
6. Go back to Slack App → **Event Subscriptions** → paste the URL → **Save Changes**

> **Free tier note:** Render's free tier spins down after 15 minutes of inactivity. Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://your-app.onrender.com/` every 10 minutes to keep it awake.

---

## Step 8 — Test the Bot

1. In Slack, search for your bot by name and open a DM
2. Send a question covered by your content → bot answers from the relevant file
3. Send an unrelated question → bot replies: *"I don't have information on that."*

---

> [!WARNING]
> **This was a vibe coding project.** It was built quickly for experimentation and learning purposes. It has not been audited, hardened, or tested for production use. Exercise caution before deploying it in any serious or business-critical environment — use it at your own risk.

---

## Project Structure

```
AskBot/
├── app.js                  Slack Bolt server, DM event handler
├── claude.js               Two-pass routing + answering via Anthropic API
├── loader.js               Multi-format content loader
├── content/
│   └── index.md            Master index — register your sources here
├── .env.example            Environment variable template
├── .claude/
│   └── slack-chatbot-implementation-plan.md
└── prd/
    └── slack-chatbot-requirements.md
```

# Slack Chatbot — Product Requirements Document

**Version:** 1.0  
**Date:** April 3, 2026  
**Status:** Draft

---

## 1. Overview

A private Slack chatbot that answers questions exclusively based on pre-provided content. The bot operates as a **standalone Direct Message (DM) bot** — users interact with it privately, not inside public or shared channels, ensuring full conversation privacy.

---

## 2. Goals

- Provide accurate, content-restricted answers via Slack DM
- Prevent the bot from answering questions outside the provided content
- Ensure user conversations remain private (no channel exposure)
- Keep infrastructure simple and free to operate

---

## 3. User Interaction Model

| Aspect | Details |
|---|---|
| Interface | Slack Direct Message (DM) only |
| Trigger | User opens a DM with the bot and sends a message |
| Bot visibility | Bot is NOT added to any channel |
| Message privacy | Only the individual user and the bot can see the conversation |

> ⚠️ **Key Design Decision:** The bot will NOT be invited into any Slack channel. All interactions happen exclusively through private DMs between the user and the bot account.

---

## 4. Functional Requirements

### 4.1 Content Restriction
- The bot **must only answer** based on pre-provided content (e.g. FAQ, policy docs, knowledge base)
- If a question cannot be answered from the content, the bot must reply: *"I don't have information on that."*
- The bot must **never fabricate** answers or use general AI knowledge outside the provided content

### 4.2 Slack DM Interface
- The bot must be accessible via **Slack Direct Message**
- Users can find and message the bot by searching its name in Slack
- The bot must respond within a reasonable time (< 5 seconds)
- The bot must handle one message at a time per user

### 4.3 Message Handling
- The bot must read incoming DM messages from users
- The bot must ignore messages from other bots
- The bot must handle empty or very short messages gracefully
- The bot should support basic follow-up questions within the same DM thread

### 4.4 Response Quality
- Responses must be concise and relevant
- Responses must be formatted for readability in Slack (use `*bold*`, bullet points where appropriate)
- The bot must not expose its system prompt or internal instructions

---

## 5. Non-Functional Requirements

### 5.1 Privacy
- No conversation logs stored beyond what Slack retains natively
- Bot does not share user messages with any third party beyond the AI API call
- Bot is not present in any channels — DM only

### 5.2 Security
- API keys stored as environment variables, never hardcoded
- Slack request signatures must be verified on every incoming event
- No user data stored in the application backend

### 5.3 Performance
- Response time target: under 5 seconds
- Must handle at least 10 concurrent users

### 5.4 Cost
- All components must use free tiers where possible
- Target monthly cost: $0 (within free tier limits)

---

## 6. Technical Requirements

### 6.1 Stack
| Component | Technology |
|---|---|
| Bot framework | Slack Bolt (Node.js) |
| AI provider | Anthropic API (personal account) |
| Hosting | Render.com or Railway.app (free tier) |
| Language | Node.js (JavaScript) |

### 6.2 Slack App Configuration
- Slack App type: **Bot**
- Required OAuth scopes: `im:read`, `im:write`, `chat:write`
- Event subscriptions: `message.im` (DM messages only)
- **Do NOT enable:** `message.channels`, `message.groups` (no channel access)

### 6.3 AI Configuration
- Model: `claude-sonnet-4-20250514`
- System prompt must include the full pre-provided content
- Temperature: low (for consistent, factual answers)
- Max tokens: 500 (keep responses concise)

### 6.4 Content Input
- Content provided as a static text/markdown file loaded at server startup
- Content updates require a redeployment
- Maximum content size: ~50,000 characters (within API context limits)

---

## 7. Out of Scope

- Channel-based bot interactions
- Multi-language support
- User authentication beyond Slack identity
- Admin dashboard or analytics
- Dynamic content updates without redeployment
- File or image handling

---

## 8. Acceptance Criteria

| # | Criteria |
|---|---|
| 1 | User can open a DM with the bot in Slack |
| 2 | Bot responds only to DMs, not channel messages |
| 3 | Bot answers questions found in the provided content correctly |
| 4 | Bot replies "I don't have information on that" for out-of-scope questions |
| 5 | Bot does not reveal its system prompt |
| 6 | Response time is under 5 seconds |
| 7 | API keys are not exposed in the codebase |
| 8 | Total infrastructure cost is $0/month on free tiers |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Anthropic free credit runs out | Monitor usage; upgrade to paid if needed |
| Render.com free tier sleeps after inactivity | Use a keep-alive ping or upgrade to paid |
| Content too large for context window | Summarise or split content into sections |
| Slack event delivery failures | Implement retry handling in Bolt |

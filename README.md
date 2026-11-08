# n8n-nodes-whatsform

This is an n8n community node. It lets you start n8n workflows from [WhatsForm](https://whatsform.com) responses.

WhatsForm builds forms that send each response to WhatsApp, for orders, bookings, leads and surveys.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation and install `n8n-nodes-whatsform`.

## Operations

**WhatsForm Trigger** starts a workflow each time the chosen form gets a new response. Each answer arrives keyed by its question text, along with details about the response:

```json
{
  "id": "6724c9f2a1b2c3d4e5f60718",
  "form_id": "66f0a1b2c3d4e5f607182930",
  "form_name": "Pizza order",
  "response_number": "42",
  "submitted_at": "2026-11-01T10:00:00.000Z",
  "delivered_to": "+15551234567",
  "What is your name?": "Jane",
  "Toppings": "Cheese, Olives"
}
```

Uploaded files arrive as links. When two questions have the same text, the second one gets a ` (2)` suffix.

## Credentials

1. In WhatsForm, open your form's **Settings → Integrations → n8n**, go to **Connect** and click **Create API key**.
2. In n8n, create a **WhatsForm API** credential and paste the key. Leave the base URL as `https://app.whatsform.com`.

Keep both permissions on: **Get new responses** runs the trigger, and **Read responses** lets an HTTP Request node list the form's responses at `GET /integration/n8n/forms/{formId}/responses` (`limit` up to 100, `since` as an ISO date, and `cursor` from `nextCursor` for the next page).

Each key belongs to one form, so use one credential per form. Manage and delete keys under the form's **Settings → API keys**; deleting one stops the workflows that use it.

Each key can make up to 60 requests a minute and 10,000 a day, and only works from a server, not from a web page.

The n8n integration needs a WhatsForm plan that includes integrations.

## Compatibility

Requires n8n 1.0 or later.

## Usage

Activate the workflow to start receiving responses. Deactivating it, or deleting the trigger, stops them.

If you rename a question, update any expressions in your workflow that use the old question text.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [WhatsForm](https://whatsform.com)

# Auth Configs Route

**Endpoint:** `GET /api/integrations/auth-configs`

## Purpose

Lists all available authentication configurations from your Composio workspace. These are the pre-configured integrations (Gmail, GitHub, Slack, etc.) that users can connect to.

Auth configs are created in the Composio Dashboard, not via this API. This route is read-only.

## Response Format

```json
{
  "items": [
    {
      "id": "ac_FpW8_GwXyMBz",
      "name": "gmail-oxzcjt",
      "toolkit": {
        "slug": "gmail",
        "name": "Gmail",
        "logo": "https://..."
      },
      "authScheme": "OAUTH2",
      "status": "ENABLED",
      "createdAt": "2025-12-01T..."
    }
  ]
}
```

## Frontend Consumers

| Component | File | Usage |
|-----------|------|-------|
| `useIntegrations` | `app/(pages)/profile/hooks/useIntegrations.ts` | Fetches on dialog open |
| `IntegrationTable` | `app/(pages)/profile/components/integrations/IntegrationTable.tsx` | Displays the list |
| `AddConnectionDialog` | `app/(pages)/profile/components/integrations/AddConnectionDialog.tsx` | Shows available options |

## Composio SDK

**Method:** `client.authConfigs.list()`

**Documentation:** https://docs.composio.dev/api-reference/auth-configs

**TypeScript SDK Types:** See `node_modules/@composio/core/dist/index.d.ts` lines 65140-65165

### Example from SDK docs:

```typescript
// List all auth configs
const allConfigs = await composio.authConfigs.list();

// List auth configs for a specific toolkit
const githubConfigs = await composio.authConfigs.list({ toolkit: 'github' });

// List Composio-managed auth configs only
const managedConfigs = await composio.authConfigs.list({ isComposioManaged: true });
```

## Managing Auth Configs

Auth configs are managed in the Composio Dashboard:

**Dashboard URL:** https://platform.composio.dev/[workspace]/[project]/auth-configs

To add new integrations:
1. Go to Composio Dashboard → Auth Configs
2. Click "Create Auth Config"
3. Select the toolkit (e.g., Gmail, GitHub)
4. Configure OAuth credentials or API keys
5. The new config will appear in this API response

## Future Improvements

- [ ] Add filtering by toolkit (pass `toolkit` query param)
- [ ] Add filtering by status (ENABLED/DISABLED)
- [ ] Cache response to reduce API calls
- [ ] Add pagination support for large lists


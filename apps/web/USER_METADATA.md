# User Metadata Structure

## PropelAuth User Metadata

When users sign up, we automatically set the following metadata:

```typescript
{
  plan: "free" | "paid",
  gamesCreated: number,
  signupDate: string (ISO date)
}
```

## Setting Up Webhooks

To automatically set metadata on user creation:

1. **Go to PropelAuth Dashboard** → "Webhooks"
2. **Add Webhook URL**: `https://your-domain.com/api/webhooks/propelauth`
3. **Select Events**: Check "user.created"
4. **Save**

For local development, use a tool like [ngrok](https://ngrok.com/) to expose your localhost:
```bash
ngrok http 3000
# Use the ngrok URL in PropelAuth webhook settings
```

## Checking User Plan in Code

### Client-Side (React)
```typescript
import { useAuthInfo } from "@propelauth/react";

const { user } = useAuthInfo();
const userPlan = user?.metadata?.plan || 'free';
const isPaidUser = userPlan === 'paid';
```

### Server-Side (API Routes)
```typescript
import auth from "@/lib/propelauth";

const user = await auth.getUser(request);
const userPlan = user?.metadata?.plan || 'free';
```

## Upgrading Users to Paid

When a user completes payment (e.g., via Stripe):

```typescript
// In your payment success webhook
const response = await fetch(
  `${process.env.NEXT_PUBLIC_AUTH_URL}/api/backend/v1/user/${userId}/metadata`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PROPELAUTH_API_KEY}`,
    },
    body: JSON.stringify({
      metadata: {
        plan: "paid",
        subscriptionId: stripeSubscriptionId,
        upgradedAt: new Date().toISOString(),
      },
    }),
  }
);
```

## Environment Variables Needed

Add to your `.env`:

```bash
# PropelAuth Configuration
NEXT_PUBLIC_AUTH_URL=https://7433221294.propelauthtest.com
PROPELAUTH_API_KEY=your_api_key_here
PROPELAUTH_VERIFIER_KEY=your_verifier_key_here
```

Get these from your PropelAuth dashboard under "Backend Integration".

## Current Implementation

- ✅ New users automatically get `plan: "free"` on signup
- ✅ Free users limited to 5 games (tracked in metadata)
- ✅ Paid users get unlimited games
- ✅ Game count increments stored in PropelAuth metadata
- ✅ UI shows plan status and game count
- 🔜 Payment integration (Stripe) to upgrade to paid

## Testing

1. Sign up a new user
2. Check PropelAuth dashboard → Users → [Your User] → Metadata
3. You should see:
   ```json
   {
     "plan": "free",
     "gamesCreated": 0,
     "signupDate": "2024-..."
   }
   ```
4. Create games and watch `gamesCreated` increment
5. Manually change `plan` to `"paid"` to test unlimited access


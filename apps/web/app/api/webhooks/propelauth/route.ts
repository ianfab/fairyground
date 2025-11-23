import { NextResponse } from "next/server";
import propelauth from "@/lib/propelauth";

// Webhook handler for PropelAuth events
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_type, user } = body;

    console.log("PropelAuth webhook event:", event_type);

    // Handle user creation event
    if (event_type === "user.created") {
      console.log("New user created:", user.user_id, user.email);

      // Set default metadata for new users
      try {
        await propelauth.updateUserMetadata(user.user_id, {
          metadata: {
            plan: "free",
            gamesCreated: 0,
            signupDate: new Date().toISOString(),
          }
        });
        
        console.log("User metadata set successfully for:", user.email);
      } catch (error) {
        console.error("Error setting user metadata:", error);
      }
    }

    // Handle other events if needed
    if (event_type === "user.updated") {
      console.log("User updated:", user.user_id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}


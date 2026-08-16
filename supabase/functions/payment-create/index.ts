import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId, amount } = await req.json();
    if (!orderId || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid order data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") ?? "1";
    const env = Deno.env.get("PHONEPE_ENV") ?? "UAT";

    if (!merchantId || !saltKey) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build the callback URL — frontend route that PhonePe redirects to after payment
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:5173";
    const callbackUrl = `${frontendUrl}/payment-status?order_id=${orderId}`;

    // PhonePe payload (amount in paise)
    const payload = {
      merchantId,
      merchantTransactionId: orderId,
      merchantUserId: userData.user.id,
      amount: Math.round(amount * 100),
      redirectUrl: callbackUrl,
      redirectMode: "REDIRECT",
      callbackUrl,
      mobileNumber: undefined as string | undefined,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Encode payload as base64
    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = btoa(payloadJson);

    // Compute X-VERIFY checksum: SHA256(payloadBase64 + "/pg/v1/pay" + saltKey) + "###" + saltIndex
    const dataForHash = payloadBase64 + "/pg/v1/pay" + saltKey;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(dataForHash)
    );
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const xVerify = `${hashHex}###${saltIndex}`;

    // PhonePe API endpoint
    const apiBase =
      env === "PRODUCTION"
        ? "https://api.phonepe.com/apis/hermes"
        : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    const payRes = await fetch(`${apiBase}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      body: JSON.stringify({ request: payloadBase64 }),
    });

    if (!payRes.ok) {
      const errBody = await payRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errBody.message ?? "Failed to initiate PhonePe payment",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payData = await payRes.json();

    if (!payData.success) {
      return new Response(
        JSON.stringify({
          error: payData.message ?? "PhonePe payment initiation failed",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract the redirect URL for the instrument response
    const redirectUrl =
      payData.data?.instrumentResponse?.redirectInfo?.url ?? null;
    const merchantTransactionId =
      payData.data?.merchantTransactionId ?? orderId;

    return new Response(
      JSON.stringify({
        success: true,
        merchantTransactionId,
        redirectUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

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

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the order belongs to this user
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, order_number, total, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !orderData) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (orderData.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
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

    // Build X-VERIFY for status check: SHA256("/pg/v1/status/" + merchantId + "/" + orderId + saltKey) + "###" + saltIndex
    const statusPath = `/pg/v1/status/${merchantId}/${orderId}`;
    const dataForHash = statusPath + saltKey;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(dataForHash)
    );
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const xVerify = `${hashHex}###${saltIndex}`;

    const apiBase =
      env === "PRODUCTION"
        ? "https://api.phonepe.com/apis/hermes"
        : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    const statusRes = await fetch(`${apiBase}${statusPath}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId,
      },
    });

    if (!statusRes.ok) {
      const errBody = await statusRes.json().catch(() => ({}));
      // Mark as failed if we can't verify
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", orderId);

      return new Response(
        JSON.stringify({
          error: errBody.message ?? "Payment verification request failed",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const statusData = await statusRes.json();

    if (!statusData.success) {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", orderId);

      return new Response(
        JSON.stringify({
          error: statusData.message ?? "Payment verification failed",
          paymentStatus: "failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paymentState = statusData.data?.state;
    const transactionId = statusData.data?.transactionId ?? null;

    // Map PhonePe states to our payment_status
    if (paymentState === "COMPLETED") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_id: transactionId,
          order_status: "processing",
        })
        .eq("id", orderId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update order" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          orderNumber: orderData.order_number,
          paymentStatus: "paid",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (paymentState === "FAILED" || paymentState === "DECLINED") {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", orderId);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment failed or declined",
          paymentStatus: "failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // PENDING, INITIATED, etc.
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment is still pending",
          paymentStatus: "pending",
        }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
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

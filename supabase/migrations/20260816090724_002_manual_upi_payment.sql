/*
# Manual UPI Payment — schema update

## What changes
1. Adds `payment_reference_id` column to `orders` — stores the UPI transaction/reference ID
   the customer enters after making a UPI payment. Displayed to admin for manual verification.
2. Changes the default `payment_method` from 'razorpay' to 'upi' so new orders reflect the
   manual UPI flow.

## Why
The store switched from automated payment-gateway checkout (Razorpay/PhonePe) to manual UPI
payments. Orders are created with `payment_status = 'pending_verification'`. Admin manually
reviews the reference ID and sets `payment_status` to `paid` or `failed`.

## Security
No RLS or policy changes — existing order policies already allow admin UPDATE and owner
SELECT/INSERT. Only a nullable column is added (no data loss risk).
*/

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference_id text;

ALTER TABLE public.orders
  ALTER COLUMN payment_method SET DEFAULT 'upi';

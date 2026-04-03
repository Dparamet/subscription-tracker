import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { google as googleAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const subscriptionSchema = z.object({
  name: z.string(),
  price: z.number(),
  currency: z.string(),
  billing_cycle: z.enum(['monthly', 'yearly']),
  next_payment_date: z.string(),
}).nullable();

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  );

  // 1. เช็ก Session และดึง Google Access Token
  const { data: { session } } = await supabase.auth.getSession();
  const googleToken = session?.provider_token;

  if (!googleToken) {
    return NextResponse.json(
      { error: 'Please connect Gmail access first', requiresGmailReconnect: true },
      { status: 401 }
    );
  }

  try {
    // 2. ดึงอีเมลล่าสุดที่น่าจะเป็นใบเสร็จ (เอามา 5 เมลล่าสุดเพื่อทดสอบ)
    const gmailRes = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=subject:(receipt OR invoice OR subscription)&maxResults=5`,
      { headers: { Authorization: `Bearer ${googleToken}` } }
    );

    if (!gmailRes.ok) {
      const gmailError = await gmailRes.json().catch(() => ({}));
      const isPermissionError =
        gmailRes.status === 401 ||
        gmailRes.status === 403 ||
        String(gmailError?.error?.message ?? '').toLowerCase().includes('insufficient') ||
        String(gmailError?.error?.message ?? '').toLowerCase().includes('permission');

      if (isPermissionError) {
        return NextResponse.json(
          { error: 'Gmail permission is required', requiresGmailReconnect: true },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: 'Failed to access Gmail API' }, { status: 502 });
    }

    const { messages } = await gmailRes.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: 'No subscription emails found' });
    }

    const results = [];
    let skipped = 0;

    // 3. วนลูปอ่านเนื้อหาเมลและใช้ AI สรุป
    for (const msg of messages) {
      try {
        const detailRes = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          { headers: { Authorization: `Bearer ${googleToken}` } }
        );
        const detail = await detailRes.json();
        const snippet = detail.snippet;

        if (!snippet || typeof snippet !== 'string') {
          skipped += 1;
          continue;
        }

        // ใช้ Vercel AI SDK สั่งให้ AI สรุปเป็น JSON ตาม Schema ที่เราต้องการ
        const { object: subscription } = await generateObject({
          model: googleAI('gemini-1.5-flash'),
          schema: subscriptionSchema,
          prompt: `Extract subscription details from this email snippet: "${snippet}". Return null if this is not a subscription receipt/invoice.`,
        });

        if (!subscription) {
          skipped += 1;
          continue;
        }

        // 4. บันทึกลง Database (Table: subscriptions)
        const { error } = await supabase.from('subscriptions').upsert({
          ...subscription,
          user_id: session.user.id,
          status: 'active'
        }, { onConflict: 'name, user_id' });

        if (!error) {
          results.push(subscription);
        } else {
          skipped += 1;
        }
      } catch {
        skipped += 1;
      }
    }

    return NextResponse.json({ message: 'Scan complete!', added: results.length, skipped });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to scan Gmail: ${reason}` }, { status: 500 });
  }
}

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { sendBossReport } from '@/ai/flows/send-boss-report';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAllowedDiscordWebhookUrl } from '@/lib/discord-webhook';

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const { bosses, webhookUrl: clientWebhookUrl } = await request.json();

        if (!bosses || !Array.isArray(bosses)) {
            return NextResponse.json({ error: 'Missing or invalid bosses data.' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
        }

        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('discord_webhook_url')
            .eq('id', user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Could not load profile.' }, { status: 500 });
        }

        let finalWebhookUrl = profile?.discord_webhook_url ?? null;

        if (!finalWebhookUrl && clientWebhookUrl && isAllowedDiscordWebhookUrl(clientWebhookUrl)) {
            const { error: saveError } = await supabaseAdmin
                .from('profiles')
                .update({
                    discord_webhook_url: clientWebhookUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (!saveError) {
                finalWebhookUrl = clientWebhookUrl;
            }
        }

        if (!finalWebhookUrl || !isAllowedDiscordWebhookUrl(finalWebhookUrl)) {
            return NextResponse.json({ error: 'Missing or invalid Discord webhook URL.' }, { status: 400 });
        }
        
        await sendBossReport({ 
            bosses, 
            webhookUrl: finalWebhookUrl, 
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API Report Error]', error);
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}

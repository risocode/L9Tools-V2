
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { sendBossReport } from '@/ai/flows/send-boss-report';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
        const { bosses, webhookUrl: clientWebhookUrl } = await request.json();

        if (!bosses || !Array.isArray(bosses)) {
            return NextResponse.json({ error: 'Missing or invalid bosses data.' }, { status: 400 });
        }

        let finalWebhookUrl = clientWebhookUrl;

        // If the user is logged in, prioritize their saved webhook URL.
        if (user) {
            const supabaseAdmin = getSupabaseAdmin();
            if (supabaseAdmin) {
                const { data: profile, error } = await supabaseAdmin
                    .from('profiles')
                    .select('discord_webhook_url')
                    .eq('id', user.id)
                    .single();
                
                if (profile?.discord_webhook_url) {
                    finalWebhookUrl = profile.discord_webhook_url;
                }
            }
        }
        
        if (!finalWebhookUrl) {
            return NextResponse.json({ error: 'Missing Discord webhook URL.' }, { status: 400 });
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

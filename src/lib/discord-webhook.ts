const DISCORD_WEBHOOK_HOSTS = new Set(['discord.com', 'discordapp.com']);

export function isAllowedDiscordWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!DISCORD_WEBHOOK_HOSTS.has(parsed.hostname)) {
      return false;
    }
    return /^\/api\/webhooks\/\d+\/[\w-]+$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

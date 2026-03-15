import type Atlanta from "../base/Atlanta.js";
import type { DiscordAPIError, Guild } from "discord.js";

export function sortByKey<T>(array: T[], key: keyof T): T[] {
	return [...array].sort((a, b) => {
		const x = a[key];
		const y = b[key];
		return x < y ? 1 : x > y ? -1 : 0;
	});
}

export function shuffle<T>(arr: T[]): T[] {
	const array = [...arr];
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export function randomNum(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min)) + min;
}

export function convertTime(
	translate: (key: string, args?: Record<string, unknown>) => string,
	timeMs: number
): string {
	const absoluteSeconds = Math.floor((timeMs / 1000) % 60);
	const absoluteMinutes = Math.floor((timeMs / (1000 * 60)) % 60);
	const absoluteHours = Math.floor((timeMs / (1000 * 60 * 60)) % 24);
	const absoluteDays = Math.floor(timeMs / (1000 * 60 * 60 * 24));

	const parts: string[] = [];
	if (absoluteDays) {
		parts.push(
			absoluteDays === 1
				? translate("time:ONE_DAY")
				: translate("time:DAYS", { amount: absoluteDays })
		);
	}
	if (absoluteHours) {
		parts.push(
			absoluteHours === 1
				? translate("time:ONE_HOUR")
				: translate("time:HOURS", { amount: absoluteHours })
		);
	}
	if (absoluteMinutes) {
		parts.push(
			absoluteMinutes === 1
				? translate("time:ONE_MINUTE")
				: translate("time:MINUTES", { amount: absoluteMinutes })
		);
	}
	if (absoluteSeconds) {
		parts.push(
			absoluteSeconds === 1
				? translate("time:ONE_SECOND")
				: translate("time:SECONDS", { amount: absoluteSeconds })
		);
	}
	return parts.join(", ");
}

export async function supportLink(client: Atlanta): Promise<string> {
	try {
		const guild = client.guilds.cache.get(client.config.support.id);
		if (!guild) return "https://atlanta-bot.fr";
		const me = guild.members.me;
		if (!me) return "https://atlanta-bot.fr";
		const channel = guild.channels.cache.find(
			(ch) => ch.permissionsFor(me.id)?.has("CreateInstantInvite") && (ch.isTextBased() || ch.isVoiceBased())
		);
		if (!channel || !("createInvite" in channel)) return "https://atlanta-bot.fr";
		const invite = await (channel as any).createInvite({ maxAge: 0 }).catch(() => null);
		return invite?.url ?? "https://atlanta-bot.fr";
	} catch {
		return "https://atlanta-bot.fr";
	}
}

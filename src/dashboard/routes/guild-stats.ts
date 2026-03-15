import { Router } from "express";
import { fetchGuild } from "../utils.js";
import CheckAuth from "../auth/CheckAuth.js";

const router = Router();

router.get("/:serverID", CheckAuth, async (req, res) => {
	const guild = req.client.guilds.cache.get(req.params.serverID as string);
	if (!guild || !req.userInfos?.displayedGuilds?.find((g: any) => g.id === req.params.serverID)) {
		return res.render("404", {
			user: req.userInfos,
			translate: req.translate,
			currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`,
		});
	}

	const guildInfos = await fetchGuild(guild.id, req.client, (req.user as any).guilds);
	const membersData = await req.client.membersData.find({ guildID: guild.id }).lean();

	const leaderboards = {
		money: sortByKey("money", membersData),
		level: sortByKey("level", membersData),
	};

	for (const cat of Object.values(leaderboards)) {
		if (cat.length > 10) cat.length = 10;
	}

	res.render("stats/guild", {
		stats: leaderboards,
		commands: getCommands(
			(guildInfos.commands ?? []).filter((c: any) => c.date > Date.now() - 604800000)
		),
		commandsUsage: getCommandsUsage(guildInfos.commands ?? []),
		user: req.userInfos,
		translate: req.translate,
		currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`,
	});
});

function getCommands(commands: any[]): Record<string, number> {
	const result: Record<string, number> = {};
	for (const cmd of commands) {
		const d = formatDate(new Date(cmd.date));
		result[d] = (result[d] ?? 0) + 1;
	}
	return result;
}

function getCommandsUsage(commands: any[]): Array<{ key: string; percentage: number; color: string }> {
	const counts: Record<string, number> = {};
	for (const cmd of commands) {
		counts[cmd.command] = (counts[cmd.command] ?? 0) + 1;
	}
	const sum = Object.values(counts).reduce((a, b) => a + b, 0);
	const entries = Object.entries(counts);
	return entries.map(([key, val], i) => ({
		key,
		percentage: Math.round((val / sum) * 100),
		color: `hsl(${(i * 360) / entries.length}, 70%, 60%)`,
	}));
}

function sortByKey(key: string, arr: any[]): any[] {
	return [...arr].sort((a, b) => b[key] - a[key]);
}

function formatDate(date: Date): string {
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	return `${mm}/${dd}`;
}

export default router;

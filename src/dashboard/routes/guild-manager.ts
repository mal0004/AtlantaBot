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

	res.render("manager/guild", {
		guild: guildInfos,
		user: req.userInfos,
		translate: req.translate,
		bot: req.client,
		currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`,
	});
});

router.post("/:serverID", CheckAuth, async (req, res) => {
	const guild = req.client.guilds.cache.get(req.params.serverID as string);
	if (!guild || !req.userInfos?.displayedGuilds?.find((g: any) => g.id === req.params.serverID)) {
		return res.render("404", {
			user: req.userInfos,
			translate: req.translate,
			currentURL: `${req.client.config.dashboard.baseURL}/${req.originalUrl}`,
		});
	}

	const guildData = await req.client.findOrCreateGuild({ id: guild.id });
	const data = req.body;

	if (data.language) {
		const language = req.client.languages.find(
			(l) => l.aliases[0].toLowerCase() === data.language.toLowerCase()
		);
		if (language) guildData.language = language.name;
		if (data.prefix?.length >= 1 && data.prefix.length < 2000) {
			// prefix is stored for legacy support but slash-only
		}
		await guildData.save();
	}

	if (data.welcomeEnable !== undefined || data.welcomeUpdate !== undefined) {
		const ch = guild.channels.cache.find((c) => "#" + c.name === data.channel);
		guildData.plugins.welcome = {
			enabled: true,
			message: data.message,
			channel: ch?.id ?? null,
			withImage: data.withImage === "on",
		};
		guildData.markModified("plugins.welcome");
		await guildData.save();
	}

	if (data.welcomeDisable !== undefined) {
		guildData.plugins.welcome = { enabled: false, message: null, channel: null, withImage: null };
		guildData.markModified("plugins.welcome");
		await guildData.save();
	}

	if (data.goodbyeEnable !== undefined || data.goodbyeUpdate !== undefined) {
		const ch = guild.channels.cache.find((c) => "#" + c.name === data.channel);
		guildData.plugins.goodbye = {
			enabled: true,
			message: data.message,
			channel: ch?.id ?? null,
			withImage: data.withImage === "on",
		};
		guildData.markModified("plugins.goodbye");
		await guildData.save();
	}

	if (data.goodbyeDisable !== undefined) {
		guildData.plugins.goodbye = { enabled: false, message: null, channel: null, withImage: null };
		guildData.markModified("plugins.goodbye");
		await guildData.save();
	}

	if (data.autoroleEnable !== undefined || data.autoroleUpdate !== undefined) {
		const role = guild.roles.cache.find((r) => "@" + r.name === data.role);
		guildData.plugins.autorole = { enabled: true, role: role?.id ?? null };
		guildData.markModified("plugins.autorole");
		await guildData.save();
	}

	if (data.autoroleDisable !== undefined) {
		guildData.plugins.autorole = { enabled: false, role: null };
		guildData.markModified("plugins.autorole");
		await guildData.save();
	}

	if (data.suggestions !== undefined) {
		const noChannel = req.translate("common:NO_CHANNEL");
		guildData.plugins.suggestions = data.suggestions === noChannel
			? false
			: guild.channels.cache.find((c) => "#" + c.name === data.suggestions)?.id ?? false;
		guildData.plugins.modlogs = data.modlogs === noChannel
			? false
			: guild.channels.cache.find((c) => "#" + c.name === data.modlogs)?.id ?? false;
		guildData.markModified("plugins");
	}

	await guildData.save();
	res.redirect(303, `/manage/${guild.id}`);
});

export default router;

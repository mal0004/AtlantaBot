import { Router } from "express";
import { EmbedBuilder } from "discord.js";

const router = Router();

router.get("/login", async (req, res) => {
	if (!req.user?.id || !(req.user as any)?.guilds) {
		const baseURL = req.client.config.dashboard.baseURL;
		return res.redirect(
			`https://discord.com/api/oauth2/authorize?client_id=${req.client.user!.id}&scope=identify%20guilds&response_type=code&redirect_uri=${encodeURIComponent(baseURL + "/api/callback")}&state=${req.query.state || "no"}`
		);
	}
	res.redirect("/selector");
});

router.get("/callback", async (req, res) => {
	if (!req.query.code) return res.redirect(req.client.config.dashboard.failureURL);

	const redirectURL = req.client.states[req.query.state as string] || "/selector";

	const params = new URLSearchParams();
	params.set("grant_type", "authorization_code");
	params.set("code", req.query.code as string);
	params.set("redirect_uri", `${req.client.config.dashboard.baseURL}/api/callback`);

	const credentials = Buffer.from(
		`${req.client.user!.id}:${req.client.config.dashboard.secret}`
	).toString("base64");

	let response = await fetch("https://discord.com/api/oauth2/token", {
		method: "POST",
		body: params.toString(),
		headers: {
			Authorization: `Basic ${credentials}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});

	const tokens = await response.json() as any;
	if (tokens.error || !tokens.access_token) {
		return res.redirect(`/api/login&state=${req.query.state}`);
	}

	const userData: { infos: any; guilds: any } = { infos: null, guilds: null };

	while (!userData.infos || !userData.guilds) {
		if (!userData.infos) {
			response = await fetch("https://discord.com/api/users/@me", {
				headers: { Authorization: `Bearer ${tokens.access_token}` },
			});
			const json = await response.json() as any;
			if (json.retry_after) await new Promise((r) => setTimeout(r, json.retry_after));
			else userData.infos = json;
		}
		if (!userData.guilds) {
			response = await fetch("https://discord.com/api/users/@me/guilds", {
				headers: { Authorization: `Bearer ${tokens.access_token}` },
			});
			const json = await response.json() as any;
			if (json.retry_after) await new Promise((r) => setTimeout(r, json.retry_after));
			else userData.guilds = json;
		}
	}

	const guilds = Object.values(userData.guilds);
	(req.session as any).user = { ...userData.infos, guilds };

	const user = await req.client.users.fetch((req.session as any).user.id);
	const userDB = await req.client.findOrCreateUser({ id: (req.session as any).user.id });

	const logsChannel = req.client.channels.cache.get(req.client.config.dashboard.logs);
	if (!userDB.logged && logsChannel?.isTextBased() && user) {
		const embed = new EmbedBuilder()
			.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
			.setColor("#DA70D6")
			.setDescription(
				req.client.translate("dashboard:FIRST_LOGIN", { user: user.tag })
			);
		(logsChannel as any).send({ embeds: [embed] }).catch(() => {});
		userDB.logged = true;
		await userDB.save();
	}

	res.redirect(redirectURL);
});

export default router;

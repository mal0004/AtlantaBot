import { PermissionsBitField } from "discord.js";
import type Atlanta from "../base/Atlanta.js";

export async function fetchGuild(guildID: string, client: Atlanta, guilds: any[]): Promise<any> {
	const guild = client.guilds.cache.get(guildID);
	if (!guild) return null;
	const conf = await client.findOrCreateGuild({ id: guild.id });
	return { ...guild, ...conf.toJSON(), ...guilds.find((g: any) => g.id === guild.id) };
}

export async function fetchUser(userData: any, client: Atlanta, query?: string): Promise<any> {
	if (userData.guilds) {
		for (const guild of userData.guilds) {
			const perms = new PermissionsBitField(BigInt(guild.permissions));
			if (perms.has("ManageGuild")) {
				guild.admin = true;
			}
			guild.settingsUrl = client.guilds.cache.get(guild.id)
				? `/manage/${guild.id}/`
				: `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&scope=bot&permissions=2146958847&guild_id=${guild.id}`;
			guild.statsUrl = client.guilds.cache.get(guild.id)
				? `/stats/${guild.id}/`
				: `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&scope=bot&permissions=2146958847&guild_id=${guild.id}`;
			guild.iconURL = guild.icon
				? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
				: "https://discordemoji.com/assets/emoji/discordcry.png";
			guild.displayed = query ? guild.name.toLowerCase().includes(query.toLowerCase()) : true;
		}
		userData.displayedGuilds = userData.guilds.filter((g: any) => g.displayed && g.admin);
		if (userData.displayedGuilds.length < 1) {
			delete userData.displayedGuilds;
		}
	}
	const user = await client.users.fetch(userData.id);
	const userDb = await client.findOrCreateUser({ id: user.id }, true);
	const userInfos = { ...(user.toJSON() as Record<string, any>), ...userDb, ...userData };
	return userInfos;
}

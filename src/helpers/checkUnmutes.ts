import { EmbedBuilder } from "discord.js";
import type Atlanta from "../base/Atlanta.js";

export function initUnmuteChecker(client: Atlanta): void {
	client.membersData.find({ "mute.muted": true }).then((members) => {
		for (const member of members) {
			client.databaseCache.mutedUsers.set(`${member.id}${member.guildID}`, member);
		}
	});

	setInterval(async () => {
		const expired = [...client.databaseCache.mutedUsers.values()].filter(
			(m) => m.mute.endDate !== null && m.mute.endDate <= Date.now()
		);

		for (const memberData of expired) {
			const guild = client.guilds.cache.get(memberData.guildID);
			if (!guild) continue;

			const member = guild.members.cache.get(memberData.id)
				?? await guild.members.fetch(memberData.id).catch(() => null);

			if (!member) {
				memberData.mute = { muted: false, endDate: null, case: null };
				await memberData.save();
				client.databaseCache.mutedUsers.delete(`${memberData.id}${memberData.guildID}`);
				client.logger.log(`[unmute] ${memberData.id} cannot be found.`);
				continue;
			}

			const guildData = await client.findOrCreateGuild({ id: guild.id });

			for (const channel of guild.channels.cache.values()) {
				if (!("permissionOverwrites" in channel)) continue;
				const overwrite = channel.permissionOverwrites?.cache.get(member.id);
				if (overwrite) await overwrite.delete().catch(() => {});
			}

			const user = member.user;
			const embed = new EmbedBuilder()
				.setDescription(
					client.translate("moderation/unmute:SUCCESS_CASE", {
						user: user.toString(),
						usertag: user.tag,
						count: memberData.mute.case,
					}, guildData.language)
				)
				.setColor("#f44271")
				.setFooter({ text: client.config.embed.footer });

			const modlogsChannel = guildData.plugins.modlogs;
			if (modlogsChannel) {
				const ch = guild.channels.cache.get(modlogsChannel as string);
				if (ch?.isTextBased() && "send" in ch) ch.send({ embeds: [embed] }).catch(() => {});
			}

			memberData.mute = { muted: false, endDate: null, case: null };
			client.databaseCache.mutedUsers.delete(`${memberData.id}${memberData.guildID}`);
			await memberData.save();
		}
	}, 5000);
}

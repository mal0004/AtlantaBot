import { EmbedBuilder } from "discord.js";
import type Atlanta from "../base/Atlanta.js";

export function initRemindChecker(client: Atlanta): void {
	client.usersData.find({ reminds: { $gt: [] } }).then((users) => {
		for (const user of users) {
			if (!client.users.cache.has(user.id)) client.users.fetch(user.id).catch(() => {});
			client.databaseCache.usersReminds.set(user.id, user);
		}
	});

	setInterval(async () => {
		const now = Date.now();
		for (const [, userData] of client.databaseCache.usersReminds) {
			const dUser = client.users.cache.get(userData.id);
			if (!dUser) continue;

			const due = userData.reminds.filter((r) => r.sendAt < now);
			if (due.length === 0) continue;

			for (const remind of due) {
				const embed = new EmbedBuilder()
					.setAuthor({ name: client.translate("general/remindme:TITLE") })
					.addFields(
						{
							name: client.translate("common:CREATION"),
							value: client.translate("general/remindme:CREATED", {
								time: client.convertTime(remind.createdAt, "from"),
							}),
						},
						{ name: client.translate("common:MESSAGE"), value: remind.message }
					)
					.setColor(client.config.embed.color)
					.setFooter({ text: client.config.embed.footer });
				dUser.send({ embeds: [embed] }).catch(() => {});
			}

			userData.reminds = userData.reminds.filter((r) => r.sendAt >= now);
			await userData.save();
			if (userData.reminds.length === 0) {
				client.databaseCache.usersReminds.delete(userData.id);
			}
		}
	}, 5000);
}

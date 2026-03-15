import { EmbedBuilder } from "discord.js";
import type Atlanta from "../base/Atlanta.js";
import type { Guild } from "discord.js";

export default class GuildCreateEvent {
	client: Atlanta;

	constructor(client: Atlanta) {
		this.client = client;
	}

	async run(guild: Guild): Promise<void> {
		const client = this.client;

		const guildOwner = await client.users.fetch(guild.ownerId).catch(() => null);
		if (!guildOwner) return;

		const userData = await client.findOrCreateUser({ id: guild.ownerId });
		const messageOptions: { embeds: EmbedBuilder[]; files?: Array<{ name: string; attachment: string }> } = {
			embeds: [],
		};

		if (!userData.achievements.invite.achieved) {
			userData.achievements.invite.progress.now += 1;
			userData.achievements.invite.achieved = true;
			messageOptions.files = [
				{ name: "unlocked.png", attachment: "./assets/img/achievements/achievement_unlocked7.png" },
			];
			userData.markModified("achievements.invite");
			await userData.save();
		}

		const thanksEmbed = new EmbedBuilder()
			.setAuthor({ name: "Thank you for adding me to your guild!" })
			.setDescription(
				"To see my commands, type `/help`.\nTo change the language, type `/setlang`."
			)
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setTimestamp();
		messageOptions.embeds = [thanksEmbed];

		guildOwner.send(messageOptions).catch(() => {});

		const humans = guild.members.cache.filter((m) => !m.user.bot).size;
		const bots = guild.members.cache.filter((m) => m.user.bot).size;

		const logsEmbed = new EmbedBuilder()
			.setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
			.setColor("#32CD32")
			.setDescription(`Joined **${guild.name}** with **${humans}** members (and ${bots} bots)`);

		const logsChannel = client.channels.cache.get(client.config.support.logs);
		if (logsChannel?.isTextBased() && "send" in logsChannel) logsChannel.send({ embeds: [logsEmbed] }).catch(() => {});
	}
}

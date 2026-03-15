import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, version as djsVersion } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Stats extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("stats")
		.setDescription("Shows bot statistics");

	constructor(client: Atlanta) {
		super(client, {
			name: "stats",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;

		const servers = client.guilds.cache.size;
		const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
		const channels = client.channels.cache.size;
		const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

		const days = Math.floor(client.uptime! / 86_400_000);
		const hours = Math.floor((client.uptime! / 3_600_000) % 24);
		const minutes = Math.floor((client.uptime! / 60_000) % 60);
		const uptime = `${days}d ${hours}h ${minutes}m`;

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: client.translate("general/stats:COUNTS_TITLE", undefined, locale) })
			.setThumbnail(client.user!.displayAvatarURL())
			.setDescription(client.translate("general/stats:MADE", undefined, locale))
			.addFields(
				{
					name: client.translate("general/stats:COUNTS_TITLE", undefined, locale),
					value: client.translate("general/stats:COUNTS_CONTENT", { servers: servers.toString(), users: users.toString() }, locale),
					inline: true,
				},
				{
					name: client.translate("general/stats:VERSIONS_TITLE", undefined, locale),
					value: `Node.js ${process.version}\ndiscord.js v${djsVersion}`,
					inline: true,
				},
				{
					name: client.translate("general/stats:RAM_TITLE", undefined, locale),
					value: `${memUsage} MB`,
					inline: true,
				},
				{
					name: client.translate("general/stats:ONLINE_TITLE", undefined, locale),
					value: client.translate("general/stats:ONLINE_CONTENT", { time: uptime }, locale),
					inline: true,
				},
				{
					name: client.translate("general/stats:LINKS_TITLE", undefined, locale),
					value: `Commands: ${client.commands.size}`,
					inline: true,
				},
			);

		if (data.config.others.github) {
			embed.addFields({
				name: "GitHub",
				value: data.config.others.github,
			});
		}

		await interaction.reply({ embeds: [embed] });
	}
}

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class ServersList extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "servers-list",

			enabled: true,
			guildOnly: false,
			ownerOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("servers-list")
		.setDescription("List all guilds the bot is in (owner only)");

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const guilds = client.guilds.cache
			.sort((a, b) => b.memberCount - a.memberCount)
			.map((guild, _key, _collection) => ({
				name: guild.name,
				id: guild.id,
				members: guild.memberCount,
			}));

		const pageSize = 10;
		const pages: string[] = [];

		for (let i = 0; i < guilds.length; i += pageSize) {
			const chunk = guilds.slice(i, i + pageSize);
			pages.push(
				chunk
					.map((g, idx) => `**${i + idx + 1}.** ${g.name} — \`${g.id}\` (${g.members} members)`)
					.join("\n"),
			);
		}

		if (pages.length === 0) {
			return void interaction.reply({
				content: "The bot is not in any guilds.",
				ephemeral: true,
			});
		}

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setTitle(`Servers List (${guilds.length} total)`)
			.setDescription(pages[0])
			.setFooter({
				text: `Page 1/${pages.length} | ${data.config.embed.footer}`,
			})
			.setTimestamp();

		interaction.reply({ embeds: [embed], ephemeral: true });
	}
}

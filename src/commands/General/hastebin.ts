import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Hastebin extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("hastebin")
		.setDescription("Upload code to Hastebin")
		.addStringOption(option =>
			option.setName("code")
				.setDescription("The code to upload")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "hastebin",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const code = interaction.options.getString("code", true);

		await interaction.deferReply();

		try {
			const res = await fetch("https://hastebin.com/documents", {
				method: "POST",
				headers: { "Content-Type": "text/plain" },
				body: code,
			});

			if (!res.ok) {
				await interaction.editReply({
					content: `${client.customEmojis.error} ${client.translate("general/hastebin:MISSING_TEXT", undefined, locale)}`,
				});
				return;
			}

			const json = await res.json() as { key: string };

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer })
				.setDescription(`${client.customEmojis.success} ${client.translate("general/hastebin:SUCCESS", undefined, locale)}\nhttps://hastebin.com/${json.key}`);

			await interaction.editReply({ embeds: [embed] });
		} catch {
			await interaction.editReply({
				content: `${client.customEmojis.error} An error occurred while uploading to Hastebin.`,
			});
		}
	}
}

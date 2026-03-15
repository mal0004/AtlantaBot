import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Shorturl extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("shorturl")
		.setDescription("Shorten a URL using is.gd")
		.addStringOption(option =>
			option.setName("url")
				.setDescription("The URL to shorten")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "shorturl",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const url = interaction.options.getString("url", true);

		await interaction.deferReply();

		try {
			const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
			const shortened = await res.text();

			if (!res.ok || shortened.startsWith("Error")) {
				await interaction.editReply({
					content: `${client.customEmojis.error} ${client.translate("general/shorturl:MISSING_URL", undefined, locale)}`,
				});
				return;
			}

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer })
				.setAuthor({ name: "Short URL" })
				.addFields(
					{ name: "Original", value: url },
					{ name: "Shortened", value: shortened },
				);

			await interaction.editReply({ embeds: [embed] });
		} catch {
			await interaction.editReply({
				content: `${client.customEmojis.error} ${client.translate("general/shorturl:MISSING_URL", undefined, locale)}`,
			});
		}
	}
}

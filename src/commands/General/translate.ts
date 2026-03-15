import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { translate as googleTranslate } from "@vitalets/google-translate-api";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Translate extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("translate")
		.setDescription("Translate text between languages")
		.addStringOption(option =>
			option.setName("from")
				.setDescription("Source language code (e.g. en, fr, de)")
				.setRequired(true),
		)
		.addStringOption(option =>
			option.setName("to")
				.setDescription("Target language code (e.g. en, fr, de)")
				.setRequired(true),
		)
		.addStringOption(option =>
			option.setName("text")
				.setDescription("Text to translate")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "translate",

			enabled: true,
			guildOnly: false,
			cooldown: 8000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const from = interaction.options.getString("from", true);
		const to = interaction.options.getString("to", true);
		const text = interaction.options.getString("text", true);

		await interaction.deferReply();

		try {
			const result = await googleTranslate(text, { from, to });

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer })
				.setAuthor({ name: "Translation" })
				.addFields(
					{ name: `From (${from})`, value: text },
					{ name: `To (${to})`, value: result.text },
				);

			await interaction.editReply({ embeds: [embed] });
		} catch {
			await interaction.editReply({
				content: `${client.customEmojis.error} ${client.translate("general/translate:INVALID_LANGUAGE", { search: to }, locale)}`,
			});
		}
	}
}

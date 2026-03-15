import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import figlet from "figlet";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Ascii extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("ascii")
		.setDescription("Convert text to ASCII art")
		.addStringOption(option =>
			option.setName("text")
				.setDescription("The text to convert")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "ascii",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const text = interaction.options.getString("text", true);

		if (text.length > 20) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("fun/ascii:TEXT_MISSING", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		const rendered = figlet.textSync(text);

		if (rendered.length > 1990) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("fun/ascii:TEXT_MISSING", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		await interaction.reply({
			content: `\`\`\`\n${rendered}\n\`\`\``,
		});
	}
}

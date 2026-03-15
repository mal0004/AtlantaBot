import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Choice extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("choice")
		.setDescription("Picks a random option from a list of choices")
		.addStringOption(option =>
			option.setName("choices")
				.setDescription("Choices separated by spaces")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "choice",

			enabled: true,
			guildOnly: false,
			cooldown: 3000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const input = interaction.options.getString("choices", true);
		const choices = input.split(/\s+/).filter(Boolean);

		if (choices.length < 2) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("fun/choice:MISSING", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		const pick = choices[Math.floor(Math.random() * choices.length)];

		await interaction.reply({
			content: `🎯 ${client.translate("fun/choice:DONE", undefined, locale)} **${pick}**`,
		});
	}
}

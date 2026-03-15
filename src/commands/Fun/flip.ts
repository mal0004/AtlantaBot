import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Flip extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("flip")
		.setDescription("Flip a coin");

	constructor(client: Atlanta) {
		super(client, {
			name: "flip",

			enabled: true,
			guildOnly: false,
			cooldown: 3000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;

		const result = Math.random() < 0.5 ? "HEADS" : "TAILS";

		await interaction.reply({
			content: `🪙 ${client.translate(`fun/flip:${result}`, undefined, locale)}`,
		});
	}
}

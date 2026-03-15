import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Someone extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("someone")
		.setDescription("Mentions a random member of the server");

	constructor(client: Atlanta) {
		super(client, {
			name: "someone",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;

		const members = await interaction.guild!.members.fetch();
		const nonBotMembers = members.filter(m => !m.user.bot);
		const random = nonBotMembers.random();

		if (!random) {
			await interaction.reply({
				content: `${client.customEmojis.error} No members found!`,
				ephemeral: true,
			});
			return;
		}

		await interaction.reply({
			content: `🎲 ${random} (${random.user.tag})`,
		});
	}
}

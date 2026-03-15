import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Setafk extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("setafk")
		.setDescription("Set or clear your AFK status")
		.addStringOption(option =>
			option.setName("reason")
				.setDescription("AFK reason (leave empty to clear)")
				.setRequired(false),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "setafk",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const reason = interaction.options.getString("reason");

		if (data.userData.afk) {
			data.userData.afk = null;
			await data.userData.save();

			await interaction.reply({
				content: `${client.customEmojis.success} ${client.translate("general/setafk:DELETED", { username: interaction.user.username }, locale)}`,
			});
			return;
		}

		data.userData.afk = reason ?? "AFK";
		await data.userData.save();

		await interaction.reply({
			content: `${client.customEmojis.success} ${client.translate("general/setafk:SUCCESS", { reason: data.userData.afk }, locale)}`,
		});
	}
}

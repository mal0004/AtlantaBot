import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Back extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "back",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("back")
		.setDescription("Go back to the previous track");

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const queue = client.player.nodes.get(interaction.guildId!);
		if (!queue || !queue.isPlaying()) {
			return void interaction.reply({
				content: t("music/play:NOT_PLAYING"),
				ephemeral: true,
			});
		}

		if (queue.history.isEmpty()) {
			return void interaction.reply({
				content: t("music/back:NO_PREV_SONG"),
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			await queue.history.back();

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setDescription(t("music/back:SUCCESS"))
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			interaction.editReply({ embeds: [embed] });
		} catch {
			interaction.editReply({ content: "An error occurred while trying to go back." });
		}
	}
}

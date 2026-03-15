import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Pause extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "pause",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("pause")
		.setDescription("Pause the current playback");

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

		if (queue.node.isPaused()) {
			return void interaction.reply({
				content: "The music is already paused!",
				ephemeral: true,
			});
		}

		queue.node.pause();

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setDescription(t("music/pause:SUCCESS"))
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	}
}

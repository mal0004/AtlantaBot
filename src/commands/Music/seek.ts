import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import ms from "ms";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Seek extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "seek",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("seek")
		.setDescription("Seek to a position in the current track")
		.addStringOption(opt =>
			opt.setName("time").setDescription("Time to seek to (e.g. 1m30s, 90s, 2m)").setRequired(true),
		);

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

		const timeStr = interaction.options.getString("time", true);
		const timeMs = (ms as unknown as (s: string) => number | undefined)(timeStr);

		if (timeMs === undefined || isNaN(timeMs)) {
			return void interaction.reply({
				content: t("music/seek:INVALID_TIME"),
				ephemeral: true,
			});
		}

		if (timeMs < 0 || timeMs > queue.currentTrack!.durationMS) {
			return void interaction.reply({
				content: "The specified time exceeds the track duration!",
				ephemeral: true,
			});
		}

		await queue.node.seek(timeMs);

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setDescription(t("music/seek:SUCCESS", { time: timeStr }))
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	}
}

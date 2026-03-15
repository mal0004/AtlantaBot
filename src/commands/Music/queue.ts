import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Queue extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "queue",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("queue")
		.setDescription("Show the current music queue");

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

		const currentTrack = queue.currentTrack;
		const tracks = queue.tracks.toArray();

		const description = [
			`**Now Playing**`,
			currentTrack ? `[${currentTrack.title}](${currentTrack.url}) — ${currentTrack.duration}` : "None",
			"",
			`**Upcoming**`,
			tracks.length > 0
				? tracks
					.slice(0, 10)
					.map((track, i) => `**${i + 1}.** [${track.title}](${track.url}) — ${track.duration}`)
					.join("\n")
				: "No upcoming tracks",
		];

		if (tracks.length > 10) {
			description.push(`\n*...and ${tracks.length - 10} more*`);
		}

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setTitle(t("music/queue:TITLE"))
			.setDescription(description.join("\n"))
			.setFooter({ text: `${tracks.length + 1} tracks | ${data.config.embed.footer}` })
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	}
}

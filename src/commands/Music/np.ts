import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class NowPlaying extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "np",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("np")
		.setDescription("Show the currently playing track");

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const queue = client.player.nodes.get(interaction.guildId!);
		if (!queue || !queue.currentTrack) {
			return void interaction.reply({
				content: t("music/play:NOT_PLAYING"),
				ephemeral: true,
			});
		}

		const track = queue.currentTrack;
		const progress = queue.node.createProgressBar();

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setTitle(t("music/np:CURRENTLY_PLAYING"))
			.setThumbnail(track.thumbnail)
			.setDescription(`[${track.title}](${track.url})\n${t("music/np:T_CHANNEL")}: ${track.author}\n\n${progress}`)
			.addFields(
				{ name: t("music/np:T_DURATION"), value: track.duration, inline: true },
				{ name: "Requested by", value: track.requestedBy?.toString() ?? "Unknown", inline: true },
			)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	}
}

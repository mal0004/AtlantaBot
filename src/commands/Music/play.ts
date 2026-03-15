import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { QueryType } from "discord-player";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Play extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "play",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("play")
		.setDescription("Play a song in your voice channel")
		.addStringOption(opt =>
			opt.setName("query").setDescription("Song name or URL").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const member = interaction.guild!.members.cache.get(interaction.user.id);
		const voiceChannel = member?.voice.channel;

		if (!voiceChannel) {
			return void interaction.reply({
				content: t("music/play:NO_VOICE_CHANNEL"),
				ephemeral: true,
			});
		}

		const query = interaction.options.getString("query", true);

		await interaction.deferReply();

		try {
			const result = await client.player.search(query, {
				requestedBy: interaction.user as any,
				searchEngine: QueryType.AUTO,
			});

			if (!result.hasTracks()) {
				return void interaction.editReply({
					content: t("music/play:NO_RESULT", { query }),
				});
			}

			const { track } = await client.player.play(voiceChannel as any, result, {
				nodeOptions: {
					metadata: { channel: interaction.channel, guild: interaction.guild },
					leaveOnEmpty: true,
					leaveOnEmptyCooldown: 60_000,
					leaveOnEnd: true,
					leaveOnEndCooldown: 60_000,
				},
			});

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setTitle(t("music/play:ADDED_QUEUE", { songName: track.title }))
				.setThumbnail(track.thumbnail)
				.setDescription(`[${track.title}](${track.url})`)
				.addFields(
					{ name: t("common:DURATION"), value: track.duration, inline: true },
					{ name: t("common:AUTHOR"), value: track.author, inline: true },
					{ name: "Requested by", value: interaction.user.toString(), inline: true },
				)
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			interaction.editReply({ embeds: [embed] });
		} catch (err) {
			interaction.editReply({ content: t("music/play:ERR_OCCURRED", { error: err instanceof Error ? err.message : "Unknown" }) });
		}
	}
}

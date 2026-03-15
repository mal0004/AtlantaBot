import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

const AVAILABLE_FILTERS = [
	"bassboost", "8D", "vaporwave", "nightcore", "phaser",
	"tremolo", "vibrato", "reverse", "treble", "normalizer",
	"surrounding", "pulsator", "subboost", "karaoke", "flanger",
	"gate", "haas", "mcompand", "mono", "mstlr", "mstrr",
	"compressor", "expander", "softlimiter", "chorus", "chorus2d",
	"chorus3d", "fadein", "dim", "earrape",
] as const;

export default class Filter extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "filter",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("filter")
		.setDescription("Apply an audio filter to the playback")
		.addStringOption(opt =>
			opt
				.setName("name")
				.setDescription("The filter to apply")
				.setRequired(true)
				.addChoices(
					...AVAILABLE_FILTERS.slice(0, 25).map(f => ({ name: f, value: f })),
				),
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

		const filterName = interaction.options.getString("name", true);

		await interaction.deferReply();

		try {
			const filtersEnabled = queue.filters.ffmpeg.getFiltersEnabled();
			const isEnabled = filtersEnabled.includes(filterName as any);

			if (isEnabled) {
				queue.filters.ffmpeg.setFilters([filterName as any]);
			} else {
				queue.filters.ffmpeg.toggle([filterName as any]);
			}

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setDescription(
					isEnabled
						? t("music/filter:REMOVING_FILTER")
						: t("music/filter:ADDING_FILTER"),
				)
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			interaction.editReply({ embeds: [embed] });
		} catch {
			interaction.editReply({ content: "An error occurred while applying the filter." });
		}
	}
}

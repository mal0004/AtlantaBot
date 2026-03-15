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
];

export default class Filters extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "filters",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("filters")
		.setDescription("List all available audio filters");

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const queue = client.player.nodes.get(interaction.guildId!);
		const active = queue?.filters.ffmpeg.getFiltersEnabled() ?? [];

		const list = AVAILABLE_FILTERS.map(f => {
			const status = active.includes(f as any) ? "✅" : "❌";
			return `${status} \`${f}\``;
		}).join("\n");

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setTitle(t("music/filters:TITLE"))
			.setDescription(`${t("music/filters:CONTENT", { prefix: "/" })}\n\n${list}`)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	}
}

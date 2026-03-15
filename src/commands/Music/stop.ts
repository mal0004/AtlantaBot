import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Stop extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "stop",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stop the music and clear the queue");

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

		queue.delete();

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setDescription(t("music/stop:SUCCESS"))
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	}
}

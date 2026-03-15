import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

const WORDS = [
	"apple", "banana", "cherry", "dragon", "eagle", "falcon", "guitar",
	"hammer", "island", "jungle", "knight", "lemon", "monkey", "needle",
	"orange", "planet", "queen", "rocket", "shield", "tiger", "umbrella",
	"violet", "window", "yellow", "zebra", "bridge", "castle", "desert",
	"forest", "garden", "harbor", "jacket", "kitten", "lantern", "marble",
];

export default class Findwords extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("findwords")
		.setDescription("Play a word-finding game");

	constructor(client: Atlanta) {
		super(client, {
			name: "findwords",

			enabled: true,
			guildOnly: true,
			cooldown: 15000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;

		const word = WORDS[Math.floor(Math.random() * WORDS.length)];
		const shuffled = word.split("").sort(() => Math.random() - 0.5).join("");
		const timeLimit = 30_000;

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: "Findwords" })
			.setDescription(
				client.translate("fun/findwords:FIND_WORD", {
					word: shuffled.toUpperCase(),
				}, locale),
			);

		await interaction.reply({ embeds: [embed] });

		const channel = interaction.channel!;
		if (!("awaitMessages" in channel)) return;
		const filter = (m: { content: string }) =>
			m.content.toLowerCase().trim() === word;

		try {
			const collected = await channel.awaitMessages({
				filter,
				max: 1,
				time: timeLimit,
				errors: ["time"],
			});

			const winner = collected.first()!;
			await interaction.editReply({
				embeds: [embed.setDescription(
					`🎉 ${client.translate("fun/findwords:WORD_FOUND", { winner: winner.author.toString() }, locale)}`,
				)],
			});
		} catch {
			await interaction.editReply({
				embeds: [embed.setDescription(
					client.translate("fun/findwords:NO_WINNER", undefined, locale),
				)],
			});
		}
	}
}

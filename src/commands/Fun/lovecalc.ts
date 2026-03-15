import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Lovecalc extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("lovecalc")
		.setDescription("Calculate the love percentage between two users")
		.addUserOption(option =>
			option.setName("user1")
				.setDescription("First user")
				.setRequired(true),
		)
		.addUserOption(option =>
			option.setName("user2")
				.setDescription("Second user")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "lovecalc",

			enabled: true,
			guildOnly: false,
			cooldown: 3000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const user1 = interaction.options.getUser("user1", true);
		const user2 = interaction.options.getUser("user2", true);

		const seed = parseInt(
			(BigInt(user1.id) + BigInt(user2.id)).toString().slice(-4),
		);
		const percentage = seed % 101;

		let emoji: string;
		if (percentage < 30) emoji = "💔";
		else if (percentage < 60) emoji = "❤️";
		else if (percentage < 80) emoji = "💕";
		else emoji = "💞";

		const bar = "█".repeat(Math.floor(percentage / 10)) + "░".repeat(10 - Math.floor(percentage / 10));

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: "Love Calculator" })
			.setDescription(
				`${emoji} ${client.translate("fun/lovecalc:CONTENT", { percent: percentage.toString(), firstUsername: user1.username, secondUsername: user2.username }, locale)}\n\n` +
				`\`${bar}\` **${percentage}%**`,
			);

		await interaction.reply({ embeds: [embed] });
	}
}

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class EightBall extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("8ball")
		.setDescription("Ask the magic 8-ball a question")
		.addStringOption(option =>
			option.setName("question")
				.setDescription("Your question")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "8ball",

			enabled: true,
			guildOnly: false,
			cooldown: 3000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const question = interaction.options.getString("question", true);

		const answerIndex = Math.floor(Math.random() * 10) + 1;
		const answer = client.translate(`fun/8ball:RESPONSE_${answerIndex}`, undefined, locale);

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: "🎱 Magic 8-Ball" })
			.addFields(
				{ name: "Question", value: question },
				{ name: "Answer", value: `🎱 ${answer}` },
			);

		await interaction.reply({ embeds: [embed] });
	}
}

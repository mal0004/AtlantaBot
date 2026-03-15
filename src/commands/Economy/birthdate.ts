import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Birthdate extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "birthdate",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("birthdate")
		.setDescription("Set your birthdate")
		.addStringOption((o) =>
			o
				.setName("date")
				.setDescription("Your birthdate (MM/DD/YYYY)")
				.setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const input = interaction.options.getString("date", true);
		const parsed = Date.parse(input);

		if (isNaN(parsed)) {
			return void (await interaction.reply({
				content: t("economy/birthdate:INVALID_DATE"),
				ephemeral: true,
			}));
		}

		const date = new Date(parsed);
		const now = new Date();

		if (date.getTime() > now.getTime()) {
			return void (await interaction.reply({
				content: t("economy/birthdate:DATE_TOO_LOW"),
				ephemeral: true,
			}));
		}

		const age = now.getFullYear() - date.getFullYear();
		if (age > 80) {
			return void (await interaction.reply({
				content: t("economy/birthdate:DATE_TOO_HIGH"),
				ephemeral: true,
			}));
		}
		if (age < 5) {
			return void (await interaction.reply({
				content: t("economy/birthdate:DATE_TOO_LOW"),
				ephemeral: true,
			}));
		}

		data.userData.birthdate = date.getTime();
		await data.userData.save();

		const formatted = client.printDate(date.getTime(), undefined, data.guild.language);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: "Birthdate",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(t("economy/birthdate:SUCCESS", { date: formatted }))
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}

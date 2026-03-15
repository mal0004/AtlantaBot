import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Setlang extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("setlang")
		.setDescription("Change the guild language")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((o) =>
			o
				.setName("language")
				.setDescription("The language to use")
				.setRequired(true)
				.addChoices(
					{ name: "English", value: "en-US" },
					{ name: "Français", value: "fr-FR" },
				),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "setlang",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const language = interaction.options.getString("language", true);

		const lang = client.languages.find(
			(l) => l.name === language || l.aliases.includes(language),
		);
		if (!lang) {
			const available = client.languages.map((l) => l.nativeName).join(", ");
			return void interaction.reply({
				content: client.translate(
					"administration/setlang:INVALID",
					{ list: available },
					data.guild.language,
				),
				ephemeral: true,
			});
		}

		data.guild.language = lang.name;
		await data.guild.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(
				client.translate("administration/setlang:SUCCESS", { lang: lang.nativeName }, lang.name),
			);

		interaction.reply({ embeds: [embed] });
	}
}

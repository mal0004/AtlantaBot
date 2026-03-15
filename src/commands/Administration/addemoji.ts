import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Addemoji extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("addemoji")
		.setDescription("Add a custom emoji to the server")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
		.addStringOption((o) =>
			o.setName("name").setDescription("Emoji name").setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("url").setDescription("Image URL for the emoji").setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "addemoji",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuildExpressions],
			botPermissions: [PermissionFlagsBits.ManageGuildExpressions],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const name = interaction.options.getString("name", true);
		const url = interaction.options.getString("url", true);
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		try {
			const emoji = await interaction.guild!.emojis.create({ attachment: url, name });

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription(t("administration/addemoji:SUCCESS", { emoji: emoji.toString() }));

			interaction.reply({ embeds: [embed] });
		} catch {
			interaction.reply({
				content: t("administration/addemoji:ERROR"),
				ephemeral: true,
			});
		}
	}
}

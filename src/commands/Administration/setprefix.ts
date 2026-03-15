import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Setprefix extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("setprefix")
		.setDescription("Store a legacy prefix in the guild database")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((o) =>
			o.setName("prefix").setDescription("The new prefix").setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "setprefix",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const prefix = interaction.options.getString("prefix", true);

		if (prefix.length > 5) {
			return void interaction.reply({
				content: client.translate("administration/setprefix:TOO_LONG", undefined, data.guild.language),
				ephemeral: true,
			});
		}

		(data.guild as any).prefix = prefix;
		await data.guild.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(
				client.translate("administration/setprefix:SUCCESS", { prefix }, data.guild.language),
			);

		interaction.reply({ embeds: [embed] });
	}
}

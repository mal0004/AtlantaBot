import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Deletemod extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("deletemod")
		.setDescription("Toggle auto-deletion of moderation commands")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

	constructor(client: Atlanta) {
		super(client, {
			name: "deletemod",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		data.guild.autoDeleteModCommands = !data.guild.autoDeleteModCommands;
		await data.guild.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(
				t(
					data.guild.autoDeleteModCommands
						? "administration/deletemod:ENABLED"
						: "administration/deletemod:DISABLED",
				),
			);

		interaction.reply({ embeds: [embed] });
	}
}

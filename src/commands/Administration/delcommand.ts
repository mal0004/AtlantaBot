import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Delcommand extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("delcommand")
		.setDescription("Remove a custom command")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((o) =>
			o.setName("name").setDescription("Command name to remove").setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "delcommand",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const name = interaction.options.getString("name", true).toLowerCase();
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const idx = data.guild.customCommands.findIndex((c) => c.name === name);
		if (idx === -1) {
			return void interaction.reply({
				content: t("administration/delcommand:NOT_FOUND", { name }),
				ephemeral: true,
			});
		}

		data.guild.customCommands.splice(idx, 1);
		data.guild.markModified("customCommands");
		await data.guild.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(t("administration/delcommand:SUCCESS", { name }));

		interaction.reply({ embeds: [embed] });
	}
}

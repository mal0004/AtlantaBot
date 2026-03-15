import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Autorole extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("autorole")
		.setDescription("Configure the autorole system")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub.setName("enable").setDescription("Enable autorole")
				.addRoleOption((o) =>
					o.setName("role").setDescription("Role to assign on join").setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("disable").setDescription("Disable autorole"),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "autorole",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
			botPermissions: [PermissionFlagsBits.ManageRoles],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const sub = interaction.options.getSubcommand();
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		if (sub === "enable") {
			const role = interaction.options.getRole("role", true);

			data.guild.plugins.autorole = { enabled: true, role: role.id };
			data.guild.markModified("plugins");
			await data.guild.save();

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription(t("administration/autorole:SUCCESS_ENABLED", { roleName: role.name }));

			return void interaction.reply({ embeds: [embed] });
		}

		if (sub === "disable") {
			data.guild.plugins.autorole = { enabled: false, role: null };
			data.guild.markModified("plugins");
			await data.guild.save();

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription(t("administration/autorole:SUCCESS_DISABLED"));

			return void interaction.reply({ embeds: [embed] });
		}
	}
}

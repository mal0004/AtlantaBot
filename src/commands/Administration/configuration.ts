import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Configuration extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("configuration")
		.setDescription("Show the current server configuration")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

	constructor(client: Atlanta) {
		super(client, {
			name: "configuration",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const guild = interaction.guild!;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);
		const p = data.guild.plugins;

		const on = client.customEmojis.success;
		const off = client.customEmojis.error;

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
			.setFooter({ text: client.config.embed.footer })
			.addFields(
				{
					name: t("administration/configuration:WELCOME_TITLE"),
					value: p.welcome.enabled
						? `${on} ${p.welcome.channel ? `<#${p.welcome.channel}>` : "—"}`
						: `${off}`,
					inline: true,
				},
				{
					name: t("administration/configuration:GOODBYE_TITLE"),
					value: p.goodbye.enabled
						? `${on} ${p.goodbye.channel ? `<#${p.goodbye.channel}>` : "—"}`
						: `${off}`,
					inline: true,
				},
				{
					name: t("administration/configuration:AUTOROLE_TITLE"),
					value: p.autorole.enabled
						? `${on} <@&${p.autorole.role}>`
						: `${off}`,
					inline: true,
				},
				{
					name: t("administration/configuration:AUTOMOD_TITLE"),
					value: p.automod.enabled ? `${on}` : `${off}`,
					inline: true,
				},
				{
					name: t("administration/configuration:MODLOGS"),
					value: p.modlogs ? `${on} <#${p.modlogs}>` : `${off}`,
					inline: true,
				},
				{
					name: t("administration/configuration:REPORTS"),
					value: p.reports ? `${on} <#${p.reports}>` : `${off}`,
					inline: true,
				},
				{
					name: t("administration/configuration:SUGGESTIONS"),
					value: p.suggestions ? `${on} <#${p.suggestions}>` : `${off}`,
					inline: true,
				},
				{
					name: t("administration/configuration:AUTODELETEMOD"),
					value: data.guild.autoDeleteModCommands ? `${on}` : `${off}`,
					inline: true,
				},
				{
					name: "Language",
					value: data.guild.language,
					inline: true,
				},
				{
					name: t("administration/configuration:IGNORED_CHANNELS_TITLE"),
					value: data.guild.ignoredChannels.length
						? data.guild.ignoredChannels.map((c) => `<#${c}>`).join(", ")
						: "None",
					inline: false,
				},
			);

		interaction.reply({ embeds: [embed] });
	}
}

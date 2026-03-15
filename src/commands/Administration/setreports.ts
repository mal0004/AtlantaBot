import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Setreports extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("setreports")
		.setDescription("Set the reports channel")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addChannelOption((o) =>
			o.setName("channel").setDescription("Channel for reports (omit to disable)")
				.addChannelTypes(ChannelType.GuildText),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "setreports",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const channel = interaction.options.getChannel("channel");
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		if (channel) {
			data.guild.plugins.reports = channel.id;
		} else {
			data.guild.plugins.reports = false;
		}
		data.guild.markModified("plugins");
		await data.guild.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(
				channel
					? t("administration/setreports:SUCCESS_ENABLED", { channel: `<#${channel.id}>` })
					: t("administration/setreports:SUCCESS_DISABLED"),
			);

		interaction.reply({ embeds: [embed] });
	}
}

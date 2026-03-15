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

export default class Setsuggests extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("setsuggests")
		.setDescription("Set the suggestions channel")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addChannelOption((o) =>
			o.setName("channel").setDescription("Channel for suggestions (omit to disable)")
				.addChannelTypes(ChannelType.GuildText),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "setsuggests",

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
			data.guild.plugins.suggestions = channel.id;
		} else {
			data.guild.plugins.suggestions = false;
		}
		data.guild.markModified("plugins");
		await data.guild.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(
				channel
					? t("administration/setsuggests:SUCCESS_ENABLED", { channel: `<#${channel.id}>` })
					: t("administration/setsuggests:SUCCESS_DISABLED"),
			);

		interaction.reply({ embeds: [embed] });
	}
}

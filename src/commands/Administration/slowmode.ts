import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Slowmode extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("slowmode")
		.setDescription("Set a channel's slowmode interval")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption((o) =>
			o.setName("channel").setDescription("Target channel").setRequired(true)
				.addChannelTypes(ChannelType.GuildText),
		)
		.addIntegerOption((o) =>
			o.setName("time").setDescription("Slowmode in seconds (0 to disable)").setRequired(true)
				.setMinValue(0).setMaxValue(21600),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "slowmode",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageChannels],
			botPermissions: [PermissionFlagsBits.ManageChannels],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const channel = interaction.options.getChannel("channel", true) as TextChannel;
		const time = interaction.options.getInteger("time", true);
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		await channel.setRateLimitPerUser(time);

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(
				time === 0
					? t("administration/slowmode:DISABLED", { channel: `<#${channel.id}>` })
					: t("administration/slowmode:ENABLED", { channel: `<#${channel.id}>`, time: String(time) }),
			);

		interaction.reply({ embeds: [embed] });
	}
}

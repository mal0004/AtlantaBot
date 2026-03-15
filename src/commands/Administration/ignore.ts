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

export default class Ignore extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("ignore")
		.setDescription("Toggle a channel as ignored (bot will not respond there)")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addChannelOption((o) =>
			o.setName("channel").setDescription("Channel to toggle (defaults to current)")
				.addChannelTypes(ChannelType.GuildText),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "ignore",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const channel = interaction.options.getChannel("channel") ?? interaction.channel!;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const idx = data.guild.ignoredChannels.indexOf(channel.id);
		if (idx === -1) {
			data.guild.ignoredChannels.push(channel.id);
		} else {
			data.guild.ignoredChannels.splice(idx, 1);
		}
		data.guild.markModified("ignoredChannels");
		await data.guild.save();

		const isNowIgnored = idx === -1;
		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(
				t(
					isNowIgnored
						? "administration/ignore:IGNORED"
						: "administration/ignore:ALLOWED",
					{ channel: `<#${channel.id}>` },
				),
			);

		interaction.reply({ embeds: [embed] });
	}
}

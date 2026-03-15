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

export default class Announcement extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("announcement")
		.setDescription("Send an announcement embed to a channel")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addChannelOption((o) =>
			o.setName("channel").setDescription("Channel to send the announcement").setRequired(true)
				.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
		)
		.addStringOption((o) =>
			o.setName("message").setDescription("Announcement content").setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("title").setDescription("Announcement title"),
		)
		.addStringOption((o) =>
			o.setName("color").setDescription("Embed color hex (e.g. #ff0000)"),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "announcement",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageMessages],
			botPermissions: [PermissionFlagsBits.SendMessages],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const channel = interaction.options.getChannel("channel", true) as TextChannel;
		const message = interaction.options.getString("message", true);
		const title = interaction.options.getString("title");
		const color = interaction.options.getString("color");
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const embed = new EmbedBuilder()
			.setColor((color as `#${string}` | null) ?? client.config.embed.color)
			.setDescription(message)
			.setFooter({ text: interaction.guild!.name, iconURL: interaction.guild!.iconURL() ?? undefined })
			.setTimestamp();

		if (title) embed.setTitle(title);

		await channel.send({ embeds: [embed] });

		const confirmEmbed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setDescription(`${t("moderation/announcement:TITLE")} sent to <#${channel.id}>!`);

		interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
	}
}

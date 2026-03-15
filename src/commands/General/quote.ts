import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Quote extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("quote")
		.setDescription("Quote a message by its ID")
		.addStringOption(option =>
			option.setName("message_id")
				.setDescription("The ID of the message to quote")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "quote",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const messageId = interaction.options.getString("message_id", true);
		const guild = interaction.guild!;

		await interaction.deferReply();

		let quotedMessage = null;
		for (const [, channel] of guild.channels.cache) {
			if (!channel.isTextBased()) continue;
			try {
				quotedMessage = await (channel as TextChannel).messages.fetch(messageId);
				if (quotedMessage) break;
			} catch {
				continue;
			}
		}

		if (!quotedMessage) {
			await interaction.editReply({
				content: `${client.customEmojis.error} ${client.translate("general/quote:NO_MESSAGE_ID", undefined, locale)}`,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: quotedMessage.author.tag, iconURL: quotedMessage.author.displayAvatarURL() })
			.setDescription(quotedMessage.content || "No content")
			.addFields(
				{ name: "Channel", value: `<#${quotedMessage.channel.id}>`, inline: true },
				{ name: "Date", value: client.printDate(quotedMessage.createdAt, undefined, locale), inline: true },
				{ name: "Link", value: `[Jump to message](${quotedMessage.url})` },
			);

		if (quotedMessage.attachments.size > 0) {
			const first = quotedMessage.attachments.first()!;
			embed.setImage(first.url);
		}

		await interaction.editReply({ embeds: [embed] });
	}
}

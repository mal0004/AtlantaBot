import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Suggest extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("suggest")
		.setDescription("Send a suggestion to the configured channel")
		.addStringOption(option =>
			option.setName("message")
				.setDescription("Your suggestion")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "suggest",

			enabled: true,
			guildOnly: true,
			cooldown: 10000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const suggestion = interaction.options.getString("message", true);

		const suggestChannel = data.guild.plugins.suggestions;
		if (!suggestChannel) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("general/suggest:MISSING_CHANNEL", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		const channel = interaction.guild!.channels.cache.get(suggestChannel as string) as TextChannel | undefined;
		if (!channel) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("general/suggest:MISSING_CHANNEL", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: client.translate("general/suggest:TITLE", { user: interaction.user.tag }, locale), iconURL: interaction.user.displayAvatarURL() })
			.setDescription(suggestion)
			.setTimestamp();

		const sent = await channel.send({ embeds: [embed] });
		await sent.react("👍");
		await sent.react("👎");

		await interaction.reply({
			content: `${client.customEmojis.success} ${client.translate("general/suggest:SUCCESS", { channel: channel.toString() }, locale)}`,
			ephemeral: true,
		});
	}
}

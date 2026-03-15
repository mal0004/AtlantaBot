import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Report extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("report")
		.setDescription("Report a user to the server staff")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("The user to report")
				.setRequired(true),
		)
		.addStringOption(option =>
			option.setName("reason")
				.setDescription("Reason for the report")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "report",

			enabled: true,
			guildOnly: true,
			cooldown: 10000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const user = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason", true);

		const reportsChannel = data.guild.plugins.reports;
		if (!reportsChannel) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("general/report:MISSING_CHANNEL", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		const channel = interaction.guild!.channels.cache.get(reportsChannel as string) as TextChannel | undefined;
		if (!channel) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("general/report:MISSING_CHANNEL", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		if (user.id === interaction.user.id) {
			await interaction.reply({
				content: `${client.customEmojis.error} ${client.translate("general/report:INVALID_USER", undefined, locale)}`,
				ephemeral: true,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: client.translate("general/report:TITLE", { user: user.tag }, locale), iconURL: user.displayAvatarURL() })
			.addFields(
				{ name: "Reporter", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
				{ name: client.translate("common:USER", undefined, locale), value: `${user} (${user.tag})`, inline: true },
				{ name: client.translate("common:REASON", undefined, locale), value: reason },
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });

		await interaction.reply({
			content: `${client.customEmojis.success} ${client.translate("general/report:SUCCESS", { user: user.tag, channel: channel.toString() }, locale)}`,
			ephemeral: true,
		});
	}
}

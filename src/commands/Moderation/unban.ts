import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Unban extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("unban")
		.setDescription("Unban a user by their ID")
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addStringOption((o) =>
			o.setName("user-id").setDescription("User ID to unban").setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "unban",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.BanMembers],
			botPermissions: [PermissionFlagsBits.BanMembers],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const userId = interaction.options.getString("user-id", true);
		const guild = interaction.guild!;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const bans = await guild.bans.fetch();
		const banned = bans.get(userId);
		if (!banned) {
			return void interaction.reply({ content: t("moderation/unban:NOT_BANNED"), ephemeral: true });
		}

		await guild.members.unban(userId, `Unbanned by ${interaction.user.tag}`);

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(t("moderation/unban:UNBANNED", { username: banned.user.toString(), server: guild.name }));

		interaction.reply({ embeds: [embed] });

		if (data.guild.plugins.modlogs) {
			const logChannel = guild.channels.cache.get(data.guild.plugins.modlogs as string);
			if (logChannel?.isTextBased()) {
				const logEmbed = new EmbedBuilder()
					.setColor("#33cc33")
					.setAuthor({ name: `Unban | ${banned.user.tag}` })
					.addFields(
						{ name: t("common:USER"), value: `${banned.user.toString()} (${userId})`, inline: true },
						{ name: t("common:MODERATOR"), value: interaction.user.toString(), inline: true },
					)
					.setTimestamp();
				logChannel.send({ embeds: [logEmbed] });
			}
		}
	}
}

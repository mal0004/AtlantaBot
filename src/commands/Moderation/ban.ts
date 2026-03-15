import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Ban extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("ban")
		.setDescription("Ban a user from the server")
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption((o) =>
			o.setName("user").setDescription("User to ban").setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("reason").setDescription("Reason for the ban"),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "ban",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.BanMembers],
			botPermissions: [PermissionFlagsBits.BanMembers],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const user = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason") ?? "No reason provided";
		const guild = interaction.guild!;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const member = await guild.members.fetch(user.id).catch(() => null);

		if (member) {
			if (!member.bannable) {
				return void interaction.reply({ content: t("moderation/ban:MISSING_PERM"), ephemeral: true });
			}
			if (member.roles.highest.position >= interaction.guild!.members.me!.roles.highest.position) {
				return void interaction.reply({ content: t("moderation/ban:SUPERIOR"), ephemeral: true });
			}
		}

		try {
			await user.send(t("moderation/ban:BANNED_DM", { server: guild.name, moderator: interaction.user.tag, reason })).catch(() => {});
		} catch {
			// DMs closed
		}

		await guild.members.ban(user, { reason: `${interaction.user.tag}: ${reason}` });

		data.guild.casesCount++;
		await data.guild.save();

		const memberData = await client.findOrCreateMember({ id: user.id, guildID: guild.id });
		memberData.sanctions.push({
			type: "ban",
			case: data.guild.casesCount,
			date: Date.now(),
			moderator: interaction.user.id,
			reason,
		});
		await memberData.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(t("moderation/ban:BANNED", { username: user.toString(), server: guild.name, moderator: interaction.user.tag, reason }))
			.addFields({ name: "Case", value: `#${data.guild.casesCount}`, inline: true });

		interaction.reply({ embeds: [embed] });

		if (data.guild.plugins.modlogs) {
			const logChannel = guild.channels.cache.get(data.guild.plugins.modlogs as string);
			if (logChannel?.isTextBased()) {
				const logEmbed = new EmbedBuilder()
					.setColor("#ff0000")
					.setAuthor({ name: t("moderation/ban:CASE", { count: data.guild.casesCount }) })
					.addFields(
						{ name: t("common:USER"), value: `${user.toString()} (${user.id})`, inline: true },
						{ name: t("common:MODERATOR"), value: interaction.user.toString(), inline: true },
						{ name: t("common:REASON"), value: reason },
					)
					.setTimestamp();
				logChannel.send({ embeds: [logEmbed] });
			}
		}
	}
}

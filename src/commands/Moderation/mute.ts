import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import ms from "ms";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Mute extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("mute")
		.setDescription("Timeout a member")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) =>
			o.setName("user").setDescription("Member to mute").setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("time").setDescription("Duration (e.g. 10m, 1h, 1d)").setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("reason").setDescription("Reason for the mute"),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "mute",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ModerateMembers],
			botPermissions: [PermissionFlagsBits.ModerateMembers],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const user = interaction.options.getUser("user", true);
		const timeStr = interaction.options.getString("time", true);
		const reason = interaction.options.getString("reason") ?? "No reason provided";
		const guild = interaction.guild!;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const duration = (ms as unknown as (s: string) => number | undefined)(timeStr);
		if (!duration || duration < 1000 || duration > 28 * 24 * 60 * 60 * 1000) {
			return void interaction.reply({ content: "Please specify a valid duration (e.g. 10m, 1h, 1d)!", ephemeral: true });
		}

		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) {
			return void interaction.reply({ content: t("moderation/mute:MISSING_MEMBER"), ephemeral: true });
		}
		if (!member.moderatable) {
			return void interaction.reply({ content: "I can't mute this member! Check my permissions and role hierarchy.", ephemeral: true });
		}

		await member.timeout(duration, `${interaction.user.tag}: ${reason}`);

		data.guild.casesCount++;
		await data.guild.save();

		const memberData = await client.findOrCreateMember({ id: user.id, guildID: guild.id });
		memberData.mute = {
			muted: true,
			case: data.guild.casesCount,
			endDate: Date.now() + duration,
		};
		memberData.sanctions.push({
			type: "mute",
			case: data.guild.casesCount,
			date: Date.now(),
			moderator: interaction.user.id,
			reason,
		});
		await memberData.save();

		client.databaseCache.mutedUsers.set(`${member.id}${guild.id}`, memberData);

		await user.send(t("moderation/mute:MUTED_DM", { server: guild.name, moderator: interaction.user.tag, reason, time: timeStr })).catch(() => {});

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(t("moderation/mute:MUTED", { username: user.toString(), time: timeStr, reason }))
			.addFields({ name: "Case", value: `#${data.guild.casesCount}`, inline: true });

		interaction.reply({ embeds: [embed] });

		if (data.guild.plugins.modlogs) {
			const logChannel = guild.channels.cache.get(data.guild.plugins.modlogs as string);
			if (logChannel?.isTextBased() && "send" in logChannel) {
				const logEmbed = new EmbedBuilder()
					.setColor("#ffcc00")
					.setAuthor({ name: t("moderation/mute:CASE", { count: data.guild.casesCount }) })
					.addFields(
						{ name: t("common:USER"), value: `${user.toString()} (${user.id})`, inline: true },
						{ name: t("common:MODERATOR"), value: interaction.user.toString(), inline: true },
						{ name: t("common:REASON"), value: reason },
						{ name: t("common:DURATION"), value: timeStr, inline: true },
					)
					.setTimestamp();
				logChannel.send({ embeds: [logEmbed] });
			}
		}
	}
}

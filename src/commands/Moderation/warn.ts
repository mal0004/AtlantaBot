import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Warn extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("warn")
		.setDescription("Warn a member")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addUserOption((o) =>
			o.setName("user").setDescription("Member to warn").setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("reason").setDescription("Reason for the warning"),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "warn",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageMessages],
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
		if (!member) {
			return void interaction.reply({ content: t("moderation/warn:MISSING_MEMBER"), ephemeral: true });
		}
		if (user.id === interaction.user.id) {
			return void interaction.reply({ content: "You can't warn yourself!", ephemeral: true });
		}

		data.guild.casesCount++;
		await data.guild.save();

		const memberData = await client.findOrCreateMember({ id: user.id, guildID: guild.id });
		memberData.sanctions.push({
			type: "warn",
			case: data.guild.casesCount,
			date: Date.now(),
			moderator: interaction.user.id,
			reason,
		});
		await memberData.save();

		await user.send(t("moderation/warn:WARNED_DM", { server: guild.name, moderator: interaction.user.tag, reason })).catch(() => {});

		const warnCount = memberData.sanctions.filter((s) => s.type === "warn").length;

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(t("moderation/warn:WARNED", { username: user.toString(), reason }))
			.addFields(
				{ name: "Case", value: `#${data.guild.casesCount}`, inline: true },
				{ name: "Total Warns", value: String(warnCount), inline: true },
			);

		await interaction.reply({ embeds: [embed] });

		const sanctions = data.guild.plugins.warnsSanctions;
		if (sanctions.kick && warnCount >= sanctions.kick) {
			if (member.kickable) {
				await member.kick(t("moderation/setwarns:AUTO_KICK", { username: user.tag, count: sanctions.kick }));
			}
		}
		if (sanctions.ban && warnCount >= sanctions.ban) {
			if (member.bannable) {
				await member.ban({ reason: t("moderation/setwarns:AUTO_BAN", { username: user.tag, count: sanctions.ban }) });
			}
		}

		if (data.guild.plugins.modlogs) {
			const logChannel = guild.channels.cache.get(data.guild.plugins.modlogs as string);
			if (logChannel?.isTextBased()) {
				const logEmbed = new EmbedBuilder()
					.setColor("#ffcc00")
					.setAuthor({ name: t("moderation/warn:CASE", { caseNumber: data.guild.casesCount }) })
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

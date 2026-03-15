import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Kick extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kick a member from the server")
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addUserOption((o) =>
			o.setName("user").setDescription("Member to kick").setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("reason").setDescription("Reason for the kick"),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "kick",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.KickMembers],
			botPermissions: [PermissionFlagsBits.KickMembers],
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
			return void interaction.reply({ content: t("moderation/kick:MISSING_MEMBER"), ephemeral: true });
		}
		if (!member.kickable) {
			return void interaction.reply({ content: t("moderation/kick:MISSING_PERM"), ephemeral: true });
		}
		if (member.roles.highest.position >= guild.members.me!.roles.highest.position) {
			return void interaction.reply({ content: t("moderation/kick:MISSING_PERM"), ephemeral: true });
		}

		await user.send(t("moderation/kick:KICKED_DM", { server: guild.name, moderator: interaction.user.tag, reason })).catch(() => {});

		await member.kick(`${interaction.user.tag}: ${reason}`);

		data.guild.casesCount++;
		await data.guild.save();

		const memberData = await client.findOrCreateMember({ id: user.id, guildID: guild.id });
		memberData.sanctions.push({
			type: "kick",
			case: data.guild.casesCount,
			date: Date.now(),
			moderator: interaction.user.id,
			reason,
		});
		await memberData.save();

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(t("moderation/kick:KICKED", { username: user.toString(), server: guild.name, moderator: interaction.user.tag, reason }))
			.addFields({ name: "Case", value: `#${data.guild.casesCount}`, inline: true });

		interaction.reply({ embeds: [embed] });

		if (data.guild.plugins.modlogs) {
			const logChannel = guild.channels.cache.get(data.guild.plugins.modlogs as string);
			if (logChannel?.isTextBased()) {
				const logEmbed = new EmbedBuilder()
					.setColor("#ff9900")
					.setAuthor({ name: t("moderation/kick:CASE", { count: data.guild.casesCount }) })
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

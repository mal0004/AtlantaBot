import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Unmute extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("unmute")
		.setDescription("Remove a member's timeout")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) =>
			o.setName("user").setDescription("Member to unmute").setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "unmute",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ModerateMembers],
			botPermissions: [PermissionFlagsBits.ModerateMembers],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const user = interaction.options.getUser("user", true);
		const guild = interaction.guild!;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) {
			return void interaction.reply({ content: t("moderation/unmute:MISSING_MEMBER"), ephemeral: true });
		}

		if (!member.isCommunicationDisabled()) {
			return void interaction.reply({ content: t("moderation/unmute:NOT_MUTED"), ephemeral: true });
		}

		await member.timeout(null, `Unmuted by ${interaction.user.tag}`);

		const memberData = await client.findOrCreateMember({ id: user.id, guildID: guild.id });
		memberData.mute = { muted: false, case: null, endDate: null };
		await memberData.save();

		client.databaseCache.mutedUsers.delete(`${member.id}${guild.id}`);

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(t("moderation/unmute:SUCCESS", { username: user.toString() }));

		interaction.reply({ embeds: [embed] });

		if (data.guild.plugins.modlogs) {
			const logChannel = guild.channels.cache.get(data.guild.plugins.modlogs as string);
			if (logChannel?.isTextBased()) {
				const logEmbed = new EmbedBuilder()
					.setColor("#33cc33")
					.setAuthor({ name: `Unmute | ${user.tag}` })
					.addFields(
						{ name: t("common:USER"), value: `${user.toString()} (${user.id})`, inline: true },
						{ name: t("common:MODERATOR"), value: interaction.user.toString(), inline: true },
					)
					.setTimestamp();
				logChannel.send({ embeds: [logEmbed] });
			}
		}
	}
}

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Profile extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "profile",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("profile")
		.setDescription("Show a user's profile")
		.addUserOption((o) =>
			o.setName("user").setDescription("The user to view"),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const target = interaction.options.getUser("user") || interaction.user;
		const isOther = target.id !== interaction.user.id;

		await interaction.deferReply();

		const memberData = isOther
			? await client.findOrCreateMember({ id: target.id, guildID: interaction.guildId! })
			: data.memberData;
		const userData = isOther
			? await client.findOrCreateUser({ id: target.id })
			: data.userData;

		const guildMember = await interaction.guild!.members.fetch(target.id).catch(() => null);

		const loverStr = userData.lover
			? `💍 <@${userData.lover}>`
			: t("economy/profile:NO_LOVER");

		const birthdateStr = userData.birthdate
			? client.printDate(userData.birthdate, undefined, data.guild.language)
			: t("economy/profile:NO_BIRTHDATE");

		const registeredAt = client.printDate(
			userData.registeredAt,
			undefined,
			data.guild.language,
		);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: t("economy/profile:TITLE", { username: target.username }),
				iconURL: target.displayAvatarURL(),
			})
			.setThumbnail(target.displayAvatarURL({ size: 256 }))
			.setDescription(userData.bio || t("economy/profile:NO_BIO") || "No bio set.")
			.addFields(
				{
					name: t("economy/profile:GLOBAL"),
					value: [
						`${t("economy/profile:CASH")}: **${memberData.money}** ${t("common:CREDITS")}`,
						`${t("economy/profile:BANK")}: **${memberData.bankSold}** ${t("common:CREDITS")}`,
						`💼 Work Streak: **${memberData.workStreak}** days`,
					].join("\n"),
					inline: false,
				},
				{
					name: t("economy/profile:LEVEL"),
					value: [
						`⭐ Level: **${memberData.level}** (${memberData.exp} XP)`,
						`${t("economy/profile:REPUTATION")}: ${t("economy/profile:REP_POINTS", { points: userData.rep })}`,
					].join("\n"),
					inline: true,
				},
				{
					name: t("economy/profile:REGISTERED"),
					value: [
						`${loverStr}`,
						`${t("economy/profile:BIRTHDATE")}: ${birthdateStr}`,
						`${t("economy/profile:REGISTERED")}: ${registeredAt}`,
					].join("\n"),
					inline: true,
				},
			)
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		if (guildMember) {
			embed.addFields({
				name: t("common:ROLES"),
				value:
					guildMember.roles.cache
						.filter((r) => r.id !== interaction.guildId)
						.map((r) => r.toString())
						.join(", ") || "None",
				inline: false,
			});
		}

		await interaction.editReply({ embeds: [embed] });
	}
}

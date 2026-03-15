import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Sanctions extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("sanctions")
		.setDescription("View a member's sanctions")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addUserOption((o) =>
			o.setName("user").setDescription("Member to look up").setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "sanctions",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageMessages],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const user = interaction.options.getUser("user", true);
		const guild = interaction.guild!;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const memberData = await client.findOrCreateMember({ id: user.id, guildID: guild.id });

		if (!memberData.sanctions.length) {
			return void interaction.reply({
				content: t("moderation/sanctions:NO_SANCTION", { username: user.toString() }),
				ephemeral: true,
			});
		}

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setAuthor({ name: `${user.tag} — Sanctions`, iconURL: user.displayAvatarURL() })
			.setFooter({ text: client.config.embed.footer });

		for (const s of memberData.sanctions.slice(-25)) {
			embed.addFields({
				name: `Case #${s.case} — ${s.type.toUpperCase()}`,
				value: `**${t("common:REASON")}:** ${s.reason}\n**${t("common:MODERATOR")}:** <@${s.moderator}>\n**${t("common:DATE")}:** ${client.printDate(s.date, undefined, data.guild.language)}`,
			});
		}

		interaction.reply({ embeds: [embed] });
	}
}

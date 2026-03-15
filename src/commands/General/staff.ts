import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Staff extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("staff")
		.setDescription("Lists server staff members");

	constructor(client: Atlanta) {
		super(client, {
			name: "staff",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const guild = interaction.guild!;

		await guild.members.fetch();

		const admins = guild.members.cache
			.filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot)
			.map(m => m.toString());
		const moderators = guild.members.cache
			.filter(m =>
				!m.permissions.has(PermissionFlagsBits.Administrator) &&
				m.permissions.has(PermissionFlagsBits.ManageMessages) &&
				!m.user.bot,
			)
			.map(m => m.toString());

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: client.translate("general/staff:TITLE", { guild: guild.name }, locale) });

		if (admins.length > 0) {
			embed.addFields({
				name: client.translate("general/staff:ADMINS", { count: admins.length.toString() }, locale),
				value: admins.join("\n"),
			});
		}

		if (moderators.length > 0) {
			embed.addFields({
				name: client.translate("general/staff:MODS", { count: moderators.length.toString() }, locale),
				value: moderators.join("\n"),
			});
		}

		if (admins.length === 0 && moderators.length === 0) {
			embed.addFields(
				{ name: client.translate("general/staff:ADMINS", undefined, locale), value: client.translate("general/staff:NO_ADMINS", undefined, locale) },
				{ name: client.translate("general/staff:MODS", undefined, locale), value: client.translate("general/staff:NO_MODS", undefined, locale) },
			);
		}

		await interaction.reply({ embeds: [embed] });
	}
}

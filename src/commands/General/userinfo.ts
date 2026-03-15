import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Userinfo extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("userinfo")
		.setDescription("Shows information about a user")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("The user to get info about")
				.setRequired(false),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "userinfo",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const user = interaction.options.getUser("user") ?? interaction.user;
		const member = interaction.guild!.members.cache.get(user.id) as GuildMember | undefined;

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: `${user.tag} (${user.id})`, iconURL: user.displayAvatarURL() })
			.setThumbnail(user.displayAvatarURL({ size: 512 }))
			.addFields(
				{
					name: "Username",
					value: user.username,
					inline: true,
				},
				{
					name: "ID",
					value: user.id,
					inline: true,
				},
				{
					name: "Bot",
					value: user.bot ? "Yes" : "No",
					inline: true,
				},
				{
					name: "Created",
					value: client.printDate(user.createdAt, undefined, locale),
					inline: true,
				},
			);

		if (member) {
			embed.addFields(
				{
					name: "Joined",
					value: member.joinedAt ? client.printDate(member.joinedAt, undefined, locale) : "N/A",
					inline: true,
				},
				{
					name: member.nickname ?? client.translate("general/userinfo:NO_NICKNAME", undefined, locale),
					value: member.nickname ?? client.translate("general/userinfo:NO_NICKNAME", undefined, locale),
					inline: true,
				},
				{
					name: "Roles",
					value: member.roles.cache
						.filter(r => r.id !== interaction.guild!.id)
						.map(r => r.toString())
						.join(", ") || client.translate("general/userinfo:NO_ROLE", undefined, locale),
				},
			);
		}

		await interaction.reply({ embeds: [embed] });
	}
}

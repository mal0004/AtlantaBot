import { ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Permissions extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("permissions")
		.setDescription("Shows a user's permissions")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("The user to check permissions for")
				.setRequired(false),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "permissions",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const user = interaction.options.getUser("user") ?? interaction.user;
		const member = await interaction.guild!.members.fetch(user.id).catch(() => null);

		if (!member) {
			await interaction.reply({
				content: `${client.customEmojis.error} Member not found!`,
				ephemeral: true,
			});
			return;
		}

		const permissions = member.permissions.toArray();

		const readable = new PermissionsBitField(permissions)
			.toArray()
			.map(p => `\`${p}\``)
			.join(", ");

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: client.translate("general/permissions:TITLE", { user: member.user.tag, channel: interaction.channel?.toString() ?? "" }, locale) })
			.setDescription(readable || "None");

		await interaction.reply({ embeds: [embed] });
	}
}

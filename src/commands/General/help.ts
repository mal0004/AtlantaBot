import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Help extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("help")
		.setDescription("Shows help for a command or lists all commands")
		.addStringOption(option =>
			option.setName("command")
				.setDescription("The command to get help for")
				.setRequired(false),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "help",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const commandName = interaction.options.getString("command");

		if (commandName) {
			const cmd = client.commands.get(commandName.toLowerCase());
			if (!cmd) {
				await interaction.reply({
					content: `${client.customEmojis.error} ${client.translate("general/help:NOT_FOUND", { search: commandName }, locale)}`,
					ephemeral: true,
				});
				return;
			}

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer })
				.setAuthor({ name: client.translate("general/help:CMD_TITLE", { prefix: "/", cmd: cmd.help.name }, locale) })
				.addFields(
					{ name: client.translate("general/help:FIELD_DESCRIPTION", undefined, locale), value: cmd.help.category, inline: true },
				);

			if (cmd.conf.memberPermissions.length > 0) {
				embed.addFields({
					name: client.translate("general/help:FIELD_PERMISSIONS", undefined, locale),
					value: cmd.conf.memberPermissions.map(p => `\`${String(p)}\``).join(", "),
				});
			} else {
				embed.addFields({
					name: client.translate("general/help:FIELD_PERMISSIONS", undefined, locale),
					value: client.translate("general/help:NO_REQUIRED_PERMISSION", undefined, locale),
				});
			}

			await interaction.reply({ embeds: [embed] });
			return;
		}

		const categories = [...new Set(client.commands.map(c => c.help.category))];
		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: client.translate("general/help:TITLE", { name: client.user!.username }, locale) })
			.setDescription(client.translate("general/help:INFO", { prefix: "/" }, locale));

		for (const category of categories.sort()) {
			const cmds = client.commands.filter(c => c.help.category === category);
			if (cmds.size === 0) continue;
			embed.addFields({
				name: category,
				value: cmds.map(c => `\`${c.help.name}\``).join(", "),
			});
		}

		await interaction.reply({ embeds: [embed] });
	}
}

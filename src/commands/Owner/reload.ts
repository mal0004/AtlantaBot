import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Reload extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "reload",

			enabled: true,
			guildOnly: false,
			ownerOnly: true,
			cooldown: 0,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("reload")
		.setDescription("Reload a command (owner only)")
		.addStringOption(opt =>
			opt.setName("command").setDescription("The command name to reload").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const commandName = interaction.options.getString("command", true).toLowerCase();
		const cmd = client.commands.get(commandName);

		if (!cmd) {
			return void interaction.reply({
				content: t("owner/reload:NOT_FOUND", { search: commandName }),
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			const category = cmd.help.category;
			const cmdPath = new URL(
				`../${category}/${commandName}.js`,
				import.meta.url,
			).href;

			const timestamp = Date.now();
			const freshModule = await import(`${cmdPath}?t=${timestamp}`);
			const FreshCommand = freshModule.default;

			const reloaded = new FreshCommand(client) as Command;
			client.commands.set(commandName, reloaded);

			const embed = new EmbedBuilder()
				.setColor("#43B581")
				.setDescription(t("owner/reload:SUCCESS", { command: commandName }))
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			interaction.editReply({ embeds: [embed] });
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);

			const embed = new EmbedBuilder()
				.setColor("#F04747")
				.setDescription(`Failed to reload \`${commandName}\`: ${error}`)
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			interaction.editReply({ embeds: [embed] });
		}
	}
}

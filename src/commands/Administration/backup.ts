import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import backup from "discord-backup";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Backup extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("backup")
		.setDescription("Manage server backups")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((sub) =>
			sub.setName("create").setDescription("Create a backup of this server"),
		)
		.addSubcommand((sub) =>
			sub.setName("load").setDescription("Load a backup")
				.addStringOption((o) =>
					o.setName("id").setDescription("Backup ID").setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("list").setDescription("List your backups"),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "backup",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.Administrator],
			botPermissions: [PermissionFlagsBits.Administrator],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const sub = interaction.options.getSubcommand();
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		if (sub === "create") {
			await interaction.deferReply();

			const backupData = await backup.create(interaction.guild! as any, {
				jsonBeautify: true,
			});

			try {
				await interaction.user.send(
					t("administration/backup:SUCCESS_PRIVATE", { backupID: backupData.id }),
				);
			} catch {
				// DMs disabled
			}

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription(t("administration/backup:SUCCESS_PUBLIC"));

			return void interaction.editReply({ embeds: [embed] });
		}

		if (sub === "load") {
			const backupId = interaction.options.getString("id", true);

			const backupInfo = await backup.fetch(backupId).catch(() => null);
			if (!backupInfo) {
				return void interaction.reply({
					content: t("administration/backup:NO_BACKUP_FOUND", { backupID: backupId }),
					ephemeral: true,
				});
			}

			await interaction.reply(t("administration/backup:START_LOADING"));
			await backup.load(backupId, interaction.guild! as any).catch(() => null);
		}

		if (sub === "list") {
			const backups = await backup.list();
			const userBackups = backups.filter(
				(b: any) => b.data?.createdBy === interaction.user.id,
			);

			if (!userBackups.length) {
				return void interaction.reply({
					content: "You don't have any backups.",
					ephemeral: true,
				});
			}

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription(
					userBackups
						.map((b: any, i: number) => `**${i + 1}.** \`${b.id}\` — ${b.data?.name ?? "Unknown"}`)
						.join("\n"),
				);

			return void interaction.reply({ embeds: [embed] });
		}
	}
}

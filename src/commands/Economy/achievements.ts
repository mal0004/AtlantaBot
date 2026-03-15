import {
	AttachmentBuilder,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Achievements extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "achievements",

			enabled: true,
			guildOnly: false,
			cooldown: 10000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("achievements")
		.setDescription("Show achievement badges")
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

		const userData = isOther
			? await client.findOrCreateUser({ id: target.id })
			: data.userData;

		const buffer = await userData.getAchievements();
		const attachment = new AttachmentBuilder(buffer, { name: "achievements.png" });

		const achievementMap: Record<string, string> = {
			work: "CLAIM_SALARY",
			firstCommand: "SEND_CMD",
			married: "MARRY",
			slots: "SLOTS",
			tip: "TIP",
			rep: "REP",
			invite: "INVITE",
		};

		const achievementKeys = Object.keys(achievementMap);

		const description = achievementKeys
			.map((key) => {
				const ach = (userData.achievements as Record<string, any>)[key];
				const status = ach.achieved ? "✅" : `⬜ (${ach.progress.now}/${ach.progress.total})`;
				return `**${t(`economy/achievements:${achievementMap[key]}`)}**: ${status}`;
			})
			.join("\n");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: t("economy/achievements:TITLE"),
				iconURL: target.displayAvatarURL(),
			})
			.setDescription(description)
			.setImage("attachment://achievements.png")
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.editReply({ embeds: [embed], files: [attachment] });
	}
}

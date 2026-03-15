import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";
import { convertTime } from "../../helpers/functions.js";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const BASE_SALARY = 100;
const STREAK_BONUS = 50;

export default class Work extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "work",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("work")
		.setDescription("Work to earn credits (24h cooldown)");

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const now = Date.now();
		const lastWork = data.memberData.cooldowns?.work ?? 0;

		if (lastWork && now - lastWork < COOLDOWN_MS) {
			const remaining = lastWork + COOLDOWN_MS - now;
			const timeLeft = convertTime(t, remaining);
			return void (await interaction.reply({
				content: t("economy/work:COOLDOWN", { time: timeLeft }),
				ephemeral: true,
			}));
		}

		const streakWindow = COOLDOWN_MS * 1.5;
		if (lastWork && now - lastWork > streakWindow) {
			data.memberData.workStreak = 0;
		}

		data.memberData.workStreak += 1;
		const salary = BASE_SALARY + (data.memberData.workStreak - 1) * STREAK_BONUS;

		data.memberData.money += salary;
		data.memberData.cooldowns = {
			...data.memberData.cooldowns,
			work: now,
		};

		await data.memberData.save();

		const userData = data.userData;
		if (!userData.achievements.work.achieved) {
			userData.achievements.work.progress.now += 1;
			if (userData.achievements.work.progress.now >= userData.achievements.work.progress.total) {
				userData.achievements.work.achieved = true;
			}
			await userData.save();
		}

		const embed = new EmbedBuilder()
			.setAuthor({
				name: t("economy/work:SALARY"),
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(t("economy/work:SALARY_CONTENT", { won: salary }))
			.addFields(
				{
					name: t("economy/work:STREAK"),
					value: `${data.memberData.workStreak} days`,
					inline: true,
				},
				{
					name: "Balance",
					value: `${data.memberData.money} ${t("common:CREDITS")}`,
					inline: true,
				},
			)
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}

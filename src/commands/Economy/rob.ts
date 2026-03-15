import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";
import { convertTime, randomNum } from "../../helpers/functions.js";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export default class Rob extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "rob",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("rob")
		.setDescription("Attempt to rob another member")
		.addUserOption((o) =>
			o.setName("user").setDescription("The member to rob").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const target = interaction.options.getUser("user", true);

		if (target.id === interaction.user.id) {
			return void (await interaction.reply({
				content: t("economy/rob:YOURSELF"),
				ephemeral: true,
			}));
		}

		if (target.bot) {
			return void (await interaction.reply({
				content: t("economy/rob:MISSING_MEMBER"),
				ephemeral: true,
			}));
		}

		const now = Date.now();
		const lastRob = data.memberData.cooldowns?.rob ?? 0;

		if (lastRob && now - lastRob < COOLDOWN_MS) {
			const remaining = lastRob + COOLDOWN_MS - now;
			const timeLeft = convertTime(t, remaining);
			return void (await interaction.reply({
				content: t("economy/rob:COOLDOWN", { time: timeLeft }),
				ephemeral: true,
			}));
		}

		const targetMember = await client.findOrCreateMember({
			id: target.id,
			guildID: interaction.guildId!,
		});

		if (targetMember.money < 100) {
			return void (await interaction.reply({
				content: t("economy/rob:NOT_ENOUGH_MEMBER", { username: target.username }),
				ephemeral: true,
			}));
		}

		data.memberData.cooldowns = {
			...data.memberData.cooldowns,
			rob: now,
		};

		const success = Math.random() < 0.4;

		if (success) {
			const stolen = randomNum(50, Math.min(500, Math.floor(targetMember.money * 0.5)));

			targetMember.money -= stolen;
			data.memberData.money += stolen;

			await targetMember.save();
			await data.memberData.save();

			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Robbery",
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setDescription(
					t("economy/rob:ROB_WON_1", { money: stolen, username: target.username }),
				)
				.setColor("#00FF00")
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		} else {
			const fine = randomNum(50, 200);
			data.memberData.money = Math.max(0, data.memberData.money - fine);
			await data.memberData.save();

			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Robbery",
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setDescription(
					t("economy/rob:ROB_LOSE_1", { fine, offset: fine, username: target.username }),
				)
				.setColor("#FF0000")
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		}
	}
}

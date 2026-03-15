import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

const EMOJIS = ["🍒", "🍊", "🍋", "🍇", "🔔", "💎", "⭐", "🍀"];

export default class Slots extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "slots",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("slots")
		.setDescription("Play the slot machine")
		.addIntegerOption((o) =>
			o
				.setName("amount")
				.setDescription("Amount to bet")
				.setRequired(true)
				.setMinValue(1),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const bet = interaction.options.getInteger("amount", true);

		if (bet > data.memberData.money) {
			return void (await interaction.reply({
				content: t("economy/slots:NOT_ENOUGH", { money: bet }),
				ephemeral: true,
			}));
		}

		const pick = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
		const a = pick(), b = pick(), c = pick();

		let winnings = 0;
		if (a === b && b === c) {
			winnings = bet * 5;
		} else if (a === b || b === c || a === c) {
			winnings = bet * 2;
		}

		const net = winnings > 0 ? winnings - bet : -bet;
		data.memberData.money += net;
		await data.memberData.save();

		const userData = data.userData;
		if (!userData.achievements.slots.achieved && winnings > 0) {
			userData.achievements.slots.progress.now += 1;
			if (userData.achievements.slots.progress.now >= userData.achievements.slots.progress.total) {
				userData.achievements.slots.achieved = true;
			}
			await userData.save();
		}

		const slotLine = `| ${a} | ${b} | ${c} |`;
		const embed = new EmbedBuilder()
			.setAuthor({
				name: "Slots",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(`**${slotLine}**`)
			.addFields(
				{
					name: winnings > 0
						? t("economy/slots:VICTORY", { username: interaction.user.username, money: bet, won: winnings })
						: t("economy/slots:DEFEAT", { username: interaction.user.username, money: bet }),
					value: `${Math.abs(net)} ${t("common:CREDITS")}`,
					inline: true,
				},
				{
					name: "Balance",
					value: `${data.memberData.money} ${t("common:CREDITS")}`,
					inline: true,
				},
			)
			.setColor(winnings > 0 ? "#00FF00" : "#FF0000")
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}

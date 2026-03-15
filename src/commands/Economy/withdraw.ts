import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Withdraw extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "withdraw",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("withdraw")
		.setDescription("Withdraw money from bank to wallet")
		.addIntegerOption((o) =>
			o
				.setName("amount")
				.setDescription("Amount to withdraw (or 0 for all)")
				.setRequired(true)
				.setMinValue(0),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		let amount = interaction.options.getInteger("amount", true);

		if (amount === 0) amount = data.memberData.bankSold;

		if (amount > data.memberData.bankSold) {
			return void (await interaction.reply({
				content: t("economy/withdraw:NOT_ENOUGH", { money: amount }),
				ephemeral: true,
			}));
		}

		if (amount <= 0) {
			return void (await interaction.reply({
				content: t("economy/withdraw:NO_CREDIT"),
				ephemeral: true,
			}));
		}

		data.memberData.bankSold -= amount;
		data.memberData.money += amount;
		await data.memberData.save();

		const embed = new EmbedBuilder()
			.setAuthor({
				name: "Withdraw",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.addFields(
				{
					name: "Withdrawn",
					value: `${amount} ${t("common:CREDITS")}`,
					inline: true,
				},
				{
					name: "New Wallet",
					value: `${data.memberData.money} ${t("common:CREDITS")}`,
					inline: true,
				},
				{
					name: "New Bank",
					value: `${data.memberData.bankSold} ${t("common:CREDITS")}`,
					inline: true,
				},
			)
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}

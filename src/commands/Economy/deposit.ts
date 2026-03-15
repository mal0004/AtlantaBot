import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Deposit extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "deposit",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("deposit")
		.setDescription("Deposit money from wallet to bank")
		.addIntegerOption((o) =>
			o
				.setName("amount")
				.setDescription("Amount to deposit (or 0 for all)")
				.setRequired(true)
				.setMinValue(0),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		let amount = interaction.options.getInteger("amount", true);

		if (amount === 0) amount = data.memberData.money;

		if (amount > data.memberData.money) {
			return void (await interaction.reply({
				content: t("economy/deposit:NO_ENOUGH_CREDIT", { money: amount }),
				ephemeral: true,
			}));
		}

		if (amount <= 0) {
			return void (await interaction.reply({
				content: t("economy/deposit:NO_CREDIT"),
				ephemeral: true,
			}));
		}

		data.memberData.money -= amount;
		data.memberData.bankSold += amount;
		await data.memberData.save();

		const embed = new EmbedBuilder()
			.setAuthor({
				name: "Deposit",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.addFields(
				{
					name: "Deposited",
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

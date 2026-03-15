import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Money extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "money",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("money")
		.setDescription("Shows wallet and bank balance")
		.addUserOption((o) =>
			o.setName("user").setDescription("The user to check the balance of"),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const target = interaction.options.getUser("user") || interaction.user;
		const isOther = target.id !== interaction.user.id;

		const memberData = isOther
			? await client.findOrCreateMember({ id: target.id, guildID: interaction.guildId! })
			: data.memberData;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: t("economy/money:TITLE", { username: target.username }),
				iconURL: target.displayAvatarURL(),
			})
			.addFields(
				{
					name: "💵 Wallet",
					value: `${memberData.money} ${t("common:CREDITS")}`,
					inline: true,
				},
				{
					name: "🏦 Bank",
					value: `${memberData.bankSold} ${t("common:CREDITS")}`,
					inline: true,
				},
				{
					name: "💰 Total",
					value: `${memberData.money + memberData.bankSold} ${t("common:CREDITS")}`,
					inline: true,
				},
			)
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}

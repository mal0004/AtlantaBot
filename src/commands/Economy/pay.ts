import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Pay extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "pay",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("pay")
		.setDescription("Transfer money to another member")
		.addUserOption((o) =>
			o.setName("user").setDescription("The member to pay").setRequired(true),
		)
		.addIntegerOption((o) =>
			o
				.setName("amount")
				.setDescription("Amount to transfer")
				.setRequired(true)
				.setMinValue(1),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const target = interaction.options.getUser("user", true);
		const amount = interaction.options.getInteger("amount", true);

		if (target.bot) {
			return void (await interaction.reply({
				content: t("economy/pay:BOT_USER"),
				ephemeral: true,
			}));
		}

		if (target.id === interaction.user.id) {
			return void (await interaction.reply({
				content: t("economy/pay:YOURSELF"),
				ephemeral: true,
			}));
		}

		if (amount > data.memberData.money) {
			return void (await interaction.reply({
				content: t("economy/pay:ENOUGH_MONEY", { amount }),
				ephemeral: true,
			}));
		}

		const targetMember = await client.findOrCreateMember({
			id: target.id,
			guildID: interaction.guildId!,
		});

		data.memberData.money -= amount;
		targetMember.money += amount;

		await data.memberData.save();
		await targetMember.save();

		const userData = data.userData;
		if (!userData.achievements.tip.achieved) {
			userData.achievements.tip.progress.now = 1;
			userData.achievements.tip.achieved = true;
			await userData.save();
		}

		const embed = new EmbedBuilder()
			.setAuthor({
				name: "Payment",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(
				t("economy/pay:SUCCESS", {
					amount,
					username: target.username,
				}),
			)
			.addFields(
				{
					name: "Your Balance",
					value: `${data.memberData.money} ${t("common:CREDITS")}`,
					inline: true,
				},
				{
					name: "Their Balance",
					value: `${targetMember.money} ${t("common:CREDITS")}`,
					inline: true,
				},
			)
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}

import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Divorce extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "divorce",

			enabled: true,
			guildOnly: true,
			cooldown: 10000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("divorce")
		.setDescription("Divorce your current partner");

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		if (!data.userData.lover) {
			return void (await interaction.reply({
				content: t("economy/divorce:NOT_MARRIED"),
				ephemeral: true,
			}));
		}

		const partnerUser = await client.users.fetch(data.userData.lover).catch(() => null);
		const partnerName = partnerUser?.username ?? data.userData.lover;

		const confirmBtn = new ButtonBuilder()
			.setCustomId("divorce_confirm")
			.setLabel("Confirm")
			.setStyle(ButtonStyle.Danger);

		const cancelBtn = new ButtonBuilder()
			.setCustomId("divorce_cancel")
			.setLabel("Cancel")
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: "Divorce",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(
				`Are you sure you want to divorce **${partnerName}**?`,
			)
			.setColor("#FF0000")
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		const reply = await interaction.reply({
			embeds: [embed],
			components: [row],
			fetchReply: true,
		});

		try {
			const response = await reply.awaitMessageComponent({
				componentType: ComponentType.Button,
				filter: (i) => i.user.id === interaction.user.id,
				time: 30_000,
			});

			if (response.customId === "divorce_confirm") {
				const partnerData = await client.findOrCreateUser({ id: data.userData.lover! });
				partnerData.lover = undefined;
				await partnerData.save();

				data.userData.lover = undefined;
				await data.userData.save();

				const successEmbed = new EmbedBuilder()
					.setDescription(
						t("economy/divorce:DIVORCED", { username: partnerName }),
					)
					.setColor("#FF0000")
					.setFooter({ text: data.config.embed.footer })
					.setTimestamp();

				await response.update({ embeds: [successEmbed], components: [] });
			} else {
				const cancelEmbed = new EmbedBuilder()
					.setDescription("Divorce cancelled.")
					.setColor(data.config.embed.color)
					.setFooter({ text: data.config.embed.footer })
					.setTimestamp();

				await response.update({ embeds: [cancelEmbed], components: [] });
			}
		} catch {
			const timeoutEmbed = new EmbedBuilder()
				.setDescription("Time's up! Divorce cancelled.")
				.setColor("#808080")
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
		}
	}
}

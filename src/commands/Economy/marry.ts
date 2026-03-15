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

export default class Marry extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "marry",

			enabled: true,
			guildOnly: true,
			cooldown: 10000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("marry")
		.setDescription("Propose marriage to a user")
		.addUserOption((o) =>
			o.setName("user").setDescription("The user to propose to").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const target = interaction.options.getUser("user", true);

		if (target.id === interaction.user.id) {
			return void (await interaction.reply({
				content: t("economy/marry:YOURSELF"),
				ephemeral: true,
			}));
		}

		if (target.bot) {
			return void (await interaction.reply({
				content: t("economy/marry:BOT_USER"),
				ephemeral: true,
			}));
		}

		if (data.userData.lover) {
			return void (await interaction.reply({
				content: t("economy/marry:ALREADY_MARRIED", { prefix: "/" }),
				ephemeral: true,
			}));
		}

		const targetUserData = await client.findOrCreateUser({ id: target.id });

		if (targetUserData.lover) {
			return void (await interaction.reply({
				content: t("economy/marry:ALREADY_MARRIED_USER", { username: target.username }),
				ephemeral: true,
			}));
		}

		const acceptBtn = new ButtonBuilder()
			.setCustomId("marry_accept")
			.setLabel("Yes")
			.setStyle(ButtonStyle.Success);

		const declineBtn = new ButtonBuilder()
			.setCustomId("marry_decline")
			.setLabel("No")
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptBtn, declineBtn);

		const proposalEmbed = new EmbedBuilder()
			.setAuthor({
				name: "Marriage Proposal",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(
				t("economy/marry:REQUEST", {
					from: interaction.user.toString(),
					to: target.toString(),
				}),
			)
			.setColor("#FF69B4")
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		const reply = await interaction.reply({
			embeds: [proposalEmbed],
			components: [row],
			fetchReply: true,
		});

		try {
			const response = await reply.awaitMessageComponent({
				componentType: ComponentType.Button,
				filter: (i) => i.user.id === target.id,
				time: 60_000,
			});

			if (response.customId === "marry_accept") {
				data.userData.lover = target.id;
				targetUserData.lover = interaction.user.id;

				if (!data.userData.achievements.married.achieved) {
					data.userData.achievements.married.progress.now = 1;
					data.userData.achievements.married.achieved = true;
				}
				if (!targetUserData.achievements.married.achieved) {
					targetUserData.achievements.married.progress.now = 1;
					targetUserData.achievements.married.achieved = true;
				}

				await data.userData.save();
				await targetUserData.save();

				const successEmbed = new EmbedBuilder()
					.setDescription(
						t("economy/marry:SUCCESS", {
							creator: interaction.user.toString(),
							partner: target.toString(),
						}),
					)
					.setColor("#FF69B4")
					.setFooter({ text: data.config.embed.footer })
					.setTimestamp();

				await response.update({ embeds: [successEmbed], components: [] });
			} else {
				const declinedEmbed = new EmbedBuilder()
					.setDescription(
						t("economy/marry:DENIED", { creator: interaction.user.toString(), partner: target.toString() }),
					)
					.setColor("#FF0000")
					.setFooter({ text: data.config.embed.footer })
					.setTimestamp();

				await response.update({ embeds: [declinedEmbed], components: [] });
			}
		} catch {
			const timeoutEmbed = new EmbedBuilder()
				.setDescription(t("economy/marry:TIMEOUT", { username: target.username }))
				.setColor("#808080")
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
		}
	}
}

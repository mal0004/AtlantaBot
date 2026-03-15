import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import ms from "ms";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Giveaway extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("giveaway")
		.setDescription("Manage giveaways")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addSubcommand((sub) =>
			sub.setName("start").setDescription("Start a new giveaway")
				.addStringOption((o) =>
					o.setName("duration").setDescription("Duration (e.g. 1h, 1d)").setRequired(true),
				)
				.addIntegerOption((o) =>
					o.setName("winners").setDescription("Number of winners").setRequired(true).setMinValue(1),
				)
				.addStringOption((o) =>
					o.setName("prize").setDescription("Prize to give away").setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("reroll").setDescription("Reroll a giveaway")
				.addStringOption((o) =>
					o.setName("message-id").setDescription("Giveaway message ID").setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("end").setDescription("End a giveaway early")
				.addStringOption((o) =>
					o.setName("message-id").setDescription("Giveaway message ID").setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("delete").setDescription("Delete a giveaway")
				.addStringOption((o) =>
					o.setName("message-id").setDescription("Giveaway message ID").setRequired(true),
				),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "giveaway",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageMessages],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const sub = interaction.options.getSubcommand();
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		if (sub === "start") {
			const durationStr = interaction.options.getString("duration", true);
			const winners = interaction.options.getInteger("winners", true);
			const prize = interaction.options.getString("prize", true);
			const duration = (ms as unknown as (s: string) => number | undefined)(durationStr);

			if (!duration || duration < 10_000) {
				return void interaction.reply({ content: t("moderation/giveaway:INVALID_CREATE"), ephemeral: true });
			}

			await client.giveawaysManager.start(interaction.channel! as any, {
				duration,
				winnerCount: winners,
				prize,
				hostedBy: interaction.user as any,
				messages: {
					giveaway: t("moderation/giveaway:TITLE"),
					giveawayEnded: t("moderation/giveaway:ENDED"),
					drawing: t("moderation/giveaway:TIME_REMAINING"),
					winners: t("moderation/giveaway:WINNERS"),
					endedAt: t("moderation/giveaway:END_AT"),
					hostedBy: t("moderation/giveaway:FOOTER"),
				},
			});

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setDescription(t("moderation/giveaway:GIVEAWAY_CREATED"));

			return void interaction.reply({ embeds: [embed], ephemeral: true });
		}

		const messageId = interaction.options.getString("message-id", true);
		const giveaway = client.giveawaysManager.giveaways.find(
			(g) => g.messageId === messageId && g.guildId === interaction.guild!.id,
		);
		if (!giveaway) {
			return void interaction.reply({ content: t("moderation/giveaway:NOT_FOUND", { messageID: messageId }), ephemeral: true });
		}

		if (sub === "reroll") {
			await client.giveawaysManager.reroll(giveaway.messageId).catch(() => null);
			return void interaction.reply({ content: t("moderation/giveaway:GIVEAWAY_REROLLED"), ephemeral: true });
		}

		if (sub === "end") {
			await client.giveawaysManager.end(giveaway.messageId).catch(() => null);
			return void interaction.reply({ content: t("moderation/giveaway:GIVEAWAY_ENDED"), ephemeral: true });
		}

		if (sub === "delete") {
			await client.giveawaysManager.delete(giveaway.messageId).catch(() => null);
			return void interaction.reply({ content: t("moderation/giveaway:GIVEAWAY_DELETED"), ephemeral: true });
		}
	}
}

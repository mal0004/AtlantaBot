import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Invitations extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("invitations")
		.setDescription("Shows the invite leaderboard for the server");

	constructor(client: Atlanta) {
		super(client, {
			name: "invitations",

			enabled: true,
			guildOnly: true,
			cooldown: 10000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const guild = interaction.guild!;

		await interaction.deferReply();

		try {
			const invites = await guild.invites.fetch();

			const inviteMap = new Map<string, number>();
			invites.forEach(inv => {
				if (!inv.inviter) return;
				const current = inviteMap.get(inv.inviter.id) ?? 0;
				inviteMap.set(inv.inviter.id, current + (inv.uses ?? 0));
			});

			const sorted = [...inviteMap.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 10);

			const description = sorted.length > 0
				? sorted.map((entry, i) => `**${i + 1}.** <@${entry[0]}> - ${client.translate("general/invitations:FIELD_MEMBERS", { total: entry[1].toString() }, locale)}`).join("\n")
				: client.translate("general/invitations:NOBODY_AUTHOR", undefined, locale);

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer })
				.setAuthor({ name: client.translate("general/invitations:TITLE", { member: interaction.user.username, guild: guild.name }, locale) })
				.setDescription(description);

			await interaction.editReply({ embeds: [embed] });
		} catch {
			await interaction.editReply({
				content: `${client.customEmojis.error} An error occurred while fetching invitations.`,
			});
		}
	}
}

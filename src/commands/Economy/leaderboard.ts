import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import AsciiTable from "ascii-table";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Leaderboard extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "leaderboard",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("Show the server leaderboard")
		.addStringOption((o) =>
			o
				.setName("type")
				.setDescription("Leaderboard type")
				.setRequired(true)
				.addChoices(
					{ name: "Money", value: "money" },
					{ name: "Level", value: "level" },
					{ name: "Reputation", value: "rep" },
				),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const type = interaction.options.getString("type", true);

		await interaction.deferReply();

		if (type === "rep") {
			const users = await client.usersData
				.find({ rep: { $gt: 0 } })
				.sort({ rep: -1 })
				.limit(10)
				.lean();

			const repTitle = "Reputation Leaderboard";
			const table = new AsciiTable(repTitle);
			table.setHeading("#", t("common:USER"), t("common:POINTS"));

			for (let i = 0; i < users.length; i++) {
				const discordUser = await client.users.fetch(users[i].id).catch(() => null);
				table.addRow(
					i + 1,
					discordUser?.username ?? users[i].id,
					users[i].rep,
				);
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: repTitle,
					iconURL: interaction.guild!.iconURL()!,
				})
				.setDescription(`\`\`\`\n${table.toString()}\n\`\`\``)
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer })
				.setTimestamp();

			return void (await interaction.editReply({ embeds: [embed] }));
		}

		const members = await client.membersData
			.find({ guildID: interaction.guildId! })
			.sort(type === "money" ? { money: -1 } : { level: -1, exp: -1 })
			.limit(10)
			.lean();

		const title =
			type === "money"
				? "Money Leaderboard"
				: "Level Leaderboard";
		const valueLabel =
			type === "money"
				? t("common:CREDITS")
				: t("common:LEVEL");

		const table = new AsciiTable(title);
		table.setHeading("#", t("common:USER"), valueLabel);

		for (let i = 0; i < members.length; i++) {
			const discordUser = await client.users.fetch(members[i].id).catch(() => null);
			const val =
				type === "money"
					? members[i].money + members[i].bankSold
					: `${members[i].level} (${members[i].exp} XP)`;
			table.addRow(i + 1, discordUser?.username ?? members[i].id, val);
		}

		const embed = new EmbedBuilder()
			.setAuthor({
				name: title,
				iconURL: interaction.guild!.iconURL()!,
			})
			.setDescription(`\`\`\`\n${table.toString()}\n\`\`\``)
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.editReply({ embeds: [embed] });
	}
}

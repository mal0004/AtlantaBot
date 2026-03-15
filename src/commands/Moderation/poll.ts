import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Poll extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("poll")
		.setDescription("Create a yes/no poll")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addStringOption((o) =>
			o.setName("question").setDescription("The poll question").setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "poll",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageMessages],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const question = interaction.options.getString("question", true);
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setAuthor({ name: t("moderation/poll:TITLE"), iconURL: interaction.user.displayAvatarURL() })
			.setDescription(question)
			.setFooter({ text: client.config.embed.footer });

		await interaction.reply({ content: "Poll sent!", ephemeral: true });

		const channel = interaction.channel!;
		if (!("send" in channel)) return;
		const pollMsg = await channel.send({ embeds: [embed] });
		await pollMsg.react("👍");
		await pollMsg.react("👎");
	}
}

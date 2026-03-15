import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Invite extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Shows the bot invite link");

	constructor(client: Atlanta) {
		super(client, {
			name: "invite",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;

		const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&scope=bot%20applications.commands&permissions=2146958847`;
		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: client.translate("general/invite:LINKS", undefined, locale) })
			.addFields(
				{ name: client.translate("general/invite:ADD", undefined, locale), value: `[Click here](${inviteUrl})` },
				{ name: client.translate("general/invite:VOTE", undefined, locale), value: `[top.gg](https://top.gg/bot/${client.user!.id})` },
				{ name: client.translate("general/invite:SUPPORT", undefined, locale), value: client.translate("general/invite:TIP", { prefix: "/" }, locale) },
			);

		await interaction.reply({ embeds: [embed] });
	}
}

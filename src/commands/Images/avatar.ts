import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Avatar extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "avatar",

			enabled: true,
			guildOnly: false,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("avatar")
		.setDescription("Show a user's avatar")
		.addUserOption(opt =>
			opt.setName("user").setDescription("The user to show the avatar of").setRequired(false),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const user = interaction.options.getUser("user") ?? interaction.user;
		const avatarURL = user.displayAvatarURL({ size: 2048, extension: "png" });

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setTitle(`${user.username}'s Avatar`)
			.setImage(avatarURL)
			.setDescription(
				`[png](${user.displayAvatarURL({ extension: "png", size: 2048 })}) | ` +
				`[jpg](${user.displayAvatarURL({ extension: "jpg", size: 2048 })}) | ` +
				`[webp](${user.displayAvatarURL({ extension: "webp", size: 2048 })})`,
			)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	}
}

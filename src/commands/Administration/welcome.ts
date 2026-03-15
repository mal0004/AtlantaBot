import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Welcome extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("welcome")
		.setDescription("Configure the welcome system")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub.setName("enable").setDescription("Enable welcome messages")
				.addChannelOption((o) =>
					o.setName("channel").setDescription("Channel for welcome messages").setRequired(true)
						.addChannelTypes(ChannelType.GuildText),
				)
				.addStringOption((o) =>
					o.setName("message").setDescription("Welcome message ({user}, {server}, {membercount} placeholders)").setRequired(true),
				)
				.addBooleanOption((o) =>
					o.setName("image").setDescription("Include a welcome image card"),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("disable").setDescription("Disable welcome messages"),
		)
		.addSubcommand((sub) =>
			sub.setName("edit").setDescription("Edit the welcome message")
				.addStringOption((o) =>
					o.setName("message").setDescription("New welcome message").setRequired(true),
				)
				.addChannelOption((o) =>
					o.setName("channel").setDescription("New channel for welcome messages")
						.addChannelTypes(ChannelType.GuildText),
				)
				.addBooleanOption((o) =>
					o.setName("image").setDescription("Include a welcome image card"),
				),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "welcome",

			enabled: true,
			guildOnly: true,
			memberPermissions: [PermissionFlagsBits.ManageGuild],
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const sub = interaction.options.getSubcommand();
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		if (sub === "enable") {
			const channel = interaction.options.getChannel("channel", true);
			const message = interaction.options.getString("message", true);
			const image = interaction.options.getBoolean("image") ?? false;

			data.guild.plugins.welcome = {
				enabled: true,
				channel: channel.id,
				message,
				withImage: image,
			};
			data.guild.markModified("plugins");
			await data.guild.save();

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription(t("administration/welcome:FORM_SUCCESS", { prefix: "/" }));

			return void interaction.reply({ embeds: [embed] });
		}

		if (sub === "disable") {
			data.guild.plugins.welcome = {
				enabled: false,
				channel: null,
				message: null,
				withImage: null,
			};
			data.guild.markModified("plugins");
			await data.guild.save();

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription(t("administration/welcome:DISABLED"));

			return void interaction.reply({ embeds: [embed] });
		}

		if (sub === "edit") {
			if (!data.guild.plugins.welcome.enabled) {
				return void interaction.reply({ content: "Welcome messages are not enabled.", ephemeral: true });
			}

			const message = interaction.options.getString("message", true);
			const channel = interaction.options.getChannel("channel");
			const image = interaction.options.getBoolean("image");

			data.guild.plugins.welcome.message = message;
			if (channel) data.guild.plugins.welcome.channel = channel.id;
			if (image !== null) data.guild.plugins.welcome.withImage = image;
			data.guild.markModified("plugins");
			await data.guild.save();

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription("Welcome message updated!");

			return void interaction.reply({ embeds: [embed] });
		}
	}
}

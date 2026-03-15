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

export default class Goodbye extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("goodbye")
		.setDescription("Configure the goodbye system")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub.setName("enable").setDescription("Enable goodbye messages")
				.addChannelOption((o) =>
					o.setName("channel").setDescription("Channel for goodbye messages").setRequired(true)
						.addChannelTypes(ChannelType.GuildText),
				)
				.addStringOption((o) =>
					o.setName("message").setDescription("Goodbye message ({user}, {server}, {membercount} placeholders)").setRequired(true),
				)
				.addBooleanOption((o) =>
					o.setName("image").setDescription("Include a goodbye image card"),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("disable").setDescription("Disable goodbye messages"),
		)
		.addSubcommand((sub) =>
			sub.setName("edit").setDescription("Edit the goodbye message")
				.addStringOption((o) =>
					o.setName("message").setDescription("New goodbye message").setRequired(true),
				)
				.addChannelOption((o) =>
					o.setName("channel").setDescription("New channel for goodbye messages")
						.addChannelTypes(ChannelType.GuildText),
				)
				.addBooleanOption((o) =>
					o.setName("image").setDescription("Include a goodbye image card"),
				),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "goodbye",

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

			data.guild.plugins.goodbye = {
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
				.setDescription(t("administration/goodbye:FORM_SUCCESS", { prefix: "/" }));

			return void interaction.reply({ embeds: [embed] });
		}

		if (sub === "disable") {
			data.guild.plugins.goodbye = {
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
				.setDescription(t("administration/goodbye:DISABLED"));

			return void interaction.reply({ embeds: [embed] });
		}

		if (sub === "edit") {
			if (!data.guild.plugins.goodbye.enabled) {
				return void interaction.reply({ content: "Goodbye messages are not enabled.", ephemeral: true });
			}

			const message = interaction.options.getString("message", true);
			const channel = interaction.options.getChannel("channel");
			const image = interaction.options.getBoolean("image");

			data.guild.plugins.goodbye.message = message;
			if (channel) data.guild.plugins.goodbye.channel = channel.id;
			if (image !== null) data.guild.plugins.goodbye.withImage = image;
			data.guild.markModified("plugins");
			await data.guild.save();

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({ text: client.config.embed.footer })
				.setDescription("Goodbye message updated!");

			return void interaction.reply({ embeds: [embed] });
		}
	}
}

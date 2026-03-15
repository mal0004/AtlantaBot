import { ChatInputCommandInteraction, ChannelType, EmbedBuilder, GuildVerificationLevel, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Serverinfo extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("serverinfo")
		.setDescription("Shows information about the server");

	constructor(client: Atlanta) {
		super(client, {
			name: "serverinfo",

			enabled: true,
			guildOnly: true,
			cooldown: 5000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const guild = interaction.guild!;

		await guild.members.fetch();

		const verificationLevels: Record<GuildVerificationLevel, string> = {
			[GuildVerificationLevel.None]: "None",
			[GuildVerificationLevel.Low]: "Low",
			[GuildVerificationLevel.Medium]: "Medium",
			[GuildVerificationLevel.High]: "High",
			[GuildVerificationLevel.VeryHigh]: "Very High",
		};

		const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
		const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
		const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
		const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== "offline").size;

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
			.setThumbnail(guild.iconURL())
			.addFields(
				{
					name: client.customEmojis.success + " " + guild.name,
					value: guild.id,
					inline: true,
				},
				{
					name: client.translate("general/serverinfo:AFK_CHANNEL", undefined, locale),
					value: guild.afkChannel?.toString() ?? client.translate("general/serverinfo:NO_AFK_CHANNEL", undefined, locale),
					inline: true,
				},
				{
					name: "Owner",
					value: `<@${guild.ownerId}>`,
					inline: true,
				},
				{
					name: client.translate("general/serverinfo:MEMBERS", { count: guild.memberCount.toString() }, locale),
					value: `(${onlineMembers} online)`,
					inline: true,
				},
				{
					name: client.translate("general/serverinfo:BOOSTS", undefined, locale),
					value: (guild.premiumSubscriptionCount ?? 0).toString(),
					inline: true,
				},
				{
					name: "Channels",
					value: `${client.translate("general/serverinfo:TEXT_CHANNELS", { count: textChannels.toString() }, locale)} / ${client.translate("general/serverinfo:VOICE_CHANNELS", { count: voiceChannels.toString() }, locale)} / ${client.translate("general/serverinfo:CAT_CHANNELS", { count: categories.toString() }, locale)}`,
					inline: true,
				},
				{
					name: "Verification",
					value: verificationLevels[guild.verificationLevel],
					inline: true,
				},
			);

		if (guild.icon) {
			embed.setThumbnail(guild.iconURL({ size: 512 }));
		}

		await interaction.reply({ embeds: [embed] });
	}
}

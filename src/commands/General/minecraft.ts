import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
// @ts-expect-error gamedig has no type declarations
import { GameDig } from "gamedig";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

interface GameDigResult {
	name: string;
	numplayers: number;
	maxplayers: number;
	ping: number;
	version: string | null;
	players: Array<{ name?: string }>;
}

export default class Minecraft extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("minecraft")
		.setDescription("Query a Minecraft server")
		.addStringOption(option =>
			option.setName("ip")
				.setDescription("Server IP address (e.g. play.hypixel.net)")
				.setRequired(true),
		);

	constructor(client: Atlanta) {
		super(client, {
			name: "minecraft",

			enabled: true,
			guildOnly: false,
			cooldown: 10000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const ip = interaction.options.getString("ip", true);

		await interaction.deferReply();

		try {
			const [host, portStr] = ip.split(":");
			const port = portStr ? parseInt(portStr, 10) : 25565;

			const state = await GameDig.query({
				type: "minecraft",
				host,
				port,
			}) as GameDigResult;

			const embed = new EmbedBuilder()
				.setColor(data.config.embed.color)
				.setFooter({ text: data.config.embed.footer })
				.setAuthor({ name: client.translate("general/minecraft:FIELD_NAME", { ip }, locale) })
				.addFields(
					{ name: client.translate("general/minecraft:FIELD_IP", undefined, locale), value: ip, inline: true },
					{ name: client.translate("general/minecraft:FIELD_CONNECTED", undefined, locale), value: client.translate("general/minecraft:PLAYERS", { count: state.numplayers.toString() }, locale), inline: true },
					{ name: client.translate("general/minecraft:FIELD_MAX", undefined, locale), value: state.maxplayers.toString(), inline: true },
					{ name: client.translate("general/minecraft:FIELD_STATUS", undefined, locale), value: client.translate("general/minecraft:ONLINE", undefined, locale), inline: true },
					{ name: client.translate("general/minecraft:FIELD_VERSION", undefined, locale), value: state.version ?? "N/A", inline: true },
				);

			if (state.players.length > 0) {
				const playerList = state.players
					.slice(0, 20)
					.map(p => p.name ?? "???")
					.join(", ");
				embed.addFields({
					name: "Players",
					value: playerList,
				});
			}

			await interaction.editReply({ embeds: [embed] });
		} catch {
			await interaction.editReply({
				content: `${client.customEmojis.error} ${client.translate("general/minecraft:FAILED", undefined, locale)}`,
			});
		}
	}
}

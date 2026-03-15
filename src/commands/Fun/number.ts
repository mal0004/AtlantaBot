import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ComponentType, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class NumberGame extends Command {
	slashCommand = new SlashCommandBuilder()
		.setName("number")
		.setDescription("Play a number guessing game (1-1000)");

	constructor(client: Atlanta) {
		super(client, {
			name: "number",

			enabled: true,
			guildOnly: true,
			cooldown: 10000,
		});
	}

	async run(interaction: ChatInputCommandInteraction, data: CommandData): Promise<void> {
		const client = interaction.client as Atlanta;
		const locale = data.guild.language;
		const target = Math.floor(Math.random() * 1000) + 1;
		let attempts = 0;
		const maxAttempts = 10;

		const embed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setAuthor({ name: "Number Game" })
			.setDescription(client.translate("fun/number:GAME_START", undefined, locale));

		const cancelButton = new ButtonBuilder()
			.setCustomId("number_cancel")
			.setLabel("Cancel")
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton);

		await interaction.reply({ embeds: [embed], components: [row] });

		const channel = interaction.channel!;
		if (!("createMessageCollector" in channel)) return;
		const filter = (m: Message) =>
			m.author.id === interaction.user.id && !isNaN(parseInt(m.content));

		const collector = channel.createMessageCollector({ filter, time: 60_000 });
		const buttonCollector = (await interaction.fetchReply()).createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60_000,
		});

		buttonCollector.on("collect", async (btn) => {
			if (btn.user.id !== interaction.user.id) {
				await btn.reply({ content: "You are not allowed to do this!", ephemeral: true });
				return;
			}
			collector.stop("cancelled");
			buttonCollector.stop();
			await interaction.editReply({
				embeds: [embed.setDescription(client.translate("fun/number:DEFEAT", { number: target.toString() }, locale))],
				components: [],
			});
		});

		collector.on("collect", async (msg: Message) => {
			attempts++;
			const guess = parseInt(msg.content);

			if (guess === target) {
				collector.stop("won");
				buttonCollector.stop();
				await interaction.editReply({
					embeds: [embed.setDescription(
						`🎉 ${client.translate("fun/number:WON", { winner: interaction.user.toString() }, locale)}`,
					)],
					components: [],
				});
				return;
			}

			if (attempts >= maxAttempts) {
				collector.stop("lost");
				buttonCollector.stop();
				await interaction.editReply({
					embeds: [embed.setDescription(client.translate("fun/number:DEFEAT", { number: target.toString() }, locale))],
					components: [],
				});
				return;
			}

			const hint = guess > target
				? client.translate("fun/number:BIG", { user: interaction.user.toString(), number: guess.toString() }, locale)
				: client.translate("fun/number:SMALL", { user: interaction.user.toString(), number: guess.toString() }, locale);

			await msg.reply(hint).catch(() => {});
		});

		collector.on("end", async (_collected, reason) => {
			if (reason === "time") {
				await interaction.editReply({
					embeds: [embed.setDescription(client.translate("fun/number:DEFEAT", { number: target.toString() }, locale))],
					components: [],
				});
			}
		});
	}
}

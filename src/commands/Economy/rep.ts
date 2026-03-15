import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";
import { convertTime } from "../../helpers/functions.js";

const COOLDOWN_MS = 12 * 60 * 60 * 1000;

export default class Rep extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "rep",

			enabled: true,
			guildOnly: true,
			cooldown: 3000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("rep")
		.setDescription("Give a reputation point to a user")
		.addUserOption((o) =>
			o.setName("user").setDescription("The user to give rep to").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const target = interaction.options.getUser("user", true);

		if (target.bot) {
			return void (await interaction.reply({
				content: t("economy/rep:BOT_USER"),
				ephemeral: true,
			}));
		}

		if (target.id === interaction.user.id) {
			return void (await interaction.reply({
				content: t("economy/rep:YOURSELF"),
				ephemeral: true,
			}));
		}

		const now = Date.now();
		const lastRep = data.userData.cooldowns?.rep ?? 0;

		if (lastRep && now - lastRep < COOLDOWN_MS) {
			const remaining = lastRep + COOLDOWN_MS - now;
			const timeLeft = convertTime(t, remaining);
			return void (await interaction.reply({
				content: t("economy/rep:COOLDOWN", { time: timeLeft }),
				ephemeral: true,
			}));
		}

		const targetUserData = await client.findOrCreateUser({ id: target.id });
		targetUserData.rep += 1;
		await targetUserData.save();

		data.userData.cooldowns = {
			...data.userData.cooldowns,
			rep: now,
		};
		if (!data.userData.achievements.rep.achieved) {
			data.userData.achievements.rep.progress.now += 1;
			if (data.userData.achievements.rep.progress.now >= data.userData.achievements.rep.progress.total) {
				data.userData.achievements.rep.achieved = true;
			}
		}
		await data.userData.save();

		const embed = new EmbedBuilder()
			.setAuthor({
				name: "Reputation",
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(
				t("economy/rep:SUCCESS", {
					username: target.username,
				}),
			)
			.setColor(data.config.embed.color)
			.setFooter({ text: data.config.embed.footer })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}

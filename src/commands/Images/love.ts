import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Love extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "love",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("love")
		.setDescription("Generate a love image between you and another user")
		.addUserOption(opt =>
			opt.setName("user").setDescription("The user to love").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const user = interaction.options.getUser("user", true);

		await interaction.deferReply();

		try {
			const canvas = createCanvas(700, 250);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#2C2F33";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const avatar1 = await loadImage(interaction.user.displayAvatarURL({ extension: "png", size: 256 }));
			const avatar2 = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));

			ctx.save();
			ctx.beginPath();
			ctx.arc(175, 125, 100, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar1, 75, 25, 200, 200);
			ctx.restore();

			ctx.save();
			ctx.beginPath();
			ctx.arc(525, 125, 100, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar2, 425, 25, 200, 200);
			ctx.restore();

			const percentage = Math.floor(Math.random() * 101);

			ctx.font = "bold 48px sans-serif";
			ctx.fillStyle = percentage > 50 ? "#43B581" : "#F04747";
			ctx.textAlign = "center";
			ctx.fillText(`${percentage}%`, 350, 100);

			ctx.font = "bold 28px sans-serif";
			ctx.fillStyle = "#FFFFFF";
			ctx.fillText("❤️", 350, 150);

			ctx.font = "18px sans-serif";
			ctx.fillStyle = "#99AAB5";
			ctx.fillText(`${interaction.user.username} & ${user.username}`, 350, 210);

			const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "love.png" });

			interaction.editReply({
				files: [attachment],
			});
		} catch {
			interaction.editReply({ content: "An error occurred while generating the love image." });
		}
	}
}

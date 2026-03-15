import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Captcha extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "captcha",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("captcha")
		.setDescription("Generate a captcha image with a user's avatar")
		.addUserOption(opt =>
			opt.setName("user").setDescription("The user to include in the captcha").setRequired(false),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const user = interaction.options.getUser("user") ?? interaction.user;

		await interaction.deferReply();

		try {
			const canvas = createCanvas(400, 300);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#F2F2F2";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = "#4285F4";
			ctx.fillRect(0, 0, canvas.width, 60);
			ctx.font = "bold 24px sans-serif";
			ctx.fillStyle = "#FFFFFF";
			ctx.textAlign = "center";
			ctx.fillText("Select all images with", canvas.width / 2, 28);
			ctx.fillText(user.username, canvas.width / 2, 52);

			const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));

			const gridSize = 80;
			const startX = (canvas.width - gridSize * 3 - 20) / 2;
			const startY = 75;

			const avatarPos = Math.floor(Math.random() * 9);
			for (let i = 0; i < 9; i++) {
				const row = Math.floor(i / 3);
				const col = i % 3;
				const x = startX + col * (gridSize + 10);
				const y = startY + row * (gridSize + 10);

				ctx.fillStyle = "#FFFFFF";
				ctx.fillRect(x, y, gridSize, gridSize);
				ctx.strokeStyle = "#CCCCCC";
				ctx.lineWidth = 1;
				ctx.strokeRect(x, y, gridSize, gridSize);

				if (i === avatarPos) {
					ctx.drawImage(avatar, x + 2, y + 2, gridSize - 4, gridSize - 4);
				} else {
					ctx.fillStyle = `hsl(${Math.random() * 360}, 40%, 70%)`;
					ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
				}
			}

			ctx.fillStyle = "#4285F4";
			ctx.fillRect(canvas.width / 2 - 50, canvas.height - 40, 100, 30);
			ctx.font = "bold 14px sans-serif";
			ctx.fillStyle = "#FFFFFF";
			ctx.textAlign = "center";
			ctx.fillText("VERIFY", canvas.width / 2, canvas.height - 20);

			const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "captcha.png" });

			interaction.editReply({
				files: [attachment],
			});
		} catch {
			interaction.editReply({ content: "An error occurred while generating the captcha image." });
		}
	}
}

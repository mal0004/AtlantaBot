import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Facepalm extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "facepalm",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("facepalm")
		.setDescription("Generate a facepalm image")
		.addUserOption(opt =>
			opt.setName("user").setDescription("The user for the facepalm").setRequired(false),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const user = interaction.options.getUser("user") ?? interaction.user;

		await interaction.deferReply();

		try {
			const canvas = createCanvas(632, 357);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#2C2F33";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));

			ctx.save();
			ctx.beginPath();
			ctx.arc(316, 140, 120, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar, 196, 20, 240, 240);
			ctx.restore();

			ctx.strokeStyle = "#99AAB5";
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.arc(316, 140, 120, 0, Math.PI * 2);
			ctx.stroke();

			ctx.font = "bold 24px sans-serif";
			ctx.fillStyle = "#FFFFFF";
			ctx.textAlign = "center";
			ctx.fillText("🤦", 316, 300);

			ctx.font = "18px sans-serif";
			ctx.fillStyle = "#99AAB5";
			ctx.fillText(user.username, 316, 335);

			const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "facepalm.png" });

			interaction.editReply({
				files: [attachment],
			});
		} catch {
			interaction.editReply({ content: "An error occurred while generating the image." });
		}
	}
}

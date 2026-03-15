import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createCanvas } from "canvas";
import { Command } from "../../base/Command.js";
import type Atlanta from "../../base/Atlanta.js";
import type { CommandData } from "../../types/index.js";

export default class Clyde extends Command {
	constructor(client: Atlanta) {
		super(client, {
			name: "clyde",

			enabled: true,
			guildOnly: false,
			cooldown: 5000,
		});
	}

	slashCommand = new SlashCommandBuilder()
		.setName("clyde")
		.setDescription("Generate a fake Clyde Discord message")
		.addStringOption(opt =>
			opt.setName("text").setDescription("The text for Clyde to say").setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction, data: CommandData) {
		const client = interaction.client as Atlanta;
		const t = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, data.guild.language);

		const text = interaction.options.getString("text", true);

		await interaction.deferReply();

		try {
			const maxWidth = 600;
			const padding = 20;
			const lineHeight = 22;
			const fontSize = 16;
			const headerHeight = 35;

			const measureCanvas = createCanvas(1, 1);
			const measureCtx = measureCanvas.getContext("2d");
			measureCtx.font = `${fontSize}px sans-serif`;

			const words = text.split(" ");
			const lines: string[] = [];
			let currentLine = "";
			for (const word of words) {
				const testLine = currentLine ? `${currentLine} ${word}` : word;
				if (measureCtx.measureText(testLine).width > maxWidth - padding * 2 - 60) {
					lines.push(currentLine);
					currentLine = word;
				} else {
					currentLine = testLine;
				}
			}
			if (currentLine) lines.push(currentLine);

			const canvasHeight = headerHeight + padding + lines.length * lineHeight + padding;
			const canvas = createCanvas(maxWidth, canvasHeight);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#36393F";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = "#5865F2";
			ctx.beginPath();
			ctx.arc(30, headerHeight - 5, 16, 0, Math.PI * 2);
			ctx.fill();
			ctx.font = "bold 10px sans-serif";
			ctx.fillStyle = "#FFFFFF";
			ctx.textAlign = "center";
			ctx.fillText("C", 30, headerHeight - 1);
			ctx.textAlign = "left";

			ctx.font = `bold ${fontSize}px sans-serif`;
			ctx.fillStyle = "#5865F2";
			ctx.fillText("Clyde", 55, headerHeight - 2);

			const tagX = 55 + ctx.measureText("Clyde").width + 8;
			ctx.fillStyle = "#5865F2";
			const badgeWidth = 30;
			const badgeHeight = 16;
			const badgeY = headerHeight - 15;
			ctx.beginPath();
			ctx.roundRect(tagX, badgeY, badgeWidth, badgeHeight, 3);
			ctx.fill();
			ctx.font = "bold 9px sans-serif";
			ctx.fillStyle = "#FFFFFF";
			ctx.fillText("BOT", tagX + 5, badgeY + 12);

			ctx.font = `${fontSize}px sans-serif`;
			ctx.fillStyle = "#DCDDDE";
			const textStartY = headerHeight + padding;
			for (let i = 0; i < lines.length; i++) {
				ctx.fillText(lines[i], 55, textStartY + i * lineHeight);
			}

			const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "clyde.png" });

			interaction.editReply({
				files: [attachment],
			});
		} catch {
			interaction.editReply({ content: "An error occurred while generating the Clyde image." });
		}
	}
}

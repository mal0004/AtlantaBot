import Canvas from "canvas";
import { AttachmentBuilder, type GuildMember, type PartialGuildMember } from "discord.js";
import { resolve } from "path";
import type Atlanta from "../base/Atlanta.js";

Canvas.registerFont(resolve("./assets/fonts/theboldfont.ttf"), { family: "Bold" });
Canvas.registerFont(resolve("./assets/fonts/SketchMatch.ttf"), { family: "SketchMatch" });

function applyText(canvas: Canvas.Canvas, text: string, defaultFontSize: number): string {
	const ctx = canvas.getContext("2d");
	let size = defaultFontSize;
	do {
		size -= 10;
		ctx.font = `${size}px Bold`;
	} while (ctx.measureText(text).width > 600);
	return ctx.font;
}

export default class GuildMemberRemoveEvent {
	client: Atlanta;

	constructor(client: Atlanta) {
		this.client = client;
	}

	async run(member: GuildMember | PartialGuildMember): Promise<void> {
		const client = this.client;
		const guildData = await client.findOrCreateGuild({ id: member.guild.id });

		if (!guildData.plugins.goodbye.enabled || !guildData.plugins.goodbye.channel) return;

		const channel = member.guild.channels.cache.get(guildData.plugins.goodbye.channel);
		if (!channel?.isTextBased()) return;

		const translate = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, guildData.language);

		const text = (guildData.plugins.goodbye.message ?? "")
			.replace(/{user}/g, member.user.tag)
			.replace(/{server}/g, member.guild.name)
			.replace(/{membercount}/g, String(member.guild.memberCount));

		if (guildData.plugins.goodbye.withImage) {
			const canvas = Canvas.createCanvas(1024, 450);
			const ctx = canvas.getContext("2d");

			const background = await Canvas.loadImage("./assets/img/greetings_background.png");
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

			ctx.fillStyle = "#ffffff";
			const { default: slugify } = await import("@sindresorhus/slugify");
			const username = slugify(member.user.username, {
				separator: " ",
				lowercase: false,
				decamelize: false,
			});
			ctx.font = applyText(canvas, username, 48);
			ctx.fillText(username, canvas.width - 660, canvas.height - 248);

			const goodbyeText = translate("administration/goodbye:IMG_GOODBYE", { server: member.guild.name });
			ctx.font = applyText(canvas, goodbyeText, 53);
			ctx.fillText(goodbyeText, canvas.width - 690, canvas.height - 65);

			ctx.font = "40px Bold";
			ctx.fillText(member.user.discriminator, canvas.width - 623, canvas.height - 178);
			ctx.font = "22px Bold";
			ctx.fillText(
				translate("administration/goodbye:IMG_NB", { memberCount: member.guild.memberCount }),
				40,
				canvas.height - 50
			);
			ctx.fillStyle = "#44d14a";
			ctx.font = "75px SketchMatch";
			ctx.fillText("#", canvas.width - 690, canvas.height - 165);

			ctx.font = "90px Bold";
			ctx.strokeStyle = "#1d2124";
			ctx.lineWidth = 15;
			const title = translate("administration/goodbye:TITLE");
			ctx.strokeText(title, canvas.width - 620, canvas.height - 330);
			const gradient = ctx.createLinearGradient(canvas.width - 780, 0, canvas.width - 30, 0);
			gradient.addColorStop(0, "#e15500");
			gradient.addColorStop(1, "#e7b121");
			ctx.fillStyle = gradient;
			ctx.fillText(title, canvas.width - 620, canvas.height - 330);

			ctx.beginPath();
			ctx.lineWidth = 10;
			ctx.strokeStyle = "#df0909";
			ctx.arc(180, 225, 135, 0, Math.PI * 2, true);
			ctx.stroke();
			ctx.closePath();
			ctx.clip();

			const avatar = await Canvas.loadImage(
				member.user.displayAvatarURL({ extension: "png", size: 512 })
			);
			ctx.drawImage(avatar, 45, 90, 270, 270);

			const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "goodbye-image.png" });
			channel.send({
				content: text,
				files: [attachment],
				allowedMentions: { parse: ["users", "everyone", "roles"] },
			});
		} else {
			channel.send({ content: text, allowedMentions: { parse: ["users", "everyone", "roles"] } });
		}
	}
}

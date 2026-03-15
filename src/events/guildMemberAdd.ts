import Canvas from "canvas";
import { AttachmentBuilder, type GuildMember } from "discord.js";
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

export default class GuildMemberAddEvent {
	client: Atlanta;

	constructor(client: Atlanta) {
		this.client = client;
	}

	async run(member: GuildMember): Promise<void> {
		const client = this.client;
		const guildData = await client.findOrCreateGuild({ id: member.guild.id });

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildID: member.guild.id,
		});

		if (memberData.mute.muted && memberData.mute.endDate && memberData.mute.endDate > Date.now()) {
			for (const channel of member.guild.channels.cache.values()) {
				if ("permissionOverwrites" in channel) {
					channel.permissionOverwrites.edit(member.id, {
						SendMessages: false,
						AddReactions: false,
						Connect: false,
					}).catch(() => {});
				}
			}
		}

		if (guildData.plugins.autorole.enabled && guildData.plugins.autorole.role) {
			member.roles.add(guildData.plugins.autorole.role).catch(() => {});
		}

		if (!guildData.plugins.welcome.enabled || !guildData.plugins.welcome.channel) return;

		const channel = member.guild.channels.cache.get(guildData.plugins.welcome.channel);
		if (!channel?.isTextBased()) return;

		const translate = (key: string, args?: Record<string, unknown>) =>
			client.translate(key, args, guildData.language);

		const text = (guildData.plugins.welcome.message ?? "")
			.replace(/{user}/g, member.toString())
			.replace(/{server}/g, member.guild.name)
			.replace(/{membercount}/g, String(member.guild.memberCount));

		if (guildData.plugins.welcome.withImage) {
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

			const welcomeText = translate("administration/welcome:IMG_WELCOME", { server: member.guild.name });
			ctx.font = applyText(canvas, welcomeText, 53);
			ctx.fillText(welcomeText, canvas.width - 690, canvas.height - 65);

			ctx.font = "40px Bold";
			ctx.fillText(member.user.discriminator, canvas.width - 623, canvas.height - 178);
			ctx.font = "22px Bold";
			ctx.fillText(
				translate("administration/welcome:IMG_NB", { memberCount: member.guild.memberCount }),
				40,
				canvas.height - 50
			);
			ctx.fillStyle = "#44d14a";
			ctx.font = "75px SketchMatch";
			ctx.fillText("#", canvas.width - 690, canvas.height - 165);

			ctx.font = "90px Bold";
			ctx.strokeStyle = "#1d2124";
			ctx.lineWidth = 15;
			const title = translate("administration/welcome:TITLE");
			ctx.strokeText(title, canvas.width - 620, canvas.height - 330);
			const gradient = ctx.createLinearGradient(canvas.width - 780, 0, canvas.width - 30, 0);
			gradient.addColorStop(0, "#e15500");
			gradient.addColorStop(1, "#e7b121");
			ctx.fillStyle = gradient;
			ctx.fillText(title, canvas.width - 620, canvas.height - 330);

			ctx.beginPath();
			ctx.lineWidth = 10;
			ctx.strokeStyle = "#03A9F4";
			ctx.arc(180, 225, 135, 0, Math.PI * 2, true);
			ctx.stroke();
			ctx.closePath();
			ctx.clip();

			const avatar = await Canvas.loadImage(
				member.user.displayAvatarURL({ extension: "png", size: 512 })
			);
			ctx.drawImage(avatar, 45, 90, 270, 270);

			const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "welcome-image.png" });
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

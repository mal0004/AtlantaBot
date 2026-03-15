import mongoose, { Schema, type Document } from "mongoose";
import Canvas from "canvas";

export interface Achievement {
	achieved: boolean;
	progress: {
		now: number;
		total: number;
	};
}

export interface IUser extends Document {
	id: string;
	rep: number;
	bio?: string;
	birthdate?: number;
	lover?: string;
	registeredAt: number;
	achievements: {
		married: Achievement;
		work: Achievement;
		firstCommand: Achievement;
		slots: Achievement;
		tip: Achievement;
		rep: Achievement;
		invite: Achievement;
	};
	cooldowns: {
		rep: number;
	};
	afk: string | null;
	reminds: Array<{
		message: string;
		createdAt: number;
		sendAt: number;
	}>;
	logged: boolean;
	apiToken: string;
	genApiToken(): Promise<string>;
	getAchievements(): Promise<Buffer>;
}

function genToken(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwzy0123456789.-_";
	let token = "";
	for (let i = 0; i < 32; i++) {
		token += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return token;
}

const defaultAchievements = {
	married: { achieved: false, progress: { now: 0, total: 1 } },
	work: { achieved: false, progress: { now: 0, total: 10 } },
	firstCommand: { achieved: false, progress: { now: 0, total: 1 } },
	slots: { achieved: false, progress: { now: 0, total: 3 } },
	tip: { achieved: false, progress: { now: 0, total: 1 } },
	rep: { achieved: false, progress: { now: 0, total: 20 } },
	invite: { achieved: false, progress: { now: 0, total: 1 } },
};

const userSchema = new Schema<IUser>({
	id: { type: String, required: true },
	rep: { type: Number, default: 0 },
	bio: { type: String },
	birthdate: { type: Number },
	lover: { type: String },
	registeredAt: { type: Number, default: () => Date.now() },
	achievements: { type: Object, default: defaultAchievements },
	cooldowns: { type: Object, default: { rep: 0 } },
	afk: { type: String, default: null },
	reminds: { type: [Object], default: [] },
	logged: { type: Boolean, default: false },
	apiToken: { type: String, default: genToken },
});

userSchema.method("genApiToken", async function () {
	this.apiToken = genToken();
	await this.save();
	return this.apiToken;
});

userSchema.method("getAchievements", async function () {
	const canvas = Canvas.createCanvas(1800, 250);
	const ctx = canvas.getContext("2d");
	const keys = ["work", "firstCommand", "married", "slots", "tip", "rep", "invite"] as const;
	const images = await Promise.all(
		keys.map((key, i) =>
			Canvas.loadImage(
				`./assets/img/achievements/achievement${this.achievements[key].achieved ? "_colored" : ""}${i + 1}.png`
			)
		)
	);
	let dim = 0;
	for (const img of images) {
		ctx.drawImage(img, dim, 10, 350, 200);
		dim += 200;
	}
	return canvas.toBuffer();
});

export default mongoose.model<IUser>("User", userSchema);

import mongoose, { Schema, type Document } from "mongoose";

export interface IMember extends Document {
	id: string;
	guildID: string;
	money: number;
	workStreak: number;
	bankSold: number;
	exp: number;
	level: number;
	registeredAt: number;
	cooldowns: {
		work: number;
		rob: number;
	};
	sanctions: Array<{
		type: string;
		case: number;
		date: number;
		moderator: string;
		reason: string;
	}>;
	mute: {
		muted: boolean;
		case: number | null;
		endDate: number | null;
	};
}

const memberSchema = new Schema<IMember>({
	id: { type: String, required: true },
	guildID: { type: String, required: true },
	money: { type: Number, default: 0 },
	workStreak: { type: Number, default: 0 },
	bankSold: { type: Number, default: 0 },
	exp: { type: Number, default: 0 },
	level: { type: Number, default: 0 },
	registeredAt: { type: Number, default: () => Date.now() },
	cooldowns: {
		type: Object,
		default: { work: 0, rob: 0 },
	},
	sanctions: { type: [Object], default: [] },
	mute: {
		type: Object,
		default: { muted: false, case: null, endDate: null },
	},
});

export default mongoose.model<IMember>("Member", memberSchema);

import mongoose, { Schema, type Document } from "mongoose";

export interface ILog extends Document {
	commandName: string;
	date: number;
	author: {
		username: string;
		id: string | null;
	};
	guild: {
		name: string;
		id: string | null;
	};
}

const logSchema = new Schema<ILog>({
	commandName: { type: String, default: "unknown" },
	date: { type: Number, default: () => Date.now() },
	author: {
		type: Object,
		default: { username: "Unknown", id: null },
	},
	guild: {
		type: Object,
		default: { name: "Unknown", id: null },
	},
});

export default mongoose.model<ILog>("Log", logSchema);

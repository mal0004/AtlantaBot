import mongoose, { Schema, type Document, type Types } from "mongoose";
import languageMeta from "../../languages/language-meta.json" with { type: "json" };

export interface IGuildPlugins {
	welcome: {
		enabled: boolean;
		message: string | null;
		channel: string | null;
		withImage: boolean | null;
	};
	goodbye: {
		enabled: boolean;
		message: string | null;
		channel: string | null;
		withImage: boolean | null;
	};
	autorole: {
		enabled: boolean;
		role: string | null;
	};
	automod: {
		enabled: boolean;
		ignored: string[];
	};
	warnsSanctions: {
		kick: number | false;
		ban: number | false;
	};
	tickets: {
		enabled: boolean;
		category: string | null;
	};
	suggestions: string | false;
	modlogs: string | false;
	reports: string | false;
	logs: string | false;
}

export interface IGuild extends Document {
	id: string;
	membersData: Record<string, unknown>;
	members: Types.ObjectId[];
	language: string;
	plugins: IGuildPlugins;
	slowmode: {
		users: Array<{ id: string; time: number }>;
		channels: Array<{ id: string; time: number }>;
	};
	casesCount: number;
	ignoredChannels: string[];
	customCommands: Array<{ name: string; answer: string }>;
	commands: unknown[];
	autoDeleteModCommands: boolean;
	disabledCategories: string[];
}

const defaultLanguage = languageMeta.find((l) => l.default)?.name ?? "en-US";

const guildSchema = new Schema<IGuild>({
	id: { type: String, required: true },
	membersData: { type: Object, default: {} },
	members: [{ type: Schema.Types.ObjectId, ref: "Member" }],
	language: { type: String, default: defaultLanguage },
	plugins: {
		type: Object,
		default: {
			welcome: { enabled: false, message: null, channel: null, withImage: null },
			goodbye: { enabled: false, message: null, channel: null, withImage: null },
			autorole: { enabled: false, role: null },
			automod: { enabled: false, ignored: [] },
			warnsSanctions: { kick: false, ban: false },
			tickets: { enabled: false, category: null },
			suggestions: false,
			modlogs: false,
			reports: false,
			logs: false,
		},
	},
	slowmode: {
		type: Object,
		default: { users: [], channels: [] },
	},
	casesCount: { type: Number, default: 0 },
	ignoredChannels: { type: [String], default: [] },
	customCommands: { type: [Object], default: [] },
	commands: { type: [Object], default: [] },
	autoDeleteModCommands: { type: Boolean, default: false },
	disabledCategories: { type: [String], default: [] },
});

export default mongoose.model<IGuild>("Guild", guildSchema);

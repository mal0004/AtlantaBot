declare module "discord-sync-commands" {
	import type { Client } from "discord.js";
	interface SyncResult {
		currentCommandCount: number;
		newCommandCount: number;
		deletedCommandCount: number;
		updatedCommandCount: number;
	}
	interface SyncOptions {
		debug?: boolean;
		guildId?: string | null;
	}
	function syncCommands(client: Client, commands: any[], options?: SyncOptions): Promise<SyncResult>;
	export = syncCommands;
}

declare module "lyrics-finder" {
	function lyricsFinder(artist: string, title: string): Promise<string | null>;
	export = lyricsFinder;
}

declare module "ascii-table" {
	class AsciiTable {
		constructor(title?: string);
		setHeading(...headings: string[]): this;
		addRow(...columns: (string | number)[]): this;
		toString(): string;
	}
	export = AsciiTable;
}

declare module "colors-generator" {
	interface Colors {
		get(): string[];
	}
	function generate(color: string, count: number): Colors;
	export { generate };
}

import { ActivityType } from "discord.js";
import syncCommands from "discord-sync-commands";
import type Atlanta from "../base/Atlanta.js";
import { initDBLStats } from "../helpers/discordbots.js";
import { initUnmuteChecker } from "../helpers/checkUnmutes.js";
import { initRemindChecker } from "../helpers/checkReminds.js";
import pkg from "../../package.json" with { type: "json" };
const { version } = pkg;

export default class ReadyEvent {
	client: Atlanta;

	constructor(client: Atlanta) {
		this.client = client;
	}

	async run(): Promise<void> {
		const client = this.client;

		client.logger.log(
			`Loading a total of ${client.commands.size} command(s).`,
			"log"
		);
		client.logger.log(
			`${client.user!.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`,
			"ready"
		);

		const commandData = client.commands.map((cmd) => cmd.slashCommand.toJSON());
		const result = await syncCommands(client, commandData, { debug: true });
		client.logger.log(
			`Slash commands synced: ${result.newCommandCount} new, ${result.updatedCommandCount} updated, ${result.deletedCommandCount} deleted.`,
			"log"
		);

		initDBLStats(client);
		initUnmuteChecker(client);
		initRemindChecker(client);

		if (client.config.dashboard.enabled) {
			const { loadDashboard } = await import("../dashboard/app.js");
			loadDashboard(client);
		}

		const statusList = client.config.status;
		let i = 0;
		setInterval(() => {
			const entry = statusList[i];
			const display = entry.name.replace("{serversCount}", String(client.guilds.cache.size)) + ` | v${version}`;
			const typeMap: Record<string, ActivityType> = {
				Playing: ActivityType.Playing,
				Listening: ActivityType.Listening,
				Watching: ActivityType.Watching,
				Competing: ActivityType.Competing,
			};
			client.user!.setActivity(display, { type: typeMap[entry.type] ?? ActivityType.Playing });
			i = (i + 1) % statusList.length;
		}, 20000);
	}
}

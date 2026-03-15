import chalk from "chalk";

function pad(value: number, digits: number): string {
	return value.toString().padStart(digits, "0");
}

function format(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}.${pad(d.getMilliseconds(), 3)}`;
}

type LogLevel = "log" | "warn" | "error" | "debug" | "cmd" | "ready";

export default class Logger {
	static log(content: string, type: LogLevel = "log"): void {
		const date = `[${format(new Date())}]:`;
		switch (type) {
			case "log":
				console.log(`${date} ${chalk.bgBlue(type.toUpperCase())} ${content}`);
				break;
			case "warn":
				console.log(`${date} ${chalk.black.bgYellow(type.toUpperCase())} ${content}`);
				break;
			case "error":
				console.log(`${date} ${chalk.black.bgRed(type.toUpperCase())} ${content}`);
				break;
			case "debug":
				console.log(`${date} ${chalk.green(type.toUpperCase())} ${content}`);
				break;
			case "cmd":
				console.log(`${date} ${chalk.black.bgWhite(type.toUpperCase())} ${content}`);
				break;
			case "ready":
				console.log(`${date} ${chalk.black.bgGreen(type.toUpperCase())} ${content}`);
				break;
			default:
				throw new TypeError("Logger type must be warn, debug, log, ready, cmd or error.");
		}
	}
}

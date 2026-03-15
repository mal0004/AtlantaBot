import type { Request, Response, NextFunction } from "express";

export default async function CheckAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
	if (!(req.session as any).user) {
		const redirectURL = req.originalUrl.includes("login") || req.originalUrl === "/"
			? "/selector"
			: req.originalUrl;
		const state = Math.random().toString(36).substring(5);
		req.client.states[state] = redirectURL;
		res.redirect(`/api/login?state=${state}`);
		return;
	}
	next();
}

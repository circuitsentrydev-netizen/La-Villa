import type { Config } from "@netlify/functions";
// Self-contained bundle of the Express backend, produced by `npm run build:netlify` in ../backend.
import backend from "../../../backend/dist-netlify/api.cjs";

export default (req: Request) => backend.handleRequest(req);

export const config: Config = {
  path: ["/api/*", "/uploads/*"],
  preferStatic: true,
};

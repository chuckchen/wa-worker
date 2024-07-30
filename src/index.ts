/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const CWA_API = "https://cloudflareinsights.com/cdn-cgi/rum";
const CWA_SCRIPT = "https://static.cloudflareinsights.com/beacon.min.js";

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		let { pathname, search } = new URL(request.url);
		if (pathname.endsWith(".js")) {
			let response = await caches.default.match(request);
			if (!response) {
				response = await fetch(CWA_SCRIPT, request);
				if (request) {
					ctx.waitUntil(caches.default.put(request, response.clone()));
				}
			}
			return response;
		}
		const req = new Request(request);
		req.headers.delete("cookie");
		const response = await fetch(`${CWA_API}${search}`, req);
		const headers = Object.fromEntries(response.headers.entries());
		if (!response.headers.has("Access-Control-Allow-Origin")) {
			headers["Access-Control-Allow-Origin"] =
				request.headers.get("Origin") || "*";
		}
		if (!response.headers.has("Access-Control-Allow-Headers")) {
			headers["Access-Control-Allow-Headers"] = "content-type";
		}
		if (!response.headers.has("Access-Control-Allow-Credentials")) {
			headers["Access-Control-Allow-Credentials"] = "true";
		}
		return new Response(response.body, {
			status: response.status,
			headers,
		});
	},
} satisfies ExportedHandler<Env>;

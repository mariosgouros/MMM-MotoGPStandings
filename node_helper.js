"use strict";

/* MMM-MotoGPStandings – node helper
 * Fetches season -> category -> standings from the MotoGP (Pulselive) API.
 * Runs server-side so there are no browser CORS issues.
 * Requires Node.js 18+ (global fetch), which current MagicMirror versions already need.
 */

const NodeHelper = require("node_helper");
const Log = require("logger");

const API_BASE = "https://api.motogp.pulselive.com/motogp/v1/results";
const REQUEST_TIMEOUT = 15000;

/** "MotoGP™" -> "motogp", "Moto 2" -> "moto2" */
const normalise = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function fetchJson(url) {
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(REQUEST_TIMEOUT)
	});
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} for ${url}`);
	}
	return response.json();
}

/** Current season first, then newest year first. */
function orderSeasons(seasons) {
	return [...seasons].sort((a, b) => {
		if (a.current !== b.current) return a.current ? -1 : 1;
		return (b.year ?? 0) - (a.year ?? 0);
	});
}

function mapRow(entry) {
	const rider = entry.rider ?? {};
	return {
		position: entry.position,
		number: rider.number ?? null,
		name: rider.full_name ?? "",
		country: rider.country?.iso ?? "",
		team: entry.team?.name ?? "",
		points: entry.points ?? 0
	};
}

async function getStandings(config) {
	const seasons = await fetchJson(`${API_BASE}/seasons`);
	if (!Array.isArray(seasons) || seasons.length === 0) {
		throw new Error("No seasons returned by the API");
	}

	const candidates = orderSeasons(seasons).slice(0, config.fallbackToPreviousSeason ? 2 : 1);
	const wanted = normalise(config.category);
	let firstResult = null;

	for (const season of candidates) {
		const categories = await fetchJson(`${API_BASE}/categories?seasonUuid=${encodeURIComponent(season.id)}`);
		const category = categories.find((c) => normalise(c.name) === wanted);
		if (!category) {
			const available = categories.map((c) => c.name).join(", ");
			throw new Error(`Category "${config.category}" not found for ${season.year}. Available: ${available}`);
		}

		const url = `${API_BASE}/standings?seasonUuid=${encodeURIComponent(season.id)}&categoryUuid=${encodeURIComponent(category.id)}`;
		const standings = await fetchJson(url);
		const rows = (standings.classification ?? []).map(mapRow).sort((a, b) => a.position - b.position);

		const result = { year: season.year, category: category.name, rows };
		if (rows.length > 0) return result;
		firstResult ??= result; // remember the empty current season in case nothing better exists
	}

	return firstResult;
}

module.exports = NodeHelper.create({
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
	},

	async socketNotificationReceived (notification, payload) {
		if (notification !== "MOTOGP_GET_STANDINGS") return;

		const { identifier, config } = payload;
		try {
			const data = await getStandings(config);
			this.sendSocketNotification("MOTOGP_STANDINGS_DATA", { identifier, data });
		} catch (error) {
			Log.error(`[${this.name}] ${error.message}`);
			this.sendSocketNotification("MOTOGP_STANDINGS_ERROR", { identifier, message: error.message });
		}
	}
});

// Exposed for testing only
module.exports._internals = { normalise, orderSeasons, mapRow, getStandings };

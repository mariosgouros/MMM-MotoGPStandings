/* MMM-MotoGPStandings
 * Displays MotoGP world championship standings for a chosen category.
 */

/* global Module */

// Column definitions live in one place so future UI work (flags, hiding columns,
// gap-to-leader, etc.) only needs to touch this list.
// `render(row, td)` fills a body cell; `label` is the header text.
const MOTOGP_COLUMNS = [
	{ key: "position", label: "Pos", className: "position", value: (r) => r.position },
	{
		key: "rider",
		label: "Rider",
		className: "rider",
		// The number keeps the default text colour; only the name is highlighted (see CSS).
		render: (td, r) => {
			if (r.number != null) {
				const number = document.createElement("span");
				number.className = "rider-number";
				number.textContent = r.number;
				td.appendChild(number);
				td.appendChild(document.createTextNode(" "));
			}
			const name = document.createElement("span");
			name.className = "rider-name";
			name.textContent = r.name;
			td.appendChild(name);
		}
	},
	{
		key: "nation",
		label: "Nation",
		className: "nation",
		render: (td, r, ctx) => {
			const iso = String(r.country || "").toLowerCase();
			if (!ctx.config.showFlags || !/^[a-z]{2}$/.test(iso)) {
				td.textContent = r.country;
				return;
			}
			const img = document.createElement("img");
			img.className = "flag";
			img.src = ctx.file(`flags/${iso}.svg`);
			img.alt = r.country;
			img.title = r.country;
			// Unknown flag file -> fall back to the ISO code as text
			img.addEventListener("error", () => { td.textContent = r.country; });
			td.appendChild(img);
		}
	},
	{ key: "team", label: "Team", className: "team", value: (r) => r.team },
	{ key: "points", label: "Points", className: "points", value: (r) => r.points }
];

// Columns shown in the "compact" view
const MOTOGP_COMPACT_COLUMNS = ["position", "rider", "points"];

Module.register("MMM-MotoGPStandings", {
	defaults: {
		category: "MotoGP", // "MotoGP", "Moto2", "Moto3" or "MotoE"
		viewMode: "full", // "full" = all columns, "compact" = position, rider and points
		showFlags: true, // national flags instead of ISO codes in the Nation column
		maxRows: 0, // 0 = show every rider
		fadeOut: true, // fade the last 2 visible rows (only applies when maxRows is not 0)
		updateInterval: 60 * 60 * 1000, // 1 hour
		retryDelay: 5 * 60 * 1000, // retry after a failed update
		fallbackToPreviousSeason: true, // use last season if the new one has no standings yet
		animationSpeed: 1000
	},

	start () {
		this.standings = null;
		this.error = null;
		this.updateTimer = null;
		this.requestStandings();
	},

	getStyles () {
		return ["MMM-MotoGPStandings.css"];
	},

	getHeader () {
		if (this.data.header) return this.data.header; // user-defined header wins
		if (this.standings) return `${this.standings.category} Standings ${this.standings.year}`;
		return undefined;
	},

	requestStandings () {
		this.sendSocketNotification("MOTOGP_GET_STANDINGS", {
			identifier: this.identifier,
			config: this.config
		});
	},

	scheduleNext (delay) {
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(() => this.requestStandings(), delay);
	},

	socketNotificationReceived (notification, payload) {
		if (!payload || payload.identifier !== this.identifier) return;

		if (notification === "MOTOGP_STANDINGS_DATA") {
			this.standings = payload.data;
			this.error = null;
			this.scheduleNext(this.config.updateInterval);
		} else if (notification === "MOTOGP_STANDINGS_ERROR") {
			this.error = payload.message;
			this.scheduleNext(this.config.retryDelay);
		} else {
			return;
		}
		this.updateDom(this.config.animationSpeed);
	},

	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = "motogp-standings";

		if (this.error && !this.standings) {
			wrapper.className += " dimmed light small";
			wrapper.textContent = `MotoGP standings unavailable: ${this.error}`;
			return wrapper;
		}
		if (!this.standings) {
			wrapper.className += " dimmed light small";
			wrapper.textContent = "Loading MotoGP standings…";
			return wrapper;
		}
		if (this.standings.rows.length === 0) {
			wrapper.className += " dimmed light small";
			wrapper.textContent = "No standings available yet.";
			return wrapper;
		}

		const table = document.createElement("table");
		table.className = "small";

		const columns = this.config.viewMode === "compact"
			? MOTOGP_COLUMNS.filter((col) => MOTOGP_COMPACT_COLUMNS.includes(col.key))
			: MOTOGP_COLUMNS;

		const headRow = document.createElement("tr");
		headRow.className = "dimmed";
		columns.forEach((col) => {
			const th = document.createElement("th");
			th.className = col.className;
			th.textContent = col.label;
			headRow.appendChild(th);
		});
		table.appendChild(headRow);

		const limit = this.config.maxRows > 0 ? this.config.maxRows : this.standings.rows.length;
		const visibleRows = this.standings.rows.slice(0, limit);
		const fade = this.config.fadeOut && this.config.maxRows > 0;
		const fadeCount = Math.min(2, visibleRows.length);

		visibleRows.forEach((row, index) => {
			const tr = document.createElement("tr");
			columns.forEach((col) => {
				const td = document.createElement("td");
				td.className = col.className;
				if (col.render) {
					col.render(td, row, this);
				} else {
					td.textContent = col.value(row);
				}
				tr.appendChild(td);
			});

			// Last two rows: 2/3 and 1/3 opacity
			const fromEnd = visibleRows.length - index; // 1 = last row
			if (fade && fromEnd <= fadeCount) {
				tr.style.opacity = String(1 - (fadeCount + 1 - fromEnd) / (fadeCount + 1));
			}
			table.appendChild(tr);
		});

		wrapper.appendChild(table);
		return wrapper;
	}
});

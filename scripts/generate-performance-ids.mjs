import { writeFileSync } from "node:fs";

const ids = (prefix, count) =>
	Array.from(
		{ length: count },
		(_, index) =>
			`${prefix}-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
	);
writeFileSync(
	new URL("../docs/performance/fixture-ids.json", import.meta.url),
	`${JSON.stringify({ empresas: ids("10000000", 100), candidaturas: ids("20000000", 1000) }, null, 2)}\n`,
);

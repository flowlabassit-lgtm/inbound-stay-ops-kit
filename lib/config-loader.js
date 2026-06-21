export const CONFIG_CANDIDATE_PATHS = [
  "./config.json",
  "./samples/demo.config.json",
  "./config.example.json"
];

export async function loadConfigFromCandidates(fetchImpl = fetch, paths = CONFIG_CANDIDATE_PATHS) {
  const errors = [];

  for (const path of paths) {
    try {
      const response = await fetchImpl(path, { cache: "no-store" });

      if (response?.ok) {
        return {
          config: await response.json(),
          path,
          fallbackUsed: path !== paths[0]
        };
      }

      errors.push(`${path}: ${response?.status || "not found"}`);
    } catch (error) {
      errors.push(`${path}: ${error.message || String(error)}`);
    }
  }

  throw new Error(`Unable to load a stay config. Tried ${paths.join(", ")}. ${errors.join(" | ")}`);
}

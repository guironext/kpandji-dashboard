import { getConteneursTransiteDejaRenseigne } from "../lib/actions/conteneur";
import { Decimal } from "@prisma/client/runtime/library";

async function main() {
  console.log("Running getConteneursTransiteDejaRenseigne...");
  try {
    const result = await getConteneursTransiteDejaRenseigne();
    console.log("Action returned. Success:", result.success);

    if (!result.success) {
      console.error("Error:", result.error);
      return;
    }

    const data = result.data;
    console.log(`Received ${data.length} items.`);

    // Helper to check for non-plain objects
    function scan(obj: any, path = "") {
      if (obj === null || obj === undefined) return;

      if (typeof obj !== "object") return;

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => scan(item, `${path}[${index}]`));
        return;
      }

      // Check constructor
      const proto = Object.getPrototypeOf(obj);
      if (proto !== Object.prototype && proto !== null) {
        const description = obj.constructor ? obj.constructor.name : "unknown";
        console.error(`[Non-Plain Object] At ${path}: ${description}`);
        // Special check for Decimal
        if (description === "Decimal" || obj instanceof Decimal) {
          console.error(`  -> Found Decimal object! Value: ${obj.toString()}`);
        }
        if (obj instanceof Date) {
          console.error(`  -> Found Date object! Value: ${obj.toISOString()}`);
        }
      }

      for (const key in obj) {
        scan(obj[key], `${path}.${key}`);
      }
    }

    scan(data);
    console.log("Scan complete.");
  } catch (error) {
    console.error("Action threw error:", error);
  }
}

main();

import { getAllCommandesProposition } from "../lib/actions/commande";
import { Decimal } from "@prisma/client/runtime/library";

async function main() {
  console.log("Testing getAllCommandesProposition...");
  try {
    const result = await getAllCommandesProposition();
    if (result.success) {
      const data = result.data ?? [];
      console.log(`Received ${data.length} commandes.`);
      if (data.length > 0) {
        const first = data[0];

        // Check serialization
        function scan(obj: any, path = "") {
          if (obj === null || obj === undefined) return;
          if (typeof obj !== "object") return;
          if (Array.isArray(obj)) {
            obj.forEach((item: any, index: number) =>
              scan(item, `${path}[${index}]`),
            );
            return;
          }

          const proto = Object.getPrototypeOf(obj);
          if (proto !== Object.prototype && proto !== null) {
            const desc = obj.constructor ? obj.constructor.name : "ukn";
            if (desc === "Decimal" || obj instanceof Decimal) {
              console.error(`[FAIL] Found Decimal at ${path}: ${obj}`);
            } else if (obj instanceof Date) {
              console.error(
                `[FAIL] Found Date at ${path}: ${obj.toISOString()}`,
              );
            }
          }

          for (const key in obj) {
            scan(obj[key], `${path}.${key}`);
          }
        }
        scan(first);
        console.log("Scan complete.");
      }
    } else {
      console.error("Action Failed:", result.error);
    }
  } catch (error) {
    console.error("Script Error:", error);
  }
}

main();

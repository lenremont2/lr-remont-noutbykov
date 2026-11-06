import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

export async function wp(args) {
  const sites = JSON.parse(
    await readFile("C:/Users/User/AppData/Roaming/Local/sites.json", "utf8"),
  );
  const site = Object.values(sites).find(
    (item) => item.name === "testing-gutenberg",
  );
  if (!site) throw new Error("Local test site not found");
  return new Promise((resolve, reject) => {
    const child = spawn(
      "C:/Users/User/AppData/Local/bin/php/php.exe",
      [
        "-c",
        "D:/works/lenremont-gutenberg/dist/php-cli.ini",
        "-d",
        "mysqli.default_port=" + site.services.mysql.ports.MYSQL[0],
        "C:/Users/User/AppData/Local/bin/wp-cli/wp-cli.phar",
        "--path=C:/Users/User/Local Sites/testing-gutenberg/app/public",
        "--user=admin",
        ...args,
      ],
      { windowsHide: true },
    );
    let out = "",
      err = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (s) => (out += s));
    child.stderr.on("data", (s) => (err += s));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(err || out)),
    );
  });
}
if (process.argv[2] === "snapshot") {
  const dir = "artifacts/gutenberg-2026-11-06/";
  for (const operation of ["preflight", "runtime"]) {
    await writeFile(
      dir + operation + ".json",
      await wp([
        "eval",
        `if(home_url()!=="http://testing-gutenberg.local")throw new Exception("Wrong site");echo wp_json_encode(Lenremont\\PageImporter\\AgentApi::${operation}());`,
      ]),
    );
  }
  try {
    await writeFile(
      dir + "backup/page-hashes.json",
      await wp([
        "eval",
        'global $wpdb;echo wp_json_encode($wpdb->get_results("SELECT ID,post_status,post_author,post_parent,SHA2(post_content,256) AS hash FROM {$wpdb->posts} WHERE post_type=0x70616765 ORDER BY ID",ARRAY_A));',
      ]),
      { flag: "wx" },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  console.log(
    "Saved local site preflight, compiler runtime, and existing page hashes.",
  );
}

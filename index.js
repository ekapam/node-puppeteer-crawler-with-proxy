const puppeteer = require("puppeteer");
const { config } = require("dotenv");
config();

(async () => {
  console.time("Total Crawling Time");

  const args = process.argv.slice(2);
  const domainArg = args.find((a) => a.startsWith("-domain="));
  const classArg = args.find((a) => a.startsWith("-class="));
  const pathsToAvoidArg = args.find((a) => a.startsWith("-pathsToAvoid="));
  const useProxy = args.includes("-proxy");

  if (!domainArg || !classArg) {
    console.error(
      "Uso: node crawler-proxy.js -domain=https://example.com -class=mi-clase [-pathsToAvoid=(a,b)] [-proxy]"
    );
    process.exit(1);
  }

  const domainToCrawl = domainArg.split("=")[1];
  const classToFind = classArg.split("=")[1];

  let pathsToAvoid = [];
  if (pathsToAvoidArg) {
    const value = pathsToAvoidArg.split("=")[1].trim();
    const match = value.match(/^\((.*)\)$/);
    const raw = match ? match[1] : value;
    pathsToAvoid = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const proxyURL = useProxy ? process.env.PROXY_URL : null;
  const username = useProxy ? process.env.PROXY_USER : null;
  const password = useProxy ? process.env.PROXY_PASS : null;

  const launchArgs = [];
  if (useProxy && proxyURL) {
    launchArgs.push(`--proxy-server=${proxyURL}`);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: launchArgs,
  });

  try {
    const page = await browser.newPage();

    if (useProxy && username && password) {
      await page.authenticate({ username, password });
    }

    const normalize = (raw) => {
      try {
        const u = new URL(raw);
        u.hash = "";
        if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
        return u.toString();
      } catch (e) {
        return null;
      }
    };

    const baseHostname = (() => {
      try {
        return new URL(domainToCrawl).hostname;
      } catch (e) {
        return null;
      }
    })();

    const visited = new Set();
    const results = [];
    let totalLinksVisited = 0;

    const queue = [normalize(domainToCrawl)];

    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      if (visited.has(current)) continue;
      if (pathsToAvoid.some((p) => current.includes(p))) continue;

      visited.add(current);
      totalLinksVisited++;

      try {
        const response = await page.goto(current, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        const status = response ? response.status() : "no-response";

        let found = false;
        try {
          found = await page.evaluate((targetClass) => {
            const nodes = document.querySelectorAll("[class]");
            return Array.from(nodes).some((el) => {
              const cls = el.getAttribute("class");
              if (!cls) return false;
              return cls
                .split(/\s+/)
                .some(
                  (token) =>
                    token === targetClass || token.startsWith(targetClass)
                );
            });
          }, classToFind);
        } catch (e) {
          console.error("Error en page.evaluate:", e.message);
        }

        results.push({ url: current, status, found });

        console.log(
          `Visited: ${current} - Status: ${status} - Found: ${
            found ? "Yes" : "No"
          }`
        );

        let links = [];
        try {
          links = await page.evaluate(() =>
            Array.from(document.querySelectorAll("a"))
              .map((a) => a.href)
              .filter(Boolean)
          );
        } catch (e) {
          console.error("Error extrayendo links:", e.message);
        }

        for (const rawLink of links) {
          if (
            !rawLink.startsWith("http://") &&
            !rawLink.startsWith("https://")
          )
            continue;
          const n = normalize(rawLink);
          if (!n) continue;
          const hostname = new URL(n).hostname;
          if (hostname !== baseHostname) continue;
          if (visited.has(n)) continue;
          if (pathsToAvoid.some((p) => n.includes(p))) continue;
          queue.push(n);
        }
      } catch (err) {
        console.error(`Error navegando a ${current}: ${err.message}`);
        results.push({ url: current, status: "error", found: false });
      }
    }

    console.table(results);
    console.log(`Total Links Visited: ${totalLinksVisited}`);
  } finally {
    await browser.close();
    console.timeEnd("Total Crawling Time");
  }
})();

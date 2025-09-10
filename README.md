# Puppeteer Crawler with Optional Proxy

This project is a **Node.js web crawler** that uses [Puppeteer](https://pptr.dev/) to traverse all pages of a domain and search for a specific CSS class.  
It supports **path exclusions** and **optional proxy usage** configured via a `.env` file.

---

## 🚀 Features

- Recursive crawling of all pages within a domain.
- Searches for a specific CSS class on each page.
- Supports excluding routes via CLI argument.
- Optional HTTP/S proxy with authentication via `.env`.
- Reports results in a table (`console.table`) with summary statistics.
- URL normalization to avoid duplicate visits.
- Skips external links and unsupported protocols (`mailto:`, `tel:`, etc.).

---

## 📦 Installation

Clone the repository and navigate to the project folder:

```bash
git clone https://github.com/youruser/crawler-proxy.git
cd crawler-proxy
```

Install dependencies:

```bash
npm install puppeteer dotenv
```

If you plan to use a proxy, create a `.env` file in the project root:

```env
PROXY_URL=http://my-proxy:3128
PROXY_USER=username
PROXY_PASS=password
```

---

## 🛠️ Usage

Run the script from the terminal:

### Without proxy
```bash
node crawler-proxy.js -domain=https://example.com -class=pp-posts
```

### With proxy (uses `.env` values)
```bash
node crawler-proxy.js -domain=https://example.com -class=pp-posts -proxy
```

### Excluding specific paths
```bash
node crawler-proxy.js -domain=https://example.com -class=pp-posts -pathsToAvoid=(/wp-admin,/login)
```

---

## 📌 Available Arguments

- `-domain=<url>` → **Required.** Base domain to crawl.  
- `-class=<name>` → **Required.** CSS class to search for on each page.  
- `-pathsToAvoid=(a,b,c)` → Optional. Comma-separated list of subpaths to skip.  
- `-proxy` → Optional. Enables proxy usage with credentials from `.env`.  

---

## 📊 Example Output

```text
Visited: https://example.com - Status: 200 - Found: Yes
Visited: https://example.com/about - Status: 200 - Found: No
Visited: https://example.com/blog - Status: 200 - Found: Yes

┌─────────┬───────────────────────────────┬─────────┬───────┐
│ (index) │ url                           │ status  │ found │
├─────────┼───────────────────────────────┼─────────┼───────┤
│    0    │ 'https://example.com'         │   200   │ true  │
│    1    │ 'https://example.com/about'   │   200   │ false │
│    2    │ 'https://example.com/blog'    │   200   │ true  │
└─────────┴───────────────────────────────┴─────────┴───────┘

Total Links Visited: 15
Total Crawling Time: 3.21s
```

---

## ⚠️ Notes

- The script runs sequentially (single tab). It may be slow on large sites.  
- It does **not** respect `robots.txt`. Ensure you comply with site policies before using it.  
- For very large websites, consider adding crawl depth limits or concurrency in future enhancements.  

---

## 📄 License

MIT License. Free to use and modify.

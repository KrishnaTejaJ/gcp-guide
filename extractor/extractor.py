import asyncio
import json
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

# CONFIGURATION
CONCURRENT_PAGES = 10  # Process 10 URLs at once
INPUT_FILE = "urls.txt"
OUTPUT_FILE = "gcp_full_structured_data.json"

async def scrape_url(context, url):
    """Parses a single URL into a structured format of tags and text."""
    page = await context.new_page()
    result = {"metadata": {"url": url, "company": ""}, "content": []}
    
    try:
        # 1. Network Idle is crucial for Google's dynamic JS content
        await page.goto(url, wait_until="networkidle", timeout=60000)
        
        # 2. Wait for the H1 or Main to ensure the story has rendered
        await page.wait_for_selector('h1, main', timeout=15000)
        
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        # 3. Find the main content container
        main = soup.find('main') or soup.find('article') or soup.find('body')
        
        # Extract Company Name
        h1 = soup.find('h1')
        result["metadata"]["company"] = h1.get_text(strip=True) if h1 else "Unknown"

        # 4. Extract Structured Tags
        if main:
            # We look for headers and paragraphs to maintain the story structure
            for element in main.find_all(['h2', 'h3', 'p', 'li']):
                text = element.get_text(strip=True)
                if text:
                    result["content"].append({
                        "tag": element.name,
                        "text": text
                    })
        
        print(f"✅ Extracted: {result['metadata']['company']}")
        return result

    except Exception as e:
        print(f"❌ Error on {url}: {e}")
        return {"metadata": {"url": url, "error": str(e)}, "content": []}
    finally:
        await page.close()

async def main():
    with open(INPUT_FILE, "r") as f:
        urls = [line.strip() for line in f.readlines()]

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Use a real user agent to avoid bot detection
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        all_results = []
        
        # Batching logic: process 10 at a time
        for i in range(0, len(urls), CONCURRENT_PAGES):
            batch = urls[i:i + CONCURRENT_PAGES]
            tasks = [scrape_url(context, url) for url in batch]
            batch_results = await asyncio.gather(*tasks)
            all_results.extend(batch_results)
            
            # Save progress every batch so you don't lose data if it crashes
            with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
                json.dump(all_results, f, indent=4, ensure_ascii=False)
            
            print(f"--- Progress: {len(all_results)}/{len(urls)} ---")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
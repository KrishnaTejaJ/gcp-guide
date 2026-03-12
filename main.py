#!/usr/bin/env python3
"""
GCP Case Study Web Crawler
Extracts company information from Google Cloud Platform customer case study pages.

Features:
- Reads URLs from a file (one URL per line)
- Checkpoint/resume functionality - saves progress after each URL
- Outputs to CSV/Excel and JSON

Usage:
    python gcp_case_study_crawler.py urls.txt
    python gcp_case_study_crawler.py urls.txt --resume  # Resume from checkpoint
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import time
import random
import re
from datetime import datetime
import os
import sys
import argparse

# Configuration
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}

REQUEST_TIMEOUT = 30
MIN_DELAY = 2
MAX_DELAY = 5
MAX_RETRIES = 3
RETRY_DELAY = 10

# Checkpoint settings
OUTPUT_DIR = "gcp_case_studies_output"
CHECKPOINT_FILE = os.path.join(OUTPUT_DIR, "checkpoint.json")
PROGRESS_CSV = os.path.join(OUTPUT_DIR, "gcp_case_studies_progress.csv")
PROGRESS_JSON = os.path.join(OUTPUT_DIR, "gcp_case_studies_full_content_progress.json")
FAILED_URLS_FILE = os.path.join(OUTPUT_DIR, "failed_urls.txt")

# How often to save checkpoint (every N URLs)
CHECKPOINT_INTERVAL = 5


def get_random_delay():
    return random.uniform(MIN_DELAY, MAX_DELAY)


def load_urls_from_file(filepath):
    urls = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            url = line.strip()
            if url and not url.startswith('#'):
                urls.append(url)
    return urls


def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def save_checkpoint(processed_urls, last_index):
    checkpoint = {
        'processed_urls': list(processed_urls),
        'last_index': last_index,
        'timestamp': datetime.now().isoformat()
    }
    with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
        json.dump(checkpoint, f, indent=2)


def load_progress_data():
    structured_data = []
    full_content = {}
    
    if os.path.exists(PROGRESS_CSV):
        try:
            df = pd.read_csv(PROGRESS_CSV, encoding='utf-8')
            structured_data = df.to_dict('records')
            print(f"  Loaded {len(structured_data)} records from progress CSV")
        except Exception as e:
            print(f"  Warning: Could not load progress CSV: {e}")
    
    if os.path.exists(PROGRESS_JSON):
        try:
            with open(PROGRESS_JSON, 'r', encoding='utf-8') as f:
                full_content = json.load(f)
            print(f"  Loaded {len(full_content)} records from progress JSON")
        except Exception as e:
            print(f"  Warning: Could not load progress JSON: {e}")
    
    return structured_data, full_content


def save_progress_data(structured_data, full_content):
    if structured_data:
        df = pd.DataFrame(structured_data)
        column_order = ['company_name', 'location', 'industry', 'products', 
                       'description', 'url', 'first_published_wayback']
        df = df[[col for col in column_order if col in df.columns]]
        df.to_csv(PROGRESS_CSV, index=False, encoding='utf-8')
    
    if full_content:
        with open(PROGRESS_JSON, 'w', encoding='utf-8') as f:
            json.dump(full_content, f, indent=2, ensure_ascii=False)


def append_failed_url(url, error_msg):
    with open(FAILED_URLS_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{url}\t{error_msg}\t{datetime.now().isoformat()}\n")


def make_request(url, session, retries=MAX_RETRIES):
    response = None
    for attempt in range(retries):
        try:
            response = session.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response
            
        except requests.exceptions.Timeout:
            print(f"  Timeout on attempt {attempt + 1}")
            if attempt < retries - 1:
                time.sleep(RETRY_DELAY)
                
        except requests.exceptions.HTTPError as e:
            print(f"  HTTP Error: {e}")
            if response is not None and response.status_code == 429:
                print(f"  Rate limited. Waiting {RETRY_DELAY * 2} seconds...")
                time.sleep(RETRY_DELAY * 2)
            elif response is not None and response.status_code >= 500:
                time.sleep(RETRY_DELAY)
            else:
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"  Request error: {e}")
            if attempt < retries - 1:
                time.sleep(RETRY_DELAY)
                
    return None


def get_wayback_date(url):
    if not url or url == 'N/A':
        return "N/A"

    api_url = f"http://archive.org/wayback/available?url={url}&timestamp=19000101"
    
    try:
        response = requests.get(api_url, timeout=10)
        data = response.json()
        
        if data.get("archived_snapshots"):
            snapshot = data["archived_snapshots"]["closest"]
            ts = snapshot["timestamp"]
            return f"{ts[:4]}-{ts[4:6]}-{ts[6:8]}"
        else:
            return "Not Found"
            
    except Exception as e:
        return "Error"


def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_products_from_div(soup):
    """Extract products from products div."""
    products = []
    products_div = soup.find('div', class_='products')
    
    if products_div:
        # Method 1: div.products > div.hr-center > span > a
        hr_center = products_div.find('div', class_='hr-center')
        if hr_center:
            for span in hr_center.find_all('span'):
                link = span.find('a')
                if link:
                    text = link.get_text(strip=True)
                    if text:
                        products.append(text)
        
        # Method 2: All links in products div
        if not products:
            for link in products_div.find_all('a'):
                text = link.get_text(strip=True)
                if text:
                    products.append(text)
        
        # Method 3: All spans in products div
        if not products:
            for span in products_div.find_all('span'):
                text = span.get_text(strip=True)
                if text:
                    products.append(text)
    
    return products


def extract_from_aside_block(soup, url):
    """Extract data from aside-content-block structure."""
    data = {
        'company_name': 'N/A',
        'location': 'N/A',
        'industry': 'N/A',
        'products': 'N/A',
        'description': 'N/A',
        'url': url
    }
    
    aside = soup.find('section', class_='aside-content-block')
    if not aside:
        aside = soup.find('div', class_='aside-content-block')
    
    if aside:
        about_heading = aside.find('h2', class_='headline-big')
        if about_heading:
            name_text = about_heading.get_text(strip=True)
            if name_text.lower().startswith('about '):
                data['company_name'] = name_text[6:].strip()
            else:
                data['company_name'] = name_text
        
        description_p = aside.find('p', class_='paragraph')
        if description_p:
            data['description'] = clean_text(description_p.get_text())
        
        industry_div = aside.find('div', class_='industry')
        if industry_div:
            spans = industry_div.find_all('span')
            if len(spans) >= 2:
                data['industry'] = clean_text(spans[1].get_text())
        
        location_div = aside.find('div', class_='location')
        if location_div:
            location_text = location_div.get_text()
            if 'Location:' in location_text:
                data['location'] = clean_text(location_text.split('Location:')[1])
    
    products = extract_products_from_div(soup)
    if products:
        data['products'] = ', '.join(products)
    
    return data


def extract_from_content_div(soup, url):
    """Extract data from KYEq9 class structure."""
    data = {
        'company_name': 'N/A',
        'location': 'N/A',
        'industry': 'N/A',
        'products': 'N/A',
        'description': 'N/A',
        'url': url
    }
    
    content_div = soup.find('div', class_='KYEq9')
    if not content_div:
        content_div = soup.find('div', class_=re.compile(r'KYEq'))
    
    if content_div:
        paragraphs = content_div.find_all('p')
        
        for p in paragraphs:
            text = p.get_text()
            
            bold = p.find('b')
            if bold and not any(keyword in text for keyword in ['Industry:', 'Location:', 'Products:', 'About Google Cloud partner']):
                if data['company_name'] == 'N/A':
                    data['company_name'] = clean_text(bold.get_text())
                    data['description'] = clean_text(text)
            
            if 'Industry:' in text:
                match = re.search(r'Industry:\s*(.+?)(?:\n|$)', text)
                if match:
                    data['industry'] = clean_text(match.group(1))
                else:
                    data['industry'] = clean_text(text.replace('Industry:', '').strip())
            
            if 'Location:' in text:
                match = re.search(r'Location:\s*(.+?)(?:\n|$)', text)
                if match:
                    data['location'] = clean_text(match.group(1))
                else:
                    data['location'] = clean_text(text.replace('Location:', '').strip())
            
            if 'Products:' in text or 'Products ' in text:
                product_links = p.find_all('a')
                if product_links:
                    products = [clean_text(link.get_text()) for link in product_links 
                               if 'cloud.google.com' in link.get('href', '') or 
                               'gemini.google' in link.get('href', '')]
                    if products:
                        data['products'] = ', '.join(products)
    
    return data


def extract_full_content(soup, url):
    """Extract the full page content for JSON storage."""
    content = {
        'url': url,
        'title': '',
        'meta_description': '',
        'main_content': '',
        'headings': [],
        'quotes': [],
        'statistics': [],
        'extracted_at': datetime.now().isoformat()
    }
    
    title_tag = soup.find('title')
    if title_tag:
        content['title'] = clean_text(title_tag.get_text())
    
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc:
        content['meta_description'] = meta_desc.get('content', '')
    
    article = soup.find('article') or soup.find('main') or soup.find('div', class_='content')
    if article:
        paragraphs = article.find_all('p')
        content['main_content'] = '\n\n'.join([clean_text(p.get_text()) for p in paragraphs if p.get_text(strip=True)])
        
        for level in range(1, 7):
            headings = article.find_all(f'h{level}')
            for h in headings:
                content['headings'].append({
                    'level': level,
                    'text': clean_text(h.get_text())
                })
        
        quotes = article.find_all(['blockquote', 'q'])
        for quote in quotes:
            content['quotes'].append(clean_text(quote.get_text()))
        
        stat_patterns = [r'(\d+%)', r'(\d+x)', r'(\$[\d,]+)', r'(\d+\s*million)', r'(\d+\s*billion)']
        text = article.get_text()
        for pattern in stat_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            content['statistics'].extend(matches)
        
        content['statistics'] = list(set(content['statistics']))
    
    return content


def scrape_case_study(url, session):
    """Scrape a single case study page."""
    response = make_request(url, session)
    if not response:
        return None, None
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Try first extraction method
    structured_data = extract_from_aside_block(soup, url)
    
    # Count non-N/A fields
    valid_fields = sum(1 for k, v in structured_data.items() if v != 'N/A' and k != 'url')
    
    # If first method didn't work well, try second method
    if valid_fields < 2:
        alt_data = extract_from_content_div(soup, url)
        alt_valid = sum(1 for k, v in alt_data.items() if v != 'N/A' and k != 'url')
        if alt_valid > valid_fields:
            structured_data = alt_data
    
    full_content = extract_full_content(soup, url)
    
    return structured_data, full_content


def main():
    parser = argparse.ArgumentParser(description='GCP Case Study Web Crawler')
    parser.add_argument('urls_file', help='Path to file containing URLs (one per line)')
    parser.add_argument('--resume', action='store_true', help='Resume from last checkpoint')
    parser.add_argument('--append', action='store_true', help='Append to existing data (skip already scraped URLs)')
    parser.add_argument('--skip-wayback', action='store_true', help='Skip Wayback Machine date lookup')
    args = parser.parse_args()
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    if not os.path.exists(args.urls_file):
        print(f"Error: URLs file not found: {args.urls_file}")
        sys.exit(1)
    
    urls = load_urls_from_file(args.urls_file)
    print(f"Loaded {len(urls)} URLs from {args.urls_file}")
    
    all_structured_data = []
    all_full_content = {}
    processed_urls = set()
    start_index = 0
    
    if args.resume:
        checkpoint = load_checkpoint()
        if checkpoint:
            processed_urls = set(checkpoint['processed_urls'])
            start_index = checkpoint['last_index']
            print(f"Resuming from checkpoint: {len(processed_urls)} URLs already processed")
            print(f"  Last index: {start_index}")
            all_structured_data, all_full_content = load_progress_data()
        else:
            print("No checkpoint found, starting from beginning")
    
    # Append mode: load existing final data and skip already scraped URLs
    if args.append:
        final_csv = os.path.join(OUTPUT_DIR, "gcp_case_studies.csv")
        final_json = os.path.join(OUTPUT_DIR, "gcp_case_studies_full_content.json")
        
        if os.path.exists(final_csv):
            try:
                df = pd.read_csv(final_csv, encoding='utf-8')
                all_structured_data = df.to_dict('records')
                # Add existing URLs to processed set
                for record in all_structured_data:
                    if 'url' in record:
                        processed_urls.add(record['url'])
                print(f"Append mode: Loaded {len(all_structured_data)} existing records")
                print(f"  {len(processed_urls)} URLs already scraped (will be skipped)")
            except Exception as e:
                print(f"  Warning: Could not load existing CSV: {e}")
        
        if os.path.exists(final_json):
            try:
                with open(final_json, 'r', encoding='utf-8') as f:
                    all_full_content = json.load(f)
                print(f"  Loaded {len(all_full_content)} existing JSON records")
            except Exception as e:
                print(f"  Warning: Could not load existing JSON: {e}")
    
    if not args.resume and not args.append and os.path.exists(FAILED_URLS_FILE):
        os.remove(FAILED_URLS_FILE)
    
    session = requests.Session()
    
    print(f"\nStarting crawl...")
    print(f"Total URLs: {len(urls)}")
    print(f"Already processed: {len(processed_urls)}")
    print(f"Remaining: {len(urls) - len(processed_urls)}")
    print("=" * 60)
    
    try:
        for i, url in enumerate(urls):
            if url in processed_urls:
                continue
            
            print(f"\n[{i+1}/{len(urls)}] Processing: {url}")
            
            try:
                structured_data, full_content = scrape_case_study(url, session)
                
                if structured_data:
                    if not args.skip_wayback:
                        wayback_date = get_wayback_date(url)
                        structured_data['first_published_wayback'] = wayback_date
                    else:
                        structured_data['first_published_wayback'] = 'Skipped'
                    
                    all_structured_data.append(structured_data)
                    print(f"  ✓ {structured_data['company_name']} | {structured_data['industry']} | {structured_data['location']}")
                    products_str = structured_data['products']
                    print(f"    Products: {products_str[:80]}..." if len(products_str) > 80 else f"    Products: {products_str}")
                else:
                    print(f"  ✗ Failed to extract data")
                    append_failed_url(url, "Failed to extract data")
                
                if full_content:
                    all_full_content[url] = full_content
                
                processed_urls.add(url)
                
                if len(processed_urls) % CHECKPOINT_INTERVAL == 0:
                    print(f"\n  [Saving checkpoint... {len(processed_urls)} URLs processed]")
                    save_checkpoint(processed_urls, i)
                    save_progress_data(all_structured_data, all_full_content)
                
                if i < len(urls) - 1:
                    delay = get_random_delay()
                    time.sleep(delay)
                    
            except KeyboardInterrupt:
                raise
            except Exception as e:
                print(f"  ✗ Error: {e}")
                append_failed_url(url, str(e))
                processed_urls.add(url)
                
    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("Interrupted! Saving progress...")
        save_checkpoint(processed_urls, i)
        save_progress_data(all_structured_data, all_full_content)
        print("Progress saved. Run with --resume to continue.")
        sys.exit(0)
    
    print("\n" + "=" * 60)
    print("Crawl complete!")
    
    save_checkpoint(processed_urls, len(urls))
    
    if all_structured_data:
        df = pd.DataFrame(all_structured_data)
        column_order = ['company_name', 'location', 'industry', 'products', 
                       'description', 'url', 'first_published_wayback']
        df = df[[col for col in column_order if col in df.columns]]
        
        csv_path = os.path.join(OUTPUT_DIR, "gcp_case_studies.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8')
        print(f"\nSaved to: {csv_path}")
        
        excel_path = os.path.join(OUTPUT_DIR, "gcp_case_studies.xlsx")
        df.to_excel(excel_path, index=False, engine='openpyxl')
        print(f"Saved to: {excel_path}")
        
        print(f"\nSummary:")
        print(f"  Total scraped: {len(df)}")
        print(f"  With location: {len(df[df['location'] != 'N/A'])}")
        print(f"  With industry: {len(df[df['industry'] != 'N/A'])}")
        print(f"  With products: {len(df[df['products'] != 'N/A'])}")
    
    if all_full_content:
        json_path = os.path.join(OUTPUT_DIR, "gcp_case_studies_full_content.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(all_full_content, f, indent=2, ensure_ascii=False)
        print(f"Saved to: {json_path}")
    
    if os.path.exists(FAILED_URLS_FILE):
        with open(FAILED_URLS_FILE, 'r') as f:
            failed_count = len(f.readlines())
        if failed_count > 0:
            print(f"\n⚠ {failed_count} URLs failed. See: {FAILED_URLS_FILE}")
    
    return df if all_structured_data else None


if __name__ == "__main__":
    main()
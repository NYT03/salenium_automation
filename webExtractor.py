import os
import requests
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def setup_driver():
    options = Options()
    options.add_argument("--headless")  # Run in headless mode (no GUI)
    service = Service("D:/HackNuthon_6/chromedriver-win64/chromedriver-win64/chromedriver.exe")  # Replace with your ChromeDriver path
    return webdriver.Chrome(service=service, options=options)

def get_relative_path(url, base_url):
    """Extract just the path that should be preserved relative to the base URL"""
    base_parsed = urlparse(base_url)
    url_parsed = urlparse(url)
    
    # If it's from a different domain, keep domain in path to avoid conflicts
    if url_parsed.netloc != base_parsed.netloc and url_parsed.netloc:
        return os.path.join(url_parsed.netloc, url_parsed.path.lstrip('/'))
    
    # Otherwise just use the path
    return url_parsed.path.lstrip('/')

def ensure_directory(file_path):
    """Ensure the directory for a file exists"""
    directory = os.path.dirname(file_path)
    if directory:
        os.makedirs(directory, exist_ok=True)

def save_file(content, file_path, mode="w", binary=False):
    ensure_directory(file_path)
    with open(file_path, "wb" if binary else mode, encoding=None if binary else "utf-8") as f:
        f.write(content)

def download_file(file_url, output_folder, base_url):
    try:
        response = requests.get(file_url, timeout=5)
        if response.status_code == 200:
            # Get path that preserves original structure
            relative_path = get_relative_path(file_url, base_url)
            
            # Handle empty paths (like for root index.html)
            if not relative_path:
                filename = "index.html"
                if not file_url.endswith('/') and '.' in file_url.split('/')[-1]:
                    filename = file_url.split('/')[-1]
                relative_path = filename
                
            # Create full path for saving
            file_path = os.path.join(output_folder, relative_path)
            
            save_file(response.content, file_path, binary=True)
            print(f"Downloaded: {file_url} -> {file_path}")
            return file_path
        else:
            print(f"Failed to download: {file_url} (Status: {response.status_code})")
    except Exception as e:
        print(f"Error downloading {file_url}: {e}")
    
    return None

def scrape_website(url, output_folder="D:/HackNuthon_6/Hack_Nu_Thon_6.0_multi_agent/scraped_site"):
    # Create the base output folder
    os.makedirs(output_folder, exist_ok=True)
    
    # Setup and get main page
    driver = setup_driver()
    driver.get(url)
    html = driver.page_source
    driver.quit()
    
    # Process main HTML
    soup = BeautifulSoup(html, "html.parser")
    
    # Save the main HTML file (typically index.html)
    main_filename = "index.html"
    # If URL ends with specific filename, use that instead
    if not url.endswith('/') and '.' in url.split('/')[-1]:
        main_filename = url.split('/')[-1]
    
    main_file_path = os.path.join(output_folder, main_filename)
    save_file(html, main_file_path)
    print(f"Saved main HTML to: {main_file_path}")
    
    # Download CSS files
    for link in soup.find_all("link", {"rel": "stylesheet"}):
        if "href" in link.attrs:
            css_url = urljoin(url, link["href"])
            download_file(css_url, output_folder, url)
    
    # Download JavaScript files
    for script in soup.find_all("script", {"src": True}):
        js_url = urljoin(url, script["src"])
        download_file(js_url, output_folder, url)
    
    # Download images
    for img in soup.find_all("img", {"src": True}):
        img_url = urljoin(url, img["src"])
        download_file(img_url, output_folder, url)
    
    # Download media files
    for media in soup.find_all(["audio", "video"]):
        if media.get("src"):
            media_url = urljoin(url, media["src"])
            download_file(media_url, output_folder, url)
        for source in media.find_all("source", {"src": True}):
            media_url = urljoin(url, source["src"])
            download_file(media_url, output_folder, url)
    
    # Find and download any linked pages from the same domain
    for a_tag in soup.find_all("a", href=True):
        link_url = urljoin(url, a_tag["href"])
        # Only follow links to the same domain and avoid anchors
        if urlparse(link_url).netloc == urlparse(url).netloc and not link_url.endswith(('#', '#/')):
            # Avoid processing the current page again
            if link_url != url:
                try:
                    response = requests.get(link_url, timeout=5)
                    if response.status_code == 200:
                        # Save the linked HTML file
                        relative_path = get_relative_path(link_url, url)
                        if not relative_path:
                            relative_path = "index.html"
                        # Make sure HTML files end with .html
                        if not relative_path.lower().endswith(('.html', '.htm')):
                            if relative_path.endswith('/'):
                                relative_path += 'index.html'
                            else:
                                relative_path += '.html'
                        
                        file_path = os.path.join(output_folder, relative_path)
                        save_file(response.text, file_path)
                        print(f"Downloaded linked page: {link_url} -> {file_path}")
                except Exception as e:
                    print(f"Error downloading linked page {link_url}: {e}")
    
    print("Scraping completed! Files saved in:", output_folder)

# Example usage
# scrape_website("https://urbansnap.vercel.app/")
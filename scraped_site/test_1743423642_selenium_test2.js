const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const { describe, it, before, after } = require('mocha');
const { assert } = require('chai');

describe('Urban Snap Website Tests', function() {
    this.timeout(30000); // Set timeout for all tests
    let driver;

    before(async function() {
        // Configure Chrome options
        let options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--window-size=1920,1080');

        // Set ChromeDriver path
        const chromeDriverPath = 'D:/HackNuthon_6/chromedriver-win64/chromedriver-win64/chromedriver.exe';
        
        // Initialize WebDriver
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(new chrome.ServiceBuilder(chromeDriverPath))
            .build();
    });

    after(async function() {
        await driver.quit();
    });

    it('should load homepage successfully', async function() {
        await driver.get('https://urbansnap.vercel.app/');
        await driver.wait(until.titleContains('Urban Snap'), 10000);
        const title = await driver.getTitle();
        assert.include(title, 'Urban Snap', 'Title should contain "Urban Snap"');
    });

    it('should have valid navigation elements', async function() {
        const logo = await driver.findElement(By.css('header img, header .logo, header h1, header a[href="/"]'));
        assert.isTrue(await logo.isDisplayed(), 'Logo should be visible');

        const navLinks = await driver.findElements(By.css('nav a, header ul li a, .navigation a, .menu a'));
        assert.isAbove(navLinks.length, 0, 'Should have at least one navigation link');
    });

    it('should have working search functionality', async function() {
        const searchBox = await driver.findElements(By.css('input[type="search"], .search-input, [placeholder*="search" i], [placeholder*="find" i]'));
        if (searchBox.length > 0) {
            const searchTerm = 'photography';
            await searchBox[0].sendKeys(searchTerm);
            await searchBox[0].sendKeys(Key.RETURN);
            await driver.wait(until.urlContains('search'), 10000);
            const currentUrl = await driver.getCurrentUrl();
            assert.include(currentUrl.toLowerCase(), 'search', 'URL should contain "search"');
        } else {
            this.skip(); // Skip if search box not found
        }
    });

    it('should have main content sections', async function() {
        const contentSelectors = [
            '.hero, #hero, .banner, #banner',
            '.gallery, .photos, .portfolio, .images',
            '.featured, .showcase, .highlights',
            '.about, #about, section:nth-child(2)',
            '.testimonials, .reviews',
            '.contact, #contact'
        ];
        
        for (const selector of contentSelectors) {
            const elements = await driver.findElements(By.css(selector));
            assert.isAbove(elements.length, 0, `Should have at least one element matching "${selector}"`);
        }
    });

    it('should have a footer with links', async function() {
        const footer = await driver.findElements(By.css('footer, .footer'));
        if (footer.length > 0) {
            const footerLinks = await footer[0].findElements(By.css('a'));
            assert.isAbove(footerLinks.length, 0, 'Footer should contain at least one link');
        } else {
            this.skip(); // Skip if footer not found
        }
    });
});
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

(async function testUrbanSnap() {
    // Configure Chrome options
    let options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    // Set ChromeDriver path
    const chromeDriverPath = 'D:/HackNuthon_6/chromedriver-win64/chromedriver-win64/chromedriver.exe';
    
    // Initialize the WebDriver with options and explicit ChromeDriver path
    let driver;
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(new chrome.ServiceBuilder(chromeDriverPath))
            .build();
    } catch (err) {
        console.error('Failed to initialize WebDriver:', err);
        console.error('Please ensure ChromeDriver is installed correctly.');
        console.error('Run: npm install chromedriver --save-dev');
        process.exit(1);
    }

    try {
        // Set implicit wait time
        await driver.manage().setTimeouts({ implicit: 10000 });

        // Test 1: Homepage Load
        await driver.get('https://urbansnap.vercel.app/');
        await driver.wait(until.titleContains('Urban Snap'), 10000);
        console.log('Successfully loaded Urban Snap homepage');

        // Verify the homepage title
        let title = await driver.getTitle();
        if (!title.includes('Urban Snap')) {
            throw new Error('Title does not contain "Urban Snap"');
        }

        // Test 2: Header and Navigation Elements
        try {
            // Check logo
            const logo = await driver.findElement(By.css('header img, header .logo, header h1, header a[href="/"]'));
            console.log('Logo found');

            // Check navigation menu
            const navMenu = await driver.findElements(By.css('nav, header ul, .navigation, .menu'));
            console.log(`Navigation menu elements found: ${navMenu.length}`);

            // Check navigation links
            const navLinks = await driver.findElements(By.css('nav a, header ul li a, .navigation a, .menu a'));
            console.log(`Navigation links found: ${navLinks.length}`);

            if (navLinks.length > 0) {
                for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
                    const linkText = await navLinks[i].getText();
                    const linkHref = await navLinks[i].getAttribute('href');
                    console.log(`Link ${i+1}: ${linkText || 'Unnamed link'} -> ${linkHref}`);
                }
            }
        } catch (err) {
            console.error('Error finding navigation elements:', err);
        }

        // Test 3: Search Functionality
        try {
            const searchBox = await driver.findElements(By.css('input[type="search"], .search-input, [placeholder*="search" i], [placeholder*="find" i]'));
            
            if (searchBox.length > 0) {
                console.log('Search box found');
                const searchTerm = 'photography';
                await searchBox[0].sendKeys(searchTerm);
                await searchBox[0].sendKeys(Key.RETURN);
                await driver.wait(until.urlContains('search'), 10000);
                console.log('Search results page loaded');
            } else {
                console.log('Search box not found');
            }
        } catch (err) {
            console.error('Error testing search functionality:', err);
        }

        // Test 4: Main Content Sections
        const contentSelectors = [
            '.hero, #hero, .banner, #banner',
            '.gallery, .photos, .portfolio, .images',
            '.featured, .showcase, .highlights',
            '.about, #about, section:nth-child(2)',
            '.testimonials, .reviews',
            '.contact, #contact'
        ];
        
        for (const selector of contentSelectors) {
            try {
                const elements = await driver.findElements(By.css(selector));
                if (elements.length > 0) {
                    console.log(`Found ${elements.length} elements matching "${selector}"`);
                }
            } catch (err) {
                console.error(`Error checking ${selector}:`, err);
            }
        }

        // Test 5: Footer Testing
        try {
            const footer = await driver.findElements(By.css('footer, .footer'));
            
            if (footer.length > 0) {
                console.log('Footer found');
                
                const footerLinks = await footer[0].findElements(By.css('a'));
                console.log(`Footer contains ${footerLinks.length} links`);
            } else {
                console.log('Footer not found');
            }
        } catch (err) {
            console.error('Error testing footer:', err);
        }

    } catch (err) {
        console.error('Test failed:', err);
        throw err;
    } finally {
        await driver.quit();
        console.log('Browser closed');
    }
})();
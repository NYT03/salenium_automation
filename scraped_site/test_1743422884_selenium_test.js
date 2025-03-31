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

        // Navigate to the Urban Snap homepage
        await driver.get('https://urbansnap.vercel.app/');
        await driver.wait(until.titleContains('Urban Snap'), 10000);
        console.log('Successfully loaded Urban Snap homepage');

        // Verify the homepage title
        let title = await driver.getTitle();
        if (!title.includes('Urban Snap')) {
            throw new Error('Title does not contain "Urban Snap"');
        }

        // Enhanced navigation links test
        const navLinks = ['About Us', 'Products', 'Features', 'Data Analytics', 'Our Team', 'Support'];
        for (let linkText of navLinks) {
            try {
                console.log(`Testing navigation to ${linkText}...`);
                
                // Wait for and click the link
                let link = await driver.wait(until.elementLocated(By.linkText(linkText)), 10000);
                await link.click();
                
                // Wait for page to load
                const expectedUrlPart = linkText.toLowerCase().replace(' ', '-');
                await driver.wait(until.urlContains(expectedUrlPart), 10000);
                
                // Verify page content
                const pageContent = await driver.findElement(By.tagName('body')).getText();
                if (!pageContent.toLowerCase().includes(linkText.toLowerCase())) {
                    console.warn(`Warning: ${linkText} page content verification failed`);
                }
                
                console.log(`Successfully navigated to ${linkText} page`);
                
                // Return to homepage
                await driver.navigate().back();
                await driver.wait(until.titleContains('Urban Snap'), 10000);
            } catch (err) {
                console.error(`Failed to navigate to ${linkText}:`, err);
                // Capture screenshot for debugging
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync(`error_${linkText.replace(' ', '_')}.png`, screenshot, 'base64');
                throw err;
            }
        }

        // Enhanced 'Join Now' functionality test
        try {
            let joinNowButton = await driver.wait(until.elementLocated(By.linkText('Join Now')), 5000);
            await joinNowButton.click();
            await driver.wait(until.urlContains('join'), 5000);
            console.log('Successfully navigated to Join Now page');
            await driver.navigate().back();
            await driver.wait(until.titleContains('Urban Snap'), 5000);
        } catch (err) {
            console.error('Failed to test Join Now functionality:', err);
            throw err;
        }

        // Enhanced 'Log in' functionality test
        try {
            await driver.get('https://urbansnap.vercel.app/');
            let loginButton = await driver.wait(until.elementLocated(By.linkText('Log in')), 5000);
            await loginButton.click();
            await driver.wait(until.urlContains('login'), 5000);
            console.log('Successfully navigated to Log in page');
        } catch (err) {
            console.error('Failed to test Log in functionality:', err);
            throw err;
        }

    } catch (err) {
        console.error('Test failed:', err);
        throw err;
    } finally {
        await driver.quit();
        console.log('Browser closed');
    }
})();

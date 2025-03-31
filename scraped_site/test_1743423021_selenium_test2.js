const { Builder, By, Key, until } = require('selenium-webdriver');

async function runUrbanSnapTests() {
  // Set up the driver
  console.log('Setting up WebDriver...');
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    // Configure driver settings
    await driver.manage().setTimeouts({ implicit: 10000 });
    await driver.manage().window().maximize();
    
    console.log('Starting UrbanSnap Website Tests');
    
    // Test 1: Homepage Load
    console.log('\n📋 Test 1: Homepage Load Test');
    await driver.get('https://urbansnap.vercel.app/');
    
    // Wait for page to fully load
    await driver.wait(async function() {
      const readyState = await driver.executeScript('return document.readyState');
      return readyState === 'complete';
    }, 10000);
    
    const title = await driver.getTitle();
    console.log(`Page title: ${title}`);
    
    // Capture screenshot of homepage
    await driver.takeScreenshot().then(function(image) {
      require('fs').writeFileSync('urbansnap-homepage.png', image, 'base64');
    });
    console.log('Screenshot captured: urbansnap-homepage.png');
    console.log('Homepage loaded successfully');
    
    // Test 2: Header and Navigation Elements
    console.log('\n📋 Test 2: Header and Navigation Test');
    
    // Check logo
    try {
      const logo = await driver.findElement(By.css('header img, header .logo, header h1, header a[href="/"]'));
      console.log('Logo found');
    } catch (error) {
      console.log('Logo not found');
    }
    
    // Check navigation menu
    try {
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
    } catch (error) {
      console.log('Error finding navigation elements:', error.message);
    }
    
    // Test 3: Search Functionality (if available)
    console.log('\n📋 Test 3: Search Functionality Test');
    try {
      const searchBox = await driver.findElements(By.css('input[type="search"], .search-input, [placeholder*="search" i], [placeholder*="find" i]'));
      
      if (searchBox.length > 0) {
        console.log('Search box found');
        const searchTerm = 'photography';
        await searchBox[0].sendKeys(searchTerm);
        await searchBox[0].sendKeys(Key.RETURN);
        
        // Wait for search results
        await driver.sleep(3000);
        
        // Check if we got search results
        const currentUrl = await driver.getCurrentUrl();
        console.log(`Search URL: ${currentUrl}`);
        
        // Capture search results
        await driver.takeScreenshot().then(function(image) {
          require('fs').writeFileSync('urbansnap-search-results.png', image, 'base64');
        });
        console.log('Search results screenshot captured');
      } else {
        console.log('Search box not found');
      }
    } catch (error) {
      console.log('Error testing search functionality:', error.message);
    }
    
    // Test 4: Check for Main Content Sections
    console.log('\n📋 Test 4: Main Content Test');
    
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
          
          // Check for images in this section
          const images = await elements[0].findElements(By.css('img'));
          console.log(`  - Contains ${images.length} images`);
          
          // Check for headings
          const headings = await elements[0].findElements(By.css('h1, h2, h3'));
          if (headings.length > 0) {
            const headingText = await headings[0].getText();
            console.log(`  - Section heading: "${headingText}"`);
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Test 5: Responsive Design Testing
    console.log('\n📋 Test 5: Responsive Design Test');
    
    // Test on mobile size
    console.log('Testing mobile view (375x667)');
    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.sleep(2000);
    
    // Check for mobile menu/hamburger
    try {
      const mobileMenu = await driver.findElements(By.css('.hamburger, .mobile-menu, .menu-icon, button[aria-label*="menu" i]'));
      console.log(`Mobile menu elements found: ${mobileMenu.length}`);
      
      if (mobileMenu.length > 0) {
        console.log('Clicking mobile menu button');
        await mobileMenu[0].click();
        await driver.sleep(1000);
        await driver.takeScreenshot().then(function(image) {
          require('fs').writeFileSync('urbansnap-mobile-menu.png', image, 'base64');
        });
        console.log('Mobile menu screenshot captured');
      }
    } catch (error) {
      console.log('Error testing mobile menu:', error.message);
    }
    
    // Test on tablet size
    console.log('Testing tablet view (768x1024)');
    await driver.manage().window().setRect({ width: 768, height: 1024 });
    await driver.sleep(2000);
    
    // Test on desktop size
    console.log('Testing desktop view (1366x768)');
    await driver.manage().window().setRect({ width: 1366, height: 768 });
    await driver.sleep(2000);
    
    // Test 6: Form Testing (if available)
    console.log('\n📋 Test 6: Form Testing');
    try {
      // Look for typical form locations
      await driver.get('https://urbansnap.vercel.app/');
      await driver.sleep(2000);
      
      // Check for contact form on homepage
      const homepageForms = await driver.findElements(By.css('form, .form, .contact-form'));
      
      if (homepageForms.length > 0) {
        console.log(`Found ${homepageForms.length} forms on homepage`);
        await testForm(driver, homepageForms[0]);
      } else {
        // Try to navigate to a contact page
        console.log('No forms found on homepage, looking for contact page');
        
        // Look for contact link
        const contactLinks = await driver.findElements(By.css('a[href*="contact" i], a:contains("contact")'));
        
        if (contactLinks.length > 0) {
          console.log('Found contact link, navigating...');
          await contactLinks[0].click();
          await driver.sleep(2000);
          
          // Look for form on contact page
          const contactForms = await driver.findElements(By.css('form, .form, .contact-form'));
          
          if (contactForms.length > 0) {
            console.log(`Found ${contactForms.length} forms on contact page`);
            await testForm(driver, contactForms[0]);
          } else {
            console.log('No forms found on contact page');
          }
        } else {
          console.log('No contact link found');
        }
      }
    } catch (error) {
      console.log('Error testing forms:', error.message);
    }
    
    // Test 7: Footer Testing
    console.log('\n📋 Test 7: Footer Test');
    try {
      await driver.get('https://urbansnap.vercel.app/');
      const footer = await driver.findElements(By.css('footer, .footer'));
      
      if (footer.length > 0) {
        console.log('Footer found');
        
        // Check footer links
        const footerLinks = await footer[0].findElements(By.css('a'));
        console.log(`Footer contains ${footerLinks.length} links`);
        
        // Check for social media links
        const socialLinks = await footer[0].findElements(By.css('a[href*="facebook"], a[href*="twitter"], a[href*="instagram"], a[href*="linkedin"], a[href*="youtube"]'));
        console.log(`Footer contains ${socialLinks.length} social media links`);
        
        // Check for copyright info
        const copyright = await footer[0].findElements(By.css('*:contains("copyright"), *:contains("©")'));
        if (copyright.length > 0) {
          console.log('Copyright information found in footer');
        }
      } else {
        console.log('Footer not found');
      }
    } catch (error) {
      console.log('Error testing footer:', error.message);
    }
    
    // Test 8: Check for Error Page
    console.log('\n📋 Test 8: Error Page Test');
    try {
      await driver.get('https://urbansnap.vercel.app/non-existent-page-for-testing');
      await driver.sleep(2000);
      
      // Look for error indicators
      const errorElements = await driver.findElements(By.css('.error, .not-found, h1:contains("404"), *:contains("not found")'));
      
      if (errorElements.length > 0) {
        console.log('Error page detected');
        
        // Capture error page screenshot
        await driver.takeScreenshot().then(function(image) {
          require('fs').writeFileSync('urbansnap-error-page.png', image, 'base64');
        });
        console.log('Error page screenshot captured');
      } else {
        console.log('No clear error page detected');
      }
    } catch (error) {
      console.log('Error testing 404 page:', error.message);
    }
    
    console.log('\n✅ All tests completed');
    
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    console.log('\nClosing WebDriver...');
    await driver.quit();
    console.log('Tests finished');
  }
}

// Helper function to test a form
async function testForm(driver, formElement) {
  try {
    // Find all input fields
    const inputs = await formElement.findElements(By.css('input, textarea'));
    console.log(`Form contains ${inputs.length} input fields`);
    
    if (inputs.length > 0) {
      // Fill in the form fields
      for (let input of inputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        
        console.log(`Input field: ${name || placeholder || 'Unnamed'} (${type || 'text'})`);
        
        // Skip hidden fields
        if (type === 'hidden') continue;
        
        // Fill in appropriate test data based on input type
        if (type === 'email') {
          await input.sendKeys('test@example.com');
        } else if (type === 'tel' || type === 'phone') {
          await input.sendKeys('1234567890');
        } else if (type === 'number') {
          await input.sendKeys('42');
        } else if (name && name.includes('name') || placeholder && placeholder.includes('name')) {
          await input.sendKeys('Test User');
        } else {
          await input.sendKeys('Test data for form submission');
        }
      }
      
      // Find the submit button but don't actually submit
      const submitButton = await formElement.findElements(By.css('button[type="submit"], input[type="submit"], .submit-button, button:contains("Send"), button:contains("Submit")'));
      
      if (submitButton.length > 0) {
        console.log('Found submit button');
        
        // Prevent actual form submission but trigger any client-side validation
        await driver.executeScript("arguments[0].addEventListener('click', function(e) { e.preventDefault(); });", submitButton[0]);
        await submitButton[0].click();
        
        console.log('Clicked submit button (prevented actual submission)');
        await driver.sleep(1000);
        
        // Check for validation messages
        const validationMessages = await formElement.findElements(By.css('.error, .validation-message, .form-error'));
        console.log(`Validation messages found: ${validationMessages.length}`);
      } else {
        console.log('No submit button found');
      }
    }
  } catch (error) {
    console.log('Error testing form:', error.message);
  }
}

// Run the tests
runUrbanSnapTests().then(() => console.log('Test suite execution complete'));
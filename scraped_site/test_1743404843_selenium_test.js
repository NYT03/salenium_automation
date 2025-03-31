const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');

describe('Website Tests', () => {
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build(); 
  });

  after(async () => {
    await driver.quit();
  });

  it('Verify login button is clickable', async () => {
    await driver.get('./HTML files/authentication.html'); // Assuming authentication.html contains the login form

    // Adjust the selector based on the actual HTML structure of the login button. 
    const loginButton = await driver.findElement(By.css('button[type="submit"]')); //  Example: Assuming a button with type="submit"
    
    assert(await loginButton.isDisplayed(), "Login button is not displayed");
    assert(await loginButton.isEnabled(), "Login button is not enabled/clickable");
  });


  it('Fill the login form with valid credentials and submit', async () => {
    await driver.get('./HTML files/authentication.html');


    const usernameField = await driver.findElement(By.css('#username')); // Replace #username with the actual ID or selector
    const passwordField = await driver.findElement(By.css('#password')); // Replace #password with the actual ID or selector

    await usernameField.sendKeys('testuser'); // Replace with a valid username
    await passwordField.sendKeys('password123'); // Replace with a valid password

    const loginButton = await driver.findElement(By.css('button[type="submit"]')); // Again, adjust the selector as needed
    await loginButton.click();

    // Add assertions to check for successful login.  For example, you could check for a welcome message, a redirect to a new page, or the presence of a logout button.
    // Example: Checking for a welcome message
    // try {
    //     await driver.wait(until.elementLocated(By.id('welcome-message')), 5000); // Replace 'welcome-message' with the actual ID
    //     assert(true, "Login Successful"); // Or a more specific assertion
    // } catch (error) {
    //     assert(false, "Login failed. Welcome message not found.");
    // }


  });

  it('Ensure the logout button is visible after login', async () => {
      // This test assumes the previous test ('Fill the login form...') was successful.
      
      // Locate the logout button (adjust the selector as per your HTML)
      try {
          const logoutButton = await driver.wait(until.elementLocated(By.id('logout-button')), 5000);  // Example ID. Replace as needed.
          assert(await logoutButton.isDisplayed(), "Logout button is not displayed after login");
      } catch (error) {
          assert(false, "Logout button not found after login");
      }



  });
});
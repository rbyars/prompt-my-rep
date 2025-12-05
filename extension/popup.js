// CONFIGURATION
// Change this to 'http://localhost:3000' if you want to switch back to testing
const APP_URL = 'https://prompt-my-rep.vercel.app'; 

document.getElementById('saveBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = "Scanning article...";

  try {
    // 1. Get the current tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 2. Inject Readability
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['readability.js']
    });

    // 3. Run Cleaner
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const documentClone = document.cloneNode(true);
        const article = new Readability(documentClone).parse();
        return article;
      }
    });

    const articleData = result[0].result;

    if (articleData) {
      statusDiv.textContent = "Authenticating...";

      // --- COOKIE CHECK ---
      // We now look for cookies on the LIVE URL
      const cookies = await chrome.cookies.getAll({ url: APP_URL });
      
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      if (!cookieString) {
        throw new Error(`No login found. Please log in at ${APP_URL}`);
      }

      statusDiv.textContent = "Sending to cloud...";

      const response = await fetch(`${APP_URL}/api/save-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieString
        },
        body: JSON.stringify({
          title: articleData.title,
          url: tab.url,
          content: articleData.textContent
        })
      });

      const serverData = await response.json();

      if (serverData.success) {
        statusDiv.textContent = "Saved to Dashboard!";
        statusDiv.style.color = "green";
      } else {
        statusDiv.textContent = "Error: " + (serverData.error || "Unauthorized");
        statusDiv.style.color = "red";
      }

    } else {
      statusDiv.textContent = "Error: Could not parse article.";
      statusDiv.style.color = "red";
    }

  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error: " + err.message;
    statusDiv.style.color = "red";
  }
});
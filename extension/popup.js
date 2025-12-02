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

      // --- DEBUGGING START ---
      console.log("DEBUG: Starting cookie search...");
      
      // Try searching by URL
      const cookies = await chrome.cookies.getAll({ url: "http://localhost:3000" });
      console.log("DEBUG: Found cookies:", cookies);

      // Build the string
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      console.log("DEBUG: Generated Cookie String:", cookieString);
      // --- DEBUGGING END ---

      if (!cookieString) {
        throw new Error("No login session found. (Cookie list was empty)");
      }

      statusDiv.textContent = "Sending to database...";

      const response = await fetch('http://localhost:3000/api/save-article', {
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
    console.error("DEBUG ERROR:", err);
    statusDiv.textContent = "Error: " + err.message;
    statusDiv.style.color = "red";
  }
});
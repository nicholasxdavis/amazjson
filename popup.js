let currentJSON = "";

function syntaxHighlight(json) {
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    },
  );
}

document.getElementById("exportBtn").addEventListener("click", async () => {
  const resultContainer = document.getElementById("result-container");
  const output = document.getElementById("output");

  resultContainer.style.display = "none";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.includes("amazon.")) {
    output.textContent = "Error: Please navigate to Amazon.";
    resultContainer.style.display = "block";
    return;
  }

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: scrapeAmazonCart,
    },
    (results) => {
      if (chrome.runtime.lastError) {
        output.textContent = "Error: " + chrome.runtime.lastError.message;
        resultContainer.style.display = "block";
        return;
      }

      if (results && results[0] && results[0].result) {
        const data = results[0].result;

        if (data.error) {
          output.textContent = data.error;
          resultContainer.style.display = "block";
          return;
        }

        currentJSON = JSON.stringify(data, null, 2);
        output.innerHTML = syntaxHighlight(currentJSON);

        resultContainer.style.display = "block";
      } else {
        output.textContent = "Failed to execute script properly.";
        resultContainer.style.display = "block";
      }
    },
  );
});

document.getElementById("copyBtn").addEventListener("click", () => {
  if (!currentJSON) return;

  navigator.clipboard
    .writeText(currentJSON)
    .then(() => {
      const copyText = document.getElementById("copyText");
      const copyIcon = document.getElementById("copyIcon");

      // Save original
      const originalText = copyText.textContent;
      const originalIconSVG = copyIcon.innerHTML;

      copyText.textContent = "Copied!";
      copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      copyIcon.style.color = "var(--success)";

      setTimeout(() => {
        copyText.textContent = originalText;
        copyIcon.innerHTML = originalIconSVG;
        copyIcon.style.color = "";
      }, 2000);
    })
    .catch((err) => console.error("Clipboard write failed", err));
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!currentJSON) return;

  const blob = new Blob([currentJSON], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `amazon-cart-${new Date().toISOString().slice(0, 10)}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function scrapeAmazonCart() {
  const items = document.querySelectorAll(".sc-list-item");
  const cartData = [];

  if (items.length === 0) {
    return { error: "No cart items found in the DOM." };
  }

  items.forEach((item) => {
    const isSavedForLater = item.closest("#sc-saved-cart");
    if (isSavedForLater) return;

    const titleEl =
      item.querySelector(".sc-product-title") ||
      item.querySelector(".a-truncate-cut");
    const linkEl =
      item.querySelector("a.sc-product-link") ||
      item.querySelector(".sc-item-product-title-cont a");
    const priceEl =
      item.querySelector(".sc-product-price") ||
      item.querySelector(".sc-item-price-block .a-size-medium");

    if (titleEl && linkEl) {
      let url = linkEl.href;
      try {
        const urlObj = new URL(url);
        url = urlObj.origin + urlObj.pathname;
      } catch (e) {}

      cartData.push({
        title: titleEl.innerText.trim(),
        url: url,
        price: priceEl ? priceEl.innerText.trim() : "N/A",
      });
    }
  });

  return cartData;
}

// Replace this with your Function App base URL after you deploy the function.
// Example: https://quotesapp-abcdefg.azurewebsites.net
const FUNCTION_BASE_URL = "https://quotesappdo178-cueuethngjepfzg6.francecentral-01.azurewebsites.net";

const btn = document.getElementById("btn");
const quoteEl = document.getElementById("quote");
const statusEl = document.getElementById("status");

btn.addEventListener("click", async () => {
  statusEl.textContent = "Fetching...";
  btn.disabled = true;

  try {
    const res = await fetch(`${FUNCTION_BASE_URL}/api/quote`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    quoteEl.textContent = data.quote ?? "No quote returned.";
    statusEl.textContent = "";
  } catch (err) {
    quoteEl.textContent = "Could not fetch a quote.";
    statusEl.textContent = String(err);
  } finally {
    btn.disabled = false;
  }
});

/* =========================================================
   PART 2: Routing formatter with file download
   ========================================================= */

const fileInput = document.getElementById("fileInput");
const btnFormat = document.getElementById("btnFormat");
const btnDownload = document.getElementById("btnDownload");
const formatStatusEl = document.getElementById("formatStatus");
const outputEl = document.getElementById("output");

let selectedFile = null;
let downloadedFilename = "formatted.txt";

if (fileInput && btnFormat && btnDownload && formatStatusEl && outputEl) {
  fileInput.addEventListener("change", () => {
    selectedFile = fileInput.files?.[0] ?? null;
    outputEl.value = "";
    btnDownload.disabled = true;

    if (!selectedFile) {
      btnFormat.disabled = true;
      formatStatusEl.textContent = "";
      return;
    }

    const nameOk = selectedFile.name.toLowerCase().endsWith(".txt");
    const typeOk = (selectedFile.type || "").startsWith("text/");
    const isText = nameOk || typeOk;
    const maxBytes = 200 * 1024;

    if (!isText) {
      btnFormat.disabled = true;
      formatStatusEl.textContent = "Please select a plain text (.txt) file.";
      selectedFile = null;
      return;
    }

    if (selectedFile.size > maxBytes) {
      btnFormat.disabled = true;
      formatStatusEl.textContent = "File is too large for this demo (max 200KB).";
      selectedFile = null;
      return;
    }

    btnFormat.disabled = false;
    formatStatusEl.textContent = `Selected: ${selectedFile.name} (${selectedFile.size} bytes)`;
  });

  btnFormat.addEventListener("click", async () => {
    if (!selectedFile) return;

    btnFormat.disabled = true;
    btnDownload.disabled = true;
    formatStatusEl.textContent = "Sending text to the API...";

    try {
      const text = await selectedFile.text();

      const res = await fetch(`${FUNCTION_BASE_URL}/api/format`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          text
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      outputEl.value = data.result ?? "";
      downloadedFilename = data.outputFilename ?? "formatted.txt";
      btnDownload.disabled = outputEl.value.length === 0;

      let statusMsg = `Done. Route used: ${data.action}. Stored as ${data.originalBlobName} and ${data.formattedBlobName}. You can now download the formatted file.`;
      
      // Extension 2: Add direct blob storage download link if available
      if (data.formattedBlobUrl) {
        statusMsg += ` Or <a href="${data.formattedBlobUrl}" target="_blank" download="${downloadedFilename}">download directly from blob storage</a>.`;
      }
      
      formatStatusEl.innerHTML = statusMsg;
    } catch (err) {
      outputEl.value = "";
      btnDownload.disabled = true;
      formatStatusEl.textContent = `Failed: ${err.message}`;
    } finally {
      btnFormat.disabled = !selectedFile;
    }
  });

  btnDownload.addEventListener("click", () => {
    const blob = new Blob([outputEl.value], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadedFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

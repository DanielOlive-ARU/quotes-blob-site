(function () {
  "use strict";

  var state = {
    route: null,
    text: "",
    filename: "",
    lastResult: null
  };

  var elements = {};

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    elements.routeSelect = $("route");
    elements.routeDescription = $("route-description");
    elements.exampleInput = $("example-input");
    elements.exampleOutput = $("example-output");
    elements.fileInput = $("file-input");
    elements.textInput = $("text-input");
    elements.convertButton = $("convert-button");
    elements.sendHint = $("send-hint");
    elements.status = $("status");
    elements.outputSection = $("output-section");
    elements.outputPreview = $("output-preview");
    elements.outputFilename = $("output-filename");
    elements.outputMetrics = $("output-metrics");
    elements.downloadButton = $("download-button");

    populateRoutes();

    elements.routeSelect.addEventListener("change", onRouteChange);
    elements.fileInput.addEventListener("change", onFileChange);
    elements.textInput.addEventListener("input", onTextInput);
    elements.convertButton.addEventListener("click", onConvert);
    elements.downloadButton.addEventListener("click", onDownload);

    updateConvertButton();
  }

  function populateRoutes() {
    var routes = window.ROUTES || [];
    routes.forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = r.key;
      opt.textContent = r.label;
      elements.routeSelect.appendChild(opt);
    });
    if (routes.length > 0) {
      elements.routeSelect.value = routes[0].key;
      applyRoute(routes[0].key);
    } else {
      applyRoute("");
    }
  }

  function getRoute(key) {
    return (window.ROUTES || []).find(function (r) {
      return r.key === key;
    });
  }

  function applyRoute(key) {
    state.route = key || null;
    var def = state.route ? getRoute(state.route) : null;
    if (def) {
      elements.routeDescription.textContent =
        def.description + " Accepts: " + def.acceptedExtensions.join(", ") + ".";
      elements.exampleInput.textContent = def.exampleInput;
      elements.exampleOutput.textContent = def.exampleOutput;
      elements.fileInput.accept = def.acceptedExtensions.join(",");
    } else {
      elements.routeDescription.textContent =
        "No conversion routes are currently available. Try reloading the page.";
      elements.exampleInput.textContent = "";
      elements.exampleOutput.textContent = "";
      elements.fileInput.removeAttribute("accept");
    }
    updateConvertButton();
  }

  function onRouteChange(e) {
    applyRoute(e.target.value || "");
  }

  function onFileChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }
    state.filename = file.name;
    var reader = new FileReader();
    reader.onload = function () {
      state.text = String(reader.result || "");
      elements.textInput.value = state.text;
      updateConvertButton();
    };
    reader.onerror = function () {
      showStatus(
        "Failed to read file: " + (reader.error && reader.error.message),
        "error"
      );
    };
    reader.readAsText(file);
  }

  function onTextInput(e) {
    state.text = e.target.value;
    if (!state.filename) {
      state.filename = "pasted-input.txt";
    }
    updateConvertButton();
  }

  function updateConvertButton() {
    var ready = Boolean(state.route && state.text.length > 0);
    elements.convertButton.disabled = !ready;

    if (ready && state.filename) {
      var derived = deriveFilenameForRoute(state.route, state.filename);
      elements.sendHint.textContent = "Will send as: " + derived;
    } else {
      elements.sendHint.textContent = "";
    }
  }

  function showStatus(message, kind) {
    elements.status.textContent = message;
    elements.status.className = "status" + (kind ? " " + kind : "");
  }

  function apiUrl(path) {
    var base = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) || "";
    if (!base || base === "__API_BASE_URL__") {
      return path;
    }
    return base.replace(/\/$/, "") + path;
  }

  function deriveFilenameForRoute(routeKey, providedName) {
    var def = getRoute(routeKey);
    if (!def || !providedName) return providedName || "input";
    var accepted = def.acceptedExtensions;
    if (!accepted || accepted.length === 0) return providedName;
    var lower = providedName.toLowerCase();
    var ok = accepted.some(function (ext) {
      return lower.endsWith(ext.toLowerCase());
    });
    if (ok) return providedName;
    var base = providedName.replace(/\.[^.]+$/, "");
    return base + accepted[0];
  }

  async function onConvert() {
    if (!state.route || !state.text) return;
    showStatus("Converting…", "working");
    elements.convertButton.disabled = true;
    elements.outputSection.hidden = true;

    var filename = deriveFilenameForRoute(
      state.route,
      state.filename || "input"
    );

    try {
      var response = await fetch(apiUrl("/api/convert"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          route: state.route,
          filename: filename,
          text: state.text
        })
      });
      var body;
      try {
        body = await response.json();
      } catch (e) {
        throw new Error(
          "Non-JSON response (HTTP " + response.status + ")."
        );
      }
      if (!response.ok || !body.ok) {
        var msg = body && body.message ? body.message : "Conversion failed.";
        if (body && body.details) msg += " — " + body.details;
        showStatus(msg, "error");
        return;
      }
      renderResult(body);
      showStatus(
        "Conversion succeeded in " + body.metrics.durationMs + " ms.",
        "success"
      );
    } catch (err) {
      showStatus(
        "Request failed: " + (err && err.message ? err.message : err),
        "error"
      );
    } finally {
      updateConvertButton();
    }
  }

  function renderResult(success) {
    state.lastResult = success;
    elements.outputPreview.textContent = success.converted.text;
    elements.outputFilename.textContent = success.converted.filename;
    elements.outputMetrics.textContent =
      success.metrics.inputBytes +
      " B in, " +
      success.metrics.outputBytes +
      " B out";
    elements.outputSection.hidden = false;
  }

  function onDownload() {
    var result = state.lastResult;
    if (!result) return;
    var blob = new Blob([result.converted.text], {
      type: result.converted.contentType
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = result.converted.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

export function hasFalKey() {
  return Boolean(globalThis.__AUTOHDR_CONFIG__?.hasFalKey);
}

export async function submitRenderJob(job) {
  return fetchJsonWithTimeout("/api/render/shot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(job)
  }, 120000);
}

export async function uploadRenderAsset(asset) {
  return fetchJsonWithTimeout("/api/render/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(asset)
  }, 120000);
}

export async function stageRenderImage(asset) {
  return fetchJsonWithTimeout("/api/image/stage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(asset)
  }, 240000);
}

export async function analyzeFurnitureNeed(asset) {
  return fetchJsonWithTimeout("/api/image/furniture-needed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(asset)
  }, 60000);
}

export async function analyzeRoomGroups(asset) {
  return fetchJsonWithTimeout("/api/images/room-groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(asset)
  }, 120000);
}

export async function analyzeFireplaceNeed(asset) {
  return fetchJsonWithTimeout("/api/image/fireplace-needed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(asset)
  }, 60000);
}

export async function getRenderStatus(job) {
  const response = await fetch("/api/render/status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(job)
  });
  return response.json();
}

export async function getRenderResult(job) {
  const response = await fetch("/api/render/result", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(job)
  });
  return response.json();
}

export async function resolveRenderJob(job) {
  return fetchJsonWithTimeout("/api/render/resolve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(job)
  }, 20000);
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

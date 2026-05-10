import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const projectEnv = {};
await loadEnv();
const port = Number(process.env.PORT ?? 5173);
const FIREPLACE_CONFIDENCE_THRESHOLD = 0.96;
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    const routePath = normalizeRoutePath(url.pathname);

    if (request.method === "OPTIONS" && routePath.startsWith("/api/")) {
      response.writeHead(204, apiHeaders());
      response.end();
      return;
    }

    if (routePath === "/runtime-config.js") {
      const config = {
        hasFalKey: Boolean(process.env.FAL_KEY),
        hasOpenAIKey: Boolean(getOpenAIKey())
      };
      response.writeHead(200, noStoreHeaders("text/javascript; charset=utf-8"));
      response.end(`globalThis.__AUTOHDR_CONFIG__ = ${JSON.stringify(config)};`);
      return;
    }

    if (routePath === "/api/openai/refine-shot" && request.method === "POST") {
      const body = await readJson(request);
      const result = await refineShotWithOpenAI(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/render/shot" && request.method === "POST") {
      const body = await readJson(request);
      const result = await submitFalShot(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/render/upload" && request.method === "POST") {
      const body = await readJson(request);
      const result = await uploadFalAsset(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/image/stage" && request.method === "POST") {
      const body = await readJson(request);
      const result = await stageFalImage(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/image/furniture-needed" && request.method === "POST") {
      const body = await readJson(request);
      const result = await analyzeFurnitureNeed(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/images/room-groups" && request.method === "POST") {
      const body = await readJson(request);
      const result = await analyzeRoomGroups(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/image/fireplace-needed" && request.method === "POST") {
      const body = await readJson(request);
      const result = await analyzeFireplaceNeed(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath.startsWith("/api/video/export/") && request.method === "POST") {
      const result = await exportVideoFile(request, routePath.split("/").at(-1) ?? "", url);
      sendJson(response, 200, result);
      return;
    }

    if (routePath.startsWith("/api/video/download/") && request.method === "GET") {
      await sendExportedVideo(response, routePath.split("/").at(-1) ?? "", url);
      return;
    }

    if (routePath === "/api/video/proxy" && request.method === "GET") {
      await proxyVideoDownload(response, url);
      return;
    }

    if (routePath === "/api/render/status" && ["GET", "POST"].includes(request.method ?? "")) {
      const body = request.method === "POST" ? await readJson(request) : readRenderQuery(url);
      const result = await getFalStatus(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath.startsWith("/api/render/status/") && ["GET", "POST"].includes(request.method ?? "")) {
      const body = {
        ...readRenderQuery(url),
        ...(request.method === "POST" ? await readJson(request) : {}),
        requestId: decodeURIComponent(routePath.split("/").at(-1) ?? "")
      };
      const result = await getFalStatus(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/render/result" && ["GET", "POST"].includes(request.method ?? "")) {
      const body = request.method === "POST" ? await readJson(request) : readRenderQuery(url);
      const result = await getFalResult(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath.startsWith("/api/render/result/") && ["GET", "POST"].includes(request.method ?? "")) {
      const body = {
        ...readRenderQuery(url),
        ...(request.method === "POST" ? await readJson(request) : {}),
        requestId: decodeURIComponent(routePath.split("/").at(-1) ?? "")
      };
      const result = await getFalResult(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath === "/api/render/resolve" && ["GET", "POST"].includes(request.method ?? "")) {
      const body = request.method === "POST" ? await readJson(request) : readRenderQuery(url);
      const result = await resolveFalRender(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath.startsWith("/api/render/resolve/") && ["GET", "POST"].includes(request.method ?? "")) {
      const body = {
        ...readRenderQuery(url),
        ...(request.method === "POST" ? await readJson(request) : {}),
        requestId: decodeURIComponent(routePath.split("/").at(-1) ?? "")
      };
      const result = await resolveFalRender(body);
      sendJson(response, 200, result);
      return;
    }

    if (routePath.startsWith("/api/")) {
      sendJson(response, 404, {
        ok: false,
        status: "not_found",
        message: `No API route matched ${request.method} ${routePath}.`
      });
      return;
    }

    const safePath = normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root, safePath === "/" ? "index.html" : safePath);
    const body = await readFile(filePath);
    response.writeHead(200, noStoreHeaders(mimeTypes[extname(filePath)] ?? "application/octet-stream"));
    response.end(body);
  } catch (error) {
    if (request.url?.startsWith("/api/")) {
      sendJson(response, 500, {
        ok: false,
        status: "server_error",
        message: error instanceof Error ? error.message : "Unexpected server error."
      });
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`AutoHDR Motion Studio running at http://127.0.0.1:${port}`);
});

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function readBodyBuffer(request, maxBytes = 100 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.byteLength;
    if (total > maxBytes) throw new Error("Uploaded video is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function readRenderQuery(url) {
  return {
    requestId: url.searchParams.get("requestId") ?? url.searchParams.get("request_id") ?? "",
    modelId: url.searchParams.get("modelId") ?? url.searchParams.get("model") ?? "",
    status_url: url.searchParams.get("status_url") ?? url.searchParams.get("statusUrl") ?? "",
    response_url: url.searchParams.get("response_url") ?? url.searchParams.get("responseUrl") ?? ""
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, noStoreHeaders("application/json; charset=utf-8"));
  response.end(JSON.stringify(payload));
}

async function exportVideoFile(request, rawId, url) {
  const exportId = normalizeExportId(rawId);
  const fileName = sanitizeDownloadFileName(url.searchParams.get("fileName") ?? "autohdr-final-video.mp4");
  const body = await readBodyBuffer(request, 600 * 1024 * 1024);
  if (!body.byteLength) {
    return { ok: false, status: "empty_file", message: "No video bytes were sent for export." };
  }

  const exportsDir = join(root, "exports");
  await mkdir(exportsDir, { recursive: true });
  const filePath = join(exportsDir, `${exportId}.mp4`);
  await writeFile(filePath, body);

  return {
    ok: true,
    status: "ready",
    id: exportId,
    fileName,
    size: body.byteLength,
    downloadUrl: `/api/video/download/${encodeURIComponent(exportId)}?fileName=${encodeURIComponent(fileName)}`
  };
}

async function sendExportedVideo(response, rawId, url) {
  const exportId = normalizeExportId(rawId);
  const fileName = sanitizeDownloadFileName(url.searchParams.get("fileName") ?? "autohdr-final-video.mp4");
  const filePath = join(root, "exports", `${exportId}.mp4`);
  const body = await readFile(filePath);
  sendVideoBytes(response, body, fileName);
}

async function proxyVideoDownload(response, url) {
  const sourceUrl = normalizeDownloadUrl(url.searchParams.get("url") ?? "");
  if (!sourceUrl) {
    sendJson(response, 400, { ok: false, status: "invalid_url", message: "A valid http(s) video URL is required." });
    return;
  }

  const fileName = sanitizeDownloadFileName(url.searchParams.get("fileName") ?? "autohdr-final-video.mp4");
  const upstream = await fetchWithTimeout(sourceUrl, {}, 120000);
  if (!upstream.ok) {
    sendJson(response, 502, {
      ok: false,
      status: "download_failed",
      message: `Could not fetch the video URL. HTTP ${upstream.status}.`
    });
    return;
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  sendVideoBytes(response, body, fileName);
}

function sendVideoBytes(response, body, fileName) {
  response.writeHead(200, {
    ...apiHeaders(),
    "Content-Type": "video/mp4",
    "Content-Length": String(body.byteLength),
    "Content-Disposition": `attachment; filename="${fileName.replaceAll('"', "")}"`,
    "Cache-Control": "no-store, max-age=0"
  });
  response.end(body);
}

function normalizeRoutePath(pathname) {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function noStoreHeaders(contentType) {
  return {
    ...apiHeaders(),
    "Content-Type": contentType,
    "Cache-Control": "no-store, max-age=0"
  };
}

function apiHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

async function refineShotWithOpenAI(payload) {
  const openaiKey = getOpenAIKey();
  if (!openaiKey) {
    return { ok: false, status: "missing_key", message: "Set OPENAI_API_KEY or OPEN_API_KEY in this project's .env before using OpenAI refinement." };
  }

  const shot = payload.shot ?? {};
  const prompt = [
    "You are a world-class real estate video creative director.",
    "Refine this generated shot so it feels like a professional videographer planned it.",
    "Return only compact JSON with keys: title, movement, imagePrompt, videoPrompt, duration.",
    "Keep all prompts photorealistic and architecture-safe. Do not invent furniture, layout, or materials.",
    `Room type: ${shot.roomType ?? "Unknown"}`,
    `Current title: ${shot.title ?? ""}`,
    `Current movement: ${shot.movement ?? ""}`,
    `Current duration: ${shot.duration ?? 5}`,
    `Current image prompt: ${shot.imagePrompt ?? ""}`,
    `Current video prompt: ${shot.videoPrompt ?? ""}`
  ].join("\n");

  const openaiResponse = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      input: prompt,
      max_output_tokens: 1200
    })
  }, 30000);

  const data = await parseFalResponse(openaiResponse);
  if (!openaiResponse.ok) {
    return {
      ok: false,
      status: "openai_failed",
      message: data.error?.message ?? "OpenAI prompt refinement failed.",
      data
    };
  }

  const text = extractOpenAIText(data);
  const refined = parseJsonObject(text);
  if (!refined) {
    return {
      ok: false,
      status: "parse_failed",
      message: "OpenAI returned text, but it was not valid JSON.",
      text
    };
  }

  return {
    ok: true,
    status: "refined",
    refined
  };
}

async function analyzeFurnitureNeed(payload = {}) {
  const openaiKey = getOpenAIKey();
  if (!openaiKey) {
    return { ok: false, status: "missing_key", message: "Set OPENAI_API_KEY or OPEN_API_KEY in this project's .env before furniture detection." };
  }

  let imageUrl = payload.imageUrl ?? payload.url ?? "";
  if (isDataUrl(imageUrl)) {
    const upload = await uploadFalAsset({
      dataUrl: imageUrl,
      fileName: payload.fileName ?? "autohdr-furniture-check.jpg"
    });
    if (!upload.ok) return upload;
    imageUrl = upload.url;
  }

  if (!isPublicUrl(imageUrl)) {
    return {
      ok: false,
      status: "unsupported_input",
      message: "Furniture detection needs a public image URL."
    };
  }

  const prompt = [
    "You are inspecting a real estate listing photo before virtual staging.",
    "Decide whether the room needs furniture added, whether an existing TV is already visible, and whether adding a TV would make sense if no TV is visible.",
    "Return only compact JSON with keys: needsFurniture, hasVisibleTv, shouldAddTv, confidence, reason, tvReason.",
    "Set needsFurniture true only when the visible room is empty, vacant, or so sparsely furnished that core staging furniture should be added.",
    "Set needsFurniture false when the room already has meaningful furniture such as sofas, beds, dining tables, desks, chairs, cabinets/vanities, or a furnished patio.",
    "Set needsFurniture false for exterior photos, closets, hallways, garages, utility rooms, tight detail shots, or rooms where adding furniture would be inappropriate.",
    "Set hasVisibleTv true only when a real TV or mounted screen is clearly visible in the image.",
    "Set shouldAddTv true only when no TV is visible and the room naturally supports a TV placement, such as a living room, family room, media room, den, or bedroom with an obvious viewing wall or console area.",
    "Set shouldAddTv false when a TV is already visible, or for kitchens, dining rooms, bathrooms, closets, hallways, exteriors, detail shots, rooms dominated by windows or fireplaces, or rooms where a TV would feel forced.",
    "Do not suggest adding a TV over a fireplace, across a window, blocking architecture, or in a location that would make the room feel less premium.",
    "Do not recommend changing already furnished rooms."
  ].join("\n");

  const openaiResponse = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageUrl, detail: "low" }
          ]
        }
      ],
      max_output_tokens: 500,
      text: {
        format: {
          type: "json_schema",
          name: "furniture_detection",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              needsFurniture: {
                type: "boolean",
                description: "True only when virtual staging furniture should be added."
              },
              hasVisibleTv: {
                type: "boolean",
                description: "True only when a real TV or mounted screen is already visible."
              },
              shouldAddTv: {
                type: "boolean",
                description: "True only when a TV should be included in the virtual staging."
              },
              confidence: {
                type: "number",
                description: "Confidence from 0 to 1."
              },
              reason: {
                type: "string",
                description: "Short reason for the decision."
              },
              tvReason: {
                type: "string",
                description: "Short reason explaining whether a TV makes sense."
              }
            },
            required: ["needsFurniture", "hasVisibleTv", "shouldAddTv", "confidence", "reason", "tvReason"]
          }
        }
      }
    })
  }, 30000);

  const data = await parseFalResponse(openaiResponse);
  if (!openaiResponse.ok) {
    return {
      ok: false,
      status: "openai_failed",
      message: data.error?.message ?? "Furniture detection failed.",
      data
    };
  }

  const outputText = extractOpenAIText(data);
  const parsed = normalizeFurnitureDetection(parseJsonObject(outputText));
  if (!parsed || typeof parsed.needsFurniture !== "boolean") {
    return {
      ok: true,
      status: "checked",
      needsFurniture: false,
      hasVisibleTv: false,
      shouldAddTv: false,
      confidence: 0,
      reason: "Furniture detection returned an invalid response, so the original image was kept to avoid changing an already furnished room.",
      tvReason: "TV placement was skipped because the furniture detection response was invalid.",
      warning: "invalid_detection_response",
      rawText: outputText.slice(0, 500)
    };
  }

  return {
    ok: true,
    status: "checked",
    needsFurniture: parsed.needsFurniture,
    hasVisibleTv: Boolean(parsed.hasVisibleTv),
    shouldAddTv: Boolean(!parsed.hasVisibleTv && parsed.shouldAddTv),
    confidence: Number(parsed.confidence ?? 0),
    reason: String(parsed.reason ?? ""),
    tvReason: String(parsed.tvReason ?? "")
  };
}

async function analyzeRoomGroups(payload = {}) {
  const openaiKey = getOpenAIKey();
  if (!openaiKey) {
    return { ok: false, status: "missing_key", message: "Set OPENAI_API_KEY or OPEN_API_KEY in this project's .env before room grouping." };
  }

  const images = Array.isArray(payload.images) ? payload.images.slice(0, 20) : [];
  if (!images.length) {
    return { ok: false, status: "missing_images", message: "At least one image is required for room grouping." };
  }

  const preparedImages = [];
  for (const image of images) {
    let imageUrl = image.imageUrl ?? image.url ?? "";
    if (isDataUrl(imageUrl)) {
      const upload = await uploadFalAsset({
        dataUrl: imageUrl,
        fileName: image.fileName ?? "autohdr-room-group.jpg"
      });
      if (!upload.ok) return upload;
      imageUrl = upload.url;
    }
    if (!isPublicUrl(imageUrl)) {
      return {
        ok: false,
        status: "unsupported_input",
        message: "Room grouping needs public image URLs."
      };
    }
    preparedImages.push({
      id: String(image.id ?? image.fileName ?? `image-${preparedImages.length + 1}`),
      fileName: String(image.fileName ?? ""),
      imageUrl
    });
  }

  const signatures = await Promise.all(preparedImages.map((image) => analyzeRoomSignature(image, openaiKey)));
  const assignments = buildRoomGroupsFromSignatures(preparedImages, signatures);

  return {
    ok: true,
    status: signatures.some((signature) => signature.fallback) ? "fallback_grouped" : "grouped",
    assignments,
    warning: signatures.some((signature) => signature.fallback)
      ? "Room grouping partially fell back to per-image defaults, so some matching may be less accurate."
      : ""
  };
}

async function analyzeFireplaceNeed(payload = {}) {
  const openaiKey = getOpenAIKey();
  if (!openaiKey) {
    return { ok: false, status: "missing_key", message: "Set OPENAI_API_KEY or OPEN_API_KEY in this project's .env before fireplace detection." };
  }

  let imageUrl = payload.imageUrl ?? payload.url ?? "";
  if (isDataUrl(imageUrl)) {
    const upload = await uploadFalAsset({
      dataUrl: imageUrl,
      fileName: payload.fileName ?? "autohdr-fireplace-check.jpg"
    });
    if (!upload.ok) return upload;
    imageUrl = upload.url;
  }

  if (!isPublicUrl(imageUrl)) {
    return {
      ok: false,
      status: "unsupported_input",
      message: "Fireplace detection needs a public image URL."
    };
  }

  const prompt = [
    "You are inspecting a real estate listing photo before a fireplace warmth edit.",
    "Decide whether a subtle fire should be added.",
    "Return only compact JSON with keys: needsFire, confidence, reason.",
    "Set needsFire true only when a clearly visible real fireplace/firebox is present and appears unlit, empty, or dark.",
    `Only return needsFire true when confidence is at least ${FIREPLACE_CONFIDENCE_THRESHOLD}. If you are not highly sure, return needsFire false.`,
    "Set needsFire false when there is no fireplace, the fireplace is already lit, the firebox is not clearly visible, or adding fire would be unsafe or unrealistic.",
    "Set needsFire false for exterior shots, kitchens without fireplaces, bathrooms, bedrooms without visible fireboxes, tight detail shots, tables, decor objects, shelves, televisions, windows, mirrors, wall art, and rooms where no existing fireplace/firebox is visible.",
    "Do not treat candles, table decor, dark recesses, shelves, wall openings, media consoles, or shadows as fireplaces.",
    "Never recommend any structural change to the home. Do not recommend adding a new fireplace, changing walls, or inventing any architectural feature."
  ].join("\n");

  const openaiResponse = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageUrl, detail: "high" }
          ]
        }
      ],
      max_output_tokens: 500,
      text: {
        format: {
          type: "json_schema",
          name: "fireplace_detection",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              needsFire: {
                type: "boolean",
                description: "True only when a subtle fire should be added inside an existing visible fireplace/firebox."
              },
              confidence: {
                type: "number",
                description: "Confidence from 0 to 1."
              },
              reason: {
                type: "string",
                description: "Short reason for the decision."
              }
            },
            required: ["needsFire", "confidence", "reason"]
          }
        }
      }
    })
  }, 30000);

  const data = await parseFalResponse(openaiResponse);
  if (!openaiResponse.ok) {
    return {
      ok: false,
      status: "openai_failed",
      message: data.error?.message ?? "Fireplace detection failed.",
      data
    };
  }

  const outputText = extractOpenAIText(data);
  const parsed = normalizeFireplaceDetection(parseJsonObject(outputText));
  if (!parsed || typeof parsed.needsFire !== "boolean") {
    return {
      ok: true,
      status: "checked",
      needsFire: false,
      confidence: 0,
      reason: "Fireplace detection returned an invalid response, so the original image was kept.",
      warning: "invalid_detection_response",
      rawText: outputText.slice(0, 500)
    };
  }

  const confidence = Number(parsed.confidence ?? 0);
  const gatedNeedsFire = Boolean(parsed.needsFire && confidence >= FIREPLACE_CONFIDENCE_THRESHOLD);
  return {
    ok: true,
    status: "checked",
    needsFire: gatedNeedsFire,
    confidence,
    reason: gatedNeedsFire
      ? String(parsed.reason ?? "")
      : parsed.needsFire && confidence < FIREPLACE_CONFIDENCE_THRESHOLD
        ? `Confidence ${confidence.toFixed(2)} is below the fireplace threshold ${FIREPLACE_CONFIDENCE_THRESHOLD.toFixed(2)}. Kept original.`
        : String(parsed.reason ?? "")
  };
}

function getOpenAIKey() {
  return projectEnv.OPEN_API_KEY ?? projectEnv.OPENAI_API_KEY ?? "";
}

function getOpenAIModel() {
  return projectEnv.OPENAI_MODEL ?? "gpt-5";
}

async function submitFalShot(payload) {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return { ok: false, status: "missing_key", message: "Set FAL_KEY in .env before submitting renders." };
  }

  const modelId = payload.modelId ?? "bytedance/seedance-2.0/image-to-video";
  const prepared = await prepareFalShotPayload(payload);
  if (!prepared.ok) return prepared;

  const input = buildFalInput(prepared.payload);
  const falResponse = await fetchWithTimeout(`https://queue.fal.run/${modelId}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${falKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }, 30000);

  const data = await parseFalResponse(falResponse);
  if (!falResponse.ok) {
    return {
      ok: false,
      status: "submit_failed",
      modelId,
      input,
      falStatus: falResponse.status,
      data
    };
  }

  return {
    ok: true,
    status: "submitted",
    modelId,
    input,
    uploads: prepared.uploads,
    ...data
  };
}

async function prepareFalShotPayload(payload) {
  const prepared = { ...payload };
  const uploads = {};

  const imageUrl = payload.imageUrl ?? payload.startImageUrl ?? "";
  if (isDataUrl(imageUrl)) {
    const upload = await uploadFalAsset({
      dataUrl: imageUrl,
      fileName: payload.fileName ?? payload.startName ?? "autohdr-scene.jpg"
    });
    if (!upload.ok) return upload;
    prepared.imageUrl = upload.url;
    prepared.startImageUrl = upload.url;
    uploads.imageUrl = upload.url;
  }

  const endImageUrl = payload.endImageUrl ?? payload.end_image_url ?? "";
  if (isDataUrl(endImageUrl)) {
    const upload = await uploadFalAsset({
      dataUrl: endImageUrl,
      fileName: payload.endFileName ?? "autohdr-scene-end.jpg"
    });
    if (!upload.ok) return upload;
    prepared.endImageUrl = upload.url;
    prepared.end_image_url = upload.url;
    uploads.endImageUrl = upload.url;
  }

  return {
    ok: true,
    payload: prepared,
    uploads
  };
}

async function uploadFalAsset(payload = {}) {
  if (!process.env.FAL_KEY) {
    return { ok: false, status: "missing_key", message: "Set FAL_KEY in .env before uploading assets." };
  }

  const source = payload.dataUrl ?? payload.imageUrl ?? payload.url ?? "";
  if (isPublicUrl(source)) {
    return {
      ok: true,
      status: "already_url",
      url: source,
      file_url: source
    };
  }

  if (!isDataUrl(source)) {
    return {
      ok: false,
      status: "unsupported_input",
      message: "Upload input must be a data URL or public URL."
    };
  }

  try {
    const { buffer, contentType } = dataUrlToBuffer(source);
    const fileName = sanitizeFileName(payload.fileName, contentType);
    const url = await uploadBufferToFalCdn(buffer, contentType, fileName);
    return {
      ok: true,
      status: "uploaded",
      url,
      file_url: url,
      fileName,
      size: buffer.byteLength
    };
  } catch (error) {
    return {
      ok: false,
      status: "upload_failed",
      message: error instanceof Error ? error.message : "Fal CDN upload failed."
    };
  }
}

async function uploadBufferToFalCdn(buffer, contentType, fileName) {
  const initiated = await fetchWithTimeout("https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content_type: contentType,
      file_name: fileName
    })
  }, 20000);
  const uploadTicket = await parseFalResponse(initiated);
  if (!initiated.ok) {
    throw new Error(uploadTicket.message ?? uploadTicket.error?.message ?? `Fal upload initiation failed with HTTP ${initiated.status}.`);
  }
  if (!uploadTicket.upload_url || !uploadTicket.file_url) {
    throw new Error("Fal upload initiation did not return upload_url and file_url.");
  }

  const uploaded = await fetchWithTimeout(uploadTicket.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType
    },
    body: buffer
  }, 90000);

  if (!uploaded.ok) {
    const data = await parseFalResponse(uploaded);
    throw new Error(data.message ?? data.error?.message ?? `Fal CDN upload failed with HTTP ${uploaded.status}.`);
  }

  return uploadTicket.file_url;
}

async function stageFalImage(payload = {}) {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return { ok: false, status: "missing_key", message: "Set FAL_KEY in .env before adding furniture." };
  }

  let imageUrl = payload.imageUrl ?? payload.url ?? "";
  if (isDataUrl(imageUrl)) {
    const upload = await uploadFalAsset({
      dataUrl: imageUrl,
      fileName: payload.fileName ?? "autohdr-stage-input.jpg"
    });
    if (!upload.ok) return upload;
    imageUrl = upload.url;
  }

  if (!isPublicUrl(imageUrl)) {
    return {
      ok: false,
      status: "unsupported_input",
      message: "Furniture staging needs a public Fal image URL."
    };
  }

  const modelId = "fal-ai/nano-banana/edit";
  const input = {
    prompt: payload.prompt ?? "Add tasteful contemporary real estate furniture to this empty room while preserving architecture, lighting, perspective, and materials.",
    image_urls: [imageUrl],
    num_images: 1,
    aspect_ratio: "auto",
    output_format: "jpeg",
    safety_tolerance: "4",
    limit_generations: true
  };

  const submitted = await submitFalQueue(modelId, input, 30000);
  if (!submitted.ok) return submitted;

  const completed = await waitForFalCompletion({
    modelId,
    requestId: submitted.request_id ?? submitted.requestId,
    status_url: submitted.status_url,
    response_url: submitted.response_url
  }, 210000);

  if (!completed.ok) return completed;

  const imageResultUrl = findImageUrl(completed.result ?? completed);
  return {
    ...completed,
    ok: Boolean(imageResultUrl),
    status: imageResultUrl ? "COMPLETED" : "image_missing",
    imageUrl: imageResultUrl,
    message: imageResultUrl ? "Furniture staging complete." : "Furniture staging completed but no image URL was found.",
    modelId,
    input
  };
}

async function submitFalQueue(modelId, input, timeoutMs) {
  const falResponse = await fetchWithTimeout(`https://queue.fal.run/${modelId}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }, timeoutMs);
  const data = await parseFalResponse(falResponse);
  if (!falResponse.ok) {
    return {
      ok: false,
      status: "submit_failed",
      modelId,
      input,
      falStatus: falResponse.status,
      data,
      message: data.error?.message ?? data.message ?? `Fal submit failed with HTTP ${falResponse.status}.`
    };
  }
  return {
    ok: true,
    status: "submitted",
    modelId,
    input,
    ...data
  };
}

async function waitForFalCompletion(payload, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const status = await getFalStatus(payload);
    if (!status.ok) return status;

    const falState = String(status.status ?? status.state ?? "").toUpperCase();
    if (["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(falState)) {
      return {
        ...status,
        ok: false,
        message: status.message ?? `Fal request ended with status ${falState}.`
      };
    }

    if (falState === "COMPLETED") {
      const result = await getFalResult(payload);
      return {
        ...status,
        result,
        ok: result.ok,
        status: "COMPLETED",
        message: result.ok ? "Fal request complete." : "Fal result lookup failed."
      };
    }

    await delay(5000);
  }

  return {
    ok: false,
    status: "timeout",
    message: "Furniture staging timed out while waiting for Fal."
  };
}

function extractOpenAIText(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  collectOpenAIText(data.output, parts);
  return parts.join("\n").trim();
}

function collectOpenAIText(value, parts) {
  if (!value) return;
  if (typeof value === "string") {
    if (value.trim()) parts.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectOpenAIText(item, parts));
    return;
  }
  if (typeof value !== "object") return;

  if (["output_text", "text"].includes(value.type) && typeof value.text === "string") {
    parts.push(value.text);
    return;
  }

  if (typeof value.output_text === "string") parts.push(value.output_text);
  if (typeof value.text === "string" && value.type !== "input_text") parts.push(value.text);
  if (value.content) collectOpenAIText(value.content, parts);
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeFurnitureDetection(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const normalized = { ...parsed };
  if (typeof normalized.needsFurniture === "string") {
    const value = normalized.needsFurniture.trim().toLowerCase();
    if (value === "true") normalized.needsFurniture = true;
    if (value === "false") normalized.needsFurniture = false;
  }
  if (typeof normalized.hasVisibleTv === "string") {
    const value = normalized.hasVisibleTv.trim().toLowerCase();
    if (value === "true") normalized.hasVisibleTv = true;
    if (value === "false") normalized.hasVisibleTv = false;
  }
  if (typeof normalized.shouldAddTv === "string") {
    const value = normalized.shouldAddTv.trim().toLowerCase();
    if (value === "true") normalized.shouldAddTv = true;
    if (value === "false") normalized.shouldAddTv = false;
  }
  if (typeof normalized.hasVisibleTv !== "boolean") normalized.hasVisibleTv = false;
  if (typeof normalized.shouldAddTv !== "boolean") normalized.shouldAddTv = false;
  return normalized;
}

async function analyzeRoomSignature(image, openaiKey) {
  const prompt = [
    "You are identifying one real estate photo for cross-angle room grouping before virtual staging.",
    "Return only compact JSON with keys: groupingKey, roomLabel, stagingStyle.",
    "groupingKey must be a short stable identifier based on the physical room identity, not the camera angle.",
    "Use durable cues like cabinetry, window wall, fireplace placement, flooring, fixtures, exterior view, and built-ins.",
    "If this is exterior, patio, driveway, or yard, use a stable exterior grouping key instead.",
    "stagingStyle must be one short sentence describing one consistent furniture package for this room."
  ].join("\n");

  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: `${prompt}\n\nImage id: ${image.id}\nFile name: ${image.fileName}` },
            { type: "input_image", image_url: image.imageUrl, detail: "low" }
          ]
        }
      ],
      max_output_tokens: 400,
      text: {
        format: {
          type: "json_schema",
          name: "room_signature",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              groupingKey: { type: "string" },
              roomLabel: { type: "string" },
              stagingStyle: { type: "string" }
            },
            required: ["groupingKey", "roomLabel", "stagingStyle"]
          }
        }
      }
    })
  }, 30000);

  const data = await parseFalResponse(response);
  if (!response.ok) {
    return buildFallbackRoomSignature(image, true);
  }

  const parsed = normalizeRoomSignature(parseJsonObject(extractOpenAIText(data)));
  if (!parsed) {
    return buildFallbackRoomSignature(image, true);
  }

  return parsed;
}

function normalizeRoomSignature(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const groupingKey = normalizeGroupingKey(parsed.groupingKey);
  if (!groupingKey) return null;
  return {
    groupingKey,
    roomLabel: String(parsed.roomLabel ?? "Room"),
    stagingStyle: String(parsed.stagingStyle ?? "Use one consistent premium furniture package across all angles of this room."),
    fallback: false
  };
}

function buildFallbackRoomSignature(image, fallback = false) {
  return {
    groupingKey: normalizeGroupingKey(image.fileName || image.id) || `room-${Date.now()}`,
    roomLabel: image.fileName ? `Room from ${image.fileName}` : "Room",
    stagingStyle: "Use one consistent premium furniture package across all angles of this room.",
    fallback
  };
}

function buildRoomGroupsFromSignatures(images, signatures) {
  const groupOrder = new Map();
  let nextGroup = 1;
  return images.map((image, index) => {
    const signature = signatures[index] ?? buildFallbackRoomSignature(image, true);
    if (!groupOrder.has(signature.groupingKey)) {
      groupOrder.set(signature.groupingKey, `room-${nextGroup}`);
      nextGroup += 1;
    }
    return {
      id: image.id,
      roomGroupId: groupOrder.get(signature.groupingKey),
      roomLabel: signature.roomLabel,
      stagingStyle: signature.stagingStyle
    };
  });
}

function normalizeGroupingKey(value) {
  const text = String(value ?? "")
    .toLowerCase()
    .replace(/\.[^.]+$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return text || "";
}

function buildFallbackRoomGrouping(images) {
  return images.map((image, index) => ({
    id: image.id,
    roomGroupId: `room-${index + 1}`,
    roomLabel: image.fileName ? `Room from ${image.fileName}` : "Room",
    stagingStyle: "Use one consistent premium furniture package for this room only."
  }));
}

function normalizeFireplaceDetection(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const normalized = { ...parsed };
  if (typeof normalized.needsFire === "string") {
    const value = normalized.needsFire.trim().toLowerCase();
    if (value === "true") normalized.needsFire = true;
    if (value === "false") normalized.needsFire = false;
  }
  return normalized;
}

async function getFalStatus(payload = {}) {
  const { requestId, modelId } = payload;
  if (!process.env.FAL_KEY) return { ok: false, status: "missing_key" };
  const statusUrl = normalizeFalQueueUrl(payload.status_url ?? payload.statusUrl);
  if (!statusUrl && (!requestId || !modelId)) return { ok: false, status: "missing_request" };

  const url = statusUrl ?? `https://queue.fal.run/${modelId}/requests/${requestId}/status?logs=1`;
  const falResponse = await fetchWithTimeout(addLogsParam(url), {
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`
    }
  }, 15000);
  const data = await parseFalResponse(falResponse);
  return { ok: falResponse.ok, modelId, requestId, falStatus: falResponse.status, ...data };
}

async function getFalResult(payload = {}) {
  const { requestId, modelId } = payload;
  if (!process.env.FAL_KEY) return { ok: false, status: "missing_key" };
  const responseUrl = normalizeFalQueueUrl(payload.response_url ?? payload.responseUrl);
  if (!responseUrl && (!requestId || !modelId)) return { ok: false, status: "missing_request" };

  const url = responseUrl ?? `https://queue.fal.run/${modelId}/requests/${requestId}`;
  const falResponse = await fetchWithTimeout(url, {
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`
    }
  }, 15000);
  const data = await parseFalResponse(falResponse);
  return { ok: falResponse.ok, modelId, requestId, falStatus: falResponse.status, ...data };
}

async function resolveFalRender(payload = {}) {
  const status = await getFalStatus(payload);
  if (!status.ok) return status;

  const falState = String(status.status ?? status.state ?? "").toUpperCase();
  const failed = ["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(falState);
  if (failed) {
    return {
      ...status,
      ok: false,
      message: status.message ?? `Fal render ended with status ${falState}.`
    };
  }

  if (falState !== "COMPLETED") {
    return {
      ...status,
      ok: true,
      videoUrl: "",
      message: status.logs?.at?.(-1)?.message ?? `Fal status: ${falState || "queued"}.`
    };
  }

  const result = await getFalResult(payload);
  const videoUrl = findVideoUrl(result);
  return {
    ...status,
    result,
    ok: result.ok,
    status: "COMPLETED",
    videoUrl,
    message: videoUrl ? "Render complete. Video is ready." : "Render complete, but no video URL was found."
  };
}

function normalizeFalQueueUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname !== "queue.fal.run") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function findVideoUrl(payload) {
  if (!payload || typeof payload !== "object") return "";
  const direct = [
    payload.video?.url,
    payload.video_url,
    payload.output?.video?.url,
    payload.output?.video_url,
    payload.data?.video?.url,
    payload.data?.video_url,
    payload.result?.video?.url,
    payload.result?.video_url
  ].find(Boolean);
  return direct ?? findNestedVideoUrl(payload);
}

function findImageUrl(payload) {
  if (!payload || typeof payload !== "object") return "";
  const direct = [
    payload.images?.[0]?.url,
    payload.image?.url,
    payload.image_url,
    payload.output?.images?.[0]?.url,
    payload.output?.image?.url,
    payload.output?.image_url,
    payload.data?.images?.[0]?.url,
    payload.data?.image?.url,
    payload.data?.image_url,
    payload.result?.images?.[0]?.url,
    payload.result?.image?.url,
    payload.result?.image_url
  ].find(Boolean);
  return direct ?? findNestedImageUrl(payload);
}

function findNestedImageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^https?:\/\/.+\.(png|jpe?g|webp)(\?|$)/i.test(value)) return value;
    if (/^https?:\/\/.+fal\.media\/files\//i.test(value)) return value;
    return "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedImageUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/image|url|file|media/i.test(key)) {
        const found = findNestedImageUrl(item);
        if (found) return found;
      }
    }
  }
  return "";
}

function findNestedVideoUrl(value) {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^https?:\/\/.+\.(mp4|mov|webm)(\?|$)/i.test(value)) return value;
    if (/^https?:\/\/.+fal\.media\/files\//i.test(value)) return value;
    return "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedVideoUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/video|url|file|media/i.test(key)) {
        const found = findNestedVideoUrl(item);
        if (found) return found;
      }
    }
  }
  return "";
}

function isDataUrl(value) {
  return typeof value === "string" && /^data:[^;,]+;base64,/i.test(value);
}

function isPublicUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function dataUrlToBuffer(value) {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/i);
  if (!match) throw new Error("Invalid data URL.");
  return {
    contentType: match[1] || "application/octet-stream",
    buffer: Buffer.from(match[2], "base64")
  };
}

function sanitizeFileName(fileName, contentType) {
  const extension = extensionFromContentType(contentType);
  const fallback = `autohdr-upload-${Date.now()}.${extension}`;
  const safe = String(fileName || fallback)
    .split(/[\\/]/)
    .at(-1)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  if (!safe) return fallback;
  return /\.[a-z0-9]{2,5}$/i.test(safe) ? safe : `${safe}.${extension}`;
}

function sanitizeDownloadFileName(fileName) {
  const safe = String(fileName || "autohdr-final-video.mp4")
    .split(/[\\/]/)
    .at(-1)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  if (!safe) return "autohdr-final-video.mp4";
  return /\.mp4$/i.test(safe) ? safe : `${safe.replace(/\.[a-z0-9]{2,5}$/i, "")}.mp4`;
}

function normalizeExportId(value) {
  const safe = String(value || "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return safe || `autohdr-export-${Date.now()}`;
}

function normalizeDownloadUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function extensionFromContentType(contentType) {
  const normalized = String(contentType || "").toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  return "bin";
}

function addLogsParam(value) {
  const url = new URL(value);
  if (!url.searchParams.has("logs")) url.searchParams.set("logs", "1");
  return url.toString();
}

function buildFalInput(payload) {
  const duration = normalizeDuration(payload.duration);
  const prompt = payload.videoPrompt ?? payload.prompt ?? "";
  const imageUrl = payload.imageUrl ?? payload.startImageUrl;
  const endImageUrl = payload.endImageUrl ?? payload.end_image_url ?? "";
  const structuralNegativePrompt =
    "invented fireplace, invented firebox, invented outdoor fireplace, invented built-in, invented niche, invented wall opening, invented column, invented chimney, invented fountain, invented window, invented door, structural change, architectural change, extra wall feature, blur, distort, low quality, warped walls, bent vertical lines, furniture morphing, flicker, watermark, text overlays";

  if ((payload.modelId ?? "").includes("seedance-2.0")) {
    const input = {
      prompt,
      image_url: imageUrl,
      resolution: "1080p",
      duration,
      aspect_ratio: "16:9",
      negative_prompt: structuralNegativePrompt,
      generate_audio: false
    };
    if (endImageUrl) input.end_image_url = endImageUrl;
    return input;
  }

  if (payload.modelId?.includes("/v3/")) {
    return {
      prompt,
      duration,
      negative_prompt: structuralNegativePrompt,
      cfg_scale: 0.5,
      start_image_url: imageUrl,
      generate_audio: false
    };
  }

  return {
    prompt,
    duration,
    negative_prompt: structuralNegativePrompt,
    cfg_scale: 0.5,
    image_url: imageUrl
  };
}

function normalizeDuration(duration) {
  const numeric = Number(duration);
  if (!Number.isFinite(numeric)) return "5";
  return String(Math.min(15, Math.max(4, Math.round(numeric))));
}

async function parseFalResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Fal request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadEnv() {
  try {
    const envText = await readFile(join(root, ".env"), "utf8");
    envText.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separator = trimmed.indexOf("=");
      if (separator === -1) return;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (key) {
        projectEnv[key] = value.replace(/^["']|["']$/g, "");
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    });
  } catch {
    // Local env is optional for dry-run mode.
  }
}

// Product photos are resized and re-encoded as WebP before upload. The server stores them as
// base64 and rejects anything over 700 000 characters.
const MAX_LENGTH = 700000;

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That file is not a supported image."));
    image.src = src;
  });
}

function render(image, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  // White behind the image so transparent PNGs do not turn black as JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  // Some browsers (older Safari) cannot encode WebP. They fall back to JPEG, which the server also accepts.
  const webp = canvas.toDataURL("image/webp", quality);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality);
}

// Returns a WebP data URL no larger than the server limit.
export async function imageFileToDataUrl(file) {
  const image = await loadImage(await readFile(file));

  let dataUrl = render(image, 800, 0.85);
  if (dataUrl.length > MAX_LENGTH) dataUrl = render(image, 600, 0.8);
  if (dataUrl.length > MAX_LENGTH) throw new Error("This image is still too large after resizing. Try a simpler photo.");

  return dataUrl;
}

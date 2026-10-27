/**
 * Resizes and re-encodes an image as JPEG in the browser. Keeps uploads small
 * (Vercel caps request bodies at 4.5 MB) and JPEG works in every email client.
 */
export async function compressImage(file: File, maxSide = 2000, quality = 0.86): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process that image.");
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background, not black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that image."))), "image/jpeg", quality),
  );
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "invitation"}.jpg`, { type: "image/jpeg" });
}

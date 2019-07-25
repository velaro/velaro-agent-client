/**
 * Use HTML canvas to generate a base 64 data string
 * representing a badge to display over the icon.
 */
export function createBadgeData(text: string) {
  const canvas = document.createElement("canvas");
  canvas.height = 140;
  canvas.width = 140;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#9cc96b";
  ctx.beginPath();
  ctx.ellipse(70, 70, 70, 70, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "white";

  if (text.length > 2) {
    ctx.font = "75px sans-serif";
    ctx.fillText("" + text, 70, 98);
  } else if (text.length > 1) {
    ctx.font = "100px sans-serif";
    ctx.fillText("" + text, 70, 105);
  } else {
    ctx.font = "125px sans-serif";
    ctx.fillText("" + text, 70, 112);
  }

  return canvas.toDataURL();
}

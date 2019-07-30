import * as path from "path";

export function getTrayIconPath() {
  if (process.platform === "darwin") {
    return path.join(__dirname, "resources", "mac", "VelaroTemplate.png");
  } else {
    return path.join(__dirname, "resources", "windows", "Velaro.png");
  }
}

export function getTrayAvailableIconPath() {
  if (process.platform === "darwin") {
    return path.join(__dirname, "resources", "mac", "VelaroTemplate.png");
  } else {
    return path.join(__dirname, "resources", "windows", "Velaro.png");
  }
}

export function getTrayUnavailableIconPath() {
  if (process.platform === "darwin") {
    return path.join(__dirname, "resources", "mac", "VelaroTemplate.png");
  } else {
    return path.join(__dirname, "resources", "windows", "Velaro.png");
  }
}

export function isDev() {
  return !!process.execPath.match(/[\\\/]electron/);
}

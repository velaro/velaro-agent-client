export function isDev() {
  return !!process.execPath.match(/[\\\/]electron/);
}

export function parseQueryString(qs: string) {
  const obj: any = {};

  const items = qs.substr(1).split("&");

  items.forEach((item) => {
    const parts = item.split("=");
    obj[parts[0]] = decodeURIComponent(parts[1]);
  });

  return obj;
}

export function buildQueryString(obj: any) {
  let str = "";

  Object.keys(obj).forEach((key) => {
    str += `&${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`;
  });

  return str.substr(1);
}

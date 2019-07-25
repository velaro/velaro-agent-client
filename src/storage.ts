import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

const dataPath = path.join(app.getPath("userData"), "data.json");

let data: any = null;

function load() {
  if (data !== null) {
    return;
  }

  if (!fs.existsSync(dataPath)) {
    data = {};
    return;
  }

  data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

function save() {
  fs.writeFileSync(dataPath, JSON.stringify(data));
}

export function set(key: string, value: any) {
  load();
  data[key] = value;
  save();
}

export function get(key: string) {
  load();
  let value = null;
  if (key in data) {
    value = data[key];
  }
  return value;
}

export function unset(key: string) {
  load();
  if (key in data) {
    delete data[key];
    save();
  }
}

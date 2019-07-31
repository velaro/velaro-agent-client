const development = {
  consoleUrl: "http://consolenew.local.velaro.com"
};

const test = {
  consoleUrl: "https://enterprise-app.velaro.com"
};

const staging = {
  consoleUrl: "https://console-staging.velaro.com"
};

const production = {
  consoleUrl: "https://app.velaro.com"
};

let config: { consoleUrl: string };

switch (process.env.VELARO_ENV) {
  case "development":
    config = development;
    break;
  case "test":
    config = test;
    break;
  case "staging":
    config = staging;
    break;
  case "production":
    config = production;
    break;
  default:
    config = production;
    break;
}

export default config;

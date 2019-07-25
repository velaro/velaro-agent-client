var copy = require("copy");

function noop() {}
copy("src/**/*.html", "compiled", noop);
copy("src/**/*.css", "compiled", noop);
copy("src/**/*.png", "compiled", noop);
copy("src/**/*.ico", "compiled", noop);
copy("src/**/*.jpeg", "compiled", noop);
copy("src/**/*.jpg", "compiled", noop);

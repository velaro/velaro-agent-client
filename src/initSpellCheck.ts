import {
  ContextMenuBuilder,
  ContextMenuListener,
  SpellCheckHandler,
} from "electron-spellchecker";

function initialize() {
  (window as any).spellCheckHandler = new SpellCheckHandler();
  (window as any).spellCheckHandler.attachToInput();
  (window as any).spellCheckHandler.switchLanguage("en-US");

  const contextMenuBuilder = new ContextMenuBuilder((window as any).spellCheckHandler);

  const contextMenuListener = new ContextMenuListener((info) => {
    contextMenuBuilder.showPopupMenu(info);
  });
}

function tryInitialize() {
  if (document.body) {
    console.log("spellcheck init: initializing");
    initialize();
  } else {
    console.log(
      "spellcheck init: document.body does not exist, trying again in 1 second."
    );
    setTimeout(() => tryInitialize(), 1000);
  }
}

tryInitialize();

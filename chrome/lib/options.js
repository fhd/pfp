/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

let browser = require("./browserAPI");
let {EventTarget, emit} = require("../../lib/eventTarget");
let options = EventTarget();

browser.runtime.onConnect.addListener(function(port)
{
  if (port.name == "options")
  {
    let target = EventTarget();

    target.emit = function(eventName, ...args)
    {
      port.postMessage({eventName, args});
    };

    port.onMessage.addListener(message =>
    {
      emit(target, message.eventName, ...message.args);
    });

    emit(options, "connect", target);
  }
});

module.exports = options;

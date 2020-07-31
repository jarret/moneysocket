// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;

const CROSS_MARK = "❌";
const MONEY_WING = "💸";
const CHECK_MARK = "✅";
const EGGPLANT = "🍆";

class ConnectProgress {
    constructor(div) {
        this.parent_div = div;

    }

    setConnectingTitle(title, color) {
        var t = DomUtl.drawText(this.parent_div, title);
        t.setAttribute("style", "color:" + color +"; padding:3px;");
    }

    setProgressLine(progress_string) {
        var t = DomUtl.drawText(this.parent_div, progress_string);
        t.setAttribute("style", "padding-bottom:10px;");
    }

    draw(state) {
        switch (state) {
        case "DISCONNECTED":
            var title = "Disconnected";
            var color = "black";
            var line = "";
            break;
        case "CONNECTING_WEBSOCKET":
            var title = "Connecting Websocket";
            var color = "orange";
            var line = EGGPLANT + EGGPLANT + EGGPLANT + " " + EGGPLANT;
            break;
        case "REQUESTING_RENDEZVOUS":
            var title = "Requesting Rendezvous";
            var color = "orange";
            var line = MONEY_WING + EGGPLANT + EGGPLANT + " " + EGGPLANT;
            break;
        case "WAITING_FOR_RENDEZVOUS":
            var title = "Waiting for Rendezvous";
            var color = "orange";
            var line = MONEY_WING + MONEY_WING + EGGPLANT + " " + EGGPLANT;
            break;
        case "CONNECTED":
            var title = "Connected";
            var color = "green";
            var line = MONEY_WING + MONEY_WING + MONEY_WING + " " + CHECK_MARK;
            break;
        case "CONNECTION_FAILED":
            var title = "Connection Failed";
            var color = "red";
            var line = CROSS_MARK + CROSS_MARK + CROSS_MARK + " " + CROSS_MARK;
            break;
        }
        this.setConnectingTitle(title, color);
        this.setProgressLine(line);
    }
}


exports.ConnectProgress = ConnectProgress;

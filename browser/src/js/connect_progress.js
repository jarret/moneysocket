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

    drawDisconnected() {
        this.setConnectingTitle("Disconnected", "black");
        this.setProgressLine("");
    }

    drawConnectingWebsocket() {
        this.setConnectingTitle("Connecting Websocket", "orange");
        var s = EGGPLANT + EGGPLANT + EGGPLANT + " " + EGGPLANT;
        this.setProgressLine(s);
    }

    drawRequestingRendezvous() {
        this.setConnectingTitle("Requesting Rendezvous", "orange");
        var s = MONEY_WING + EGGPLANT + EGGPLANT + " " + EGGPLANT;
        this.setProgressLine(s);
    }

    drawWaitingForRendezvousPeer() {
        this.setConnectingTitle("Waiting For Rendezvous Peer", "orange");
        var s = MONEY_WING + MONEY_WING + EGGPLANT + " " + EGGPLANT;
        this.setProgressLine(s);
    }

    drawConnected() {
        this.setConnectingTitle("Connected", "green");
        var s = MONEY_WING + MONEY_WING + MONEY_WING + " " + CHECK_MARK;
        this.setProgressLine(s);
    }

    drawConnectionFailed() {
        this.setConnectingTitle("Connection Failed", "red");
        var s = CROSS_MARK + CROSS_MARK + CROSS_MARK + " " + CROSS_MARK;
        this.setProgressLine(s);
    }
}


exports.ConnectProgress = ConnectProgress;

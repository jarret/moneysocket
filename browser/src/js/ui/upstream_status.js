// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;

const CHECK_MARK = "✅";
const PLUG = "🔌";

class UpstreamStatusUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
    }

    draw() {
        this.my_div = document.createElement("div");
        this.updateDisconnected();
        this.parent_div.appendChild(this.my_div);
    }

    updateDisconnected() {
        DomUtl.deleteChildren(this.my_div);
        DomUtl.drawText(this.my_div, "Upstream: " + PLUG);
        this.my_div.setAttribute("class", "upstream-status");
    }

    updateConnected() {
        DomUtl.deleteChildren(this.my_div);
        DomUtl.drawText(this.my_div, "Upstream: " + CHECK_MARK);
        this.my_div.setAttribute("class", "upstream-status");
    }
}

exports.UpstreamStatusUi = UpstreamStatusUi;

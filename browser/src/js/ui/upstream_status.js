// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;

const CHECK_MARK = "✅";
const PLUG = "🔌";

class UpstreamStatusUi {
    constructor(div, title) {
        this.parent_div = div;
        this.my_div = null;
        this.title = title
    }

    draw(divclass) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", divclass);
        this.updateDisconnected();
        this.parent_div.appendChild(this.my_div);
    }

    updateDisconnected() {
        DomUtl.deleteChildren(this.my_div);
        DomUtl.drawText(this.my_div, this.title + ": " + PLUG);
    }

    updateConnected() {
        DomUtl.deleteChildren(this.my_div);
        DomUtl.drawText(this.my_div, this.title + ": " + CHECK_MARK);
    }
}

exports.UpstreamStatusUi = UpstreamStatusUi;

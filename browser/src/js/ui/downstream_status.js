// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;

const CHECK_MARK = "✅";
const PLUG = "🔌";

class DownstreamStatusUi {
    constructor(div, title) {
        this.parent_div = div;
        this.my_div = null;

        this.ping_time = 0;
        this.provided_msats = null;

        this.connected_div = null;
        this.ping_div = null;
        this.balance_div = null;
        this.title = title;
    }

    draw(divclass) {
        this.my_div = document.createElement("div");

        this.connected_div = DomUtl.emptyDiv(this.my_div);
        this.ping_div = DomUtl.emptyDiv(this.my_div);
        this.balance_div = DomUtl.emptyDiv(this.my_div);

        this.ping_time = 0;
        this.provided_msats = null;
        this.updateDisconnected();

        this.my_div.setAttribute("class", divclass);
        this.parent_div.appendChild(this.my_div);
    }

    updateDisconnected() {
        DomUtl.deleteChildren(this.connected_div);
        DomUtl.deleteChildren(this.ping_div);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawText(this.connected_div, this.title + ": " + PLUG);
        DomUtl.drawText(this.ping_div, "Ping: N/A");
        DomUtl.drawText(this.balance_div, "Provided: N/A");
    }

    updateConnected() {
        DomUtl.deleteChildren(this.connected_div);
        DomUtl.deleteChildren(this.ping_div);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawText(this.connected_div, this.title + ": " + CHECK_MARK);
        DomUtl.drawText(this.ping_div,
                        "Ping: " + this.ping_time.toString() + "ms");
        if (this.provided_msats != null) {
            DomUtl.drawText(this.balance_div,
                "Provided: " + DomUtl.balanceFmt(this.provided_msats));
        } else {
            DomUtl.drawText(this.balance_div, "Provided: N/A");
        }
    }

    updatePingTime(new_ping_time) {
        this.ping_time = new_ping_time;
        this.updateConnected();
    }

    updateProviderMsats(msats) {
        this.provided_msats = msats;
        this.updateConnected();
    }
}

exports.DownstreamStatusUi = DownstreamStatusUi;

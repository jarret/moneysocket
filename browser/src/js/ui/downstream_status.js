// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;

const CHECK_MARK = "✅";
const PLUG = "🔌";

class DownstreamStatusUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;

        this.ping_time = 0;
        this.provided_msats = 0;

        this.connected_div = null;
        this.ping_div = null;
        this.balance_div = null;
    }

    draw() {
        this.my_div = document.createElement("div");

        this.connected_div = DomUtl.emptyDiv(this.my_div);
        this.ping_div = DomUtl.emptyDiv(this.my_div);
        this.balance_div = DomUtl.emptyDiv(this.my_div);

        this.ping_time = 110;
        this.provided_msats = 1234567;
        this.updateDisconnected();

        this.my_div.setAttribute("class", "downstream-status");
        this.parent_div.appendChild(this.my_div);
    }

    updateDisconnected() {
        DomUtl.deleteChildren(this.connected_div);
        DomUtl.deleteChildren(this.ping_div);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawText(this.connected_div, "Downstream: " + PLUG);
        DomUtl.drawText(this.ping_div, "Ping: N/A");
        DomUtl.drawText(this.balance_div, "Provided: N/A");
    }

    updateConnected() {
        DomUtl.deleteChildren(this.connected_div);
        DomUtl.deleteChildren(this.ping_div);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawText(this.connected_div, "Downstream: " + CHECK_MARK);
        DomUtl.drawText(this.ping_div,
                        "Ping: " + this.ping_time.toString() + "ms");
        DomUtl.drawText(this.balance_div,
                        "Provided: " + DomUtl.balanceFmt(this.provided_msats));
    }

    updatePingTime(new_ping_time) {
        this.ping_time = new_ping_time;
        this.updateConnected();
    }

    updateProviderMsats(msats) {
        this.provider_msats = msats;
        this.updateConnected();
    }
}

exports.DownstreamStatusUi = DownstreamStatusUi;

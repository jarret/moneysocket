// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Connection = require("./connection.js").Connection;
const Utils = require('./utils.js').Utils;
const WebsocketInterconnect = require('./moneysocket/socket/websocket.js').WebsocketInterconnect;
const WebsocketConnectUi = require('./moneysocket/socket/websocket_ui.js').WebsocketConnectUi;

class PurseStatusUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.spendable_div = null;
        this.wallet_role_div = null;
        this.service_role_div = null;
        this.wallet_counterpart_div = null;
    }

    Draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.spendable_div = Utils.EmptyDiv(this.my_div);
        Utils.DrawBigBalance(this.spendable_div, 0.0);
        Utils.DrawBr(this.my_div);

        this.wallet_role_div = Utils.EmptyDiv(this.my_div);
        Utils.DrawText(this.wallet_role_div, "Wallet Role: ");
        Utils.DrawColoredText(this.wallet_role_div, "Not Connected", "red");

        Utils.DrawBr(this.my_div);

        this.service_role_div = Utils.EmptyDiv(this.my_div);
        Utils.DrawText(this.service_role_div, "Service Role: ");
        Utils.DrawColoredText(this.service_role_div, "Not Connected", "red");

        Utils.DrawBr(this.my_div);

        this.wallet_counterpart_div = Utils.EmptyDiv(this.my_div);
        Utils.DrawText(this.wallet_counterpart_div,
                      "Wallet Counterpart Balance: N/A");

        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    UpdateSpendable(new_spendable) {
        Utils.DeleteChildren(this.spendable_div)
        Utils.DrawBigBalance(this.spendable_div, 0.0);
    }

    UpdateWalletRoleConnected() {
        Utils.DeleteChildren(this.wallet_role_div)
        Utils.DrawText(this.wallet_role_div, "Wallet Role: ");
        Utils.DrawColoredText(this.wallet_role_div, "Connected", "green");
    }

    UpdateWalletRoleConnecting() {
        Utils.DeleteChildren(this.wallet_role_div)
        Utils.DrawText(this.wallet_role_div, "Wallet Role: ");
        Utils.DrawColoredText(this.wallet_role_div, "Connecting", "orange");
    }

    UpdateWalletRoleDisconnected() {
        Utils.DeleteChildren(this.wallet_role_div)
        Utils.DrawText(this.wallet_role_div, "Wallet Role: ");
        Utils.DrawColoredText(this.wallet_role_div, "Not Connected", "red");
    }

    UpdateServiceRoleConnected() {
        Utils.DeleteChildren(this.service_role_div)
        Utils.DrawText(this.service_role_div, "Service Role: ");
        Utils.DrawColoredText(this.service_role_div, "Connected", "green");
    }

    UpdateServiceRoleConnecting() {
        Utils.DeleteChildren(this.service_role_div)
        Utils.DrawText(this.service_role_div, "Service Role: ");
        Utils.DrawColoredText(this.service_role_div, "Connecting", "orange");
    }

    UpdateServiceRoleDisconnected() {
        Utils.DeleteChildren(this.service_role_div)
        Utils.DrawText(this.service_role_div, "Service Role: ");
        Utils.DrawColoredText(this.service_role_div, "Not Connected", "red");
    }

    UpdateWalletCounterpartBalance(msats) {
        Utils.DeleteChildren(this.wallet_counterpart_div)
        Utils.DrawText(this.wallet_counterpart_div,
                      "Wallet Counterpart Balance: " + Utils.BalanceFmt(msats));
    }

}

class PurseApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.psu = null;
        this.wcu = null;
        this.scu = null;

        this.wallet_socket = null;
        this.service_socket = null;

        this.default_wallet_ws_url = "ws://127.0.0.1:11060";
        this.default_service_ws_url = "ws://192.168.0.21:11058";

        this.wi = new WebsocketInterconnect(this);
    }


    DrawPurseUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        Utils.DrawTitle(this.my_div, "Purse App", "h1");

        this.psu = new PurseStatusUi(this.my_div);
        this.psu.Draw("center");

        Utils.DrawBr(this.my_div);
        this.wcu = new WebsocketConnectUi(this.my_div,
                                          "WALLET Connect to External SERVICE",
                                          this.default_wallet_ws_url, this,
                                          "wallet");
        this.wcu.Draw("left");

        this.scu = new WebsocketConnectUi(this.my_div,
                                          "SERVICE Connect to External WALLET",
                                          this.default_service_ws_url, this,
                                          "service");
        this.scu.Draw("right");
        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }


    NewSocket(socket, cb_param) {
        console.log("got new socket: " + socket.ToString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "wallet") {
            this.wallet_socket = socket;
            this.psu.UpdateWalletRoleConnected();
            this.wcu.DrawDisconnectButton();
            // TODO wallet role object,
        } else if (cb_param == "service") {
            this.service_socket = socket;
            this.psu.UpdateServiceRoleConnected();
            this.scu.DrawDisconnectButton();
            // TODO service role object,
        } else {
            console.log("unknown cb param");
        }
    }

    SocketClose(socket, cb_param) {
        console.log("got socket close: " + socket.ToString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "wallet") {
            console.log("got wallet socket closed");
            this.wallet_socket = null;
            this.psu.UpdateWalletRoleDisconnected();
            this.wcu.DrawConnectButton();
            // TODO wallet role object
        } else if (cb_param == "service") {
            console.log("got service socket closed");
            this.service_socket = null;
            this.psu.UpdateServiceRoleDisconnected();
            this.scu.DrawConnectButton();
            // TODO service role object
        } else {
            console.log("got unknown socket closed");
        }
    }

    Connect(cb_param) {
        if (cb_param == "wallet") {
            var ws_url = this.wcu.GetWsUrl();
            console.log("connect wallet: " + ws_url);
            this.psu.UpdateWalletRoleConnecting();
            this.wcu.DrawConnecting();
            this.wi.Connect(ws_url, "wallet");
        } else if (cb_param == "service") {
            var ws_url = this.scu.GetWsUrl();
            console.log("connect service: " + ws_url);
            this.psu.UpdateServiceRoleConnecting();
            this.scu.DrawConnecting();
            this.wi.Connect(ws_url, "service");
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    Disconnect(cb_param) {
        if (cb_param == "wallet") {
            console.log("disconnect wallet");
            if (this.wallet_socket != null) {
                this.wallet_socket.Close();
            }
        } else if (cb_param == "service") {
            console.log("disconnect service");
            if (this.service_socket != null) {
                this.service_socket.Close();
            }
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new PurseApp();

function DrawFirstUi() {
    window.app.DrawPurseUi()
}

window.addEventListener("load", DrawFirstUi());

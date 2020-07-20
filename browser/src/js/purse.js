const Connection = require("./connection.js").Connection;
const Utils = require('./utils.js').Utils;
const WebsocketInterconnect = require('./moneysocket/socket/websocket.js').WebsocketInterconnect;


class WalletConnectUi {
    constructor(div, default_ws_url) {
        this.parent_div = div;
        this.my_div = null;
        this.input = null;
        this.default_ws_url = default_ws_url;
    }

    Draw(style) {
        this.my_div = document.createElement("div");
        Utils.DrawTitle(this.my_div, "Wallet Role Connect to Service", "h4");
        this.my_div.setAttribute("class", style);
        this.input = Utils.DrawTextInput(this.my_div, this.default_ws_url);
        Utils.DrawBr(this.my_div);
        this.connect_button_div = Utils.EmptyDiv(this.my_div);
        this.DrawConnectButton();
        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    GetWsUrl() {
        return this.input.value;
    }

    DrawConnectButton() {
        Utils.DeleteChildren(this.connect_button_div);
        Utils.DrawButton(this.connect_button_div, "Connect",
            function() {window.app.ConnectWallet()});
    }

    DrawConnecting() {
        Utils.DeleteChildren(this.connect_button_div);
        var connect_button = Utils.DrawButton(this.connect_button_div,
                                              "Connecting", function() {});
        connect_button.disabled = true;
    }

    DrawDisconnectButton() {
        Utils.DeleteChildren(this.connect_button_div);
        Utils.DrawButton(this.connect_button_div, "Disconnect",
            function() {window.app.DisconnectWallet()});
    }
}

class ServiceConnectUi {
    constructor(div, default_ws_url) {
        this.parent_div = div;
        this.my_div = null;
        this.default_ws_url = default_ws_url;
        this.input = null;
    }

    Draw(style) {
        this.my_div = document.createElement("div");
        Utils.DrawTitle(this.my_div, "Service Role Connect to Wallet", "h4");
        this.my_div.setAttribute("class",  style);
        this.input = Utils.DrawTextInput(this.my_div, this.default_ws_url);
        Utils.DrawBr(this.my_div);
        this.connect_button_div = Utils.EmptyDiv(this.my_div);
        this.DrawConnectButton();
        Utils.DrawBr(this.my_div);
        this.parent_div.appendChild(this.my_div);
    }

    GetWsUrl() {
        return this.input.value;
    }

    DrawConnectButton() {
        Utils.DeleteChildren(this.connect_button_div);
        Utils.DrawButton(this.connect_button_div, "Connect",
            function() {window.app.ConnectService()});
    }

    DrawConnecting() {
        Utils.DeleteChildren(this.connect_button_div);
        var connect_button = Utils.DrawButton(this.connect_button_div,
                                              "Connecting", function() {});
        connect_button.disabled = true;
    }

    DrawDisconnectButton() {
        Utils.DeleteChildren(this.connect_button_div);
        Utils.DrawButton(this.connect_button_div, "Disconnect",
            function() {window.app.DisconnectService()});
    }
}

class PurseStatusUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.balance_div = null;
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

        this.default_wallet_ws_url = "ws://127.0.0.1:11050";
        this.default_service_ws_url = "ws://127.0.0.1:11051";

        this.wi = new WebsocketInterconnect(this);
    }


    DrawPurseUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        Utils.DrawTitle(this.my_div, "Purse App", "h1");

        this.psu = new PurseStatusUi(this.my_div);
        this.psu.Draw("center");

        Utils.DrawBr(this.my_div);
        this.wcu = new WalletConnectUi(this.my_div,
                                       this.default_wallet_ws_url);
        this.wcu.Draw("left");

        this.scu = new ServiceConnectUi(this.my_div,
                                        this.default_service_ws_url);
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

    ConnectService() {
        var ws_url = this.scu.GetWsUrl();
        console.log("connect service: " + ws_url);
        this.psu.UpdateServiceRoleConnecting();
        this.scu.DrawConnecting();
        this.wi.Connect(ws_url, "service");
    }

    DisconnectService() {
        console.log("disconnect service");
        if (this.service_socket != null) {
            this.service_socket.Close();
        }
    }

    DisconnectWallet() {
        console.log("disconnect wallet");
        if (this.wallet_socket != null) {
            this.wallet_socket.Close();
        }
    }

    ConnectWallet() {
        var ws_url = this.wcu.GetWsUrl();
        console.log("connect wallet: " + ws_url);
        this.psu.UpdateWalletRoleConnecting();
        this.wcu.DrawConnecting();

        this.wi.Connect(ws_url, "wallet");
    }

}

window.app = new PurseApp();

function DrawFirstUi() {
    window.app.DrawPurseUi()
}

window.addEventListener("load", DrawFirstUi());

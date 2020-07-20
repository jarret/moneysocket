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

    UpdateWalletRoleDisconnected() {
        Utils.DeleteChildren(this.service_role_div)
        Utils.DrawText(this.service__role_div, "Service Role: ");
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

        //this.section = Utils.EmptySection(this.div);
        //this.section.setAttribute("class", "container");

        this.default_wallet_ws_url = "ws://127.0.0.1:11050";
        this.default_service_ws_url = "ws://127.0.0.1:11051";

        //var c1 = new Connection(this.section, "Service",
         //                       "ws://localhost:11051", "left");
        //var c2 = new Connection(this.section, "Moneysocket 2",
         //                       "ws://localhost:5400", "right");
        //this.connections = {"Service": c1}

        this.wi = new WebsocketInterconnect(this.NewSocket,
                                            this.SocketClose);
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
        console.log("this: " + this.constructor);
        if (cb_param == "wallet") {
            this.wallet_socket = socket;
            this.psu.UpdateWalletRoleConnected();
            this.wcu.DrawConnected();
        } else if (cb_param == "service") {
            this.service_socket = socket;
            this.psu.UpdateServiceRoleConnected();
            this.scu.DrawConnected();
        } else {
            console.log("unknown cb param");
        }
    }

    SocketClose(socket) {
        console.log("got socket close: " + socket.ToString());
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
    }

    DisconnectConnectWallet() {
        console.log("disconnect wallet");
    }

    ConnectWallet() {
        var ws_url = this.wcu.GetWsUrl();
        console.log("connect wallet: " + ws_url);
        this.psu.UpdateWalletRoleConnecting();
        this.wcu.DrawConnecting();

        this.wi.Connect(ws_url, "wallet");
    }


    /*

    DrawUi() {
        for (var title in this.connections) {
            this.connections[title].DrawConnectUi();
            Utils.DrawBr(this.div);
        }
    }

    NumConnections() {
        var i = 0;

        for (var title in this.connections) {
            if (this.connections[title].connected) {
                i++;
            }
        }
        return i;
    }

    Ping(title) {
        console.log("sending ping....");
        this.SendPing(this.connections['Service'])
    }

    PushSat(title) {
        var payee;

        if (this.NumConnections() != 2) {
            console.log("*** need to be connected to both websockets");
            return;
        }

        if (title == "Moneysocket 1") {
            payee = this.connections["Moneysocket 2"];
        } else {
            payee = this.connections["Moneysocket 1"];
        }
        this.RequestInvoice(payee);
    }

    PullSat(title) {
        var payee;

        if (this.NumConnections() != 2) {
            console.log("*** need to be connected to both websockets");
            return;
        }
        if (title == "Moneysocket 1") {
            payee = this.connections["Moneysocket 1"];
        } else {
            payee = this.connections["Moneysocket 2"];
        }
        this.RequestInvoice(payee);
    }

    SendPing(connection) {
        var r = {"request_type": "PING"};
        connection.SendTextRequest(r);
    }

    RequestInvoice(connection) {
        var r = {"request_type": "GET_INVOICE",
                 "msat_amount":  1000};
        connection.SendTextRequest(r);
    }

    PayInvoice(connection, bolt11) {
        var r = {"request_type": "PAY_INVOICE",
                 "bolt11":  bolt11};
        connection.SendTextRequest(r);
    }

    ConnectSocket(title) {
        console.log(title);
        this.connections[title].ConnectSocket();
    }

    DisconnectSocket(title) {
        console.log(title);
        this.connections[title].DisconnectSocket();
    }

    WsIncomingEvent(title, data) {
        var connection = this.connections[title];
        const n = JSON.parse(data);
        console.log("received: " + data);

        if (n["request_type"] == "PONG") {
            console.log("got PONG");
        } else if (n["request_type"] == "PING") {
            console.log("got PING");
        } else if (n["request_type"] == "ERROR") {
            console.log("got ERROR");
        } else {
            console.log("got unknown");
        }
    }

    Handle(event) {
        console.log("received: " + event.data);
        const data = JSON.parse(event.data);
    }
*/
}

window.app = new PurseApp();

function DrawFirstUi() {
    window.app.DrawPurseUi()
}

window.addEventListener("load", DrawFirstUi());

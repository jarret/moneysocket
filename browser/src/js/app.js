const Connection = require("./connection.js").Connection;
const Utils = require('./utils.js').Utils;

class App {
    constructor() {
        this.div = document.getElementById("ui");
        this.section = Utils.EmptySection(this.div);
        this.section.setAttribute("class", "container");

        var c1 = new Connection(this.section, "Moneysocket 1",
                                "ws://192.168.0.21:5401", "left");
        var c2 = new Connection(this.section, "Moneysocket 2",
                                "ws://localhost:5400", "right");
        this.connections = {"Moneysocket 1": c1,
                            "Moneysocket 2": c2};
    }

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
        console.log("received: " + n);

        if (n["notification_type"] == "INVOICE") {
            var payer;
            if (title == "Moneysocket 1") {
                payer = this.connections['Moneysocket 2'];
            } else {
                payer = this.connections['Moneysocket 1'];
            }
            this.PayInvoice(payer, n['bolt11'])
        } else if (n["notification_type"] == "PREIMAGE") {
            console.log("preimage: " +  n['preimage']);
        } else if (n["notification_type"] == "BALANCE") {
            connection.UpdateBalance(n['msats']);
        } else {
            console.log("unknown notification");
        }
    }

    /*
    Handle(event) {
        console.log("received: " + event.data);
        const data = JSON.parse(event.data);
    }
*/
}

window.app = new App();

function DrawFirstUi() {
    window.app.DrawUi()
}

window.addEventListener("load", DrawFirstUi());

// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php



/* we need to require all the classes so they rgister to the REQUEST_SUBCLASSES
 * dictionary */

const RequestRendezvous = require('./rendezvous.js').RequestRendezvous;
const RequestPing = require('./rendezvous.js').RequestRendezvous;
const RequestProvider = require('./provider.js').RequestProvider;
const RequestInvoice = require('./invoice.js').RequestInvoice;
const RequestPay = require('./pay.js').RequestPay;

class RequestReceiver {
}

exports.RequestReceiver = RequestReceiver;

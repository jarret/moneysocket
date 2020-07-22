# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


from core.message.message import MoneysocketMessage


REQUEST_NAMES = ['REQUEST_RENDEZVOUS',
                 'REQUEST_WALLET',
                 'REQUEST_SERVICE',
                 'REQUEST_BALANCE',
                 'REQUEST_GIFT_INFO',
                 'REQUEST_WALLET_INVOICE',
                 'REQUEST_WALLET_PAY',
                 'REQUEST_WALLET_PAY_GIFT',
                 'REQUEST_EXTENSION',
                 'REQUEST_PING',
                ]

REQUESTS = set(REQUEST_NAMES)

class MoneysocketRequest(MoneysocketMessage):
    REQUEST_SUBCLASSES = {}

    def __init__(self, request_name):
        super().__init__()
        self['message_class'] = "REQUEST"
        self['request_uuid'] = str(uuid.uuid4())
        self['request_name'] = request_name

    @staticmethod
    def check_valid(msg_txt):
        err = super().validate(msg_txt)
        if err:
            return err
        msg_dict = json.loads(msg_text)
        if 'request_uuid' not in msg_dict.keys():
            return "no request_uuid included"

        if 'request_uuid' not in msg_dict.keys():
            return "no request_uuid included"
        if type(msg_dict['request_uuid']) != str:
            return "unknown request_uuid type"
        try:
            _ = uuid.UUID(msg_dict['request_uuid'])
        except:
            return "invalid request_uuid"

        if 'request_name' not in msg_dict.keys():
            return "invalid request_name"
        if type(msg_dict['request_name']) != str:
            return "unknown request_name type"

        if msg_dict['request_name'] not in REQUESTS:
            return "unknown request_name: %s" % msg_dict['request_name']

        return None



from core.message.request.rendezvous import RendezvousRequest
from core.message.request.ping import PingRequest


REQUEST_SUBCLASSES = {'REQUEST_RENDEZVOUS':      Request,
                      'REQUEST_WALLET':          None,
                      'REQUEST_SERVICE':         None,
                      'REQUEST_BALANCE':         None,
                      'REQUEST_GIFT_INFO':       None,
                      'REQUEST_WALLET_INVOICE':  None,
                      'REQUEST_WALLET_PAY':      None,
                      'REQUEST_WALLET_PAY_GIFT': None,
                      'REQUEST_EXTENSION':       None,
                      'REQUEST_PING':            PingRequest,
                     }

MoneysocketRequest.REQUEST_SUBCLASSES = REQUEST_SUBCLASSES

REQUESTS = set(REQUEST_SUBCLASSES.keys())

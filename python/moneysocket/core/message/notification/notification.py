# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


from core.message.message import MoneysocketMessage



class MoneysocketNotification(MoneysocketMessage):
    NOTIFICATION_SUBCLASSES = {}

    def __init__(self, request_response_uuid=None):
        super().__init__("NOTIFICATION")
        self['notification_uuid'] = str(uuid.uuid4())
        self['request_reference_uuid'] = request_reverence_uuid


    @staticmethod
    def check_valid(msg_txt):
        return None



NOTIFICATION_SUBCLASSES = {"NOTIFY_RENDEZVOUS":             None,
                           "NOTIFY_INCOMPATIBLE":           None,
                           "NOTIFY_WALLET_BECOMING_READY":  None,
                           "NOTIFY_SERVICE_BECOMING_READY": None,
                           "NOTIFY_SERVICE":                None,
                           "NOTIFY_WALLET":                 None,
                           "NOTIFY_INVOICE":                None,
                           "NOTIFY_GIFT_INFO":              None,
                           "NOTIFY_PREIMAGE":               None,
                           "NOTIFY_PONG":                   None,
                           "NOTIFY_ERROR":                  None,
                          }

MoneysocketNotification.NOTIFICATION_SUBCLASSES = NOTIFICATION_SUBCLASSES
NOTIFICATIONS = set(NOTIFICATION_SUBCLASSES.keys())

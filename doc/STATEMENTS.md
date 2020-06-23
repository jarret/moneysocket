MONEYSOCKET STATEMENTS

# Topic 0

## 0.0.0
Statements are non-binding. This is just for facilitating the advancement of
discussion. Nobody owns the update permission of this document.

## 0.1.0
The numbering scheme of this document is for a) to allow insertion/deletion
without needing to renumber and reorder everything and b) to allow easier
referencing of a statement in external discussion. The first number is
approximate topic/section. The middle number is statement number. The last
number is extra and to be used if we need to insert.

## 0.2.0
If we are going to collectively comment on and edit this on
GitHub/GitLab/whatever, try to keep lines wrapped at 80 characters so lines are
identifiable for comment and diffs are easier to read.

# Topic 1

## 1.0.0
["Rough Consensus and Running
Code"](https://en.wikipedia.org/wiki/Rough_consensus) is a good guideline and
good-faith principal.

## 1.1.0
Whenever possible, we prefer compatible terminology and definitions with the
[LNURL spec](https://github.com/btcontract/lnurl-rfc).

## 1.2.0
It is desirable - if it still makes sense as we make progress in the
construction of this protocol - to pursue inclusion with
[LNURL](https://github.com/btcontract/lnurl-rfc).

## 1.3.0
We anticipate the need to improve/extend this protocol after the time of
adoption 'in the wild' therefore attaching version numbers identifiers to
protocol messages and other techniques for non-disruptive upgrades and
failbacks are desirable.


# Topic 2

## 2.0.0
The entity definitions of `LN SERVICE` and `LN WALLET` from LNURL seem to apply
here.

## 2.1.0
Since this protocol is for untrusted peer interoperability, the terminology for
messages `Request` and `Notification` (to indicate that each device is free to
revise it's behavior at any time) makes more sense than `Command` and `Status`
(or other variants) which indicate compulsion.

## 2.2.0
As is the case with LNURL, a single piece of software can take on both the
roles of `LN SERVICE` and `LN WALLET` simultaneously.


# Topic 3

## 3.0.0
A connection of websockets between devices does not necessarily 1-1 correspond
to a connection between a `LN WALLET` or `LN SERVICE`. It is a free choice for
the implementation to choose to utilize more than two websocket connection in
chain in order to connect two entities.

## 3.1.0
A "dumb" intermediary websocket server meant for facilitating a chain of
connections may behave as a `LN WALLET` or `LN SERVICE` in temporary absence of
a 'real' entity for the purposes establishing a connection. However, this is
considered an implementation detail and likely not in scope of the protocol
declaration.

## 3.2.0
Minimal latency for facilitating the coordination of payments between two
Lightning Network nodes is a desirable design goal.

## 3.3.0
Ease of end-user UI for making it easy to connect to and user services is a
desirable design goal. Where this goal potentially trades off with the goal of
minimal latency is best left up to implementation decisions rather than being
enforced by the protocol.


# Topic 4

## 4.0.0
A `LN WALLET` can be any of a) A non-custodial BTC wallet, b) A custodial BTC
wallet c) a custodial fiat wallet d) a custodial wallet of another asset.

## 4.1.0
The protocol is assumed to be operating with in BTC when in-band for the
purposes of transferring money using this protocol. `LN WALLETS` holding other
assets must convert their native asset to BTC satoshis upon transfer.


+++
title = "About"
description = "I write code at the intersection of Bitcoin and identity. Currently building Spaces Protocol, sovereign names anchored to Bitcoin."
template = "about.html"

[extra]
list_posts = true
links = [
  { name = "GitHub", url = "https://github.com/buffrr" },
  { name = "Telegram", url = "https://t.me/buffrr" },
]
+++

I write code at the intersection of Bitcoin and identity.

In general, I hope to contribute to a world where the identities we use online belong to us, where money and identity don't require permission, and where the trust roots of the internet aren't rented from authorities we can't audit. I currently spend most of my time working on Spaces Protocol — sovereign names anchored to Bitcoin.

Beyond Spaces, I've spent years shipping naming and identity infrastructure: **Fingertip** (the de facto resolver for Handshake names), variants on top of **ENS**, **letsdane** (a DANE/TLSA proxy enabling certificate-authority-free TLS in browsers), and **Beacon** (a Chromium fork integrating DANE directly into Chrome's certificate validation stack).

## Work

Sovereign naming, identity, and PKI on Bitcoin. Most of what's here is either currently shipping or fed into what is.

### Spaces Protocol — *active*

A permissionless naming and identity protocol anchored to Bitcoin. No separate chain, no token, no central registrar. Names live off-chain — Bitcoin anchors trust. Protocol state is verified via client-side validation.

I built the stack end-to-end as lead engineer:

- **spaced** — client-side validation. Reads Bitcoin blocks, verifies protocol state, and produces a Merkle root used as the trust anchor. [→ repo](https://github.com/spacesprotocol/spaces)
- **libveritas** — zk-powered verification library for certificates. [→ repo](https://github.com/spacesprotocol/libveritas)
- **spacedb** — cryptographically verifiable data store and universal accumulator. [→ repo](https://github.com/spacesprotocol/spacedb)
- **certrelay** — certificate relay infrastructure for Bitcoin-anchored PKI. [→ repo](https://github.com/spacesprotocol/certrelay)
- **fabric-dht** — open DHT network for spaces. [→ repo](https://github.com/spacesprotocol/fabric)
- **Nacho** — resolver and key store app for spaces. [→ App Store](https://apps.apple.com/us/app/nacho-handles/id6755894049) · [→ handles on mainnet](https://spacesprotocol.org/blog/handles-on-mainnet/)

### letsdane

An experimental DANE/TLSA proxy enabling certificate-authority-free TLS in unmodified browsers. It sits between client and network, intercepts TLS handshakes, and validates via DANE. The middle path between "rebuild the browser" (Beacon) and "do nothing." [→ repo](https://github.com/buffrr/letsdane)

### Fingertip

The de facto resolver for Handshake names. If you're using Handshake today, you're almost certainly resolving through Fingertip. [→ repo](https://github.com/imperviousinc/fingertip)

### Beacon — *archived*

A fork of Chromium that integrated DANE/TLSA directly into Chrome's certificate validation stack. The goal was to remove the certificate authority from the trust path entirely: if you trust DNSSEC, you don't need the CAs. Lessons from it helped improve the Spaces PKI design. [→ repo](https://github.com/imperviousinc/beacon)

### ENS variants — *archived*

Several experimental builds on top of ENS exploring alternative namespace mechanics. Research artifacts; the work informed Spaces' architectural choices.

## Papers and Specs

- **Spaces Protocol** — the protocol paper. [→ read](https://spacesprotocol.org/paper/)
- **SIP-7: Records wire format** — compact binary format for the records published under a handle. *Implemented.* [→ spec](https://github.com/spacesprotocol/sips/blob/main/sip-0007.mediawiki)
- **NIP-SPACES** — binds a Nostr pubkey to a Spaces handle through `kind:0` metadata, verified against a certrelay network. *Draft.* [→ spec](https://github.com/buffrr/nips/blob/spaces/NIP-SPACES.md)

## Talks

- **TABConf 7** — Spaces Protocol: Scalable & Permissionless Bitcoin Identities. [→ recording](https://www.youtube.com/watch?v=NtcGuGuFUlM)
- **TABConf 8** — Sovereign Name, Certain Destiny
- **BTC Takeover** — live stream. [→ recording](https://www.youtube.com/watch?v=6NSqjat9q3k)

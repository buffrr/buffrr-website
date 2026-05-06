+++
title = "Are we self-sovereign PKI yet?"
date = 2026-05-06
description = "Every end-to-end encrypted messenger ships a fingerprint UI. Almost nobody opens it. A note on what's actually missing."
path = "/blog/are-we-self-sovereign-pki-yet.html"

[taxonomies]
tags = ["pki", "cryptography"]
+++

Signal is end-to-end encrypted in the sense that the keys are end-to-end. Whether you got the right keys is a different question, and almost nobody asks it.

<img src="/blog/are-we-self-sovereign-pki-yet.html/signal-safety-number.png" alt="Signal safety number screen" width="320" />

Safety numbers on Signal exist because, in principle, the server could hand you the wrong key for your contact. You're supposed to walk through one the first time you talk to someone you care about. In practice, almost nobody does.

iMessage shipped the same idea in late 2023, called Contact Key Verification:

<img src="/blog/are-we-self-sovereign-pki-yet.html/imessage-contact-key-verification.png" alt="iMessage Contact Key Verification: Show Public Verification Code" width="320" />

WhatsApp has a Security Code. Threema rates contacts red, orange, or green depending on how they were added. Matrix has cross-signed device verification with comparison emoji. PGP has fingerprints, which is where this whole pattern started, and about which there is little left to say beyond [Filippo Valsorda's 2016 essay](https://words.filippo.io/giving-up-on-long-term-pgp/).

Signal ships safety numbers because the platform might one day be compelled or compromised, and the architecture is meant to let you catch that. But almost nobody verifies. So the encryption ends up end-to-end conditional on the platform being honest, even though the design tried to be conditional on something stronger. Almost word for word the property you wanted to avoid by encrypting in the first place.

## The shape of the problem

It is not just messaging. The same gap shows up wherever you need to bind a public name to a key.

You can publish an email address. Email is rented from a provider that can read it, suspend it, hand it over, or refuse to deliver mail from it. In April 2026, Google [handed a user's account data to ICE](https://www.eff.org/deeplinks/2026/04/google-broke-its-promise-me-now-ice-has-my-data) without notifying him in time to challenge the subpoena, breaking a decade-old promise. Self-hosting is not really an escape: since November 2025, Gmail has been rejecting messages from senders that don't pass DMARC alignment at the SMTP level rather than filtering them. Running your own mail server now means convincing the majority providers your domain looks legitimate. Email-as-an-ID was never quite a standard; it was a custodial relationship.

You can publish a username. Twitter, GitHub, Bluesky, ProtonMail, Telegram, Discord, your registrar. Each of them owns a slice of your name, and there is no way to prove the slices belong to the same person without trusting yet another platform. Keybase noticed this over a decade ago and built cross-platform identity proofs: signed claims posted on each of your accounts, all linked to a single key. The bottom of the stack was still a key fingerprint, with the same problem Signal has now. But it did solve a smaller and real problem: tying scattered identities together, so the `@_buffrr` on Twitter and the `@buffrr` on GitHub could be checked against the same key. [Zoom acquired Keybase in 2020](https://news.ycombinator.com/item?id=23102430). [Public hosting was killed in 2023](https://github.com/keybase/client/issues/24577), and the rest has been left to rot.

You can publish a key fingerprint, if you have already given up.

## Why the existing PKI doesn't fix this

We have public-key infrastructure for machines. We don't have it for people. And the PKI we have for machines is a tower of custody.

CAs validate domain ownership by looking up DNS records. Until [March 15 of this year](https://cabforum.org/2025/06/18/ballot-sc-085v2-require-validation-of-dnssec-when-present-for-caa-and-dcv-lookups/), CAs were not required to validate DNSSEC at all when doing so, and even now they are only required to validate DNSSEC *when it is present*, which is on a small minority of domains. A BGP route leak or a registrar compromise that diverts your domain's DNS for ten minutes can therefore still produce a real, browser-trusted certificate for your domain. This is not theoretical; it has been [used in the wild](https://community.letsencrypt.org/t/using-bgp-to-acquire-bogus-tls-certificates/38627). The CA/Browser Forum's response, [Multi-Perspective Issuance Corroboration](https://blog.citp.princeton.edu/2024/02/13/announcing-the-open-multi-perspective-issuance-corroboration-project/), checks from several network vantage points to make BGP attacks harder. It is also a workaround.

DANE was the standards-track answer to all of this. It [didn't ship in browsers](https://www.imperialviolet.org/2015/01/17/notdane.html). DNSSEC itself is not really a self-sovereign trust root either; ICANN holds the keys.

Certificate Transparency is sometimes invoked as the success story. CT solves a different problem: detecting misissuance after the fact, against append-only logs operated by what's currently about six organizations. Trusting CT comes down to trusting that those operators won't all collude. That's hard, but it isn't self-sovereign. And CT isn't the bottom of the stack. DNS is, and CAs use DNS to decide who gets a certificate.

Email PKI follows the same pattern. S/MIME routes through a corporate CA. WKD routes through the email provider, which is the party you were trying to encrypt past.

Every layer is custodial. Every layer assumes you trust someone.

## What would actually help

A name like `grace@key` that resolves to a public key. The same key, in every app, for every recipient. Not assignable to anyone else, not revocable, not subject to suspension. Yours forever. No fingerprint to verify out of band, because resolving the name *is* verifying the binding to a key.

Not a better platform. Not a more auditable CA. No privileged operator at all.

This works today:

```
$ beam grace@key AGE
age1k2spr6duuu07857wqg0922hd7j0rlnjjax4jvvk50yyhcstn6swspyzh4t
```

That's it. The rest of this post is about why that worked.

In shape: two parties have to be able to agree on which key `grace@key` is bound to without consulting anyone in particular. They need a shared, append-only record of which names exist and which keys they belong to. And that record can't have a signing key to steal, an operator to coerce, or a committee to lobby.

[Spaces](https://spacesprotocol.org) takes this shape. *(Disclosure: I work on it.)* Issued names live in a binary Merkle trie. The root of that trie is committed to Bitcoin's chain, used here as a widely-replicated, hard-to-rewrite timestamp service. The role is the same one CT logs play in the Web PKI; the difference is proof of work instead of operator trust, and a fixed 32 bytes of footprint to issue any batch size of handles.

End users don't touch the chain. Spaces can issue handles in bulk under a parent name; the recipient gets a handle and a key, no on-chain transaction. Resolving someone else's handle is a Merkle-proof check against one of the committed roots (read [paper](https://spacesprotocol.org/paper) to dig deeper). No wallet, no fees, no chain sync on the receiver's side. A handle is a key-controlled identity; the records published under it (an age public key, a Nostr pubkey, a TLS certificate hash) are signed by the handle's key and distributed over a peer network called **Certrelay**, with every response carrying a Merkle inclusion proof you verify locally. The on-chain part proves *who owns the name*. The off-chain part says *what the name points to*. There is no DNS in either path.

## The CA of all CAs

A trust anchor is normally a public key plus a signing process you accept on faith. The whole problem of PKI, eventually, is that signing process: somebody held the private key, and somebody can lose it. Or sell it. Or be served a warrant for it.

Spaces gives you a different shape. The trust anchor is a 32-byte hash: a summary of the entire protocol state, computable and verifiable by anyone, not blessed by some authority. Once your client has that hash, every handle resolution is a Merkle-proof check against it. Signal asks you to verify a fingerprint per contact, and you don't. Spaces asks you to verify a single hash, ever, and you actually might. Call it one global safety number for the whole protocol.

OK, fine. That 32-byte hash still has to come from somewhere, and if your phone fetched it from a server, the server is the trust root again. So Spaces ships a small desktop app called [Veritas](https://spacesprotocol.org/docs/use/veritas/). Veritas syncs from a checkpoint, verifies the Bitcoin header chain, and scans the small set of transactions Spaces cares about, walking the protocol rules to produce the trust ID on your machine. It's not a full node. You scan the trust ID into a client and it's good for about two weeks. The trust anchor is now a value *you* compute, not a signature you accept.

Better. The sync still costs something. Veritas has to keep up with the header chain and the relevant transactions, and you still need to run something on your laptop.

The endgame is a zero-knowledge certificate. It proves the same thing Veritas does (the Bitcoin header chain, the protocol-relevant transactions, and the protocol rules) but as a single succinct proof, on the order of 250 KB. 

We're starting on this now with the RISC Zero zkVM, using recursive proof composition to produce a zk-STARK - the past year went into shipping handle issuance and the surrounding infrastructure; the certificate is what we're building next.

A client downloads the certificate once, verifies it in milliseconds, and is done. No sync. No Veritas. No signing key. The proof *is* the credential. There is nothing to compromise, not in the sense that compromising it is hard, but in the sense that there is no secret to steal in the first place.

That's a CA without a private key. We have spent forty years iterating on PKI designs where the trust anchor is a key somebody holds. "A CA without a key" is a different shape of thing.

## Some considerations

In rough order of how often I think about each:

- **Key rotation, and the harder problem of key loss.** A handle is bound to a key. Rotation is done by publishing a new UTXO binding the handle to a new key; in practice that will mean paying a small fee to a service that does the on-chain part for you. Hundreds of rotations can be made in a single transaction. The harder problem, as with any key-based identity, is what happens when the key is lost rather than rotated. There are reasonable answers (split-key custody, social recovery, time-locked fallbacks) and no fully satisfying ones.
- **Why proof of work and not a witness-based log.** Witnesses are simpler, cheaper, and easier to deploy. The trade-off is that a witness can be coerced and a chain reorg can't (cheaply). For an identity layer, I think it's worth it. The harder version of the disagreement is that an identity layer should be the most boring, durable thing in the stack, and "depends on Bitcoin's proof of work staying economically secure for decades and decades" is plausible but not boring. I don't have a great answer to that.
- **What you still have to trust.** "No signing key" is not "no trust." It's reshaped trust: in Bitcoin's proof-of-work security, in the Veritas binary you ran being the one you think you ran, and in the protocol rules Veritas applies being the ones you'd want a trust anchor to apply. Two of those three are publicly auditable computation. The third is the same software supply-chain problem every security tool faces. The trust hasn't disappeared, but it's gone from a private key in a custodian's HSM to assumptions anyone can audit.
- **Slow issuance.** Top-level *spaces* (the part after the `@`, like `@key`) are acquired by ordinary auction, except that the winning bid is burned rather than paid to anyone. Supply is capped at about ten per day. Individual squatting (buy at auction, hold, resell) is possible. What is prevented is mass pre-mining at launch. The namespace meters out over time, so good names keep entering the pool instead of all getting reserved on day one. *Handles* like `grace@key` are issued in batches by the space owner. The [public faucet](https://spacesprotocol.org/faucet/) hands out free ones.
- **Adoption.** The hardest part of any new identity system is getting clients to support it. With the zk certificate, the verification can be embedded inside an app and users never have to think about it. Whether the apps people already use will embed it is a different question. The shape of the answer is here. The answer being something you can actually message your friends with isn't.
- **The other half of identity.** Binding a name to a key is one half of the problem. The other half is social: recovery, reputation, disambiguation, telling the right Sarah from the wrong one. `grace@key` resolving to a stable key forever doesn't tell you whether the human behind it is the one you meant to talk to. The first half has resisted a usable solution for decades. Web PKI is custodial. Blockchain naming projects have come and gone. ENS still depends on running a full Ethereum node or trusting Infura. The second half is a separate problem, and I don't have an answer for it either.

The missing piece, for a long time, has been a way to bind a human-scale name to a key without trusting a server, a registrar, or a CA. The shape of that piece is now clear enough to point at.

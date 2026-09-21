# GRAZA COPY

Verbatim source for `src/scripts/graza.ts`. The only changes allowed are the {placeholders} listed
here and the two branches described here.

PLACEHOLDERS (resolve from data): {drizzle.price} {drizzle.size} {sizzle.price} {trio.price}
{trio.separate} {offer.value}. Product names come from the catalogue.
BRANCHES: (a) "Same price" applies only if sizzle.price == drizzle.price; otherwise the agent says
"Not the same: Sizzle {sizzle.price} EUR, Drizzle {drizzle.price} EUR." and keeps the rest of the turn.
(b) The final agent turn appears only if the offer exists in data and config.promotions.firstOrder is on.
If not, replace it with "Welcome, then. Check out when you're ready." (this fallback line is NOT Greta's
copy, log it in AI_LOG.md as an assumption). Only the [Yes] path is scripted.
"It's from the current harvest too" and the card's "current harvest" render only if drizzle.harvest is
'current'.

[Shopper opens the floating bubble]
Agent: Hey! Looking for an oil? Tell me what's cooking.

User: My friend swears by Sizzle, she says it's great. I want something for
      salads and dipping bread, and I care that it's actually fresh.
      Is that the one?

Agent: Ooh, your friend has good taste.
       [understanding: Friend's pick: Sizzle | For: salads, dipping bread | Fresh]
       Sizzle is your go-to when you're actually cooking: searing, roasting,
       big dinner energy. For salads and bread you want Drizzle: the fresh,
       raw finish, your solo-picnic-in-the-park oil. It's from the current
       harvest too.

User: Are they the same price?

Agent: Same price, {drizzle.price} EUR each, so it really comes down to how you'll use it.
       For salads and bread, go Drizzle.
       [card: Drizzle, finishing oil, {drizzle.size}, {drizzle.price} EUR, current harvest]
       [buttons: Just Drizzle] [Get the trio]
       Still want Sizzle for the pan? The trio has Sizzle (cooking),
       Drizzle (finishing) and Frizzle (high-heat), {trio.price} EUR instead of {trio.separate}.

User: [taps Just Drizzle]

Agent: Done, it's in your bag. Quick one before you check out: is this your
       first order with Graza?  [chips: Yes] [No]

User: Yes.

Agent: Nice, then you get {offer.value}% off your next order. Grab Drizzle now and come
       back for Sizzle once you're cooking more, with the discount.

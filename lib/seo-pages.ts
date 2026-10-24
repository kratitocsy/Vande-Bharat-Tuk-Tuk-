export type Faq = { q: string; a: string };

export type SeoPage = {
  path: string;
  title: string; // <title>, without the site name
  description: string; // meta description
  eyebrow: string;
  h1: string;
  lead: string;
  body: string[];
  highlightsTitle: string;
  highlights: { title: string; text: string }[];
  tipsTitle: string;
  tips: string[];
  faqs: Faq[];
  trip: string; // trips.slug in the database
  dropoff?: string; // pre-selected drop-off for city rides
  cta: string;
  related: string[]; // paths of related pages
};

const PRICE_FAQ: Faq = {
  q: "How much does it cost?",
  a: "There is no fixed fare. Send a request or call Mahi on 98934 13847, and the rider will agree the price with you before the ride. You can tell us your budget when you ask. Pay the rider in cash or by UPI at the end.",
};

export const SEO_PAGES: SeoPage[] = [
  {
    path: "/khajuraho-temple-tour",
    title: "Khajuraho Temple Tour by Tuk Tuk",
    description:
      "See the Western, Eastern and Southern groups of Khajuraho temples in one trip by auto rickshaw. Your rider waits at each stop. Call Mahi on 98934 13847.",
    eyebrow: "Temple tour",
    h1: "Khajuraho temple tour by tuk tuk",
    lead: "See all three temple groups in one relaxed trip. One auto, one local rider, and no hunting for a ride between stops.",
    body: [
      "The Khajuraho Group of Monuments is a UNESCO World Heritage Site, built by the Chandela dynasty about a thousand years ago. The temples are spread across three areas: the Western Group close to the centre of town, the Eastern Group a short ride away, and the Southern Group a little further out. Walking between them in the heat is hard work, which is why most visitors take an auto.",
      "On the full temple circuit your rider takes you to each group in turn and waits while you explore. Plan on four to five hours in total. You decide how long to spend at each stop, and you can ask the rider to stop for chai, photos or the museum on the way.",
    ],
    highlightsTitle: "What the circuit covers",
    highlights: [
      { title: "Western Group", text: "The best-known temples, including Kandariya Mahadeva, Lakshmana and Vishvanatha, set in a landscaped garden." },
      { title: "Eastern Group", text: "A quieter cluster that includes the Jain temples and the Javari, Vamana and Brahma temples." },
      { title: "Southern Group", text: "The Duladeo and Chaturbhuj temples, away from the crowds." },
    ],
    tipsTitle: "Tips for a good temple day",
    tips: [
      "Start early. Mornings are cooler and the light on the carvings is softer.",
      "Entry tickets for the monuments are paid at the gate and are separate from the ride.",
      "Carry water, wear a hat, and wear clothes that cover your shoulders and knees at temple sites.",
      "Agree the price and the waiting time with your rider on the call, before you start.",
    ],
    faqs: [
      {
        q: "How long does the full temple tour take?",
        a: "About four to five hours with stops at all three groups. If you only have a morning, ask for the Western Group visit instead.",
      },
      {
        q: "Is the rider a guide?",
        a: "Our riders know the town and the temples well and will happily point you around, but they are not official guides. Licensed guides are available near the Western Group entrance if you want the full story.",
      },
      PRICE_FAQ,
      {
        q: "Can I add the Light & Sound Show?",
        a: "Yes. Book the evening show as a separate trip, or ask your rider to arrange it when they call you.",
      },
    ],
    trip: "temple-circuit",
    cta: "Request the temple circuit",
    related: ["/western-group-of-temples-tuk-tuk", "/light-and-sound-show-khajuraho", "/khajuraho-airport-transfer"],
  },
  {
    path: "/western-group-of-temples-tuk-tuk",
    title: "Western Group of Temples by Tuk Tuk, Khajuraho",
    description:
      "A return tuk tuk ride to the Western Group of Temples in Khajuraho. Your rider waits while you explore. Call Mahi on 98934 13847 to agree the price.",
    eyebrow: "Western Group",
    h1: "Western Group of Temples by tuk tuk",
    lead: "A return ride from your hotel to the Western Group, with your rider waiting while you explore, then back again.",
    body: [
      "The Western Group is the heart of Khajuraho and the first stop for almost every visitor. It holds the largest and most elaborate temples, including Kandariya Mahadeva, Lakshmana, Vishvanatha, Chitragupta and Devi Jagadamba. The temples stand together in a garden and take around two hours to see properly.",
      "Because the Western Group is close to town, the ride itself is short. The real benefit of booking is the waiting: your rider stays at the gate while you walk around, and takes you back to your hotel when you are done. Tell your rider roughly how long you plan to stay when they call.",
    ],
    highlightsTitle: "Nearby, if you have time",
    highlights: [
      { title: "Archaeological Museum", text: "Sculptures from the temples, a short walk from the Western Group." },
      { title: "Matangeshwar Temple", text: "A working temple close to the Western Group, still used for worship." },
      { title: "Shiv Sagar Lake", text: "A quiet spot for a break at the end of the day." },
    ],
    tipsTitle: "Tips",
    tips: [
      "Go early or late in the day to avoid the midday heat.",
      "Check the current opening hours before you go, as they can change.",
      "Entry tickets are bought at the gate and are not part of the ride.",
      "Ask your rider for a pickup time that matches the sunrise or sunset light if you like photography.",
    ],
    faqs: [
      { q: "Does the rider wait for me?", a: "Yes. This is a return trip, so the rider waits at the Western Group and brings you back." },
      { q: "How long should I plan for the Western Group?", a: "Most visitors spend about two hours. The full trip with the ride is usually around three." },
      PRICE_FAQ,
    ],
    trip: "western-temples-visit",
    cta: "Request a Western Group visit",
    related: ["/khajuraho-temple-tour", "/light-and-sound-show-khajuraho"],
  },
  {
    path: "/khajuraho-airport-transfer",
    title: "Khajuraho Airport Transfer by Tuk Tuk",
    description:
      "Tuk tuk pickup and drop to Khajuraho Airport (HJR). Share your flight number and a local rider plans around it. Call Mahi on 98934 13847.",
    eyebrow: "Airport transfer",
    h1: "Khajuraho airport transfer by tuk tuk",
    lead: "A simple ride between Khajuraho Airport (HJR) and your hotel. Tell us your flight and we plan the pickup around it.",
    body: [
      "Khajuraho Airport is a short drive from the town and the temples, so an auto rickshaw is the easiest way to get between the two. One auto takes up to three people with small bags. If you are travelling with large suitcases, mention it when you book and we will plan for it.",
      "For arrivals, give us your flight number and your hotel name. Your rider will wait for you rather than leaving a long gap. For departures, tell us your flight time and we will suggest when to leave. If your flight is early, it is a good idea to send your request the evening before.",
    ],
    highlightsTitle: "How it works",
    highlights: [
      { title: "Send a request", text: "Choose the airport as pickup or drop-off, add your flight number in the pickup details, and send it." },
      { title: "A rider calls you", text: "The rider calls or messages you to confirm the time and agree the price." },
      { title: "Ride and pay", text: "Pay the rider in cash or by UPI at the end of the ride." },
    ],
    tipsTitle: "Tips",
    tips: [
      "Add your flight number so the rider can check for delays.",
      "Send early-morning requests the evening before.",
      "Mention if you have more than small bags so we can plan the space.",
    ],
    faqs: [
      { q: "Can I book a ride for an early flight?", a: "Yes. Send your request the evening before, or call Mahi on 98934 13847, and we will plan the pickup time with you." },
      { q: "What if my flight is late?", a: "Add your flight number when you request. Your rider will keep an eye on it and adjust the pickup." },
      { q: "How many people and bags fit?", a: "Up to three people with small bags in one auto. For a bigger group, request a second auto with the same pickup." },
      PRICE_FAQ,
    ],
    trip: "city-ride",
    dropoff: "airport",
    cta: "Request an airport ride",
    related: ["/khajuraho-railway-station-transfer", "/khajuraho-temple-tour"],
  },
  {
    path: "/khajuraho-railway-station-transfer",
    title: "Khajuraho Railway Station Transfer by Tuk Tuk",
    description:
      "Tuk tuk rides to and from Khajuraho Railway Station, day or night. Share your train number and a local rider plans around it. Call Mahi on 98934 13847.",
    eyebrow: "Railway station transfer",
    h1: "Khajuraho railway station transfer by tuk tuk",
    lead: "A ride between Khajuraho Railway Station and your hotel, including early and late trains.",
    body: [
      "Khajuraho Railway Station is outside the town, so you will want a ride arranged before you arrive, especially for early-morning and late-night trains. Booking ahead means a rider is waiting instead of you searching for one on the platform.",
      "Add your train number and the coach if you know it, and your hotel name. Your rider will call you to confirm and agree the price. One auto takes up to three people with small bags.",
    ],
    highlightsTitle: "Good to know",
    highlights: [
      { title: "Trains at odd hours", text: "Tell us your arrival time and we plan around it, even if the train is early or late." },
      { title: "Your hotel", text: "Pick Khajuraho town as the drop-off and write your hotel name in the details." },
      { title: "Pay at the end", text: "Cash or UPI to the rider, after you arrive." },
    ],
    tipsTitle: "Tips",
    tips: [
      "Send your request before you board, with your train number.",
      "Keep your phone on so the rider can reach you if the train is delayed.",
      "For a bigger group, request a second auto with the same pickup.",
    ],
    faqs: [
      { q: "Do you cover night trains?", a: "Yes. Send a request with your train number, or call Mahi on 98934 13847, and we will arrange a rider for your arrival time." },
      { q: "What if the train is delayed?", a: "Share your train number. Your rider will check for delays and adjust the pickup." },
      PRICE_FAQ,
    ],
    trip: "city-ride",
    dropoff: "railway-station",
    cta: "Request a railway station ride",
    related: ["/khajuraho-airport-transfer", "/khajuraho-temple-tour"],
  },
  {
    path: "/light-and-sound-show-khajuraho",
    title: "Khajuraho Light and Sound Show by Tuk Tuk",
    description:
      "Evening tuk tuk ride to the Light and Sound Show at the Western Group of Temples in Khajuraho, with a ride back. Call Mahi on 98934 13847.",
    eyebrow: "Evening show",
    h1: "Light & Sound Show in Khajuraho, with a ride there and back",
    lead: "Get to the evening show at the Western Group without worrying about the ride back in the dark.",
    body: [
      "The Light and Sound Show is held in the evening at the Western Group of Temples. The temples are lit up while a narration tells the story of the Chandela dynasty and the temples. It is a popular way to end a day of sightseeing.",
      "The show ticket is bought separately, and show timings change with the season, so check the current schedule before you plan your evening. Your rider drops you at the Western Group, and comes back for you when the show ends. Tell your rider the show time when they call, and they will plan the pickup for you.",
    ],
    highlightsTitle: "How the evening works",
    highlights: [
      { title: "Drop at the gate", text: "Your rider takes you to the Western Group in time for the start." },
      { title: "Ride back", text: "The same rider is there when the show ends, so you are not stuck looking for an auto." },
      { title: "Plan your dinner", text: "Ask the rider for a restaurant stop on the way back if you like." },
    ],
    tipsTitle: "Tips",
    tips: [
      "Check the show timing for the day before you book.",
      "Carry a light layer, as evenings can be cooler in winter.",
      "Keep mosquito repellent handy during warmer months.",
    ],
    faqs: [
      { q: "Is the show ticket included in the ride?", a: "No. The ride and the show ticket are separate. Buy the ticket at the venue." },
      { q: "Will the rider wait for the whole show?", a: "Your rider will drop you and return for the end of the show. Agree the plan on the call." },
      PRICE_FAQ,
    ],
    trip: "light-and-sound-show",
    cta: "Request an evening show ride",
    related: ["/western-group-of-temples-tuk-tuk", "/khajuraho-temple-tour"],
  },
  {
    path: "/raneh-falls-tuk-tuk",
    title: "Raneh Falls & Ken Gharial Sanctuary by Tuk Tuk from Khajuraho",
    description:
      "Half-day tuk tuk trip from Khajuraho to Raneh Falls and the Ken Gharial Sanctuary, about 20 km away. Call Mahi on 98934 13847 to agree the price.",
    eyebrow: "Day trip",
    h1: "Raneh Falls and Ken Gharial Sanctuary from Khajuraho",
    lead: "A half-day trip to a pink granite canyon on the Ken River, about 20 km from Khajuraho.",
    body: [
      "Raneh Falls is a series of waterfalls on the Ken River, running through a canyon of pink and red granite. It is one of the most scenic places near Khajuraho and a good way to spend the part of the day when the temples are too hot to enjoy. The Ken Gharial Sanctuary is nearby, set along the same stretch of river.",
      "Allow about five hours for the trip including the drive. The water is at its fullest during and just after the monsoon, while in the dry months the canyon rocks are the main attraction. Entry tickets are paid at the site, and your rider waits for you throughout.",
    ],
    highlightsTitle: "What to expect",
    highlights: [
      { title: "The canyon", text: "Layers of pink granite shaped by the river, with viewpoints along the edge." },
      { title: "Ken Gharial Sanctuary", text: "A protected stretch of river close to the falls." },
      { title: "A relaxed return", text: "Your rider waits for you and brings you back to Khajuraho." },
    ],
    tipsTitle: "Tips",
    tips: [
      "Go in the morning for cooler weather.",
      "Wear shoes with grip, as rocks near the canyon can be slippery, especially after rain.",
      "Take water and snacks, as options near the viewpoints are limited.",
    ],
    faqs: [
      { q: "How far is Raneh Falls from Khajuraho?", a: "About 20 km, roughly a 30 to 45 minute ride by auto each way." },
      { q: "When is the best time to visit?", a: "During and shortly after the monsoon, when the water is high. The canyon is worth seeing at other times too." },
      PRICE_FAQ,
    ],
    trip: "raneh-falls",
    cta: "Request a Raneh Falls trip",
    related: ["/panna-national-park-tuk-tuk", "/pandav-falls-tuk-tuk", "/khajuraho-temple-tour"],
  },
  {
    path: "/panna-national-park-tuk-tuk",
    title: "Panna National Park Safari Gate Transfer from Khajuraho",
    description:
      "Tuk tuk ride from Khajuraho to the Panna National Park gate for your safari, and back. Safari tickets are separate. Call Mahi on 98934 13847.",
    eyebrow: "Safari transfer",
    h1: "Khajuraho to Panna National Park gate by tuk tuk",
    lead: "A ride to the Madla gate for your safari, and back to your hotel afterwards.",
    body: [
      "Panna National Park is a tiger reserve a drive from Khajuraho, and many visitors add a safari to their temple trip. Safaris start early in the morning, so getting to the gate on time matters. A rider booked in advance takes the stress out of that early start.",
      "This trip covers the ride only. Safari tickets and the jeep are booked separately through the park, so arrange those before you travel. Tell your rider the safari slot you have, and they will plan the pickup time with you.",
    ],
    highlightsTitle: "Before you go",
    highlights: [
      { title: "Book your safari first", text: "Safari slots and tickets are arranged separately. Have your booking ready before you request the ride." },
      { title: "Early start", text: "Morning safaris mean a very early pickup. Send your request the evening before." },
      { title: "Return trip", text: "Your rider can wait or come back for you. Agree the plan on the call." },
    ],
    tipsTitle: "Tips",
    tips: [
      "Carry a jacket in winter. Mornings can be cold in an open jeep.",
      "Take your ID and your safari booking.",
      "Check the park's current rules and gate timings before you go.",
    ],
    faqs: [
      { q: "Does the ride include the safari?", a: "No. The ride and the safari are separate. Book your safari tickets and jeep through the park." },
      { q: "Can you pick me up very early?", a: "Yes, with notice. Send your request the evening before, or call Mahi on 98934 13847." },
      PRICE_FAQ,
    ],
    trip: "panna-national-park",
    cta: "Request a safari gate ride",
    related: ["/raneh-falls-tuk-tuk", "/pandav-falls-tuk-tuk"],
  },
  {
    path: "/pandav-falls-tuk-tuk",
    title: "Pandav Falls Day Trip by Tuk Tuk from Khajuraho",
    description:
      "Full-day tuk tuk trip from Khajuraho to Pandav Falls and its caves on the Panna road. Call Mahi on 98934 13847 to agree the price.",
    eyebrow: "Day trip",
    h1: "Pandav Falls day trip from Khajuraho",
    lead: "A waterfall, a deep pool and a set of caves, a day trip away from the temples.",
    body: [
      "Pandav Falls drops into a deep pool surrounded by green forest, with caves nearby that local tradition links to the Pandavas of the Mahabharata. It sits in the Panna district, on the way towards Panna, and is one of the most refreshing day trips from Khajuraho.",
      "Plan on about six hours including the drive and time at the falls. The falls are at their best during and after the monsoon. Your rider waits for you, and can make a stop on the way back if you like.",
    ],
    highlightsTitle: "What you will see",
    highlights: [
      { title: "The waterfall", text: "Water falling into a deep, still pool, with trees all around." },
      { title: "The caves", text: "Natural caves nearby, tied to local stories about the Pandavas." },
      { title: "The drive", text: "Countryside views on the road from Khajuraho." },
    ],
    tipsTitle: "Tips",
    tips: [
      "Start in the morning so you are back before dark.",
      "Take water, snacks and a change of clothes if you plan to get wet.",
      "Follow the posted safety signs near the water, especially in the monsoon.",
    ],
    faqs: [
      { q: "How long is the Pandav Falls trip?", a: "About six hours including the drive and time at the falls." },
      { q: "Can I combine it with Raneh Falls?", a: "That makes for a very long day. Most visitors pick one. Ask your rider when they call." },
      PRICE_FAQ,
    ],
    trip: "pandav-falls",
    cta: "Request a Pandav Falls trip",
    related: ["/raneh-falls-tuk-tuk", "/panna-national-park-tuk-tuk"],
  },
];

export function getSeoPage(path: string) {
  return SEO_PAGES.find((p) => p.path === path);
}

export const HOME_FAQS: Faq[] = [
  {
    q: "How is the price decided?",
    a: "You and the rider agree the price by phone before the ride. You can give your budget when you request a ride, or just ask the rider. Don't get in before you have agreed the price.",
  },
  { q: "How do I pay?", a: "Pay your rider in cash or by UPI at the end of the trip. There is nothing to pay online." },
  { q: "How many people fit in one auto?", a: "Up to 3 adults with small bags. For bigger groups, request a second auto with the same pickup." },
  {
    q: "My flight or train is late. What happens?",
    a: "Add your flight or train number in the pickup details when you book. We'll keep an eye on it and adjust your pickup.",
  },
  {
    q: "Is the rider a temple guide?",
    a: "Our riders know the temples well and are happy to point you around, but they are not official guides. Licensed guides are available at the Western Group entrance.",
  },
  {
    q: "How do I change or cancel a booking?",
    a: "Tell the rider when they call, or call or WhatsApp them any time before pickup. Keep your request code handy.",
  },
];

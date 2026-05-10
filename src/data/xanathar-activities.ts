// Xanathar's Guide to Everything Ch. 2 — downtime activity reference.
// Compact summaries for at-the-table lookup; the DM has the book for full text.

export type ComplicationDie = 6 | 8 | 10 | 12

export interface ComplicationEntry {
  roll: number
  text: string
}

export interface XanatharActivity {
  id: string
  name: string
  summary: string
  workweeks: string
  goldCost: string
  skill: string
  resolutionHint: string
  complicationDie: ComplicationDie
  complications: ComplicationEntry[]
  notes?: string
}

export const XANATHAR_ACTIVITIES: XanatharActivity[] = [
  {
    id: 'buying-magic-item',
    name: 'Buying a Magic Item',
    summary: 'Track down a seller, then negotiate; quality scales with effort and coin.',
    workweeks: '1+',
    goldCost: '100 gp +',
    skill: 'Charisma (Persuasion)',
    resolutionHint: 'Higher check totals open higher-rarity tables (1–5 → A; 41+ → I).',
    complicationDie: 12,
    complications: [
      { roll: 1, text: 'The item is a fake, planted by an enemy.' },
      { roll: 2, text: 'The item is stolen by the party\'s enemies.' },
      { roll: 3, text: 'The item is cursed by a god.' },
      { roll: 4, text: "The item's original owner will kill to reclaim it." },
      { roll: 5, text: 'The item is at the centre of a dark prophecy.' },
      { roll: 6, text: 'The seller is murdered before the sale.' },
      { roll: 7, text: 'The seller is a devil looking to make a bargain.' },
      { roll: 8, text: 'The item is the key to freeing an evil entity.' },
      { roll: 9, text: 'A third party bids on the item, doubling its price.' },
      { roll: 10, text: 'The item is an enslaved, intelligent entity.' },
      { roll: 11, text: 'The item is tied to a cult.' },
      { roll: 12, text: 'Enemies spread rumours that the item is an artefact of evil.' },
    ],
  },
  {
    id: 'carousing',
    name: 'Carousing',
    summary: 'Mingle with lower / middle / upper class to seed contacts.',
    workweeks: '1',
    goldCost: '10 / 50 / 250 gp by class',
    skill: 'Charisma (Persuasion)',
    resolutionHint:
      '1–5 hostile contact · 6–10 none · 11–15 ally · 16–20 two allies · 21+ three allies.',
    complicationDie: 8,
    complications: [
      { roll: 1, text: "You are challenged to a duel by a local who took offence." },
      { roll: 2, text: 'You made a foe out of a local lord while carousing.' },
      { roll: 3, text: 'You fell in love with an NPC inappropriate for your class.' },
      { roll: 4, text: 'You made a foe of a guild or religious order.' },
      { roll: 5, text: 'You spent twice the agreed amount; pay or owe.' },
      { roll: 6, text: 'You woke up in an out-of-the-way spot, missing valuables.' },
      { roll: 7, text: 'You made a powerful contact who now insists on a favour.' },
      { roll: 8, text: 'You blacked out — what did you do?' },
    ],
    notes: 'Three sub-tables exist (lower/middle/upper); roll on whichever class fits.',
  },
  {
    id: 'crafting-item',
    name: 'Crafting an Item',
    summary: 'Forge non-magical gear with the right tools and raw materials.',
    workweeks: '1+',
    goldCost: '½ item market price (raw materials)',
    skill: 'Tool proficiency required',
    resolutionHint: 'Workweeks needed = item gp cost ÷ 50. Multiple crafters split the time.',
    complicationDie: 6,
    complications: [
      { roll: 1, text: 'A rival hears of your work and tries to sabotage it.' },
      { roll: 2, text: 'A merchant demands a discount; refuse and lose business.' },
      { roll: 3, text: 'A noble takes interest; impressing them takes extra time.' },
      { roll: 4, text: 'Materials prove faulty — pay 25 gp more or restart.' },
      { roll: 5, text: 'A delivery is hijacked; recover materials or eat the loss.' },
      { roll: 6, text: 'A previous client reports the prior work as flawed.' },
    ],
  },
  {
    id: 'crafting-magic-item',
    name: 'Crafting Magic Items',
    summary: 'Long-term project: rare formula + exotic ingredient + workweeks of work.',
    workweeks: 'rarity-dependent (weeks → years)',
    goldCost: '½ rarity asking price',
    skill: 'Spellcaster (or specialist) of required level',
    resolutionHint:
      'Common 5,000 gp · Uncommon 1,000 gp · Rare 5,000 gp · Very Rare 50,000 gp · Legendary 500,000 gp.',
    complicationDie: 8,
    complications: [
      { roll: 1, text: 'Rumour of the item draws a thief.' },
      { roll: 2, text: 'A demon offers help — at a price.' },
      { roll: 3, text: 'A rival NPC seeks to claim the item first.' },
      { roll: 4, text: 'A botched batch of components; reroll workweek.' },
      { roll: 5, text: 'A spirit tied to the formula appears.' },
      { roll: 6, text: 'A noble demands the item be gifted to them.' },
      { roll: 7, text: 'The temple/guild objects to the work.' },
      { roll: 8, text: 'A planar accident contaminates the workshop.' },
    ],
  },
  {
    id: 'crime',
    name: 'Crime',
    summary: 'Plan and execute a heist scaled to the haul value.',
    workweeks: '1',
    goldCost: '25 gp (lifestyle + tools)',
    skill: 'Best of Dexterity (Stealth), Thieves\' Tools, Intelligence (Investigation), Charisma (Deception)',
    resolutionHint:
      'Two failures → caught and jailed. Two successes → take haul. Three successes → take 1.5× haul.',
    complicationDie: 8,
    complications: [
      { roll: 1, text: 'A bystander is killed during the heist.' },
      { roll: 2, text: 'You inadvertently rob someone you care about.' },
      { roll: 3, text: 'The mark identifies you; bounty posted.' },
      { roll: 4, text: 'A rival crew claims the haul as theirs.' },
      { roll: 5, text: 'Half your loot is fake.' },
      { roll: 6, text: 'A guild expects a cut.' },
      { roll: 7, text: 'A guard turns out to be an off-duty paladin.' },
      { roll: 8, text: 'You learn the mark stole the haul from someone else first.' },
    ],
  },
  {
    id: 'gambling',
    name: 'Gambling',
    summary: 'Wager 10–1,000 gp at the tables; outcome scales with check totals.',
    workweeks: '1',
    goldCost: '10–1,000 gp stake',
    skill:
      'Wisdom (Insight), Charisma (Deception), Charisma (Intimidation) — best of three',
    resolutionHint:
      '1 success → lose half stake. 2 → break even. 3 → win stake. 4+ → win 1.5× stake.',
    complicationDie: 8,
    complications: [
      { roll: 1, text: 'You owe 1d10 × 10 gp to a dangerous loan shark.' },
      { roll: 2, text: 'You made a powerful enemy at the tables.' },
      { roll: 3, text: 'You made a romantic connection with a fellow gambler.' },
      { roll: 4, text: 'A noble accuses you of cheating.' },
      { roll: 5, text: 'Your winnings include a stolen item.' },
      { roll: 6, text: 'You are recruited to throw a future game.' },
      { roll: 7, text: 'A friend has been kidnapped to settle their debts.' },
      { roll: 8, text: 'You won a deed to a haunted property.' },
    ],
  },
  {
    id: 'pit-fighting',
    name: 'Pit Fighting',
    summary: 'A workweek of staged duels at a local fighting pit.',
    workweeks: '1',
    goldCost: '—',
    skill:
      'Strength (Athletics), Dexterity (Acrobatics), Constitution save — best of three',
    resolutionHint: 'Earn 100 gp per successful check (max 3). 0 successes → injured.',
    complicationDie: 8,
    complications: [
      { roll: 1, text: 'A rival fighter swears revenge.' },
      { roll: 2, text: 'You are accused of throwing a fight.' },
      { roll: 3, text: 'You owe a noble a return bout.' },
      { roll: 4, text: 'You are smitten with a fellow fighter.' },
      { roll: 5, text: 'A criminal offers you steroids/elixirs — at a cost.' },
      { roll: 6, text: 'A fan stalks you between matches.' },
      { roll: 7, text: 'A clergy condemns the violence; church business dries up.' },
      { roll: 8, text: 'A young hopeful asks you to train them.' },
    ],
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    summary: 'Rest and recover; clear exhaustion and recover from minor afflictions.',
    workweeks: '1',
    goldCost: 'lifestyle for the week',
    skill: 'None',
    resolutionHint:
      'Advantage on saves vs. diseases / poisons currently on you; reduce one level of exhaustion.',
    complicationDie: 6,
    complications: [
      { roll: 1, text: 'A romantic interest ends a relationship.' },
      { roll: 2, text: 'A family member arrives needing aid.' },
      { roll: 3, text: 'A trusted friend is in trouble; they ask for help.' },
      { roll: 4, text: 'A misunderstanding earns you a hostile rumour.' },
      { roll: 5, text: 'You are robbed during the week.' },
      { roll: 6, text: 'A debt collector tracks you down.' },
    ],
  },
  {
    id: 'religious-service',
    name: 'Religious Service',
    summary: 'Volunteer with a temple to gain favour and inspiration.',
    workweeks: '1',
    goldCost: '—',
    skill: 'Intelligence (Religion) or Charisma (Persuasion)',
    resolutionHint: 'DC 10 success → temple owes you a favour. DC 20 → two favours.',
    complicationDie: 6,
    complications: [
      { roll: 1, text: 'A schism in the temple drags you in.' },
      { roll: 2, text: 'A rival cleric resents your involvement.' },
      { roll: 3, text: 'A penitent confesses a serious crime to you.' },
      { roll: 4, text: 'A celebrant believes a relic should be returned.' },
      { roll: 5, text: 'A god sends you a vision.' },
      { roll: 6, text: 'The temple asks for a tithe of your treasure.' },
    ],
  },
  {
    id: 'research',
    name: 'Research',
    summary: 'Dig through libraries / sages for a single topic.',
    workweeks: '1',
    goldCost: '50 gp (sage fees)',
    skill: 'Intelligence (Arcana / History / Nature / Religion)',
    resolutionHint: 'DC 10 → one piece of lore. DC 20 → two. Bonus per extra workweek.',
    complicationDie: 6,
    complications: [
      { roll: 1, text: 'A book is missing from the library — borrow it back?' },
      { roll: 2, text: 'A sage tries to recruit you for a sketchy expedition.' },
      { roll: 3, text: 'A rumour ties your topic to a forbidden cult.' },
      { roll: 4, text: 'A spy mistakes you for a fellow agent.' },
      { roll: 5, text: 'A jealous wizard sabotages your sources.' },
      { roll: 6, text: 'A demon takes interest in your reading list.' },
    ],
  },
  {
    id: 'scribe-scroll',
    name: 'Scribing a Spell Scroll',
    summary: 'Write a spell scroll for a spell you know.',
    workweeks: 'rarity-dependent (1d-9d weeks)',
    goldCost: 'rarity-dependent (15–250,000 gp)',
    skill: 'Spellcasting class + spell prepared',
    resolutionHint:
      'Cantrip 1 day · 1st 1 wk · 2nd 2 wk · 3rd 3 wk · ... · 9th 9 wk.',
    complicationDie: 6,
    complications: [
      { roll: 1, text: 'A rival spellcaster wants the scroll for themselves.' },
      { roll: 2, text: 'A guild charges a tax on scribed scrolls.' },
      { roll: 3, text: 'Your ink supplier needs a bodyguard.' },
      { roll: 4, text: 'The spell\'s component goes missing mid-scribe.' },
      { roll: 5, text: 'A misprint introduces a small wild-magic effect on cast.' },
      { roll: 6, text: 'An apprentice stole a draft of the scroll.' },
    ],
  },
  {
    id: 'selling-magic-item',
    name: 'Selling a Magic Item',
    summary: 'Find a buyer; price scales with effort and rarity.',
    workweeks: '1+',
    goldCost: '25 gp lifestyle',
    skill: 'Charisma (Persuasion)',
    resolutionHint:
      'Common ≤ 100 gp · Uncommon 101–500 · Rare 501–5,000 · etc — see DMG/XGtE table.',
    complicationDie: 10,
    complications: [
      { roll: 1, text: 'The buyer is a fence; the item is reported stolen.' },
      { roll: 2, text: 'The buyer haggles down by 25%.' },
      { roll: 3, text: 'A rival party tries to outbid you.' },
      { roll: 4, text: 'The buyer is a cultist using the item for evil ends.' },
      { roll: 5, text: 'The buyer asks for the item to be delivered to a remote site.' },
      { roll: 6, text: 'A previous owner appears, claiming the item.' },
      { roll: 7, text: 'The sale must happen at a dangerous location.' },
      { roll: 8, text: 'The buyer pays in gems of suspicious origin.' },
      { roll: 9, text: 'The buyer expects you to throw in advice/training.' },
      { roll: 10, text: 'The buyer is a doppelganger.' },
    ],
  },
  {
    id: 'training',
    name: 'Training',
    summary: 'Learn a new language or tool proficiency over many workweeks.',
    workweeks: '10',
    goldCost: '25 gp/wk (250 gp total)',
    skill: 'None — instructor required',
    resolutionHint: 'After 10 workweeks (250 gp), gain proficiency.',
    complicationDie: 8,
    complications: [
      { roll: 1, text: 'A jealous rival sabotages a lesson.' },
      { roll: 2, text: 'Your instructor is wanted by the authorities.' },
      { roll: 3, text: 'Your instructor demands a quest as the final exam.' },
      { roll: 4, text: 'A fellow student is plotting against the instructor.' },
      { roll: 5, text: 'The instructor falls ill mid-course.' },
      { roll: 6, text: 'You discover the instructor was once a villain.' },
      { roll: 7, text: 'A rival school dismisses your training as worthless.' },
      { roll: 8, text: 'You and the instructor begin a romance.' },
    ],
  },
  {
    id: 'work',
    name: 'Work',
    summary: 'Take honest labour to cover lifestyle expenses.',
    workweeks: '1',
    goldCost: 'covers lifestyle (varies)',
    skill: 'Strength (Athletics), Intelligence, Charisma — by job',
    resolutionHint:
      '9 or less → poor. 10–14 → modest. 15–20 → comfortable. 21+ → wealthy lifestyle.',
    complicationDie: 6,
    complications: [
      { roll: 1, text: 'Your employer\'s rival tries to recruit you.' },
      { roll: 2, text: 'You witness a co-worker stealing.' },
      { roll: 3, text: 'A customer files a complaint against you.' },
      { roll: 4, text: 'Your employer offers you a permanent role at terrible pay.' },
      { roll: 5, text: 'Your employer\'s business is a front for crime.' },
      { roll: 6, text: 'You stumble onto a buried secret on the job.' },
    ],
  },
]

export function lookupActivity(id: string): XanatharActivity | undefined {
  return XANATHAR_ACTIVITIES.find((a) => a.id === id)
}

import type { Aspect } from '../types'

export interface ClassFeatureImprovement {
  name: string
  summary: string
}

export interface AspectInfo {
  /** S&F stronghold archetype this Aspect's class is keyed to. */
  strongholdType: string
  /** Short flavour line — what this Aspect tilts the bastion toward. */
  flavour: string
  /** Which kind of followers the Aspect's class chart rolls. */
  followers: string
  /** GM picks 1+ at their discretion (S&F class chapter, abridged). */
  demesneEffects: string[]
  /** init 20, can't repeat until short rest. Abridged from S&F. */
  strongholdActions: string[]
  /** Class feature improvement granted by the stronghold. */
  classFeature: ClassFeatureImprovement
  /** True when the entry is homebrew (not in S&F). */
  homebrew?: boolean
}

// Sourced from Strongholds & Followers (MCDM, 2018-2019). Entries condensed for
// at-the-table reference — the DM has the book for full rules text. Artificer
// post-dates S&F so its entry is flagged as homebrew.
export const ASPECT_INFO: Record<Aspect, AspectInfo> = {
  Bard: {
    strongholdType: 'Establishment',
    flavour: 'Influence, reputation, cultural sway.',
    followers: "Bard's class follower table — performers, scribes, patrons.",
    demesneEffects: [
      'Wind through the trees plays music; hooves beat out a complex rhythm.',
      'Folk who live in the demesne for a week start ending sentences in rhyming couplets.',
      'Thunder rolls on dramatic statements; ravens alight on cue.',
    ],
    strongholdActions: [
      'Until init 20 next round, all inspiration dice roll maximum (chord: root + fifth).',
      "A 3-piece band arrives; until init 20 next round, enemies roll 3d20-take-worst on saves vs your magic.",
      'Regain all inspiration dice.',
    ],
    classFeature: {
      name: 'Encouraging Inspiration',
      summary:
        "While an ally has unspent inspiration, +1 prof bonus — for inspiration dice equal to your stronghold level (refresh on extended rest).",
    },
  },
  Wizard: {
    strongholdType: 'Tower',
    flavour: 'Arcane research, planar wards, reagent stockpile.',
    followers: "Wizard's class table — apprentices, sages, bound spirits.",
    demesneEffects: [
      'The library copies every nonmagical book brought into the demesne.',
      'Concentrate 10 minutes to scry on any person/location in the demesne (works from any plane).',
      'Once per day, control the weather in the demesne (no LoS required).',
    ],
    strongholdActions: [
      'Cast a prepared spell — no slot used.',
      'Cast flesh to stone on every enemy within 60 ft — no slot used.',
      'Recover all spent spell slots as if from a long rest.',
    ],
    classFeature: {
      name: 'Spellmaster',
      summary:
        'Concentrate on two spells at once — for a number of times equal to your stronghold level (refresh on extended rest).',
    },
  },
  Paladin: {
    strongholdType: 'Chapel (Temple)',
    flavour: 'Oath-marked banner, pilgrim flow, holy ground.',
    followers: "Paladin's table — squires, knights-errant, oath-bound clerics.",
    demesneEffects: [
      'Clear blue skies and warm sun year-round; rain falls only at night, thunderstorms avoid the area.',
      'Evil creatures in daylight have disadvantage on attacks, saves, and ability checks.',
      "The paladin senses any chaotic/evil creature with 7+ HD in the demesne (range = stronghold level in hexes).",
    ],
    strongholdActions: [
      'Each chaotic/evil creature within 120 ft Con-saves or is bound by gold/silver chains until they break free.',
      'Flying enemies within 120 ft Con-save or land for the rest of combat — and stay grounded.',
      "An ally's armor turns gold: AC bonus equal to your Cha mod for the rest of combat (1×/day per ally).",
    ],
    classFeature: {
      name: 'Righteous Smite',
      summary:
        'Divine Smite ignores radiant/weapon resistance; invulnerability becomes resistance, no resistance becomes vulnerability. Uses = stronghold level.',
    },
  },
  Cleric: {
    strongholdType: 'Church (Temple)',
    flavour: 'Sanctuary, divine favour, congregation lifeline.',
    followers: "Cleric's table — acolytes, healers, lay-priests.",
    demesneEffects: [
      "Folk in the cleric's demesne are immune to disease.",
      "The cleric hears the prayers of in-concordance worshippers in the demesne.",
      "Weather mirrors the cleric's health — fair when hale, foul when wounded.",
    ],
    strongholdActions: [
      'Enemies within 30 ft Con-save or suffer the contagion spell.',
      'Shafts of golden light annihilate undead/demons/devils within 60 ft on a failed Wis save.',
      'You and all allies in the stronghold recover all Hit Dice + 30 temporary HP.',
    ],
    classFeature: {
      name: 'Manifest Divinity',
      summary:
        'When you Channel Divinity, all allies within 30 ft regain 3d8 HP. Uses = stronghold level.',
    },
  },
  Druid: {
    strongholdType: 'Grove (Temple variant)',
    flavour: 'Wild domain, beast network, seasonal rites.',
    followers: "Druid's table — wardens, beast companions, hedgewitches.",
    demesneEffects: [
      'Local birds and mammals speak Common and Elvish; they warn the druid of intruders.',
      'Naturally-grown nuts/fruits/vegetables grant goodberry effect (only inside the demesne).',
      "Roads/trails don't last more than a day, but allies pass freely as if on roads.",
    ],
    strongholdActions: [
      'Grasping vines for 1 min: enemies within 60 ft Dex-save or restrained, taking 3d8/round.',
      'Banish an enemy to Arcadia on a failed save.',
      'Summon 1d4+1 shambling mounds for 1 minute.',
    ],
    classFeature: {
      name: 'Savage Shape',
      summary:
        'Wild Shape into any monstrosity / fey / dragon up to ½ your level CR. Uses = stronghold level.',
    },
  },
  Fighter: {
    strongholdType: 'Fortress (Keep)',
    flavour: 'Garrison drills, martial banner, tactical reach.',
    followers: "Fighter's table — soldiers, captains, smiths.",
    demesneEffects: [
      'Fortifications grant defending units +2 Morale.',
      'Menhirs follow hostile intruders, blocking them from the locals.',
      'Archers train more accurately; edged weapons in the demesne stay keen.',
    ],
    strongholdActions: [
      'Until init 20 next round, enemies casting in your demesne take 1d6/spell-level force damage and lose the spell on a failed Con-save.',
      'Until end of next turn, you and all allies hit automatically (still roll for crits).',
      'You and all allies are restored to full HP.',
    ],
    classFeature: {
      name: 'Fighting Surge',
      summary:
        'Action Surge attacks automatically critical-hit. Uses = stronghold level.',
    },
  },
  Rogue: {
    strongholdType: 'Tavern (Establishment)',
    flavour: 'Smuggler routes, fence network, false bottoms.',
    followers: "Rogue's table — fixers, fences, informants.",
    demesneEffects: [
      'One ally per stronghold level can hide in the demesne, undetectable by mundane or magical means.',
      'Trespassers feel constantly spied upon.',
      'Hostile creatures resting in the demesne hit a hidden trap on a d20 ≤ 10 (3d8 piercing).',
    ],
    strongholdActions: [
      'All enemies within 60 ft are marked for death; for 1 min you can spend the mark on a hit for +6d6 slashing.',
      'Enemies within 60 ft lose stealth and invisibility.',
      'Gain a Coin of Fate — flip when hit; heads = miss, tails = hit + lose coin.',
    ],
    classFeature: {
      name: 'Vanishing Strike',
      summary:
        'After a Sneak Attack hit, become invisible until end of next turn or until you attack/cast. Uses = stronghold level.',
    },
  },
  Ranger: {
    strongholdType: 'Lodge (Keep variant)',
    flavour: 'Trail wardens, beast lore, frontier intelligence.',
    followers: "Ranger's table — scouts, trackers, beasts.",
    demesneEffects: [
      'Game is plentiful, larger and fiercer than usual.',
      'Enemies must DC 15 Survival or be attacked by 2d6 winter wolves while navigating.',
      'Allies treat the demesne as favored terrain; enemy units treat it as difficult terrain.',
    ],
    strongholdActions: [
      'Targets appear on enemies within 60 ft — vulnerability to your attacks until init 20 next round.',
      'Summon a 60-ft fog cloud for 1 min; you and allies see through it normally.',
      'Until init 20 next turn, your hits cause bleeding (3d8/round, DC 18 Con to end).',
    ],
    classFeature: {
      name: 'Chosen Enemy',
      summary:
        'Your favored enemy has vulnerability to your attacks. Uses = stronghold level.',
    },
  },
  Sorcerer: {
    strongholdType: 'Sanctum (Tower)',
    flavour: 'Wild magic, blood-line patrons, planar resonance.',
    followers: "Sorcerer's table — bound kin, occult tutors, unwitting marks.",
    demesneEffects: [
      "Curses, blessings, and oaths spoken in the demesne have a 15% chance of triggering Wild Magic.",
      'Folk who live in the demesne for a season learn one random sorcerer cantrip (lost if they leave).',
      'Raindrops cast prismatic reflections during the day.',
    ],
    strongholdActions: [
      'Cast three prepared spells using normal slots.',
      'For 1 minute, all your spells are heightened (no sorcery points needed).',
      'Wreathed in fire shield — enemies who strike take 4d8 instead of 2d8.',
    ],
    classFeature: {
      name: 'Source of Magic',
      summary:
        'Bonus sorcery points equal to your stronghold level (refresh on extended rest).',
    },
  },
  Warlock: {
    strongholdType: 'Fane (Tower / hidden)',
    flavour: "Patron's eye on the bastion, pact-bound rites.",
    followers: "Warlock's table — patron envoys, cultists, fellow pact-bearers.",
    demesneEffects: [
      'The sun appears as a baleful orb over the demesne.',
      'Constellations are strange; stars occasionally fall.',
      'You sense enemies in the demesne instantly.',
      'Once per month, summon an earthquake against any enemy in the demesne.',
    ],
    strongholdActions: [
      'Recover all spell slots as if from a short rest.',
      'Fire eldritch blast at every enemy you can see within 60 ft.',
      'Summon a Type VI servitor (S&F p.31).',
    ],
    classFeature: {
      name: 'Master Invoker',
      summary:
        'Gain an extra spell slot — uses = stronghold level (refresh on extended rest).',
    },
  },
  Barbarian: {
    strongholdType: 'Camp (Keep variant)',
    flavour: 'Warband loyalty, totemic banners, raiding range.',
    followers: "Barbarian's table — warriors, shamans, beast-bonded kin.",
    demesneEffects: [
      'Ale brings cheer with no hangovers, no matter how much.',
      'Wildlife grows especially large and fierce, migrating with the camp.',
      'Poisons brought into the demesne neutralize within an hour — no cowardly civilized deaths.',
    ],
    strongholdActions: [
      'A "Yawp!" frightens all enemies within 60 ft until init 20 next round.',
      'Rage; allies not in heavy armor share the rage benefits.',
      'Cast chain lightning (DC 8 + prof + Con) — works mid-rage, doesn\'t end it.',
    ],
    classFeature: {
      name: "Chieftain's Rage",
      summary:
        'When you drop an enemy to 0 HP, take a free attack or movement. Uses = stronghold level.',
    },
  },
  Monk: {
    strongholdType: 'Monastery (Temple variant)',
    flavour: 'Discipline, training halls, Ki-resonant calm.',
    followers: "Monk's table — disciples, masters, wandering pilgrims.",
    demesneEffects: [
      'Creatures age more slowly within the demesne.',
      'Temperature stays temperate year-round, all day.',
      "Violence has a 15% chance of summoning a Source of Earth, who ends it via Back to Earth.",
    ],
    strongholdActions: [
      'Skin becomes diamond — until init 20 next round, immune to all damage except psychic.',
      'Make eight unarmed attacks against an adjacent enemy.',
      'Regain all ki as though from a long rest.',
    ],
    classFeature: {
      name: 'Focused Ki',
      summary:
        'When attacked while you have unspent ki, ignore all of an attack\'s effects except its damage. Uses = stronghold level.',
    },
  },
  Artificer: {
    strongholdType: 'Workshop (Tower-flavoured)',
    flavour: 'Inventions, prototypes, infusion stockpile.',
    followers: "Artificer's table — apprentices, machinists, planar suppliers.",
    homebrew: true,
    demesneEffects: [
      'Workshop tools never dull; spare parts replenish overnight.',
      'Apprentices and tinkerers feel drawn to the demesne — one fresh hopeful arrives each season.',
      'Magical mishaps are contained: experimental failures lose 1 die of damage in the demesne.',
    ],
    strongholdActions: [
      'Recover all spent infusions for the day.',
      'Conjure a Steel Defender (or your subclass\'s analogue) for 1 minute.',
      'Bestow an infusion on an ally at-the-table for 1 minute, no slot.',
    ],
    classFeature: {
      name: 'Master Infuser (homebrew)',
      summary:
        'Maintain one extra infusion at a time — uses = stronghold level (refresh on extended rest).',
    },
  },
}

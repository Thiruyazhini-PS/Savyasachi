/**
 * ==========================================================================
 * CHAKRAVYUHA: THE ESCAPE FROM LAKSHAGRIHA
 * Room Data Definitions for all 9 Chambers (7-Layer Narrative Architecture)
 * ==========================================================================
 */

import { RoomDefinition } from '../types';

export const ROOMS: RoomDefinition[] = [
  {
    id: 1,
    act: "ACT I: BEAUTY & CELEBRATION",
    themeClass: "theme-act1",
    title: "I. VARANAVATA: The Deceptive Welcome",
    location: "GATES OF VARANAVATA PROVINCE",
    arrival: {
      sub: "Bells chime over the northern bank of Ganga. Marigold garlands crown the pavilions, yet under the celebratory conch horns, a hurried whisper ripples.",
      normalAspect: "Citizens tossing flower petals, town elders presenting offerings to Yudhishthira, sweet sandalwood incense.",
      wrongAspect: "The chief steward, Purochana, keeps surveying the northern perimeter instead of the royal procession, clutching sealed rolls of architectural parchment."
    },
    backgroundActivity: [
      "Flower vendors arranging garlands along stone porticos",
      "Royal chariots disembarking in the central courtyard",
      "Purochana's men unloading heavy lacquered wooden crates under tarpaulins"
    ],
    ambientLog: "Temple bells peal across the western river bend. The aroma of burning benzoin masks a sharp, asphaltic undertone.",
    npcs: [
      {
        id: "purochana",
        name: "Purochana",
        role: "Royal Architect & Steward",
        avatar: "👳🏽‍♂️",
        initialX: 72,
        initialY: 55,
        state: "Welcoming · Furtive Glance",
        dialogue: "Noble Pandavas! Welcome to holy Varanavata! By King Dhritarashtra's command, I have raised a house of five doors — a celestial haven of cedar and gold consecrated for your rest on the promontory!",
        routineText: "Purochana frequently pats an iron key at his waist while glancing toward the river road."
      },
      {
        id: "kunti",
        name: "Queen Mother Kunti",
        role: "Mother of the Pandavas",
        avatar: "👵🏾",
        initialX: 28,
        initialY: 60,
        state: "Observant · Wary",
        dialogue: "Yudhishthira, my son... observe the supply convoy behind the gate. Four heavy freight wagons weep amber resin with official lac guild stamps, while flower carts disguise the rest.",
        routineText: "Kunti stands close to Bhima, her eyes noting the placement of every sentry."
      }
    ],
    hotspots: [
      {
        id: "crate_tarpaulin",
        title: "Unmarked Wooden Crate",
        x: 60,
        y: 68,
        icon: "📦",
        tag: "SUSPICIOUS SUPPLY",
        drishtiHint: "A heavy, dark seepage stains the bottom timber. 4 freight wagons weep amber pitch with lac guild stamps; 1 flower cart drips honey with no stamp.",
        description: "Heavy timber crates marked with royal Hastinapura seals. Exactly four convoy wagons bear resin-stained wheels and lac guild stamps.",
        sensory: "Your fingers touch the wood grain. Sticky, dark bitumen and raw amber lac resin adhere to your skin.",
        hollow: false,
        clue: {
          id: "clue_unmarked_resin",
          title: "Imported Bitumen & Lac Crates",
          type: "MATERIAL EVIDENCE",
          desc: "Dozens of crates loaded not with palace provisions, but with combustible lac and mineral pitch."
        }
      },
      {
        id: "city_map_scroll",
        title: "Town Surveyor's Folio",
        x: 42,
        y: 48,
        icon: "📜",
        tag: "GEOGRAPHICAL RECORD",
        drishtiHint: "The surveyor's ground plan details 7 distinct doors; builder Purochana spoke only of 5 (7 - 5 = 2).",
        description: "A blueprint schematic of Varanavata. The surveyor's official plan shows 7 architectural doors leading inside and outside Lakshagriha.",
        sensory: "Red draftsman ink records seven door portals around the outer ramparts.",
        hollow: false,
        clue: {
          id: "clue_door_mismatch",
          title: "Surveyor's Seven Doors (vs. Five Sworn)",
          type: "SPATIAL EVIDENCE",
          desc: "The surveyor's folio blueprint drafts 7 doors, contradicting Purochana's sworn count of 5 doors."
        }
      },
      {
        id: "vidura_messenger",
        title: "Vidura's Secret Envoy",
        x: 18,
        y: 52,
        icon: "🕊",
        tag: "COVERT COMMUNIQUE",
        drishtiHint: "A disguised ascetic carrying a copper disc etched with a ring of 9 moons: 6 carved lit, 3 dark remaining.",
        description: "A wanderer approaches Yudhishthira under the guise of offering ash. He presses an inscribed copper ring into your palm without looking up.",
        sensory: "He murmurs: 'The disc keeps count of nights. Ask it what remains.' Three dark moons remain etched on the rim.",
        hollow: false,
        clue: {
          id: "clue_vidura_warning_mleccha",
          title: "Vidura's Moon Count Ring",
          type: "CRYPTIC WARNING",
          desc: "'The disc keeps count of nights. Ask it what remains.' Uncle Vidura's disc reveals 3 dark moons remaining before the blaze."
        }
      }
    ],
    puzzle: {
      type: "DEDUCTIVE SEQUENCE",
      tag: "MOTIVE RECONSTRUCTION",
      title: "Decipher the Royal Mandate",
      instruction: "Arrange the chronological observations to deduce why Duryodhana financed such extraordinary luxury in a remote river outpost.",
      elements: [
        { id: "e1", text: "Pandavas sent on 'peaceful pilgrimage' by King Dhritarashtra" },
        { id: "e2", text: "Special palace commissioned exclusively through Purochana" },
        { id: "e3", text: "Site chosen half a league from civilian firefighters and stone wells" },
        { id: "e4", text: "Vidura's warning speaks of a flame without iron or arrow" }
      ],
      correctOrder: ["e1", "e2", "e3", "e4"],
      solutionNote: "The pilgrimage is an orchestrated trap. Lakshagriha is not a sanctuary, but a pyre."
    },
    decision: {
      title: "Purochana's Invitation to Enter Immediately",
      desc: "Purochana bows low, urging the royal family to retire into the house before sunset. Do you accept his escort immediately to observe his movements, or linger to inspect the river perimeter?",
      options: [
        {
          id: "opt_enter",
          title: "Enter with Purochana Immediately",
          effect: "Lulls Purochana's suspicion (-15% Vigilance), but leaves the river perimeter unmapped.",
          suspicionDelta: -15,
          recordedNote: "You chose immediate entry, keeping Purochana complacent while stepping inside the lion's den."
        },
        {
          id: "opt_linger",
          title: "Linger at the Riverbank Wharf",
          effect: "Identifies the river shallows and reeds (+Secret Route Clue), but sparks Purochana's alert eye (+20% Vigilance).",
          suspicionDelta: 20,
          recordedNote: "You scouted the Ganga bank first; Purochana observed your delay with narrowed eyes."
        }
      ]
    },
    breakthrough: {
      heading: "THE GATES OF LAKSHAGRIHA OPEN",
      narrative: "As the heavy sal-wood doors swing inward, the scent of fresh honey, clarified butter, and polished cedar billows forward. The architecture is breathtaking—yet your eyes now seek the seams between the splendor.",
      buttonText: "ENTER THE HOUSE OF LAC"
    }
  },

  {
    id: 2,
    act: "ACT II: CURIOSITY & SPLENDOR",
    themeClass: "theme-act2",
    title: "II. LAKSHAGRIHA: The Grand Chamber",
    location: "GRAND AUDIENCE HALL OF LAKSHAGRIHA",
    arrival: {
      sub: "Cedar, gold and silk. Everything shines like it was made yesterday. Yet the lamps all lean one way, the air smells of clarified butter and tree resin, and the walls conceal a silent draft.",
      normalAspect: "Four carved cedar pillars with lotus capitals, mirror-polished floor reflecting lamp flames, rich silk curtains, and warm clerestory sunlight.",
      wrongAspect: "The flames and curtains lean eastward toward a hidden hollow strip in the carved frieze. The surveyor's plan marks seven doors, but only five exist."
    },
    backgroundActivity: [
      "The Oil-Bearer replenishing braziers with fragrant ghee-lac oil, avoiding the east wall",
      "The Lamp-Boy trimming wicks that persistently bend toward the east wall draft",
      "Steward Guards stationed at the outer doors, watching Purochana in the upper gallery",
      "Purochana monitoring the hall from the mezzanine rail on a strict 90-second patrol loop"
    ],
    ambientLog: "Mahabharata Adi Parva (Jatugriha Parva, Ganguli Sec. CXLVI–CXLVIII): 'The Pandavas entered that mansion... Yudhishthira, smelling the scent of fat, clarified butter, and lac mixed with hemp, said unto Bhimasena: This house is combustible...'",
    npcs: [
      {
        id: "purochana",
        name: "Purochana",
        role: "Chief Architect & Royal Steward",
        avatar: "👳🏽‍♂️",
        initialX: 82,
        initialY: 28,
        state: "Patrolling Mezzanine Rail (90s Loop)",
        dialogue: "Welcome, princes. Not a nail was spared for your comfort. Is something wrong with the walls, my prince?",
        routineText: "0:00 gallery rail > 0:20 stairs to sentry > 0:40 east wall palm check > 0:55 greets Kunti > 1:10 glances at player > 1:20 exits hall > 1:30 returns."
      },
      {
        id: "oil_bearer",
        name: "Oil-Bearer",
        role: "Palace Servant (Woman, 40s)",
        avatar: "🏺",
        initialX: 68,
        initialY: 62,
        state: "Pouring Braziers Sequentially",
        dialogue: "Mind the floor, my lord. We oiled it this morning with sweet temple oils.",
        routineText: "Pours fragrant oil into braziers, wipes hands on cloth, hums two bars of a work song, never looks at the east wall."
      },
      {
        id: "lamp_boy",
        name: "Lamp-Boy",
        role: "Palace Servant (Boy, 12)",
        avatar: "✂️",
        initialX: 22,
        initialY: 65,
        state: "Trimming Leaning Wicks",
        dialogue: "They never stay straight, these flames. Always bending toward the east frieze.",
        routineText: "Trims lamp wicks with bronze shears, frowns as the flame persistently leans east toward the draft."
      },
      {
        id: "steward_guard",
        name: "Steward Guard",
        role: "Purochana's Sentry",
        avatar: "🛡️",
        initialX: 90,
        initialY: 70,
        state: "Guarding Main Portals",
        dialogue: "Not that door, my lord. It sticks. The master has ordered it barred.",
        routineText: "Shifts weight, scarred hand resting on spear shaft, glances up at the gallery whenever Purochana moves."
      },
      {
        id: "kunti",
        name: "Queen Kunti",
        role: "Mother of the Pandavas",
        avatar: "👵🏾",
        initialX: 42,
        initialY: 58,
        state: "Touching Cedar Pillar",
        dialogue: "It is lovely. Why does my chest feel so tight? Listen, my son. The walls are not all the same.",
        routineText: "Touches the cedar column, smells her fingertips, and quietly wipes them on her silk wrap."
      },
      {
        id: "yudhishthira",
        name: "Yudhishthira",
        role: "Eldest Pandava",
        avatar: "👑",
        initialX: 48,
        initialY: 56,
        state: "Examining Ceiling & Lamps",
        dialogue: "Smell the air. Ghee and resin, and nothing is cooking. Say nothing. Smile. Keep your eyes open.",
        routineText: "Slowly looks around the clerestory rafters, notes the leaning flames, and studies the surveyor's plan."
      },
      {
        id: "bhima",
        name: "Bhimasena",
        role: "Second Pandava",
        avatar: "💪🏾",
        initialX: 36,
        initialY: 54,
        state: "Watching Floor Seams",
        dialogue: "A house that smells like a feast with no feast. Let me break that door. Let me find what they hide.",
        routineText: "Arms crossed, nostrils flaring, jaw tight. Clenches fists at the sound of the hollow wall."
      },
      {
        id: "arjuna",
        name: "Arjuna",
        role: "Third Pandava",
        avatar: "🏹",
        initialX: 14,
        initialY: 62,
        state: "Testing Door Bolts",
        dialogue: "The bolts are all outside. Strange for a guest house. We are barred from without.",
        routineText: "Steps to the doorway, gently tests the pivot hinge, peering at the iron bolt set on the exterior frame."
      }
    ],
    hotspots: [
      {
        id: "east_wall",
        title: "East Wall Carved Frieze & Lotus Plate",
        x: 75,
        y: 52,
        icon: "🪷",
        tag: "HOLLOW STRIP & CYLINDER",
        drishtiHint: "Drishti reveals a continuous cold draft billowing between the lotuses. Tapping reveals a hollow vertical strip with an 8-petal rotating brass lotus plate.",
        description: "An intricate cedar frieze of sacred lotuses and elephants. One vertical timber strip is subtly wider than the rest and conceals a rotating brass lotus medallion with eight notches.",
        sensory: "Tapping along the wall transitions from dull wood thud to a deep, resonant hollow ring. A brass arrow groove is etched beside the plate at 135 degrees.",
        hollow: true,
        clue: {
          id: "clue_east_wall_strip",
          title: "East Wall Hollow Strip & Lotus Mechanism",
          type: "SPATIAL EVIDENCE",
          desc: "A concealed four-length hollow cavity behind the lotus frieze, unlatched by aligning the elongated lotus petal with the 135-degree arrow groove."
        }
      },
      {
        id: "plan_table",
        title: "Surveyor's Drafting Table & Knotted Cord",
        x: 48,
        y: 75,
        icon: "📜",
        tag: "ARCHITECTURAL BLUEPRINT",
        drishtiHint: "The blueprint marks 7 doors, but only 5 exist in the hall. Drag the knotted cord from the servant bundle to measure the 4-length gap.",
        description: "An antique teak table with an unrolled floor plan, inkpot, calipers, and a coiled measuring cord with tied knots every unit.",
        sensory: "The drawing specifies 16 cord-lengths for the east hall, whereas pacing the room yields only 12 lengths. Exactly four units are missing.",
        hollow: false,
        clue: {
          id: "clue_door_count_mismatch",
          title: "Door Count Mismatch (Seven Drawn vs. Five Built)",
          type: "SPATIAL EVIDENCE",
          desc: "The surveyor's drafting table proves a 4-length hidden partition exists in the east wing."
        }
      },
      {
        id: "door_latch",
        title: "Chamber Outer Door Latch",
        x: 12,
        y: 60,
        icon: "🔒",
        tag: "ONE-WAY LOCK MECHANISM",
        drishtiHint: "The heavy iron slide-bolt is mounted exclusively on the exterior side of the door, allowing stewards to lock guests inside.",
        description: "A solid cedar portal. Looking past the frame reveals a massive forged iron bolt mounted on the outside face.",
        sensory: "Tracing the bolt reveals no internal release handle. If thrown, the occupants would be hermetically sealed within.",
        hollow: false,
        clue: {
          id: "clue_outside_bolts",
          title: "Outside Iron Bolts",
          type: "TRAP MECHANISM",
          desc: "Every portal can be deadbolted exclusively from the exterior corridor, trapping anyone inside."
        }
      },
      {
        id: "camphor_chest",
        title: "Sandalwood Altar Chest",
        x: 88,
        y: 65,
        icon: "📦",
        tag: "OFFERING CHEST (RED HERRING)",
        drishtiHint: "An open sandalwood chest filled with white camphor cakes and dried aromatics. Emits sweet incense smoke.",
        description: "An ornamental offering box on a stone altar. Inside lie square white camphor blocks intended for evening aarti prayers.",
        sensory: "Sweet, cooling camphor fragrance wafts into the air. Highly volatile, but purely ceremonial.",
        hollow: false,
        clue: {
          id: "clue_camphor_cakes",
          title: "Camphor, burns bright and fast",
          type: "RED HERRING",
          desc: "Ceremonial camphor blocks for temple lamps. While flammable, this is not the secret structural mechanism."
        }
      },
      {
        id: "brazier_oil",
        title: "Brass Brazier & Leaning Flame",
        x: 32,
        y: 68,
        icon: "🔥",
        tag: "THERMAL AIRFLOW",
        drishtiHint: "The lamp flame persistently tilts east toward the hollow wall, pulled by subterranean draft.",
        description: "A wide bronze brazier filled with golden oil. The flame continually flickers and leans eastward.",
        sensory: "The hot vapor smells distinctly of clarified cow ghee cut with crude amber tree resin.",
        hollow: false
      }
    ],
    puzzle: {
      type: "SPATIAL RECONSTRUCTION",
      tag: "LOTUS CYLINDER ALIGNMENT",
      title: "Unseal the East Wall Staircase",
      instruction: "Measure the 4-length discrepancy on the plan table, identify the hollow resonance along the east wall, and rotate the brass lotus plate until the elongated petal aligns with the carved arrow groove (135°).",
      elements: [
        { id: "step_count", name: "Step A: Count Doors", sound: "Seven drawn. Five built." },
        { id: "step_measure", name: "Step B: Measure with Knotted Cord", sound: "16 on plan minus 12 in hall = 4 missing." },
        { id: "step_listen", name: "Step C: Listen for Resonance", sound: "Dull timber thud gives way to deep hollow ring." },
        { id: "step_rotate", name: "Step D: Align Long Petal (135°)", sound: "Brass notches click into lock channel." }
      ],
      correctSelection: "step_rotate",
      solutionNote: "Rotating the 8-petal lotus plate so petal #3 points along the 135° groove triggers the concealed counterweight, sliding the timber panel to reveal the dark stone descent."
    },
    decision: {
      title: "Bhima's Urge to Smash the Cellar Door",
      desc: "Bhima's muscles knot as he hears the hollow chamber breathing cold air: 'Let me break that door. Let me find what they hide.' Yudhishthira counsels patience. How do you respond?",
      options: [
        {
          id: "opt_restrain_bhima",
          title: "Restrain Bhima ('A caught snake bites once; a watched snake bites twice')",
          effect: "Vigilance remains Calm (-10%). Purochana relaxes, unaware his secret flues are discovered. Sets restrainedBhima.",
          suspicionDelta: -10,
          recordedNote: "Yudhishthira restrained Bhima with quiet wisdom. Purochana remains confident in his deception."
        },
        {
          id: "opt_let_bhima_strike",
          title: "Let Bhima Strike the Cellar Door",
          effect: "Bhima kicks the door with thunderous force. Purochana rushes in alarmed, posting permanent guards (+25% Vigilance). Sets breakCellarEarly.",
          suspicionDelta: 25,
          recordedNote: "Bhima battered the cellar timber. Purochana arrived white-faced and posted sentries in the hall."
        }
      ]
    },
    breakthrough: {
      heading: "THE CONCEALED DESCENT UNLOCKED",
      narrative: "✦ CLACK! The brass notches engage. With a deep shudder and a burst of ancient cedar dust, the false wall glides aside. A blast of cold subterranean air pulls the lamp flames toward a flight of damp stone steps descending into the palace foundation.",
      buttonText: "DESCEND THE HIDDEN STAIRWAY"
    }
  },

  {
    id: 3,
    act: "ACT III: SUSPICION & CHEMICAL DANGER",
    themeClass: "theme-act3",
    title: "III. THE STORAGE VAULTS: Flammable Chemistry",
    location: "SUB-LEVEL CHEMICAL STOREHOUSE",
    arrival: {
      sub: "No lamps with naked flames are permitted here; only mica-shielded lanterns glow dimly. The air is thick with a sickeningly sweet, pungent smell that burns the back of the throat.",
      normalAspect: "Neat terracotta jars, bales of untreated wool, barrels labeled as temple ghee.",
      wrongAspect: "The barrels do not contain clarified butter, but petroleum-infused bitumen, shellac resin, and sulfur-steeped jute."
    },
    backgroundActivity: [
      "A storage laborer hastily sealing clay amphoras with moist river mud",
      "Purochana's private scribe checking an inventory list of combustible loads",
      "Rats fleeing the dry eastern corner where resin fumes are strongest"
    ],
    ambientLog: "A dull, low vibration hums through the stone foundations. The smell of volatile turpentine is unmistakable.",
    npcs: [
      {
        id: "arjuna",
        name: "Arjuna",
        role: "Master Archer & Strategist",
        avatar: "🏹",
        initialX: 45,
        initialY: 58,
        state: "Testing Combustibility with Flint Spark",
        dialogue: "Look at this fiber, Brother. A single spark will not merely burn it; it will explode like celestial thunder. This entire floor is packed with thousands of maunds of lac.",
        routineText: "Arjuna collects samples in a cloth pouch for our deduction board."
      },
      {
        id: "laborer",
        name: "Subservient Storeman",
        role: "Purochana's indentured laborer",
        avatar: "👷🏽",
        initialX: 75,
        initialY: 62,
        state: "Trembling · Avoiding Eye Contact",
        dialogue: "I only follow orders, my Lords! The Master commanded these jars be stacked along every interior cavity wall... none near the courtyard wells!",
        routineText: "He nervously wipes his pitch-stained hands against his hemp tunic."
      }
    ],
    hotspots: [
      {
        id: "ghee_jar",
        title: "Tainted Ghee Amphora",
        x: 32,
        y: 65,
        icon: "🏺",
        tag: "COMBUSTIBLE ACCELERANT",
        drishtiHint: "The liquid inside matches the amber blocks packed in cedar from the convoy crate—crude lac mixed with animal fat and ghee accelerant.",
        description: "Tall earthen jars supposedly holding five hundred gallons of sacrificial cow ghee for temple consecration.",
        sensory: "You dip a wooden splint into the jar. An oily film separates instantly, smelling of mineral turpentine.",
        hollow: false,
        clue: {
          id: "clue_crude_oil",
          title: "Adulterated Mineral Oil & Sulfur",
          type: "CHEMICAL CLUE",
          desc: "The butter jars are packed with distilled naphtha and sulfur capable of igniting instantly."
        }
      },
      {
        id: "hemp_matting",
        title: "Resin-Soaked Hemp Walls",
        x: 62,
        y: 45,
        icon: "🌾",
        tag: "INTERIOR INSULATION",
        drishtiHint: "Under Drishti, the weave of the wall mats shines with dark, solidified lac resin droplets.",
        description: "Woven reed and jute mats lining the partition walls under the plaster. They are saturated with pure tree-lac.",
        sensory: "The fibers feel stiff, glossy, and warm. They peel away with a crackling stickiness.",
        hollow: false,
        clue: {
          id: "clue_lac_mats",
          title: "Resin-Saturated Lac Wall Linings",
          type: "MATERIAL CLUE",
          desc: "Every wall partition contains thick layers of lac that will liquefy into flaming napalm when heated."
        }
      },
      {
        id: "builders_manifest",
        title: "Purochana's Secret Manifest",
        x: 82,
        y: 52,
        icon: "📑",
        tag: "ARCHITECTURAL LEDGER",
        drishtiHint: "Written in Purochana's private cipher: 'Delivery completed before the fourteenth night of the dark fortnight.'",
        description: "A parchment ledger recording the exact weights of lac, hemp, ghee, and bitumen delivered from Hastinapura.",
        sensory: "The date of expected 'consecration' matches the upcoming Amavasya (new moon) festival.",
        hollow: false,
        clue: {
          id: "clue_fire_date",
          title: "Target Date: New Moon Night",
          type: "TEMPORAL CLUE",
          desc: "The assassination is scheduled for the dark moonless night when the wind blows hardest toward the river."
        }
      }
    ],
    puzzle: {
      type: "DEDUCTION TABLEAU",
      tag: "CHEMICAL SYNTHESIS",
      title: "Synthesize the Flammability Equation",
      instruction: "Connect the discovered materials on your deduction tableau to prove the fatal nature of the Lakshagriha design.",
      solutionNote: "DEDUCTION COMPLETE: Lakshagriha is an engineered inferno waiting for a single midnight torch."
    },
    decision: {
      title: "What to do with the Storeman?",
      desc: "The frightened storeman knows Purochana's secret. If you bribe him to flee, he may alert Purochana in panic. If you swear him to silence, he may betray you.",
      options: [
        {
          id: "opt_mercy",
          title: "Give Him Gold & Order Him to Escape Across the River",
          effect: "Saves a life. The storeman swears loyalty and leaves a hidden skiff on the river (-5% Suspicion).",
          suspicionDelta: -5,
          recordedNote: "You showed mercy to the laborer; he pledged to tether a small skiff beneath the willow banks."
        },
        {
          id: "opt_detain",
          title: "Confine Him in the Wine Cellar",
          effect: "Guarantees complete silence tonight, but Purochana will soon miss his servant (+20% Vigilance).",
          suspicionDelta: 20,
          recordedNote: "You bound the storeman in the cellar. No word escapes, but his absence will soon be noted."
        }
      ]
    },
    breakthrough: {
      heading: "THE DEDUCTION FORMS: AN INFERNO WAITING",
      narrative: "All doubt evaporates. This house is a bomb of lac, sulfur, and naphtha. To survive, you cannot simply flee out the front gate—Purochana's sentries would cut you down. You must decipher Vidura’s secret riddle to find the underground escape.",
      buttonText: "DECIPHER VIDURA'S SECRET MESSAGE"
    }
  },

  {
    id: 4,
    act: "ACT IV: PARANOIA & THE ENIGMA",
    themeClass: "theme-act4",
    title: "IV. VIDURA'S ENIGMA: The Porcupine's Burrow",
    location: "THE INNER SANCTUM & RETIRED STUDY",
    arrival: {
      sub: "A room of profound silence. Dust motes drift in the beam of a lone earthen lamp. On the cedar desk lies the copper prayer disc handed to Yudhishthira by Vidura’s messenger.",
      normalAspect: "Ancient palm leaf manuscripts, copper prayer vessels, quiet moonlight through the jali screens.",
      wrongAspect: "The copper disc carries no sacred Vedic hymn, but geometric grooves that align with the shadow of the lamp pedestal."
    },
    backgroundActivity: [
      "Purochana pacing in the courtyard below, his shadow stretching across the terrace",
      "Night owls calling from the dry acacia grove",
      "The steady, measured breathing of the Pandava brothers gathered in council"
    ],
    ambientLog: "Temple bells toll from the far bank of the river. The air is still and chill.",
    npcs: [
      {
        id: "yudhishthira",
        name: "Yudhishthira",
        role: "Eldest Pandava & Dharmaraja",
        avatar: "👑",
        initialX: 50,
        initialY: 55,
        state: "Contemplating the Cipher",
        dialogue: "Uncle Vidura spoke in the Mleccha tongue so no spy of Duryodhana could comprehend: 'The consumer of all things shall spare neither grass nor palace. But he who burrows beneath the earth like a porcupine emerges in green meadows.'",
        routineText: "He carefully aligns the disc against the lamp's bronze pedestal."
      }
    ],
    hotspots: [
      {
        id: "copper_disc",
        title: "Vidura's Inscribed Copper Disc",
        x: 48,
        y: 65,
        icon: "🔘",
        tag: "CIPHER KEY",
        drishtiHint: "The concentric circles correspond to the nine flagstones of the central prayer alcove.",
        description: "A disc of beaten copper with 8 directional notches and an engraved porcupine symbol at the center.",
        sensory: "The grooves are deeply etched and blackened with charcoal ink.",
        hollow: false,
        clue: {
          id: "clue_porcupine_burrow",
          title: "The Porcupine Burrow Schematic",
          type: "TUNNEL KEY",
          desc: "Vidura has dispatched a master miner (Khanitra) to excavate an escape tunnel right beneath our floor."
        }
      },
      {
        id: "brass_lamp",
        title: "Adjustable Shadow Lamp",
        x: 62,
        y: 48,
        icon: "🪔",
        tag: "SHADOW PROJECTION",
        drishtiHint: "Rotating the lamp neck casts a shadow that reveals hidden directional arrows on the rug.",
        description: "A heavy brass oil lamp with an adjustable curved shroud that casts a single sharp slit of light.",
        sensory: "The brass is cool to the touch. It pivots smoothly on an oiled swivel pin.",
        hollow: false,
        clue: {
          id: "clue_shadow_direction",
          title: "Shadow Alignment: North-Northwest",
          type: "CIPHER ANGLE",
          desc: "When rotated 135 degrees, the shadow points to the ninth stone behind Kunti's couch."
        }
      }
    ],
    puzzle: {
      type: "LIGHT AND SHADOW",
      tag: "SHADOW ROTATION",
      title: "Align the Lamp to Reveal the Entry Flagstone",
      instruction: "Rotate the oil lamp until its beam passes directly through the porcupine notch on Vidura's disc, projecting the hidden coordinate.",
      targetAngle: 135,
      currentAngle: 45,
      solutionNote: "The beam strikes the ninth flagstone! A subterranean tapping echoes from beneath the floor."
    },
    decision: {
      title: "When to Open Communication with the Miner?",
      desc: "You hear the rhythmic tap of an iron pickaxe beneath the floor. Making contact now risks noise that sentries might detect, but delaying could mean entering the tunnel blind.",
      options: [
        {
          id: "opt_contact_now",
          title: "Tap the Countersign Three Times Immediately",
          effect: "Establishes instant contact with the miner. You learn the full tunnel map (+10% Vigilance).",
          suspicionDelta: 10,
          recordedNote: "You tapped the countersign. A muffled voice whispered: 'Khanitra is here, sent by Vidura.'"
        },
        {
          id: "opt_wait_midnight",
          title: "Wait Until the Midnight Guard Shift",
          effect: "Maintains absolute silence. No risk of alerting the night patrol (-10% Vigilance, but route remains unverified).",
          suspicionDelta: -10,
          recordedNote: "You maintained silence until midnight, taking no risks with the patrolling sentries."
        }
      ]
    },
    breakthrough: {
      heading: "THE EARTH OPENS: KHANITRA'S TUNNEL",
      narrative: "With a soft grinding whisper, the square flagstone depresses into a recessed groove. A rough stone stair leads downward into cool earthen darkness. From below, a calloused hand lifts an oil-soaked rush torch.",
      buttonText: "ENTER THE SUBTERRANEAN PASSAGE"
    }
  },

  {
    id: 5,
    act: "ACT V: PREPARATION & THE UNDERGROUND",
    themeClass: "theme-act5",
    title: "V. THE TUNNEL: Khanitra's Passage",
    location: "SUBTERRANEAN MINING SHAFT",
    arrival: {
      sub: "Beneath the combustible palace lies the cold, damp womb of the earth. The air smells of moist clay, wet shale, and subterranean spring water.",
      normalAspect: "Sturdy sal-timber shoring struts, pickaxe marks in the lime-hardened clay, tallow candles.",
      wrongAspect: "The ceiling vibrates faintly whenever horses gallop on the courtyard above. The shaft is long—nearly half a league to the river."
    },
    backgroundActivity: [
      "Khanitra carefully replacing loose shoring wedges along the low ceiling",
      "Drops of cold mineral water splashing into drainage trenches",
      "Bhima inspecting the tunnel height to ensure Mother Kunti can be carried"
    ],
    ambientLog: "A muffled thud from above marks the closing of the palace courtyard gate. You are safe underground.",
    npcs: [
      {
        id: "khanitra",
        name: "Khanitra the Miner",
        role: "Vidura's Master Sapper",
        avatar: "⛏️",
        initialX: 68,
        initialY: 52,
        state: "Wiping Clay from his Brow",
        dialogue: "Hail, sons of Pandu! Vidura sent me two months ago. Day and night I have dug through this bedrock with my blind mole crew. The passage extends straight past the sentry posts and emerges inside the hollow trunk of a colossal banyan by the Ganga shore!",
        routineText: "He keeps an ear against the shale wall, checking for structural tremors."
      },
      {
        id: "bhima",
        name: "Bhima",
        role: "The Strongest Pandava",
        avatar: "💪🏾",
        initialX: 32,
        initialY: 58,
        state: "Testing the Timber Braces",
        dialogue: "When the flame is lit, Mother and my brothers need not stumble through this mire. I will hoist Mother upon my shoulders and carry Nakula and Sahadeva on my hips. Just give the word!",
        routineText: "He flexes his massive shoulders, ready to break any cave-in with bare hands."
      }
    ],
    hotspots: [
      {
        id: "tunnel_junction",
        title: "Fork in the Subterranean Shaft",
        x: 50,
        y: 45,
        icon: "🔀",
        tag: "ROUTE NAVIGATION",
        drishtiHint: "The left fork is narrow and flooded with silt but reinforced. The right fork is dry, but cut through crumbling shale.",
        description: "A crucial split in the subterranean path. Both passages lead toward the riverbank banyan tree.",
        sensory: "The left tunnel smells of stagnant water; the right tunnel creaks under the weight of above-ground stone.",
        hollow: false,
        clue: {
          id: "clue_tunnel_routes",
          title: "Dual Escape Channels",
          type: "SPATIAL STRATEGY",
          desc: "Left shaft: Safe from collapse, slow speed. Right shaft: Fast transit, high risk of cave-in during inferno."
        }
      },
      {
        id: "air_vent_sub",
        title: "Subterranean Air Siphon",
        x: 80,
        y: 38,
        icon: "🌀",
        tag: "SMOKE PROTECTION",
        drishtiHint: "A clever baffle designed by Khanitra to prevent toxic smoke from the palace above from being sucked into the tunnel.",
        description: "A counter-weighted slate baffle that closes automatically if heavy hot air pushes downward.",
        sensory: "You test the stone slab. It swings shut with airtight precision.",
        hollow: false,
        clue: {
          id: "clue_smoke_baffle",
          title: "Khanitra's Smoke Deflector",
          type: "SURVIVAL GEAR",
          desc: "Closing this baffle before entering prevents smoke asphyxiation when the palace blazes."
        }
      }
    ],
    puzzle: {
      type: "ROUTE PLANNING",
      tag: "SPATIAL LOGIC",
      title: "Select & Fortify the Escape Route",
      instruction: "Assign Bhima and Khanitra to brace the unstable ceiling struts along the primary tunnel corridor.",
      solutionNote: "The corridor is secured! The subterranean artery is ready to evacuate the entire royal family."
    },
    decision: {
      title: "Sacrifice Mechanic: Route vs Supplies",
      desc: "To guarantee speed during a sudden nighttime fire, you must choose what to pre-stage in the tunnel now.",
      options: [
        {
          id: "opt_water_skins",
          title: "Pre-Stage Wet Silk Blankets & Water Jars",
          effect: "Guarantees family immunity to smoke burns during the inferno.",
          suspicionDelta: 0,
          recordedNote: "You staged wet blankets and water skins; the family will be protected against the heat."
        },
        {
          id: "opt_weapons_gold",
          title: "Pre-Stage Arjuna's Bows, Armor & Royal Gold",
          effect: "Preserves your martial power for the wilderness journey, but family must endure unfiltered heat.",
          suspicionDelta: 0,
          recordedNote: "You cached Gandiva bow and weapons; you enter the wild armed as kshatriyas."
        }
      ]
    },
    breakthrough: {
      heading: "THE ESCAPE VEIN IS SECURED",
      narrative: "Khanitra clasps your hands. 'The tunnel is finished, Prince. Now return to the palace above and celebrate your feast. When the dark moon rises tonight, Purochana will kindle his torch... and find an empty grave.'",
      buttonText: "RETURN ABOVE FOR THE FINAL BANQUET"
    }
  },

  {
    id: 6,
    act: "ACT VI: PANIC & THE FINAL BANQUET",
    themeClass: "theme-act6",
    title: "VI. THE LAST NIGHT: The Midnight Feast",
    location: "THE GREAT VERANDA OF LAKSHAGRIHA",
    arrival: {
      sub: "It is the fourteenth night of the dark fortnight—Amavasya. Queen Kunti has hosted a grand almsgiving feast for all citizens and guards. Laughter echoes, wine flows, yet the wind howling through the rafters carries an eerie, restless fury.",
      normalAspect: "Heaping platters of sweet rice, venison, spiced madira wine, guests dancing to drumbeats.",
      wrongAspect: "Purochana has slipped away from the dining tables three times to inspect the torches stacked along the southern portico."
    },
    backgroundActivity: [
      "Palace guards succumbing to heavy wine and slumber on the carpets",
      "Torches burning with an unnatural purple fringe—sulfur has been applied",
      "Kunti whispering to her sons to gather near the prayer alcove"
    ],
    ambientLog: "The wind from the west accelerates to a gale. The dry reeds along the lake whistle.",
    npcs: [
      {
        id: "purochana",
        name: "Purochana",
        role: "Heavily Inebriated yet Clutches his Torch",
        avatar: "👳🏽‍♂️",
        initialX: 75,
        initialY: 48,
        state: "Stumbling · Clutching Flint & Steel",
        dialogue: "A glorious feast, Queen Kunti! Eat... drink deep! Tomorrow at dawn, all your troubles in Hastinapura will be forgotten forever...",
        routineText: "He is on the verge of collapsing into drunken sleep, but keeps his torch within arm's reach."
      },
      {
        id: "kunti",
        name: "Kunti",
        role: "Queen Mother",
        avatar: "👵🏾",
        initialX: 25,
        initialY: 60,
        state: "Serene & Decisive",
        dialogue: "The guards are asleep, my children. The hour of retribution and rebirth has struck. We must strike before he sets fire to our beds.",
        routineText: "She quietly motions Nakula and Sahadeva toward the secret flagstone."
      }
    ],
    hotspots: [
      {
        id: "purochana_couch",
        title: "Purochana's Sleeping Mat",
        x: 72,
        y: 52,
        icon: "🛏️",
        tag: "ENEMY COMMANDER",
        drishtiHint: "Purochana's breathing is heavy and deep. The 3 dark moons counted on Vidura's disc have now passed; tonight is the final night of the dark fortnight.",
        description: "The architect of Lakshagriha lies sprawled on his divan, clutching the iron keys and oil flask.",
        sensory: "He mutters Duryodhana's name in his drunken slumber.",
        hollow: false,
        clue: {
          id: "clue_purochana_incapacitated",
          title: "Purochana in Deep Slumber",
          type: "OPPORTUNITY CLUE",
          desc: "The traitor sleeps in the very lac chamber he designed as your tomb."
        }
      },
      {
        id: "torch_stand",
        title: "Prepared Sulfur Torches",
        x: 88,
        y: 35,
        icon: "🔥",
        tag: "IGNITION POINT",
        drishtiHint: "Drishti shows the wall behind this torch is hollowed out and packed with pure gun-resin.",
        description: "A cluster of five heavy pitch torches, primed to set the entire southern wing alight simultaneously.",
        sensory: "The heat of the smoldering wick is ready to drop into the lac flue.",
        hollow: true,
        clue: {
          id: "clue_ignition_source",
          title: "The Prepared Firebrand",
          type: "CRITICAL TRIGGER",
          desc: "Igniting this point inverts the trap: Lakshagriha will burn from the outside inward, covering your subterranean flight."
        }
      }
    ],
    puzzle: {
      type: "TACTICAL TIMING",
      tag: "STEALTH COORDINATION",
      title: "Coordinate the Pandava Evacuation",
      instruction: "Position each brother at their escape stations before lighting the diversionary flame.",
      solutionNote: "All stations manned! The Pandavas take control of their own fate."
    },
    decision: {
      title: "Who Sets the Flame?",
      desc: "If you wait, Purochana might wake and trap you inside. If you light the house now, you destroy the plot and seal Purochana inside his own evil creation.",
      options: [
        {
          id: "opt_fire_now",
          title: "Kindle the Outer Flue and Plunge into the Tunnel",
          effect: "Total surprise! Purochana is trapped; the world will believe the Pandavas perished in the accident.",
          suspicionDelta: 0,
          recordedNote: "Bhima touched the torch to the southern wall. The lacquer hissed like a thousand vipers."
        },
        {
          id: "opt_drag_purochana",
          title: "Attempt to Capture Purochana Alive for Trial",
          effect: "Moral righteousness, but causes severe delay in the raging heat.",
          suspicionDelta: 50,
          recordedNote: "You attempted to drag Purochana, but the roof beam collapsed, forcing an immediate plunge."
        }
      ]
    },
    breakthrough: {
      heading: "THE ROAR OF THE INFERNO",
      narrative: "A terrifying golden wave erupts across the cedar eaves. Within three heartbeats, the entire palace of lac shrieks with blinding orange fury! Heat washes over you like a furnace blast as Bhima levers the tunnel stone open!",
      buttonText: "SURVIVE THE BURNING PALACE"
    }
  },

  {
    id: 7,
    act: "ACT VII: SURVIVAL & THE INFERNO",
    themeClass: "theme-act5",
    title: "VII. THE INFERNO: Flight Through the Fire",
    location: "THE BURNING MAZE OF LAKSHAGRIHA",
    arrival: {
      sub: "The palace is a vortex of roaring flame! Pitch melts from the ceiling in burning drops like molten rain. Smoke chokes the corridors; timber beams crash down across the gilded hallways!",
      normalAspect: "None. The house is collapsing inward in an apocalyptic storm of heat and ash.",
      wrongAspect: "The intense upward draft is sucking oxygen away from the floor level."
    },
    backgroundActivity: [
      "Massive cedar pillars collapsing into showers of blinding sparks",
      "Molten shellac pooling across the floor like flaming rivers",
      "Bhima smashing through fallen timber to shield Kunti and his brothers"
    ],
    ambientLog: "The thunder of collapsing roofs drowns out every human voice. The air is 400 degrees!",
    npcs: [
      {
        id: "bhima",
        name: "Bhima",
        role: "Titan of the Fire",
        avatar: "💪🏾",
        initialX: 50,
        initialY: 60,
        state: "Carrying Kunti on his Back",
        dialogue: "HOLD FAST TO MY CLOAK! Do not breathe the smoke! Follow my footsteps—the tunnel hatch is twenty paces ahead through the falling colonnade!",
        routineText: "He deflects a burning beam with his bare forearms, shielding the family."
      }
    ],
    hotspots: [
      {
        id: "flaming_debris",
        title: "Collapsed Roof Truss",
        x: 40,
        y: 45,
        icon: "🪵",
        tag: "BLOCKED CORRIDOR",
        drishtiHint: "The wall to the left is thin cedar screen; a single strike will shatter it into the clear escape corridor.",
        description: "A blazing beam of sal wood blocks the main pathway to the prayer alcove.",
        sensory: "Intense searing radiant heat pushes you back.",
        hollow: true,
        clue: {
          id: "clue_screen_breach",
          title: "Flimsy Side Partition",
          type: "EVASION ROUTE",
          desc: "Bypass the main hallway by shattering the ornamental side lattice."
        }
      },
      {
        id: "tunnel_hatch_fire",
        title: "The Subterranean Iron Hatch",
        x: 65,
        y: 70,
        icon: "🕳️",
        tag: "THE SANCTUARY",
        drishtiHint: "Cool drafts still rise from below. The iron handle is searing hot—use cloth to lift it!",
        description: "The stone slab leading down into Khanitra's deep burrow.",
        sensory: "You feel the miraculous cool air of the earth fighting against the roaring flame.",
        hollow: false,
        clue: {
          id: "clue_safe_descent",
          title: "Subterranean Sanctuary Hatch",
          type: "ESCAPE DESTINATION",
          desc: "The only point where fire cannot penetrate. Descend and seal the smoke deflector!"
        }
      }
    ],
    puzzle: {
      type: "LIVE SURVIVAL MAZE",
      tag: "FIRE NAVIGATION",
      title: "Navigate Through the Burning Flues to the Hatch",
      instruction: "Select the correct sequence of corridors using your memory of the palace layout before the fire meter depletes.",
      steps: [
        { prompt: "Ceiling begins to rain molten lac! Where do you turn?", choices: ["North toward Grand Portico (Dead End)", "West toward Drainage Alcove", "East into Kitchen Cellar"], correct: 1 },
        { prompt: "A wall of burning tapestries collapses! How do you clear it?", choices: ["Wait for flames to subside", "Bhima smashes the cedar screen", "Douse with oil jar"], correct: 1 },
        { prompt: "The hatch is reached, but the handle is red-hot!", choices: ["Use wet silk blanket to wrench it open", "Kick it with leather sandals", "Pour remaining wine"], correct: 0 }
      ],
      solutionNote: "HATCH OPENED! The family plunges down as the palace roof collapses in a thunderous roar!"
    },
    decision: {
      title: "The Smoke Deflector: Seal Behind You?",
      desc: "Closing Khanitra's heavy stone baffle will completely cut off air from the surface, sealing the tunnel from toxic fumes forever.",
      options: [
        {
          id: "opt_seal_baffle",
          title: "Slam & Lock the Stone Deflector",
          effect: "Total protection from smoke. The palace burns above as you move swiftly underground.",
          suspicionDelta: 0,
          recordedNote: "Bhima swung the stone slab shut. Above, the earth shook as Lakshagriha fell into white ash."
        },
        {
          id: "opt_leave_chink",
          title: "Leave a Chink to Listen for Pursuers",
          effect: "Risky smoke inhalation, but confirms no sentries survived to pursue.",
          suspicionDelta: 10,
          recordedNote: "You paused a second to listen. Only the roar of flames and collapsing beams answered."
        }
      ]
    },
    breakthrough: {
      heading: "PLUNGED INTO DARKNESS & SAFETY",
      narrative: "Silence drops like a heavy shroud. Above, the monstrous roar of Lakshagriha becomes a distant rumble in the earth. Mother Kunti weeps tears of gratitude in the dim torchlight. You have survived the inferno.",
      buttonText: "EMERGE AT THE SACRED GANGA"
    }
  },

  {
    id: 8,
    act: "ACT VIII: SILENCE & THE GANGA",
    themeClass: "theme-act7",
    title: "VIII. THE GANGA AT MIDNIGHT: The Silent Waterway",
    location: "THE SECRET RIVER EMBANKMENT",
    arrival: {
      sub: "Emerging from the hollow roots of an ancient banyan tree, the cool night air of the sacred Ganga touches your face like a blessing. Silver moonlight paints the rippling black waters. On the distant northern hill, a towering column of orange flame lights the sky.",
      normalAspect: "Crickets chirping in the tall river grass, soft splashing of gentle waves, scent of wet sand.",
      wrongAspect: "A solitary boatman in a broad wooden skiff waits in the reeds, holding an unlit lantern with a porcupine talisman carved on the prow."
    },
    backgroundActivity: [
      "The reflection of the burning palace shimmering on the mid-river currents",
      "Night herons startled by the distant rumble taking flight over the water",
      "The boatman tapping his oar against the hull in a slow, rhythmic cadence"
    ],
    ambientLog: "The river lap is soothing and deep. The smell of smoke is swept away by the southern breeze.",
    npcs: [
      {
        id: "boatman",
        name: "Vidura's Trusty Boatman",
        role: "The River Guide",
        avatar: "🚣🏽‍♂️",
        initialX: 65,
        initialY: 55,
        state: "Scanning the Shoreline",
        dialogue: "Who walks the reeds in the hour of ash? Speak the words spoken only by the friend of the mole and the wind!",
        routineText: "He holds the skiff steady against the swirling eddy with a single pole."
      },
      {
        id: "yudhishthira",
        name: "Yudhishthira",
        role: "Dharmaraja",
        avatar: "👑",
        initialX: 35,
        initialY: 62,
        state: "Preparing the Countersign",
        dialogue: "Be at peace, helmsman. We are those who escaped the weapon that burns without steel.",
        routineText: "He displays the engraved copper disc given in Varanavata."
      }
    ],
    hotspots: [
      {
        id: "boat_prow",
        title: "The River Skiff",
        x: 62,
        y: 58,
        icon: "🛶",
        tag: "ESCAPE VESSEL",
        drishtiHint: "The skiff is fitted with muffled oars wrapped in oily rags to glide through the water without sound.",
        description: "A wide, seaworthy river craft capable of navigating the torrential rapids of the Ganga.",
        sensory: "The damp wood of the boat feels solid and honest beneath your touch.",
        hollow: false,
        clue: {
          id: "clue_boat_prow",
          title: "Muffled River Vessel",
          type: "TRANSPORT EVIDENCE",
          desc: "Sent personally by Vidura with provisions, warm wool coats, and maps of the southern forests."
        }
      },
      {
        id: "burning_horizon",
        title: "The Burning Horizon",
        x: 85,
        y: 25,
        icon: "🔥",
        tag: "LAKSHAGRIHA IN ASHES",
        drishtiHint: "Duryodhana's spies will believe the Pandavas are dead. Your official death is your greatest shield.",
        description: "Looking back across the river, the palace of lac is a mountain of blinding fire. All Hastinapura will mourn you tomorrow.",
        sensory: "The smoke column resembles a towering trident against the stars.",
        hollow: false,
        clue: {
          id: "clue_assumed_death",
          title: "The Illusion of Death",
          type: "STRATEGIC TRUTH",
          desc: "As long as the world believes the Pandavas died in the fire, you are free to gather your true strength."
        }
      }
    ],
    puzzle: {
      type: "AUDIO COUNTERSIGN",
      tag: "TRUST VERIFICATION",
      title: "Exchange the Coded Oar Taps",
      instruction: "Listen to the boatman's rhythmic tapping and match the countersign beat taught by Vidura.",
      pattern: [1, 0, 1, 1],
      solutionNote: "The boatman nods deeply. 'Step aboard, children of Pandu! The great Ganga shall carry you beyond the reach of deceit!'"
    },
    decision: {
      title: "Where to Steer the Skiff?",
      desc: "The boatman can row along the northern bank toward friendly Panchala kingdom, or deep into the perilous southern wilderness of Hidimbavana.",
      options: [
        {
          id: "opt_deep_forest",
          title: "Disembark into the Dark Southern Wilderness",
          effect: "Absolute secrecy. No enemy spy will dream you entered the cannibal forest.",
          suspicionDelta: -100,
          recordedNote: "You directed the prow into the wild southern bank; you enter exile as untamed ghosts."
        },
        {
          id: "opt_panchala_border",
          title: "Skirt the Panchala Border for Supplies",
          effect: "Faster recovery, but increases the chance of royal travelers recognizing Arjuna's bearing.",
          suspicionDelta: 30,
          recordedNote: "You skirted the border; fresh milk was secured, but distant scouts were spotted."
        }
      ]
    },
    breakthrough: {
      heading: "GLIDING ACROSS THE MOONLIT WATERS",
      narrative: "The oars dip into the sacred river without a ripple. The cool spray washes the soot from your brow. Behind you, the funeral pyre prepared for you sinks into the horizon. Ahead, the uncharted wilderness awaits.",
      buttonText: "ENTER THE ANCIENT WILDERNESS"
    }
  },

  {
    id: 9,
    act: "ACT IX: UNCERTAINTY & SURVIVAL",
    themeClass: "theme-act8",
    title: "IX. THE DEEP WILDERNESS: Rebirth in the Forest",
    location: "THE VIRGIN CANOPY OF HIDIMBAVANA",
    arrival: {
      sub: "Giant sal and peepal trees rise into the misty dawn. Vines as thick as python coils drape from the canopy. The Pandavas, soot-stained and weary, gather in a clearing around a small hidden fire.",
      normalAspect: "Dew dripping from giant emerald leaves, dawn birds welcoming the sun, ancient moss-carpeted earth.",
      wrongAspect: "You are now cast outside the royal court forever. No palaces, no servants, no crown—only each other and your Dharma."
    },
    backgroundActivity: [
      "Arjuna testing the string tension of his Gandiva bow in the forest mist",
      "Kunti drinking clean water from an earthen bowl filled by Sahadeva",
      "Bhima standing vigilant as the forest guardian at the clearing perimeter"
    ],
    ambientLog: "The dawn chorus of peacocks echoes through the mist. The trial of Lakshagriha is conquered.",
    npcs: [
      {
        id: "kunti",
        name: "Queen Mother Kunti",
        role: "The Lioness of the Kuru Clan",
        avatar: "👵🏾",
        initialX: 48,
        initialY: 58,
        state: "Hands Extended in Blessing",
        dialogue: "We entered Varanavata as princes marked for slaughter. We emerge into this wild forest as survivors, reborn through wisdom, fortitude, and unity. The fire has burned away our naive trust; from its ashes, an empire of righteousness shall rise.",
        routineText: "She places her hand upon Yudhishthira's head in solemn consecration."
      }
    ],
    hotspots: [
      {
        id: "journal_complete",
        title: "The Completed Folio of Lakshagriha",
        x: 52,
        y: 65,
        icon: "📜",
        tag: "THE HISTORICAL RECORD",
        drishtiHint: "The ink has set permanently into the parchment. The conspiracy of Lakshagriha is immortalized.",
        description: "The complete visual record of your investigation: sketches of the lac pillars, the chemical manifest, the tunnel plans, and the final escape.",
        sensory: "The manuscript carries the faint, heroic scent of cedar smoke and river water.",
        hollow: false,
        clue: {
          id: "clue_full_chronicle",
          title: "The Chronicle of the Great Escape",
          type: "FINAL SAGA DOCUMENT",
          desc: "You have unmasked the treachery of the House of Lac and preserved the future of Bharata."
        }
      }
    ],
    puzzle: {
      type: "EPIC CONSECRATION",
      tag: "THE VOW OF SURVIVAL",
      title: "Bind the Pandava Vow of Unity",
      instruction: "Review the nine discovered truths and seal the sacred vow of rebirth in the wilderness.",
      solutionNote: "THE CHRONICLE IS COMPLETE. You have triumphed over the Chakravyuha of Lakshagriha!"
    },
    decision: {
      title: "The Path Forward into the Epic",
      desc: "How shall the Pandavas conduct themselves during their clandestine exile?",
      options: [
        {
          id: "opt_brahmin_disguise",
          title: "Assume the Guise of Wandering Brahmin Mendicants",
          effect: "The historical path of the Mahabharata. Move unseen through towns, learn Vedic lore, and prepare for the tournament of Draupadi.",
          suspicionDelta: 0,
          recordedNote: "You chose the guise of holy mendicants. Clad in deer-skins, the princes of the earth walked unseen."
        },
        {
          id: "opt_forest_warriors",
          title: "Forge an Army of Wilderness Tribes and Forest Dwellers",
          effect: "Build martial alliances with the Nishadas and Rakshasas of Hidimbavana.",
          suspicionDelta: 0,
          recordedNote: "You embraced the wild; Bhima’s legend began to spread among the guardians of the deep trees."
        }
      ]
    },
    breakthrough: {
      heading: "CHAKRAVYUHA: VICTORY & REBIRTH",
      narrative: "The morning sun breaks over the canopies of Hidimbavana, bathing the Pandavas in golden light. You did not merely solve puzzles; you navigated a living tapestry of betrayal, chemistry, stealth, and sisterhood. You have escaped Lakshagriha!",
      buttonText: "REPLAY & EXPLORE ALL NINE ROOMS"
    }
  }
];

export const ROOM2_PUZZLE_CONFIG = {
  planDoors: 7,
  visibleDoors: 5,
  missingDoors: 2,
  eastRoomHall: 12,
  eastRoomPlan: 16,
  stripGap: 4,
  lotusLongPetalIndex: 3,
  drawnArrowAngle: 135,
  tolerance: 10,
};

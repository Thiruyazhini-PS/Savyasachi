# SAVYASACHI

### Chapter 1: The Escape from Lakshagriha

A story-driven escape-room game set in the Mahabharata's **House of Lac** episode. You play the Pandavas and Kunti through one night of deception, discovery and flight, from the festive gates of Varanavata to the forest across the Ganga.

> **Status:** design and production-spec stage. Room specs are written; build and asset pipelines are in progress. *(Update this line as the project moves.)*

---

## Premise

The Pandavas are invited to Varanavata and housed in a beautiful new palace. It smells faintly of ghee and resin, its lamps all lean one way, and it has fewer doors than its plan promises. Over Chapter 1 the player uncovers the trap, trusts a hidden ally, and turns the trap around.

## Design principles

- **In-world only.** No website modals or side panels. Close-ups are full-screen camera pushes into the object, with depth of field.
- **Fair-play puzzles.** Every puzzle is solvable with sound off and with zero Mahabharata or Sanskrit knowledge. Symbols come with an in-room Rosetta key.
- **No glowing clues.** Hints use camera drift, sound, character barks, or the wind field, never a pulse or outline.
- **Four-tier hints plus Show Me.** Nudge, direction, near-solve, then a scripted walkthrough, logged neutrally as "solved with help."
- **One wind field per room.** Curtains, flames, dust and smoke all follow the same airflow, which doubles as a clue.
- **Spatial audio with captions.** Every tap and rhythm is captioned.
- **Choices with weight.** Each room has a decision that sets knowledge flags and changes later scenes.
- **Accessible.** Reduced-motion support, no flashing, a Low quality preset, and gentler timers on the live sequence.
- **Painted look.** Anime/manhwa illustration, clean line art, Shinkai-style light, layered transparent plates with depth maps.

## Chapter 1 structure

| Room | Title | Primary mechanic |
|---|---|---|
| 1 | Varanavata | Rosetta-key decoding and a 3-dial lock |
| 2 | Lakshagriha | Spatial reconstruction: count the doors, measure the room, listen for the hollow wall |
| 3 | The House Beneath | One cutaway house, five beats: deduction board, sliding-lamp shadow, visual strut bracing, torch-through-gale, live fire escape |
| 4 | The Ganga at Midnight | Rhythmic countersign |
| 5 | The Deep Wilderness | Orienteering and Folio consecration |

Each room runs the same seven layers: Arrival, Visual Story, Investigation, Escape Challenge, Decision, Breakthrough, Cinematic Transition.

## The Folio

The player's journal. It auto-writes entries, draws monochrome ink sketches that build themselves, and stores evidence cards. The floor plan the player maps in Room 2 is saved and reused as the live map in the Room 3 escape. Knowledge flags (for example `houseLayoutMapped`, `knowsHollowFlues`, `knowsExternalLock`) carry across rooms.

## Repository layout

*(Adjust to match your actual structure.)*

```
/docs
  /specs        Per-room production specs
  /art-bible    Style prompts, palettes, character sheets
/assets
  /room01 ... /room05    Layered WebP plates and depth maps
/src            Game engine and room logic
/config         Per-room puzzle data
/tests          Automated puzzle and flag tests
```

## Getting started

*(Fill in once the stack is chosen.)*

```bash
git clone <repo-url>
cd savyasachi
# install dependencies
# run the dev server
```

## Quality checks

Every room is held to the same acceptance tests: a documented solution trace, an automated test that correct input solves and wrong input does not, a fair-play audit, all dialogue in each vigilance variant, screenshots at 1080p and 1366x768, 60 fps on a mid-range laptop, and a style comparison against the approved Varanavata art.

## Source material and content notes

The story follows the Jatugriha Parva episode of the Mahabharata. Section citations are being verified against Ganguli's translation and are not yet printed in the game. Several beats (the nine-seal Folio ritual, the puzzle mechanics) are original to the game, not canon. The scene involving the Nishada family is handled without gore and under content review.

## Contributing

Issues and suggestions are welcome. Please do not overwrite approved assets, and keep new puzzles fair-play and glow-free.

## License

## Credits

Design, art direction and production by Thiruyazhini P.S

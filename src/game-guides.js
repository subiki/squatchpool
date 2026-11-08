// Active house rules reviewed against archived Episodes 1, 3 and 4,
// game controllers/adjudicators and owner-approved Press/Tuna rules.
// Single content source for the homepage and each in-game rulebook.
// Do not link visitors to external manuscripts or removed Rules/Field Notes pages.
export const GAME_GUIDES = Object.freeze({
  "but-wait-theres-more": {
    "intro": "A called-pocket 8-ball game with two hidden balls and a nasty defensive decision before the 8.",
    "sections": [
      {
        "title": "Rack and break",
        "items": [
          "Rack six solids, six stripes and the 8. The 7-ball and 15-ball are held off the table, one from each group.",
          "Place the white cue ball behind the head string (the shaded kitchen), aim and break. You do not call a ball or pocket on the break.",
          "The table remains open after the break. The first legally called ball and pocket made on a later shot assigns solids or stripes."
        ]
      },
      {
        "title": "Taking a turn",
        "items": [
          "After the break, tap the ball you intend to make, then its pocket, then aim and shoot. The called ball must fall in the called pocket to continue shooting.",
          "Once groups are assigned, contact one of your group balls first. Pocket your visible group to work toward the 8.",
          "An uncalled or wrongly pocketed ball stays down, but it does not give you another turn or establish your group. A normal miss passes play."
        ]
      },
      {
        "title": "The surprise ball",
        "items": [
          "When you have cleared your visible group, play pauses before your first 8-ball attempt. Your opponent chooses either still-hidden ball—the 7 or 15—and places it anywhere legal on the felt.",
          "If the returned ball belongs to your group, you must pocket it before shooting the 8. If it belongs to your opponent, it can obstruct you, but you may still shoot the 8 if your own group is clear.",
          "If your opponent later reaches their 8-ball turn, you get to place the remaining hidden ball, if one is still held. Each player's surprise is resolved once."
        ]
      },
      {
        "title": "Fouls and winning",
        "items": [
          "Pocketing the white cue ball, missing all object balls, or contacting the wrong group first is a foul; the opponent receives ball-in-hand.",
          "Call the 8-ball and its exact pocket. You win only when your group is fully cleared, the surprise has been resolved, and the 8 falls legally in that pocket.",
          "An early 8, an 8 on a foul, or an 8 in the wrong pocket loses the rack immediately."
        ]
      }
    ],
    "example": "You are solids and have cleared your six visible solids. Your opponent can place the hidden 7 in front of the 8, forcing you to make the 7 first—or place their own hidden 15 to block your route while leaving you eligible to call the 8.",
    "controls": "For a break, drag the white ball inside the kitchen and press BREAK. On later turns choose ball → pocket → aim → SHOOT. Reverse aim, power and spin are beside or below the table."
  },
  "caroms": {
    "intro": "Play 8-ball backwards: strike a numbered object ball into the white cue ball, using the white as a backboard.",
    "sections": [
      {
        "title": "Set up and break",
        "items": [
          "Rack the object balls as in 8-ball, with the white cue ball near the head position. Break by striking the 1-ball toward the white ball—not by hitting the white with a cue.",
          "Groups are open until a legal post-break pocket assigns solids or stripes. Clear your group and then legally pocket the 8 to win the rack.",
          "The current match is best of three racks (first to two). Breaks alternate in this playable version."
        ]
      },
      {
        "title": "How a legal carom works",
        "items": [
          "Select one of your eligible numbered balls as the striker and aim from that ball. Its first contact must be with the white cue ball.",
          "After that contact, at least one ball must touch a rail. A rail hit before the object ball reaches the white does not satisfy the rule.",
          "The struck object ball—or another object ball reached through its post-contact chain—may drop. The white cue ball cannot be used to knock a different ball into a pocket as an ordinary combo."
        ]
      },
      {
        "title": "Choose your skill level",
        "items": [
          "Beginner: legally pocketed balls count without calling a ball and pocket (slop is allowed).",
          "Intermediate: slop is allowed for group balls, but you must call the 8-ball and its pocket.",
          "Advanced: call the ball and pocket on every non-break shot. Each player may select a different level to balance the match."
        ]
      },
      {
        "title": "Fouls and rack finish",
        "items": [
          "Missing the white cue ball, failing the post-contact rail requirement, or making an illegal white-ball combo is a foul. The incoming player chooses to leave the white where it is or move it to the center between the side pockets.",
          "If the white cue ball itself falls into a pocket, it is returned to the table center.",
          "Pocket the 8 only after clearing your group; make the required call for your level. An 8 on the break is spotted and play continues in this version."
        ]
      }
    ],
    "example": "You strike your 3-ball into the white. After that contact the 3 banks off a rail and drops in the corner: a legal carom. If instead the white rolls into your 4 and pockets it, that is an illegal white-ball combo.",
    "controls": "Choose Strike ball, aim from that numbered ball toward the white, set power, and press SHOOT. When a call is required, choose ball and pocket. The foul-option buttons appear when needed."
  },
  "cutthroat": {
    "intro": "Three players defend three colors. Eliminate the other sets, but scratches can transfer a ball and revive a rival.",
    "sections": [
      {
        "title": "Players, colors and break",
        "items": [
          "Use fifteen object balls: five blue, five yellow and five red. The numbers printed on balls do not matter in this version.",
          "Player 1 breaks from the kitchen. Balls made on the break stay pocketed; no color is assigned just for making a break ball.",
          "After your first legal post-break pocket, choose an available color. You may wait until the end of that turn; after two players choose, the third gets the remaining color."
        ]
      },
      {
        "title": "Turns and elimination",
        "items": [
          "On your turn, shoot at any object ball—an opponent's color or even your own. Each legally pocketed ball lets you keep shooting.",
          "A miss ends your turn. In the current implementation, failing to contact an object ball also ends the turn, without an extra ball-in-hand penalty.",
          "When your color has no balls remaining on the table, you are eliminated and skip turns unless a later scratch claim returns you to play."
        ]
      },
      {
        "title": "The special scratch claim",
        "items": [
          "Pocketing the white cue ball is a scratch. The next active player receives ball-in-hand.",
          "The third player may choose one of the scratcher's remaining on-table balls and claim it as their own, or decline. The ball stays in the same place; only its ownership changes.",
          "The claimant can be a previously eliminated player. Taking ownership of that ball brings them back into the game. Balls already pocketed—even on fouls—are not re-spotted."
        ]
      },
      {
        "title": "How to win",
        "items": [
          "The winner is the last player with at least one ball still belonging to them on the table. There is no special 8-ball finish and no called pocket requirement.",
          "Because you can pocket your own balls, clearing the wrong color may eliminate you. Think about who will remain alive after each shot."
        ]
      }
    ],
    "example": "Blue scratches while two blue balls remain. Yellow gets ball-in-hand; Red (the third player) may claim one of Blue's on-table balls. Even if Red had already been eliminated, that claim puts Red back in the rack.",
    "controls": "Select 1, 2 or 3 local humans (bots fill empty seats). Break, aim from the white and shoot. The color picker appears above the table after your first legal pocket; scratch claims appear in More."
  },
  "press-your-luck": {
    "intro": "Race to a target score across racks. Own balls build your rack award; pressing on opponent balls can grow—or erase—a bonus.",
    "sections": [
      {
        "title": "Rack, groups and calls",
        "items": [
          "Start a normal 8-ball rack, position the white behind the head string, and break. An 8 made on the break is spotted and play continues.",
          "The table is open until the first correctly called post-break group ball assigns solids or stripes. After the break, call both the ball and the pocket.",
          "Pocket your own group first. Your own-group balls count one point each toward this rack's potential award, including group balls you made on the break once your group is known."
        ]
      },
      {
        "title": "Pressing your luck",
        "items": [
          "Once your group is cleared, you can shoot the called 8 immediately or keep shooting opponent balls to press your luck.",
          "Each opponent ball legally pocketed while pressing adds one provisional bonus point. You keep shooting when you make a valid called shot.",
          "A miss on the 8 forfeits your provisional pressing bonus and ends your turn; balls already pocketed stay down. A scratch or other foul also forfeits the bonus and gives the opponent ball-in-hand."
        ]
      },
      {
        "title": "Winning and scoring",
        "items": [
          "A legally called 8 wins the rack and adds two points. The rack winner banks their own-group points, any surviving pressing bonus, and the two points for the 8.",
          "Declare a bank or kick on the 8 before shooting. If the cue ball or the 8 actually hits a rail before the 8 enters the called pocket, the entire current-rack award is doubled—not previous banked racks.",
          "Pocketing the 8 early, on a scratch, or illegally loses the rack. The opponent banks whatever own-ball points and bonus they already earned in that rack, but gets no automatic two points for the 8.",
          "The rack winner breaks next. First player to reach or exceed the selected target score wins the match, even if one rack carries them past the target."
        ]
      },
      {
        "title": "Reading the scoreboard",
        "items": [
          "Banked = points locked from earlier completed racks; these cannot be lost by pressing now.",
          "Own balls = one point per ball of your group made in this rack, awarded if you win.",
          "Press (at risk) = opponent-ball bonus that disappears on a missed 8 or foul. If legal 8 = projected match total including the two-point 8, before any successful bank/kick multiplier."
        ]
      }
    ],
    "example": "You have 6 banked points, pocketed 4 of your own balls this rack, and pressed for 2 opponent balls. A normal called 8 banks 4 + 2 + 2 = 8 more, taking you to 14. A successful declared bank/kick doubles those 8 rack points to 16, taking you to 22.",
    "controls": "After the break, tap a ball and pocket, aim and press SHOOT (Space also shoots while aiming). Set Bank/kick before your called 8 if you want to risk the double; follow Banked, Own, Press and If legal 8 above the table."
  },
  "tuna": {
    "intro": "Two independent ascending ball sequences, three scoring balls, and a 10-ball finish that rewards planning.",
    "sections": [
      {
        "title": "Rack and legal first contact",
        "items": [
          "Rack fifteen balls and break from the kitchen. The two sequences are 1–10 and 11–15; both are active at once.",
          "On every normal shot, your first contact must be the lowest numbered ball still on the table in either sequence. At the start, that means the 1 or the 11.",
          "As balls disappear, each sequence advances independently. For example, after the 1 and 11 are gone, the next legal first-contact targets are the 2 and 12."
        ]
      },
      {
        "title": "Calling and pocketing",
        "items": [
          "Call the ball and pocket after the break. Your first-contact target must be legal, but the ball you call can be a different ball that you pocket through a legal combination.",
          "A correctly called pocketed ball stays down and you keep shooting. Balls pocketed without a matching legal call, or in an illegal shot, are spotted back onto the table.",
          "Contacting neither sequence's lowest available ball first—or scratching the white cue ball—is a foul. The incoming player receives ball-in-hand."
        ]
      },
      {
        "title": "Money balls and the 10",
        "items": [
          "The 15 is worth 1 point, the 9 is worth 2, and the legally winning 10 is worth 3. These are match points, not real money.",
          "You may legally win with the 10 only after the 9 and all balls 11–15 are gone. Other lower solids (1–8) may still be on the table.",
          "If the 10 drops before you are eligible to win, it is spotted. Money-ball points accumulate across racks until you start a new match."
        ]
      },
      {
        "title": "Rack and match flow",
        "items": [
          "The player who legally pockets the winning 10 takes the rack and breaks the next one.",
          "Use the displayed legal targets to choose your first contact. Plan ahead so you can clear the 9 and the high sequence while keeping a route to the 10."
        ]
      }
    ],
    "example": "Suppose the 1 and 11 are down: you can first contact the 2 or 12. Once the 9 and 11–15 are gone, a legal called 10 wins even if the 3, 4 and 5 remain.",
    "controls": "Place the white behind the head string for the break. On later shots, tap the ball to call, then a pocket; aim, set power and SHOOT. The status area shows your current legal first-contact targets and running points."
  }
});

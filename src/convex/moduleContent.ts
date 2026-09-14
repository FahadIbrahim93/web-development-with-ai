/**
 * Module course content. Written for non-technical adults: short sentences,
 * concrete analogies, zero assumed knowledge, and a "you steer, AI types"
 * framing throughout. Each module has 3 sections; each section has a short
 * reading, an activity, and a recap.
 */
export interface LessonSection {
  title: string;
  reading: string[];
  activity: string;
  recap: string;
  /** A hands-on challenge that gates "mark done" — learning by doing. */
  interactive: Interactive;
}

/** Every interactive game type, discriminated by `kind`. */
export type Interactive =
  | { kind: "order"; prompt: string; items: { text: string }[]; solvedText: string }
  | {
      kind: "match";
      prompt: string;
      pairs: { concept: string; analogy: string }[];
      solvedText: string;
    }
  | {
      kind: "pick-best";
      prompt: string;
      options: { text: string; why: string; best?: boolean }[];
      solvedText: string;
    }
  | {
      kind: "grow-site";
      prompt: string;
      candidates: { text: string; keep: boolean; why: string }[];
      solvedText: string;
    }
  | {
      kind: "prompt-builder";
      prompt: string;
      fragments: { text: string; correct: boolean; why: string }[];
      solvedText: string;
    }
  | { kind: "vibe-switcher"; solvedText: string }
  | {
      kind: "checklist";
      prompt: string;
      items: { text: string }[];
      /** Indices that must be selected to pass. */
      mustSelect: number[];
      solvedText: string;
    }
  | {
      kind: "quiz";
      prompt: string;
      options: { label: string; correct?: boolean }[];
      solvedText: string;
    }
  | {
      kind: "spot-the-difference";
      prompt: string;
      badDocument: string;
      fixes: { label: string; text: string; correct: boolean }[];
      solvedText: string;
    };

export interface ModuleContent {
  slug: string;
  intro: string;
  sections: LessonSection[];
}

export const MODULE_CONTENT: ModuleContent[] = [
  {
    slug: "foundations",
    intro:
      "Everything on the internet is a conversation between your browser and a computer far away. By the end of this module you'll understand that conversation — and you'll have directed AI to build your first tiny website.",
    sections: [
      {
        title: "What actually happens when you visit a website",
        reading: [
          "Type an address and press Enter. Three things happen, fast enough to feel like magic.",
          "First, your browser — the app you're reading this in — sends a request across the internet, like a messenger calling out 'anyone home at this address?'",
          "Second, a server answers. A server is just a computer that's always on, always listening, and holds the files that make up the website.",
          "Third, your browser receives those files and paints them on your screen. That's the whole trick. A website is files on someone else's computer, drawn by yours.",
        ],
        activity:
          "Open any website you like. Ask yourself: which part is the messenger (your browser), and which part is the kitchen (the server holding the files)? There's nothing to click — you're training your mental model.",
        recap:
          "Browser = messenger and painter. Server = kitchen holding the files. Website = files served, then painted.",
        interactive: {
          kind: "order",
          prompt: "Put the journey of a website visit in order, from your keypress to a painted page.",
          items: [
            { text: "You type an address and press Enter" },
            { text: "Your browser asks across the internet: 'anyone home at this address?'" },
            { text: "A server answers: 'yes — here are my files'" },
            { text: "Your browser paints the files on your screen" },
          ],
          solvedText: "Exactly. That whole trip usually takes under a second.",
        },
      },
      {
        title: "The three ingredients inside every site",
        reading: [
          "Every website — from a café's homepage to YouTube — is built from the same three ingredients.",
          "HTML is the skeleton: it says 'here is a heading, here is a button, here is a photo.' Without it, a page has no parts to point at.",
          "CSS is the outfit: colors, fonts, spacing, and where everything sits. Same skeleton, different outfit, completely different vibe.",
          "JavaScript is the muscles: it makes the page react. Menus that open, forms that check your typing, buttons that do things.",
        ],
        activity:
          "On any webpage, find one thing that is skeleton (a heading), one thing that is outfit (a color or font choice), and one thing that is muscles (something that reacts when you click or type).",
        recap:
          "HTML = skeleton. CSS = outfit. JavaScript = muscles. Content = the reason people visit at all.",
        interactive: {
          kind: "match",
          prompt: "Match each website ingredient to its everyday job.",
          pairs: [
            { concept: "HTML", analogy: "The skeleton — parts you can point at" },
            { concept: "CSS", analogy: "The outfit — colors and where things sit" },
            { concept: "JavaScript", analogy: "The muscles — things that react to taps" },
            { concept: "Content", analogy: "The reason people visit at all" },
          ],
          solvedText: "Four ingredients, one page. You'll see them everywhere now.",
        },
      },
      {
        title: "Where AI fits in — and where you fit in",
        reading: [
          "Here's the honest truth: AI is now very good at typing HTML, CSS, and JavaScript.",
          "So if AI can type the files, what's left for you? Everything that matters: deciding what the site should say, who it should serve, what it should look like, and judging whether the result is any good.",
          "Think of AI as a very fast assistant who never gets tired of rewriting. You are the director. You describe the scene; it types the script.",
          "The skill this course teaches is direction: describing clearly, reviewing honestly, and giving feedback that actually improves the result.",
        ],
        activity:
          "In the free lesson's builder, generate a café site, then regenerate it with a different vibe. Notice: your words changed the outcome. That's direction — the skill you're here to build.",
        recap:
          "AI types; you direct. Clear description plus honest review equals professional results.",
        interactive: {
          kind: "pick-best",
          prompt: "You need a site for your dog-grooming studio. Which prompt gets the best first draft?",
          options: [
            {
              text: "\"Make me a website.\"",
              why: "No audience, no content, no vibe — the AI has to invent everything, and it will guess wrong.",
            },
            {
              text: "\"A website with HTML, CSS, and JavaScript, responsive, modern.\"",
              why: "Sounds technical, but says nothing about who the site is for or what's on it.",
            },
            {
              text: "\"A one-page site for my dog-grooming studio. Warm and friendly, big photos of dogs, prices for three packages, and a booking button that's always visible.\"",
              why: "Names the audience, the content, the vibe, and the one action that matters. Best first draft, every time.",
              best: true,
            },
          ],
          solvedText: "Audience, content, vibe, one action. That's a prompt worth typing.",
        },
      },
    ],
  },
  {
    slug: "first-site",
    intro:
      "Ideas are cheap; a finished page is priceless. In this module you'll take one idea from a wish list to a polished one-page site, using AI to do the typing and your judgment to do the steering.",
    sections: [
      {
        title: "From wish list to one clear goal",
        reading: [
          "Most first sites fail because they try to be five things at once. Yours will succeed because it does one thing well.",
          "Write this sentence and fill in the blanks: 'My site helps ______ do ______ without ______.'",
          "Example: 'My site helps local dog owners book a grooming visit without phoning around.'",
          "That sentence is your compass. Every decision from here on — text, colors, layout — either serves it or gets cut.",
        ],
        activity:
          "Write your one-sentence goal. If you can't fill in the blanks, that's the real problem to solve first — and a perfect thing to bring to a live session.",
        recap:
          "One site, one job. If everything is important, nothing is.",
        interactive: {
          kind: "pick-best",
          prompt: "Which of these is a complete one-sentence goal for a first site?",
          options: [
            {
              text: "\"A modern website for my business.\"",
              why: "Every site says that. It names no one it helps and nothing it removes.",
            },
            {
              text: "\"My site helps local dog owners book a grooming visit without phoning around.\"",
              why: "Names who it helps, what it does, and the pain it removes. Now every design decision has a judge.",
              best: true,
            },
            {
              text: "\"A beautiful site showcasing everything my business does.\"",
              why: "'Everything' is the trap — five goals means five half-finished ones.",
            },
          ],
          solvedText: "Who, what, without what. Steal that sentence shape for your own site.",
        },
      },
      {
        title: "Structure: the five blocks of a one-page site",
        reading: [
          "Nearly every good one-page site is five blocks in a sensible order.",
          "Block 1, the hero: one sentence saying what you do and for whom, plus one button saying what to do next.",
          "Block 2, proof: why should a stranger believe you? Photos, a short story, real names.",
          "Block 3, the offer: what exactly they get — services, prices, or products — said plainly.",
          "Block 4, how it works: three steps, no jargon. Block 5, contact: one obvious way to reach you, repeated at the bottom.",
        ],
        activity:
          "Sketch five rectangles on paper and label them hero, proof, offer, how-it-works, contact. Write a one-line draft inside each. Paper first, pixels later — it's faster.",
        recap:
          "Hero, proof, offer, how-it-works, contact. Five blocks, in that order, done honestly.",
        interactive: {
          kind: "order",
          prompt: "A stranger just landed on your one-page site. Put the five blocks in the order they should meet them.",
          items: [
            { text: "Hero: one sentence saying what you do and for whom" },
            { text: "Proof: why a stranger should believe you" },
            { text: "Offer: exactly what they get, said plainly" },
            { text: "How it works: three steps, no jargon" },
            { text: "Contact: one obvious way to reach you" },
          ],
          solvedText: "Five blocks, in that order — you just designed a one-page site.",
        },
      },
      {
        title: "Directing AI to build it, then iterating",
        reading: [
          "Now hand your sketch and your one-sentence goal to AI. The quality of what comes back tracks the quality of what you put in.",
          "A weak prompt: 'make me a website.' A strong prompt: 'a one-page site for a dog grooming studio. Warm and friendly, big photos of dogs, prices for three packages, a booking button that's always visible.'",
          "When the result isn't right, don't start over — give feedback like you would to a person: 'the green feels wrong, try a warm cream; the booking button should be brighter than everything else.'",
          "Two or three rounds of clear feedback gets most first sites 90% of the way there. Judging 'is this good yet?' is your job; typing is not.",
        ],
        activity:
          "Generate your one-page site from your sketch. Give at least two rounds of specific feedback, and keep a note of which changes improved it most — that's your taste developing.",
        recap:
          "Strong prompts name the audience, the vibe, and the content. Feedback beats starting over.",
        interactive: {
          kind: "prompt-builder",
          prompt: "Assemble the strongest prompt from these fragments. Order matters.",
          fragments: [
            { text: "\"make me a website\"", correct: false, why: "That's the weak prompt — cut it." },
            { text: "A one-page site for a home bakery", correct: true, why: "Names the project first." },
            { text: "for neighbors who order weekly bread", correct: true, why: "Then the audience." },
            { text: "with warm colors and big photos of the loaves", correct: true, why: "Then the vibe and content." },
            { text: "responsive and modern and clean", correct: false, why: "Buzzwords the AI already does by default — no information." },
            { text: "with an order button that's always visible", correct: true, why: "And finally, the one action that matters." },
          ],
          solvedText: "Project, audience, vibe, one action — assembled like a pro.",
        },
      },
    ],
  },
  {
    slug: "content-that-converts",
    intro:
      "A site is only as good as what's on it. This module is about words and pictures that make a small site feel professional — with AI as your drafting partner and you as the editor-in-chief.",
    sections: [
      {
        title: "Headlines that answer 'what is this?'",
        reading: [
          "Visitors decide in seconds whether a site is for them. Your headline does that job.",
          "The reliable formula: say what you do, for whom, in plain words. 'Fresh bread, baked every morning in Maplewood' beats 'Artisanal excellence redefined.'",
          "Clever is risky; clear is professional. If a stranger can't repeat your headline after hearing it once, it's too clever.",
          "AI is a superb headline machine — give it your one-sentence goal and ask for ten options, then pick the one a customer would actually say out loud.",
        ],
        activity:
          "Ask AI for ten headline options for your site. Read them aloud. Keep the two that sound like something a real person would say, and sleep on the final choice.",
        recap:
          "Clear beats clever. If they can't repeat it, replace it.",
        interactive: {
          kind: "pick-best",
          prompt: "A customer can only hear your headline once. Which one survives?",
          options: [
            { text: "\"Artisanal excellence, redefined.\"", why: "Sounds like a poster, says nothing. Nobody can repeat it.", },
            { text: "\"Fresh bread, baked every morning in Maplewood.\"", why: "What, when, where — a stranger could repeat it after hearing it once.", best: true },
            { text: "\"Where passion meets flour.\"", why: "Poetic but empty. What do you actually sell?", },
          ],
          solvedText: "Say what you do, for whom, in plain words. Clear is professional.",
        },
      },
      {
        title: "An about page people actually read",
        reading: [
          "People visit your about page to answer one question: 'can I trust these people?'",
          "So lead with the human, not the history. 'I started baking for my neighbors' builds trust faster than 'Founded in 2019.'",
          "Keep it to three short beats: who you are, what you make, what it's like to work with you.",
          "Let AI draft it from a few voice-memo sentences about yourself — then edit ruthlessly until it sounds like you on a good day, not a brochure.",
        ],
        activity:
          "Record two minutes of yourself answering 'why do you do this?' Transcribe, feed it to AI, and ask for a 120-word about page in your voice. Cut every sentence that isn't truly yours.",
        recap:
          "About pages are trust documents. Human first, history later, short always.",
        interactive: {
          kind: "spot-the-difference",
          prompt: "Here's a first draft of an about page, as a stranger would read it. Flag the fixes that would actually improve it.",
          badDocument:
            "Welcome to our website!\n\nFounded in 2019, we are a leading provider of quality solutions.\nWe have always been passionate about excellence, and our mission\nis to leverage synergies across every customer journey.\n\nContact us today!",
          fixes: [
            {
              label: "Swap the company-first opener for a human one",
              text: "'I started baking for my neighbors' builds trust faster than 'Founded in 2019.' Human first, history later.",
              correct: true,
            },
            {
              label: "Cut the buzzwords ('quality solutions', 'leverage synergies')",
              text: "Nobody talks like that. Say plainly what you make and for whom.",
              correct: true,
            },
            {
              label: "Move 'Founded in 2019' to the very first line",
              text: "No — leading with history is the draft's core mistake. The human hook goes first.",
              correct: false,
            },
            {
              label: "Say what you actually make, with one specific detail",
              text: "'Fresh bread, baked every morning in Maplewood' beats 'quality solutions' every time.",
              correct: true,
            },
            {
              label: "Add more impressive words like 'excellence' to sound professional",
              text: "Adjectives are not evidence. Specifics are what read as professional.",
              correct: false,
            },
            {
              label: "Make the ending a real next step",
              text: "'You'll hear from me within one business day' beats a bare 'Contact us today!'",
              correct: true,
            },
          ],
          solvedText:
            "Human first, plain words, one specific detail, explicit next step. That's an about page people finish.",
        },
      },
      {
        title: "Choosing images like a designer",
        reading: [
          "Photos are the fastest way to look professional — or amateur.",
          "The rule: real beats stock. A slightly imperfect photo of your actual shop builds more trust than a glossy image of a stranger's smile.",
          "Consistency is what reads as 'designed': similar lighting, similar cropping, similar warmth across all your images.",
          "AI can help you plan the shot list ('what six photos should a bakery site have?') and, if you have no photos at all, suggest tasteful placeholders until you can shoot the real thing.",
        ],
        activity:
          "Write a six-photo shot list for your site: what each photo shows and where it sits. Shoot or collect one of them this week — real beats perfect.",
        recap:
          "Real over stock. Consistent over varied. A shot list is half the work.",
        interactive: {
          kind: "vibe-switcher",
          solvedText:
            "Same site, three feelings. Style isn't decoration — it's the first thing visitors read. Pick one vibe and stay consistent.",
        },
      },
    ],
  },
  {
    slug: "going-live",
    intro:
      "A site on your laptop helps nobody. This module walks you through publishing — getting a real address on the internet — and the small checks that make a big difference on launch day.",
    sections: [
      {
        title: "Getting an address: domains, demystified",
        reading: [
          "A domain is your site's address — yourbusiness.com. You rent it yearly from a registrar, usually for the price of a few coffees.",
          "Choose the shortest name people can spell after hearing it once. .com if you can get it; your country's ending is also fine.",
          "You do not need email hosting or add-ons at checkout. Decline the upsells; you can add them later if you ever need them.",
          "Pointing the domain at your published site is one setting, and AI can walk you through it for your specific registrar step by step.",
        ],
        activity:
          "Shortlist three domain names and check availability. Say each out loud — if you'd have to spell it over the phone, drop it.",
        recap:
          "Domains are rented addresses. Short and spellable beats clever every time.",
        interactive: {
          kind: "pick-best",
          prompt: "A friend says her cake business is 'Cakes by Anastasia-Marie-Confections'. Which domain should she grab?",
          options: [
            { text: "cakesbyanastasia-marie-confections.com", why: "Accurate but unsayable — she'd be spelling it on the phone forever.", },
            { text: "anastasiascakes.com", why: "Short, spellable after hearing once, says exactly what it is.", best: true },
            { text: "the-very-best-cakes-in-town-2026.com", why: "Nobody says that out loud, and it ages badly.", },
          ],
          solvedText: "Short, spellable, yours. Domain hunting done right.",
        },
      },
      {
        title: "Publishing your site",
        reading: [
          "Publishing means copying your finished site files onto a server so the world can see them. Modern tools make this a few clicks, not a computer-science degree.",
          "Your AI assistant can publish for you when you ask — the files are already made; this is delivery, not construction.",
          "After publishing, open your site in a private/incognito window. What you see cached on your own machine can differ from what strangers see.",
          "Expect to feel a small drop of 'oh, it's real now.' That feeling is correct. It gets easier by site number three.",
        ],
        activity:
          "Publish your one-page site (or rehearse the steps with AI if you're not ready). Verify it loads in a private window on your actual address.",
        recap:
          "Publishing is delivery, not construction. Always verify in a private window.",
        interactive: {
          kind: "quiz",
          prompt: "You just published your site. Why check it in a private/incognito window?",
          options: [
            { label: "Private windows are faster" },
            { label: "Your own browser may show a cached, outdated version of the page", correct: true },
            { label: "It hides your site from competitors" },
            { label: "Private windows have better colors" },
          ],
          solvedText: "Right — you see what strangers see, not what your cache kept.",
        },
      },
      {
        title: "The launch-day checks that matter",
        reading: [
          "Four checks catch 95% of launch problems, and all take a minute each.",
          "Phone check: open your site on your actual phone. Most of your visitors will be here. Text should be readable without pinching.",
          "Link check: click every link. A dead link on launch day is a leaky boat.",
          "Speed check: does it feel instant on mobile data? Huge images are the usual culprit — ask AI to compress them.",
          "Contact check: submit your own contact form or click your own booking button. If it doesn't reach you, fix it before announcing anything.",
        ],
        activity:
          "Run all four checks on your site and note anything that failed. Bring failures to a live session — they're usually five-minute fixes.",
        recap:
          "Phone, links, speed, contact. Four minutes, most of the safety.",
        interactive: {
          kind: "checklist",
          prompt: "Launch day. Tap every check you must run before announcing your site (all four are required).",
          items: [
            { text: "Open the site on your actual phone" },
            { text: "Click every link on the page" },
            { text: "Feel the speed on mobile data" },
            { text: "Submit your own contact form / booking button" },
            { text: "Email the site to ten friends for opinions" },
            { text: "Change the colors one more time" },
          ],
          mustSelect: [0, 1, 2, 3],
          solvedText: "All four. That minute each is your safety net — announce away.",
        },
      },
    ],
  },
  {
    slug: "site-that-sells",
    intro:
      "Whether you sell products, services, or your own skills, this module shapes your site around one thing: helping the right visitor take the next step without friction or pressure.",
    sections: [
      {
        title: "One page, one job: the offer",
        reading: [
          "Selling starts with a clear offer: who it's for, what they get, what it costs, and what to do next.",
          "The pattern that works: 'For [who]: [what they get], for [price]. [Next step].' If any part is missing, visitors stall.",
          "Vagueness is the enemy — 'quality service at fair prices' says nothing. 'Two hours of garden cleanup, $80, booked online' says everything.",
          "You don't need pressure tactics. Clarity is the whole trick: a person who understands your offer can decide; a person who can't, leaves.",
        ],
        activity:
          "Write your offer in the pattern above. Then ask AI to play a skeptical customer and poke holes in it. Revise until the holes are gone.",
        recap:
          "Who, what, price, next step. Clear offers sell; vague ones apologize.",
        interactive: {
          kind: "pick-best",
          prompt: "Which offer sentence would you actually book?",
          options: [
            { text: "\"Quality gardening services at fair prices. Contact us today!\"", why: "Says nothing a competitor couldn't say. No service, no price, no next step.", },
            { text: "\"For busy Maplewood homeowners: two hours of garden cleanup, $80, booked online in two minutes.\"", why: "Who, what, price, next step — a person can decide, so they do.", best: true },
            { text: "\"Transform your outdoor space into paradise. Limited spots!\"", why: "Pressure with no information. Clarity converts; urgency doesn't.", },
          ],
          solvedText: "Who, what, price, next step. That's the whole formula.",
        },
      },
      {
        title: "Contact forms and booking that people finish",
        reading: [
          "Every field you add to a form loses people. Name, contact, message — that's usually enough.",
          "A booking button that leads to a live calendar converts better than 'email us and we'll get back to you.' This course has one built in.",
          "Tell people what happens after they submit: 'You'll hear from me within one business day.' Uncertainty kills completions.",
          "Test your own flow on your phone, standing in line somewhere. If it annoys you slightly, it's losing you customers.",
        ],
        activity:
          "Audit your contact or booking flow: count the fields, check the mobile experience, and add one sentence telling people what happens next.",
        recap:
          "Fewer fields, real calendars, explicit next steps. Friction is the enemy.",
        interactive: {
          kind: "grow-site",
          prompt: "Design a contact form people actually finish. Keep what's needed, cut the friction.",
          candidates: [
            { text: "Name field", keep: true, why: "You need something to call them." },
            { text: "One way to reply — email or phone", keep: true, why: "Without it, the form goes nowhere." },
            { text: "Message box (optional)", keep: true, why: "Optional means fewer people bounce." },
            { text: "Required company name", keep: false, why: "A neighbor booking garden help doesn't have a 'company'." },
            { text: "Required phone AND email AND address", keep: false, why: "Every required field loses people. Ask for one way to reply." },
            { text: "A sentence: 'You'll hear from me within one business day'", keep: true, why: "Explicit next steps keep completions high." },
          ],
          solvedText: "Fewer fields, one reply route, explicit next step. Friction lost.",
        },
      },
      {
        title: "Honest persuasion: proof over hype",
        reading: [
          "Small sites win on trust, not volume. Proof is how you build it.",
          "The most powerful sentence on a service site is a real customer quote with a real name. One of those beats a wall of adjectives.",
          "Show, don't claim: instead of 'fast and reliable,' try 'booked yesterday, cleaned today.' Specifics are believable.",
          "Never invent testimonials — it's the one shortcut that poisons everything else. Ask two past customers for a sentence; that's all you need to start.",
        ],
        activity:
          "Message two past customers and ask for one honest sentence about their experience. Put the best one, with their name, near your offer.",
        recap:
          "Proof beats hype. One real quote outweighs ten adjectives.",
        interactive: {
          kind: "pick-best",
          prompt: "One testimonial slot on your gardening site. Which quote goes in?",
          options: [
            { text: "\"Amazing service!!! 10/10!!!\"", why: "Anonymous enthusiasm reads as invented. No name, no specifics, no trust.", },
            { text: "\"They turned my jungle into a garden in one afternoon. — Priya, Maplewood\"", why: "Specific result, real name, real place. Believable in one line.", best: true },
            { text: "\"Fast, reliable, professional, and efficient.\"", why: "Four adjectives, zero evidence. Exactly what hype looks like.", },
          ],
          solvedText: "One specific, named quote outweighs a wall of adjectives.",
        },
      },
    ],
  },
  {
    slug: "maintenance",
    intro:
      "Websites aren't one-and-done. This module gives you a small monthly routine that keeps your site healthy for years — and shows how AI can take most of the chores off your plate.",
    sections: [
      {
        title: "The 30-minute monthly routine",
        reading: [
          "Once a month, sit down with your site for thirty minutes. Same time each month works best — first Monday, say.",
          "Minutes 0–10: click through every page and link. Fix anything dead or embarrassing.",
          "Minutes 10–20: update one thing that's stale — an old price, a dated photo, a past event still on the calendar.",
          "Minutes 20–30: glance at your visitor numbers. One question matters: is anyone actually arriving, and from where?",
          "That's it. Small, boring, unbeatable. Sites that get neglected don't die dramatically; they just quietly embarrass their owners.",
        ],
        activity:
          "Put a recurring 30-minute appointment in your calendar right now, titled 'site maintenance.' Future-you will be grateful.",
        recap:
          "Thirty minutes a month: click, update, glance at numbers. Boring beats broken.",
        interactive: {
          kind: "order",
          prompt: "Your 30-minute monthly maintenance session. Order the routine.",
          items: [
            { text: "Minutes 0–10: click through every page and link" },
            { text: "Minutes 10–20: update one stale thing — a price, a photo, an old event" },
            { text: "Minutes 20–30: glance at visitor numbers — anyone arriving, and from where?" },
          ],
          solvedText: "Click, update, glance. Boring, unbeatable, done.",
        },
      },
      {
        title: "Reading your visitors (just enough)",
        reading: [
          "You need exactly three numbers: how many people visited, which page they landed on, and which page they left from.",
          "More visitors arriving on your offer page than your home page? Good — that usually means word is spreading.",
          "Lots of traffic but no bookings or messages? The problem is clarity, not traffic. Revisit the offer module.",
          "AI can help you set up simple, privacy-respecting analytics and translate the numbers into plain English once a month.",
        ],
        activity:
          "Ask AI to recommend a simple analytics setup for your site, install it with its help, and note this month's three numbers somewhere you'll see them.",
        recap:
          "Three numbers: arrived, landed, left. Traffic without clarity is a crowded empty restaurant.",
        interactive: {
          kind: "pick-best",
          prompt: "Your stats: 900 visits this month, 12 contact-form submissions. What's the diagnosis?",
          options: [
            { text: "You need more visitors — run ads immediately", why: "Traffic isn't the problem; 900 visits produced 12 interested people, so the page isn't converting them.", },
            { text: "Your site is fine — 12 is a good number", why: "1.3% is thin for a local service. There's money being left on the table.", },
            { text: "A clarity problem — visitors arrive but the offer doesn't give them a next step", why: "Traffic without clarity is a crowded empty restaurant. Fix the offer, not the ads.", best: true },
          ],
          solvedText: "Diagnose before you prescribe. Clarity first, traffic second.",
        },
      },
      {
        title: "Growing without breaking",
        reading: [
          "When your site starts working, you'll want to add: new pages, a shop, a blog, a newsletter. Restraint is a skill.",
          "Add the thing your customers actually ask for — not the thing that seems impressive. Requests are evidence; hunches are guesses.",
          "Every addition needs a home: new pages belong in your navigation only if a stranger could guess what they'd find there.",
          "And keep a simple backup habit: ask AI to help you snapshot your site before big changes, so 'undo' is always one step away.",
        ],
        activity:
          "Write down the one addition your customers have actually asked for. Park everything else on a 'someday' list — it will still be there next month.",
        recap:
          "Growth follows evidence. Evidence lives in customer requests, not hunches.",
        interactive: {
          kind: "grow-site",
          prompt: "Your bakery site is working. Customers keep asking for one thing. Keep the evidence-backed addition, cut the hunches.",
          candidates: [
            { text: "A simple order form — three customers asked for it this month", keep: true, why: "Requests are evidence. Build what's asked for." },
            { text: "A blog about sourdough philosophy", keep: false, why: "A hunch, not a request. Park it on the someday list." },
            { text: "A fancy 3D spinning croissant animation", keep: false, why: "Impressive to you, distracting to them." },
            { text: "Photos of this week's actual menu", keep: true, why: "Customers ask 'what's in the shop?' daily — this answers it." },
          ],
          solvedText: "Requests are evidence; hunches are guesses. You just ran product development.",
        },
      },
    ],
  },
];

export function getContentFor(slug: string): ModuleContent | undefined {
  return MODULE_CONTENT.find((m) => m.slug === slug);
}

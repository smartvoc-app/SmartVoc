/* English help texts. Kept apart from the machinery because prose cannot be
 * translated sentence by sentence: German and English build their sentences
 * differently, and the emphasis sits in other places. Two complete versions,
 * not one word list. Mirrors help.de.tsx chapter for chapter. */
import type { Kapitel, Tipp } from "./help.types";
import { KritzelStart, KritzelAbstaende, KritzelBereiche, KritzelKarte,
         KritzelEndspurt, KritzelListe, KritzelLeiste,
         KritzelVergessen, KritzelFenster, KritzelTesteffekt } from "../ui/Kritzel";

export const TIPPS_EN: Tipp[] = [
  { h: "A little every day beats a lot now and then",
    b: "Ten to fifteen minutes a day does more than an hour at the weekend. In the gaps between sessions your brain does the rest by itself." },
  { h: "Think first, then turn the card over",
    b: "Actually type your answer before you look at the solution. That effort of remembering is what makes a word stick, not looking at it again." },
  { h: "A word needs many encounters",
    b: "Almost nobody knows a word after seeing it once. Meeting the same word again over several days is normal, and exactly how it should be." },
  { h: "Make friends with your mistakes",
    b: "The words you got wrong are the valuable ones. In Statistics, “Stubborn” collects exactly those for focused practice." },
  { h: "Few new words, properly learnt",
    b: "Eight to twelve new words a day is plenty. Better to really know a few than to half-know fifty." },
  { h: "Mix your words up",
    b: "Practise in a jumble rather than one list straight through. It feels harder and trains your memory noticeably better." },
  { h: "Say the word under your breath",
    b: "Read the word and mouth it silently as you go. The more senses join in, the better it sticks." },
  { h: "Learn the word in context",
    b: "Put a new word into a small sentence or a picture in your head. “The dog barks” is easier to remember than “dog” on its own." },
  { h: "Practise both directions",
    b: "First English to German, then German to English. You only really know a word once it works both ways." },
  { h: "Sleep finishes the job",
    b: "What you practise in the evening settles overnight. A short review before bed often works particularly well." },
];

export const ANLEITUNG_EN: Kapitel[] = [
  {
    titel: "Start right away",
    text: (
      <>
        <p>There is nothing to set up. For every language you have switched on, a hundred words are ready. Tap <b>Practise</b> at the bottom, pick a list, and the first card is there.</p>
        <KritzelStart titel="From the page in your exercise book to the first card" />
        <p>Your own words come in whenever you need them. It takes under two minutes:</p>
        <ol>
          <li>Under <b>Word lists</b> tap <b>+ New list</b>, then <b>Paste a list</b>. The app gives you a ready-made instruction to copy. Paste it into your AI app and attach a photo of the page from your exercise book; copy what comes back into the app, example sentences and phonetics included.</li>
          <li>If you have a date coming up, give the list a <b>target date</b>: the day the words have to be solid. It also works without one.</li>
          <li>Back to <b>Practise</b>, pick the new list, go.</li>
        </ol>
        <p>From now on the app decides which word comes back when. The next chapter says why.</p>
      </>
    ),
  },
  {
    titel: "What SmartVoc does differently",
    text: (
      <>
        <p>Most vocabulary programs let you work through a list until you know it. SmartVoc keeps a record for every single word: how long it lasts with you, how hard you find it, and when you are about to forget it. That is exactly when it comes back.</p>
        <KritzelAbstaende titel="Every correct answer pushes the word further out" />
        <p>That has two consequences that surprise people at first. Words that are solid disappear from the queue for weeks, so they cost you no time at all. And words you hesitated over are back tomorrow. Both are the reason why ten minutes a day does more than an hour on Saturday.</p>
        <p>You cannot overrule this planning. What you do control: which words come in, how many per day, and how strictly the app marks your answers. That is further down under <b>Settings worth changing</b>. How the maths works is in the chapter <b>Behind it</b>.</p>
      </>
    ),
  },
  {
    titel: "SmartVoc at a glance",
    text: (
      <>
        <p>Four areas sit side by side at the bottom. Each answers a different question.</p>
        <KritzelBereiche titel="Four areas, four questions" />
        <ul>
          <li><b>Practise</b>: what should I do now? This is where the learning happens.</li>
          <li><b>Practice plan</b>: will I be ready in time? Your dates and where you stand.</li>
          <li><b>Word lists</b>: where do my words come from? Creating, filling, managing.</li>
          <li><b>Statistics</b>: where do I stand? What is solid, what is wobbly, and whether it is moving.</li>
        </ul>
        <p>Two buttons sit at the top right. The cog holds the <b>Settings</b>, the question mark this guide, the <b>Study tips</b> and the chapter <b>Behind it</b>.</p>
        <p><b>The colours do not mean the same thing everywhere.</b> SmartVoc uses colour in two places, and the two scales measure different things. Confusing them means misreading the app.</p>
        <p>The <b>five levels</b> apply to a single word. The bar reads from left to right:</p>
        <ul>
          <li><b>solid</b>: lasts longer than two weeks and only rarely comes back.</li>
          <li><b>nearly</b>: lasts up to two weeks. Written out, the level is <b>nearly solid</b>.</li>
          <li><b>wobbly</b>: lasts less than three days. Written out, <b>still wobbly</b>.</li>
          <li><b>new</b>: practised only once or twice.</li>
          <li><b>unpractised</b>: never asked yet.</li>
        </ul>
        <p>You will find this bar in the same form everywhere: under the card, on every list and in Statistics. Tapping an entry in the legend opens the words behind it.</p>
        <p>The <b>traffic light</b> applies to a whole list. It counts how many of the list's words have reached <b>solid</b> or <b>nearly solid</b>: from 95 per cent the list counts as <b>ready</b>, from 70 per cent as <b>on track</b>, below that as <b>behind</b>. You can move the thresholds.</p>
      </>
    ),
  },
  {
    titel: "The «Practise» area",
    text: (
      <>
        <p>In the row above the card you choose what gets asked: the language, the direction, and one or several of your word lists, or one of the four <b>Smart lists</b> the app puts together itself. The selection may mix languages.</p>
        <KritzelKarte titel="Question on the front, solution on the back" />
        <p>Four <b>answer types</b> are available under the card. You can switch mid-session:</p>
        <ul>
          <li><b>Typing</b>: you write the answer yourself. The most demanding, and the most effective. When in doubt, this one.</li>
          <li><b>Multiple choice</b>: you pick from several options. Easier, good at the start or when you are tired.</li>
          <li><b>Self-check</b>: you think, turn the card over and judge yourself. Best to write the answer down first.</li>
          <li><b>Browse only</b>: for skimming a list. Counts for nothing, neither progress nor statistics.</li>
        </ul>
        <p>The <b>direction</b> can be switched just as freely: foreign language to German, the other way round, or mixed. Change both regularly, otherwise your memory learns the pattern instead of the word.</p>
        <p><b>There is a bar above and below the card.</b> They measure different things. Above the card is the <b>round progress</b>: how much of this round is done. Every word needs a certain number of correct answers for that. A mistake resets its counter, and the bar drops back a little.</p>
        <p>Below the card is your <b>progress</b>: how the words in this selection spread across the five levels. The round progress starts fresh every round, your progress moves over weeks. In browse mode both are missing, because that mode changes nothing.</p>
        <p><b>How your answer is marked.</b> When you type, the app compares your answer with the solution and reaches one of three verdicts: <b>right</b>, <b>nearly right</b> or <b>wrong</b>. Nearly right is not politeness, it counts differently from wrong. In Statistics, right and nearly right are counted together as <b>hits</b>.</p>
        <ul>
          <li>Typing slips are recognised as long as the answer is close enough to the solution. Depending on how close, they count as nearly right.</li>
          <li>Accents and umlauts are treated leniently by default. Set to strict, “grun” instead of “grün” counts as a mistake.</li>
          <li>The article counts half by default. You can make it optional or require it in full. If it does not count, it is not shown on the card at all; the gender is shown instead.</li>
          <li>Capitalisation counts by default. <b>ss</b> and <b>ß</b> always count as the same.</li>
        </ul>
        <p>After each answer the app shows which characters were missing, surplus or different. If a verdict annoys you, the lever is in the settings under <b>Answer checking</b>.</p>
        <p><b>When a round is over.</b> Every word in the selection has a goal for this round: a number of correct answers it needs. A wobbly word needs three, a new one two, a nearly solid or due one needs one. Once all goals are met, the round is done. That is why you see more cards than words, and why a mistake costs something: it resets that word's counter.</p>
        <p>Two numbers limit how big a round gets in the first place:</p>
        <ul>
          <li><b>Due today</b> holds at most thirty words, at most ten of them brand new. You set both numbers yourself.</li>
          <li>If a list's date falls within the next three days, these limits do not apply to its words. Holding words back shortly before a deadline would make no sense.</li>
        </ul>
        <p>After forty cards shown, the app also asks whether you want to stop for today. You can carry on regardless.</p>
      </>
    ),
  },
  {
    titel: "The «Practice plan» area",
    text: (
      <>
        <p>The practice plan shows when each list has to be solid and how far along you are, as a calendar or as a list. Only lists you have given a <b>target date</b> appear here. All the others are practised as normal, they just do not show up here.</p>
        <KritzelEndspurt titel="The closer the date, the tighter the repetitions" />
        <p><b>The target date.</b> Give a list the day it has to be solid. You set it under <b>Word lists</b>, on the list itself.</p>
        <p>From then on the app counts backwards: from about three weeks before the date it demands more confidence from those words, which brings them up more often. In the last few days the daily limit no longer applies to them. After the date everything returns to normal.</p>
        <p>If you practise several lists together, the words of the list with the nearer date come up more often by themselves. You do not have to set anything for that.</p>
        <p>The colour of a day shows how ready the list is. If several lists fall on one day, the colour shows the weakest.</p>
        <p>Tap a day and you see which lists are involved, how many of their words are likely to be solid on the day, and you can start practising straight from there.</p>
      </>
    ),
  },
  {
    titel: "The «Word lists» area",
    text: (
      <>
        <p>All your words live in lists, and every word belongs to exactly one list. What a list is, is up to you: a page in your exercise book, a lesson, the material for a test.</p>
        <KritzelListe titel="First the list, then its words" />
        <p>Four ways lead in. Picking the right one saves you the most work:</p>
        <ul>
          <li><b>Paste a list</b>: for a whole page. With the AI instruction you can have your AI app build it from a photo.</li>
          <li><b>Type a single word</b>: for additions.</li>
          <li><b>Take a shared list</b>: when someone has sent you a code or a link.</li>
          <li><b>Read a spreadsheet</b>: Excel or CSV, web version only. The blank template sits right next to it.</li>
        </ul>
        <p><b>The route via AI.</b> It works with any AI that can read images. Tap <b>Copy AI prompt</b> in the app, switch to your AI app, paste the instruction and attach a photo of your page. Copy the answer back into the large field and tap <b>Continue to checking</b>.</p>
        <p><b>The checking window.</b> Every word is listed there on its own, with all its details. Look over it and correct whatever went wrong. At the end you choose the list. Photos are misread now and then; this is where you catch it.</p>
        <p><b>Changing lists and words.</b> When you open a list you first see the list itself: target date, progress and the actions. The words sit one level down under <b>View and edit words</b>. Tap a row there and use <b>Edit</b> or <b>Delete</b>; several at once works too.</p>
        <p>Two lists that belong together can be <b>merged</b>. Deleting a list deletes its words too, along with their progress. To keep them, move them to another list first.</p>
        <p><b>Exporting and sharing.</b> <b>Export</b> gives you your words back as text or as an Excel spreadsheet, in the same format the app reads back in, and without an account. <b>Share</b> sends a list to someone else; they get their own copy, and your progress stays separate. Sharing needs an account.</p>
        <p><b>The four Smart lists.</b> Next to your own lists there are four the app puts together every day, across everything you have:</p>
        <ul>
          <li><b>Due today</b>: your portion for today, due words and new ones.</li>
          <li><b>Due words</b>: everything that is up for review now.</li>
          <li><b>Still wobbly</b>: exactly the words on the level <b>still wobbly</b>.</li>
          <li><b>Due soon</b>: still solid, but coming up again shortly.</li>
        </ul>
        <p>You can look at them and practise them, but not change them. Below that there is also <b>All words</b>. That is not a Smart list, it is your whole collection.</p>
      </>
    ),
  },
  {
    titel: "The «Statistics» area",
    text: (
      <>
        <p>Statistics goes into detail. At the top you choose whether you are looking at all languages or one, all words or a particular list, and whether it covers the last 7, 30 or 90 days.</p>
        <KritzelLeiste titel="The same five levels everywhere" />
        <ul>
          <li><b>Stock</b>: how your words spread across the five levels.</li>
          <li><b>Progress</b>: how many words came in, how much you practised, on how many days, and how many words newly reached the level <b>solid</b>.</li>
          <li><b>Analyses</b>: how your answers turn out, what they fail on, how quickly a word becomes solid for you, how long your words last, how long your sessions are, and at what time of day you do best.</li>
          <li><b>Sticking points</b> and <b>Stubborn</b>: the words that keep getting away from you. You can practise them straight from there.</li>
        </ul>
        <p>Analyses with too little data behind them are not shown at all. That is why the page is fairly empty at the start. It fills up.</p>
      </>
    ),
  },
  {
    titel: "Settings worth changing",
    text: (
      <>
        <p>The defaults follow the research on learning and suit most people. Three of them are still worth a look:</p>
        <ul>
          <li><b>Learning intensity</b>: how reliably you want to know a word when it comes back. More intense means practising more often, and more of it sticks. Less intense means fewer cards, and more slips away. There is no right answer here, only a trade.</li>
          <li><b>New words per day</b>: your only lever on the quantity. Fewer new words means less backlog, not slower learning.</li>
          <li><b>Answer checking</b>: how strictly accents, articles and capitalisation are marked.</li>
        </ul>
        <p>Beyond that there are smaller things that make daily use nicer: what appears on the card (phonetics, forms, example sentences), what the app opens with, the colour scheme and the card typeface. Everything can be reset individually, and whatever you have changed is marked.</p>
        <p>Under <b>Advanced</b> you can watch the model do its arithmetic. You never need to.</p>
      </>
    ),
  },
  {
    titel: "With or without an account",
    text: (
      <>
        <p>The app runs completely without an account and completely without a connection. Without signing in, everything you enter stays on this device, and nowhere else.</p>
        <p>Signing in adds three things: the same state on all your devices, <b>sharing</b> lists, and your words surviving if something happens to the device. You can sign in later at any time and take your existing lists with you.</p>
        <p>You delete your account in the account window at the top right. That is also where you change your display name and password. Deleting removes the data on the server too, and it cannot be undone.</p>
      </>
    ),
  },
  {
    titel: "Common questions",
    text: (
      <>
        <p className="help-frage"><b>Why is the same word back already?</b></p>
        <p>Because you hesitated last time, or got it wrong. The app brings a word back shortly before you forget it, and for a wobbly word that is tomorrow.</p>
        <p className="help-frage"><b>Why does the app ask me words I have known for ages?</b></p>
        <p>Because even words that sit firmly need a refresh every few weeks; otherwise they do fade over the months. It is only a few cards, and they cost you almost no time.</p>
        <p className="help-frage"><b>I was away for a week. How bad is it?</b></p>
        <p>Not bad. The due words pile up, but <b>Due today</b> only gives you the portion for today. You do not get the whole backlog at once.</p>
        <p className="help-frage"><b>A word is spelled wrong. How do I change it?</b></p>
        <p>Open the list, <b>View and edit words</b>, tap the row, <b>Edit</b>. Everything can be changed or added there: the word, example sentences, phonetics, forms and gender.</p>
        <p className="help-frage"><b>My progress is off. Can I start again?</b></p>
        <p>In the settings under <b>Data on this device</b> you can reset your progress: points, history and daily streak, in every language. Your words stay. It cannot be undone.</p>
        <p className="help-frage"><b>I want to leave SmartVoc. Do I get my words out?</b></p>
        <p>Yes. <b>Export</b> gives you every list as text or as an Excel spreadsheet, without an account and without a detour.</p>
        <p className="help-frage"><b>My question is not here.</b></p>
        <p>Write to <b>support@smartvoc.app</b>. Questions, bugs and suggestions all go to the same address.</p>
      </>
    ),
  },
];

export const THEORIE_LEAD_EN =
  "SmartVoc does not guess when a word comes back. It works it out, with a model researchers have been refining for over a hundred years. If you want to know why a word only reappears in three weeks, the answer is here.";

export const THEORIE_EN: Kapitel[] = [
  {
    titel: "Forgetting is not a failure",
    text: (
      <>
        <p>In the late 19th century Hermann Ebbinghaus taught himself meaningless syllables and measured how much of them was still there after an hour, a day, a week. Out came the <b>forgetting curve</b>: freshly learnt material drops steeply at first and then ever more gently.</p>
        <KritzelVergessen titel="Every repetition makes the curve flatter" />
        <p>What matters is not the loss but what happens afterwards. After every repetition the curve falls more gently than before. The word holds longer.</p>
        <p>So forgetting is not a failure but the normal case. And the lever you can pull.</p>
      </>
    ),
  },
  {
    titel: "The best moment is just before you forget",
    text: (
      <>
        <p>Repeat too early and the word is still present, so the repetition does little. Repeat too late and it is gone, so you learn it again.</p>
        <KritzelFenster titel="In between lies the window the app is looking for" />
        <p>In between lies a window where a repetition does the most: when remembering just about works but costs effort. It is called <b>spaced repetition</b>, and the effect is among the best evidenced in learning research.</p>
        <p>That window is exactly what the app looks for, word by word. Which is why a word you know well only comes back in three weeks, and one you hesitated over comes back tomorrow.</p>
      </>
    ),
  },
  {
    titel: "Retrieving beats re-reading",
    text: (
      <>
        <p><b>Remembering</b> something makes it stick more than <b>reading</b> it again. The technical term is the <b>testing effect</b>.</p>
        <KritzelTesteffekt titel="Reading five times gives less than testing four times" />
        <p>Reading a word list through five times does less for you than reading it once and testing yourself four times. Even though the reading feels considerably safer.</p>
        <p>That is why <b>typing</b> is the recommended answer type, and why <b>just flipping through</b> is explicitly marked as not counting. And why it pays to really think before you turn the card over, uncomfortable as it is.</p>
      </>
    ),
  },
  {
    titel: "What the app knows about each word",
    text: (
      <>
        <p>Behind the scenes runs <b>FSRS</b>, a modern memory model. It keeps three numbers for every word:</p>
        <ul>
          <li><b>How long it holds.</b> This grows after every correct answer. That is the flattening curve from above.</li>
          <li><b>How stubborn it is.</b> Some words are difficult no matter how often you practise them. Those come back more often and get marked as “persistent”.</li>
          <li><b>How well you still know it right now.</b> When this drops below your target, the word is due.</li>
        </ul>
        <p>You can move that target in the settings. A higher target means: practise more often, more sticks. A lower one: fewer cards a day, more forgetting. There is no right answer here, only a trade you make yourself.</p>
        <p>What the app does <b>not</b> do: it does not tune the model to you personally, and records nothing for that purpose. The model's numbers are the same for everyone.</p>
      </>
    ),
  },
  {
    titel: "Why things change before a test",
    text: (
      <>
        <p>Give a word list a target date and the app raises the target for those words as the date approaches.</p>
        <p>That is not a second calculation but the same one with a stricter target. A higher retention target means shorter intervals, so the words come up more often. After the date everything falls back to your normal target.</p>
        <p>In the last days before the date the app also lifts the daily cap for those words. It helps nobody if the test words of all things are the ones stuck at the limit.</p>
      </>
    ),
  },
  {
    titel: "Why learning is allowed to feel hard",
    text: (
      <>
        <p>Learning research has a term that sounds like a contradiction at first: <b>desirable difficulties</b>. It means hurdles that make practice harder in the moment and are worth more precisely because of it.</p>
        <p>Spaced practice is one. Retrieving instead of re-reading is the second. The third is <b>interleaving</b>: practising words mixed up instead of one list after another in a block.</p>
        <p>All three share the same catch. They feel worse than they are. Go through a list five times in a row and you feel secure, and a week later you are not. Practise mixed and spaced and you make more mistakes along the way and remember more at the end.</p>
        <p>So how practice feels is a poor guide, and that is why the app takes the order out of your hands.</p>
      </>
    ),
  },
  {
    titel: "What the numbers you see mean",
    text: (
      <>
        <p>The <b>round progress</b> above the card applies to the current round only: how much of what you set out to do right now is done. It starts fresh with every round.</p>
        <p>The <b>mastery level</b> is something else. It shows how all the words of this practice spread across the five levels, changes slowly over weeks, and is the same figure that appears as the traffic light in the practice plan and as the bar in the statistics.</p>
        <p>It is the same calculation everywhere: the share of words that have stuck or nearly stuck.</p>
      </>
    ),
  },
  {
    titel: "What is in your hands",
    text: (
      <>
        <ul>
          <li><b>Regularity.</b> Ten minutes a day beat an hour on Saturday, because the model builds on intervals and not on volume.</li>
          <li><b>Honesty.</b> With self-check, cheating only cheats you out of the repetition.</li>
          <li><b>Few new words.</b> Eight to twelve a day is plenty. Every new word creates future repetitions.</li>
        </ul>
      </>
    ),
  },
  {
    titel: "Further reading",
    text: (
      <ul className="help-links">
        <li><a href="https://en.wikipedia.org/wiki/Forgetting_curve" target="_blank" rel="noreferrer">Forgetting curve (Wikipedia)</a>: Ebbinghaus’ measurement and what follows from it</li>
        <li><a href="https://en.wikipedia.org/wiki/Spaced_repetition" target="_blank" rel="noreferrer">Spaced repetition (Wikipedia)</a>: why intervals work</li>
        <li><a href="https://en.wikipedia.org/wiki/Testing_effect" target="_blank" rel="noreferrer">Testing effect (Wikipedia)</a>: retrieving beats re-reading</li>
        <li><a href="https://github.com/open-spaced-repetition/fsrs4anki/wiki" target="_blank" rel="noreferrer">FSRS</a>: the model this app calculates with</li>
      </ul>
    ),
  },
];

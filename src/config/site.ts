/*
 * Apex Fitness website content.
 *
 * Everything marketing-related lives here so it can be edited without touching components.
 * IMAGES: the photos below are placeholder stock shots from Unsplash. To use your own, put
 * files in /public/images/ and replace a URL with e.g. '/images/strength-floor.jpg'.
 * Contact details shown on the site come from the database (/admin → Settings).
 */
import type { Plan } from '../types'

const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72`

/** Responsive srcset for an Unsplash URL (other URLs are returned unchanged). */
export function srcSet(url: string, widths = [480, 800, 1200]): string | undefined {
  if (!url.includes('images.unsplash.com')) return undefined
  return widths.map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ')
}

export const BRAND = {
  name: 'Apex Fitness',
  location: 'Dhubulia',
  /** Official logo (transparent). Dark lettering for light backgrounds… */
  logo: { full: '/brand/apex-logo.webp', small: '/brand/apex-logo-sm.webp' },
  /** …and the reversed version (white lettering) for dark backgrounds like the footer. */
  logoOnDark: { full: '/brand/apex-logo-light.webp', small: '/brand/apex-logo-light-sm.webp' },
  /** width / height of the logo files */
  logoRatio: 1000 / 691,
}

export const IMAGES = {
  hero: unsplash('1541534741688-6078c6bfb5c5', 1400),
  auth: unsplash('1574680096145-d05b474e2155', 1200),
  cta: unsplash('1567013127542-490d757e51fc', 1200),
  about: unsplash('1534438327276-14e5300c3a48', 1400),
  contact: unsplash('1571902943202-507ec2618e8f', 1200),
}

export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programs' },
  { to: '/membership', label: 'Membership' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

/** Headline numbers (edit to match the gym). */
export const STATS = [
  { value: 1200, suffix: '+', label: 'Members trained', note: 'Since opening our doors' },
  { value: 60, suffix: '+', label: 'Premium equipment', note: 'Commercial-grade machines, racks & free weights' },
  { value: 8, suffix: '', label: 'Training programs', note: 'Strength, conditioning & mobility' },
  { value: 17, suffix: ' hrs', label: 'Open every weekday', note: 'Early birds to night owls' },
]

export type ProgramCategory = 'Strength' | 'Conditioning' | 'Mind & Body' | 'Coaching'

export interface Program {
  slug: string
  title: string
  category: ProgramCategory
  summary: string
  tagline: string
  overview: string[]
  level: string
  sessions: string
  duration: string
  /** 1 (gentle) – 5 (all-out) */
  intensity: number
  image: string
  outcomes: { title: string; text: string }[]
  forWho: string[]
  session: { title: string; mins: number; text: string }[]
  /** Mon → Sun; null = rest / recovery day */
  week: (string | null)[]
}

export const PROGRAMS: Program[] = [
  {
    slug: 'strength-foundations',
    title: 'Strength Foundations',
    category: 'Strength',
    summary: 'Master the big lifts — squat, bench, deadlift — with coached technique and a progressive plan.',
    tagline: 'Learn the big lifts the right way — and get strong for life.',
    overview: [
      'Strength Foundations is where most Apex members begin. You will learn the squat, bench press, deadlift and overhead press step by step, with form checks on every working set.',
      'Each week the weights go up a little, following a simple, proven progression. No guesswork and no ego lifting — just solid technique and strength you can measure.',
    ],
    level: 'Beginner',
    sessions: '3× / week',
    duration: '60 min',
    intensity: 2,
    image: unsplash('1532029837206-abbe2b7620e3', 1200),
    outcomes: [
      { title: 'Confident technique', text: 'Move safely and efficiently through the four core barbell lifts.' },
      { title: 'Steady strength gains', text: 'Small weekly jumps you can track in your training log.' },
      { title: 'Stronger posture', text: 'Build the back, hips and core that protect you outside the gym.' },
      { title: 'A routine that sticks', text: 'Three focused sessions a week that fit around work or college.' },
    ],
    forWho: ['Complete beginners who have never lifted a barbell', 'Members returning after a long break', 'Anyone who wants to lift safely without injury', 'Lifters building a base before Powerbuild'],
    session: [
      { title: 'Warm-up & mobility', mins: 10, text: 'Raise your heart rate and open up hips, ankles and shoulders.' },
      { title: 'Technique primer', mins: 10, text: 'Light sets to groove the movement pattern of the day.' },
      { title: 'Main lift', mins: 25, text: 'Progressive working sets on squat, bench, deadlift or press.' },
      { title: 'Accessory circuit', mins: 10, text: 'Rows, lunges and core work to support the big lifts.' },
      { title: 'Cool-down', mins: 5, text: 'Breathing and stretching to start recovery.' },
    ],
    week: ['Full body A', null, 'Full body B', null, 'Full body A', 'Optional mobility', null],
  },
  {
    slug: 'powerbuild',
    title: 'Powerbuild',
    category: 'Strength',
    summary: 'Heavy compounds plus hypertrophy blocks for lifters ready to push numbers and build muscle.',
    tagline: 'Heavy compounds meet hypertrophy — build strength and size together.',
    overview: [
      'Powerbuild blends powerlifting-style heavy days with bodybuilding volume. You train each muscle group twice a week: once heavy for strength, once with higher reps for size.',
      'Training is organised in 4-week blocks that build up and then deload, so you keep progressing without burning out.',
    ],
    level: 'Intermediate',
    sessions: '4× / week',
    duration: '75 min',
    intensity: 4,
    image: unsplash('1517836357463-d25dfeac3438', 1200),
    outcomes: [
      { title: 'Bigger lifts', text: 'Heavy, low-rep work that pushes your squat, bench and deadlift.' },
      { title: 'Visible muscle', text: 'Hypertrophy blocks that add size where you want it.' },
      { title: 'Smart programming', text: 'Planned deloads keep joints healthy and progress steady.' },
      { title: 'Measurable results', text: 'Track your progress at the end of every block.' },
    ],
    forWho: ['Lifters with 6+ months of consistent training', 'Anyone who has stalled on a beginner program', 'Members who want strength and aesthetics', 'Athletes in an off-season building phase'],
    session: [
      { title: 'Dynamic warm-up', mins: 10, text: 'Activation drills and ramp-up sets.' },
      { title: 'Strength block', mins: 30, text: 'Heavy compound lift in the 3–6 rep range.' },
      { title: 'Hypertrophy block', mins: 25, text: 'Supersets in the 8–15 rep range for muscle growth.' },
      { title: 'Finisher & cool-down', mins: 10, text: 'Short pump set, then stretching.' },
    ],
    week: ['Upper strength', 'Lower strength', null, 'Upper volume', 'Lower volume', null, null],
  },
  {
    slug: 'apex-hiit',
    title: 'Apex HIIT',
    category: 'Conditioning',
    summary: 'Battle ropes, sleds and intervals that torch calories and build an engine that lasts.',
    tagline: 'Short, savage intervals that build a serious engine.',
    overview: [
      'Apex HIIT is 45 minutes of structured interval training using ropes, sleds, kettlebells, bikes and bodyweight. Work periods are short and intense, rest periods are planned, and every session is different.',
      'Every movement can be scaled, so first-timers and seasoned athletes train side by side — each at their own maximum effort.',
    ],
    level: 'All levels',
    sessions: '3× / week',
    duration: '45 min',
    intensity: 5,
    image: unsplash('1599058917212-d750089bc07e', 1200),
    outcomes: [
      { title: 'Better stamina', text: 'Climb stairs, play sport and chase kids without gasping.' },
      { title: 'High calorie burn', text: 'Intervals keep your metabolism elevated after training.' },
      { title: 'Mental toughness', text: 'Learn to push through discomfort, one round at a time.' },
      { title: 'Never boring', text: 'New formats every week keep you coming back.' },
    ],
    forWho: ['Anyone who wants maximum results in minimum time', 'Members looking to lose fat and improve fitness', 'Lifters adding conditioning to their week', 'People who love high-energy training'],
    session: [
      { title: 'Activation', mins: 8, text: 'Movement prep and heart-rate build-up.' },
      { title: 'Skill & scaling', mins: 5, text: 'Learn the moves and choose your level.' },
      { title: 'Interval rounds', mins: 25, text: 'Work-to-rest intervals across ropes, sleds, bikes and bells.' },
      { title: 'Core finisher', mins: 4, text: 'A short, focused core burn.' },
      { title: 'Recovery', mins: 3, text: 'Breathing and stretching to bring the heart rate down.' },
    ],
    week: ['HIIT', null, 'HIIT', null, 'HIIT', 'Active recovery', null],
  },
  {
    slug: 'fat-loss-reset',
    title: 'Fat-Loss Reset',
    category: 'Conditioning',
    summary: 'A 12-week blend of strength, cardio and nutrition habits with weekly check-ins.',
    tagline: 'A 12-week reset for lasting, sustainable fat loss.',
    overview: [
      'Fat-Loss Reset combines strength training to protect muscle, steady cardio to burn energy, and simple nutrition habits that fit Indian home cooking — no crash diets.',
      'Weekly check-ins with measurements and photos keep you accountable and let us adjust your plan as you progress.',
    ],
    level: 'Beginner',
    sessions: '4× / week',
    duration: '50 min',
    intensity: 3,
    image: unsplash('1594737625785-a6cbdabd333c', 1200),
    outcomes: [
      { title: 'Sustainable fat loss', text: 'Lose fat steadily while keeping your strength.' },
      { title: 'Food that works', text: 'Easy portion and protein habits for everyday meals.' },
      { title: 'More energy', text: 'Better sleep, mood and stamina as training adds up.' },
      { title: 'Weekly accountability', text: 'Check-ins that keep you on track for all 12 weeks.' },
    ],
    forWho: ['Beginners with a weight-loss goal', 'Anyone who has tried diets that did not last', 'Members preparing for a wedding or event', 'People who want structure and accountability'],
    session: [
      { title: 'Warm-up', mins: 8, text: 'Light cardio and mobility.' },
      { title: 'Strength circuit', mins: 22, text: 'Full-body resistance work to keep muscle.' },
      { title: 'Cardio block', mins: 15, text: 'Steady or interval cardio on bike, rower or treadmill.' },
      { title: 'Stretch & log', mins: 5, text: 'Cool down and record your session.' },
    ],
    week: ['Strength + cardio', 'Cardio', null, 'Strength + cardio', 'Cardio', 'Weekly check-in', null],
  },
  {
    slug: 'mobility-flow',
    title: 'Mobility & Flow',
    category: 'Mind & Body',
    summary: 'Yoga-inspired mobility to unlock hips and shoulders, speed up recovery and move pain-free.',
    tagline: 'Move better, recover faster and feel lighter every day.',
    overview: [
      'Mobility & Flow uses yoga-inspired sequences, controlled joint work and breathing to improve how your body moves. It is the perfect partner to any strength or conditioning program.',
      'Expect slow, deliberate movement, longer holds and a calm environment — a reset button for desk-bound backs and tight hips.',
    ],
    level: 'All levels',
    sessions: '2× / week',
    duration: '45 min',
    intensity: 1,
    image: unsplash('1544367567-0f2fcb009e0b', 1200),
    outcomes: [
      { title: 'Freer joints', text: 'Unlock hips, shoulders and spine for deeper, safer lifts.' },
      { title: 'Less stiffness', text: 'Ease back and neck tension from long hours of sitting.' },
      { title: 'Faster recovery', text: 'Feel fresher between hard training days.' },
      { title: 'Calmer mind', text: 'Breathing work that lowers stress and improves sleep.' },
    ],
    forWho: ['Lifters with tight hips or shoulders', 'Office workers and students who sit all day', 'Anyone recovering from hard training', 'Members of every age and fitness level'],
    session: [
      { title: 'Breath & arrive', mins: 5, text: 'Settle in with guided breathing.' },
      { title: 'Joint circles', mins: 10, text: 'Controlled rotations for every major joint.' },
      { title: 'Flow sequence', mins: 20, text: 'Linked movements that build range and control.' },
      { title: 'Deep holds & relax', mins: 10, text: 'Longer stretches and a guided wind-down.' },
    ],
    week: [null, 'Flow', null, null, 'Flow', null, null],
  },
  {
    slug: 'group-sculpt',
    title: 'Group Sculpt',
    category: 'Mind & Body',
    summary: 'High-energy group sessions for toning, core strength and serious fun with your crew.',
    tagline: 'Music up, energy high — tone up with your crew.',
    overview: [
      'Group Sculpt is a coach-led class using dumbbells, bands, steps and bodyweight to build lean strength and a strong core. Every class is set to music and paced for the room.',
      'It is the most social hour at Apex: a supportive crew, friendly competition and a session that flies by.',
    ],
    level: 'All levels',
    sessions: '3× / week',
    duration: '50 min',
    intensity: 3,
    image: unsplash('1518611012118-696072aa579a', 1200),
    outcomes: [
      { title: 'Toned, lean muscle', text: 'Light-to-moderate weights for definition and shape.' },
      { title: 'Rock-solid core', text: 'Dedicated core sections in every class.' },
      { title: 'Motivation that lasts', text: 'Training with a group keeps you consistent.' },
      { title: 'Fun every time', text: 'Music-driven sessions that never feel like a chore.' },
    ],
    forWho: ['Members who enjoy training with others', 'Beginners who want guidance and energy', 'Anyone looking to tone up and feel fitter', 'Friends who want to train together'],
    session: [
      { title: 'Groove warm-up', mins: 7, text: 'Music-led movement to get everyone going.' },
      { title: 'Sculpt blocks', mins: 28, text: 'Upper, lower and full-body blocks with weights and bands.' },
      { title: 'Core section', mins: 10, text: 'Planks, crunches and anti-rotation work.' },
      { title: 'Stretch-out', mins: 5, text: 'Cool down together.' },
    ],
    week: ['Class', null, 'Class', null, 'Class', null, null],
  },
  {
    slug: 'personal-training',
    title: '1-on-1 Personal Training',
    category: 'Coaching',
    summary: 'A coach, a plan built around you, and accountability every single session.',
    tagline: 'Your goals, your plan — with expert eyes on every rep.',
    overview: [
      'Personal training at Apex starts with a full assessment: movement screen, strength baseline and a conversation about your goals, schedule and history.',
      'From there your coach writes a plan just for you and trains you one-on-one — correcting technique, adjusting the load and keeping you accountable from session to session.',
    ],
    level: 'Any goal',
    sessions: 'Flexible',
    duration: '60 min',
    intensity: 3,
    image: unsplash('1597452485669-2c7bb5fef90d', 1200),
    outcomes: [
      { title: 'A plan made for you', text: 'Programming built around your body, goals and schedule.' },
      { title: 'Faster progress', text: 'Expert coaching removes guesswork and wasted sessions.' },
      { title: 'Injury-smart training', text: 'Exercises adapted around past injuries or limitations.' },
      { title: 'Total accountability', text: 'Someone who expects you — and tracks every result.' },
    ],
    forWho: ['Anyone who wants the fastest, safest results', 'Members with injuries or special considerations', 'Beginners who feel nervous on the gym floor', 'Busy people who need efficient sessions'],
    session: [
      { title: 'Check-in', mins: 5, text: 'How you slept, how you feel, what is next.' },
      { title: 'Tailored warm-up', mins: 10, text: 'Prep that targets your specific needs.' },
      { title: 'Coached training', mins: 35, text: 'Your personal plan, with technique feedback on every set.' },
      { title: 'Review & homework', mins: 10, text: 'Progress notes and what to do between sessions.' },
    ],
    week: ['Session', null, 'Session', null, 'Session', null, null],
  },
  {
    slug: 'athlete-prep',
    title: 'Athlete Prep',
    category: 'Coaching',
    summary: 'Speed, power and injury-proofing for footballers, cricketers and competitive athletes.',
    tagline: 'Speed, power and resilience for athletes who compete.',
    overview: [
      'Athlete Prep is performance training for sport. Sessions combine sprint mechanics, jumps and throws, heavy strength work and injury-prevention drills.',
      'Training follows your season — building in the off-season, staying sharp during matches — so you peak when it counts.',
    ],
    level: 'Advanced',
    sessions: '3× / week',
    duration: '70 min',
    intensity: 5,
    image: unsplash('1517963879433-6ad2b056d712', 1200),
    outcomes: [
      { title: 'More speed', text: 'Sprint mechanics and acceleration drills.' },
      { title: 'Explosive power', text: 'Jumps, throws and Olympic-style lifts.' },
      { title: 'Fewer injuries', text: 'Hamstring, knee and shoulder resilience work.' },
      { title: 'Peak on match day', text: 'Training that follows your competition calendar.' },
    ],
    forWho: ['Footballers, cricketers and kabaddi players', 'School and college athletes', 'Members training for fitness tests', 'Competitive athletes returning from injury'],
    session: [
      { title: 'Movement prep', mins: 12, text: 'Dynamic warm-up and activation.' },
      { title: 'Speed & agility', mins: 15, text: 'Sprints, change of direction and footwork.' },
      { title: 'Power', mins: 13, text: 'Jumps, throws and explosive lifts.' },
      { title: 'Strength', mins: 20, text: 'Heavy lower- and upper-body work.' },
      { title: 'Prehab & cool-down', mins: 10, text: 'Injury-prevention drills and recovery.' },
    ],
    week: ['Speed + strength', null, 'Power + strength', null, 'Conditioning', 'Match / practice', null],
  },
]

/** Real photos from the gym (public/images/facility). `position` = CSS object-position for the crop. */
export const FACILITIES = [
  { title: 'Strength Floor', text: 'A full rack of hex dumbbells, Olympic bars and sturdy benches.', image: '/images/facility/free-weights.webp', position: 'center 45%', size: 'lg' as const },
  { title: 'Cardio Deck', text: 'Commercial treadmills with programmed workouts.', image: '/images/facility/treadmill.webp', position: 'center 35%', size: 'sm' as const },
  { title: 'Functional Zone', text: 'Dual-cable functional trainer, stability balls and steps.', image: '/images/facility/functional-trainer.webp', position: 'center 40%', size: 'sm' as const },
  { title: 'Cable Station', text: 'Weight-stack cable stations for back, arms and every muscle group.', image: '/images/facility/cable-station.webp', position: 'center 45%', size: 'sm' as const },
  { title: 'Indoor Cycling', text: 'Spin bikes with adjustable resistance for intervals and steady cardio.', image: '/images/facility/spin-bike.webp', position: 'center 55%', size: 'sm' as const },
]

/** Coach photo (public/images/coach.webp). */
export const COACH = {
  image: '/images/coach.webp',
  promises: ['Form checks on every working set', 'A personal plan after your fitness assessment', 'Monthly progress reviews', 'Support on the floor every day'],
}

/**
 * Member reviews shown on the home page (rating = stars out of 5).
 * These are SAMPLE reviews — replace them with real reviews from your members before going live.
 */
export const TESTIMONIALS = [
  { name: 'Sourav G.', tag: 'Member · 1 year', rating: 5, quote: 'I came in unable to do a single pull-up. Twelve months later I’m deadlifting twice my bodyweight. Every rep is coached properly.' },
  { name: 'Priya S.', tag: 'Member · 8 months', rating: 4, quote: 'Clean, bright and never intimidating. The reminders before my membership runs out are a lifesaver — I’ve never missed a renewal.' },
  { name: 'Debjit S.', tag: 'Athlete Prep', rating: 4, quote: 'My sprint times dropped and my knee stopped hurting. The program is structured like a real athletic setup.' },
  { name: 'Moumita P.', tag: 'Group Sculpt', rating: 5, quote: 'The evening group classes are my favourite hour of the day. Great energy, great people.' },
  { name: 'Rakib S.', tag: 'Member · 2 years', rating: 5, quote: 'Best equipment in the area, and the staff remember your name. Seeing my days left on the dashboard keeps me honest.' },
  { name: 'Ananya B.', tag: 'Fat-Loss Reset', rating: 4, quote: 'Lost 9 kg in 12 weeks without crash dieting. The weekly check-ins made all the difference.' },
]

export const STEPS = [
  { title: 'Visit Apex', text: 'Drop by the gym in Dhubulia for a tour and a free fitness assessment.' },
  { title: 'Join at the desk', text: 'Pick a plan and complete your membership at our front desk — no online payment needed.' },
  { title: 'Link it online', text: 'Create your account, add your membership and track days left, reminders and progress.' },
]

export const FAQ = [
  { q: 'Can I buy a membership on the website?', a: 'No — memberships are purchased at our front desk in Dhubulia. The website lets you link the membership you bought so you can track it, get reminders and manage your profile.' },
  { q: 'How do I add my existing membership?', a: 'Create an account, answer “Yes, I’m already a member”, and fill in your plan, purchase date and start date. We calculate the expiry date automatically and our staff verify it against your receipt.' },
  { q: 'When will I be reminded to renew?', a: 'You’ll get a reminder 5 days and again 3 days before your membership expires — on your dashboard, by email and on WhatsApp (you can switch email/WhatsApp off in your profile).' },
  { q: 'Is there a trial session?', a: 'Yes. Visit us or send a message from the contact page and we’ll book a free trial workout and fitness assessment.' },
  { q: 'Can I pause my membership?', a: 'Yearly members can freeze up to 30 days. Talk to the front desk and we’ll update your dates.' },
]

/**
 * Shown on the website if the plans can't be loaded from the server (e.g. while the
 * backend is offline). Keep in sync with Admin → Membership Plans / backend seed.sql.
 */
export const DEFAULT_PLANS: Plan[] = [
  { id: 1, slug: 'monthly', name: 'Monthly', durationDays: 30, price: 1200, tagline: 'Start strong, no long commitment.', features: ['Full gym floor access', 'Cardio & strength zones', 'Locker room access', 'Free fitness assessment'], isFeatured: false, isActive: true, sortOrder: 1 },
  { id: 2, slug: 'quarterly', name: 'Quarterly', durationDays: 90, price: 3200, tagline: 'Our most popular way to build a habit.', features: ['Everything in Monthly', 'Personal workout plan', 'Monthly progress check-in', 'Group class access'], isFeatured: true, isActive: true, sortOrder: 2 },
  { id: 3, slug: 'half-yearly', name: 'Half-Yearly', durationDays: 180, price: 5800, tagline: 'Six months to transform your training.', features: ['Everything in Quarterly', '2 personal training sessions', 'Nutrition guidance session', 'Priority class booking'], isFeatured: false, isActive: true, sortOrder: 3 },
  { id: 4, slug: 'yearly', name: 'Yearly', durationDays: 365, price: 9999, tagline: 'Best value for committed athletes.', features: ['Everything in Half-Yearly', '6 personal training sessions', 'Quarterly body composition scan', 'Freeze up to 30 days'], isFeatured: false, isActive: true, sortOrder: 4 },
]

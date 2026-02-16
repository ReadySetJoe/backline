import { CompensationType, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Genres (unchanged from original seed)
// ---------------------------------------------------------------------------
const genres = [
  "Rock",
  "Punk",
  "Hardcore",
  "Metal",
  "Indie Rock",
  "Indie Pop",
  "Emo",
  "Post-Punk",
  "Shoegaze",
  "Noise",
  "Garage Rock",
  "Psychedelic",
  "Folk",
  "Country",
  "Americana",
  "Bluegrass",
  "Singer-Songwriter",
  "Jazz",
  "Blues",
  "Soul",
  "R&B",
  "Funk",
  "Alternative",
  "Hip Hop",
  "Rap",
  "Electronic",
  "DJ",
  "Ambient",
  "Experimental",
  "Pop",
  "Pop Punk",
  "Ska",
  "Reggae",
  "Latin",
  "World",
];

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function emailify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+$/, "") + "@test.com"
  );
}

// ---------------------------------------------------------------------------
// Artist seed data
// ---------------------------------------------------------------------------
type ArtistSeed = {
  name: string;
  location: string;
  artistType: "SOLO" | "DUO" | "FULL_BAND";
  memberCount: number;
  genres: string[];
  bio: string;
  drawEstimate: number;
  typicalSetLength: number;
  availabilityPreference:
    | "WEEKENDS"
    | "WEEKNIGHTS"
    | "ANY_NIGHT"
    | "SPECIFIC_DATES";
  latitude: number;
  longitude: number;
};

const artists: ArtistSeed[] = [
  // ---- NEW YORK CITY (10 in-city + 2 suburb) ----
  {
    name: "The Midnight Mavericks",
    location: "New York, NY",
    artistType: "FULL_BAND",
    memberCount: 5,
    genres: ["Rock", "Indie Rock"],
    bio: "High-energy rock quintet tearing up the NYC club circuit since 2021.",
    drawEstimate: 180,
    typicalSetLength: 60,
    availabilityPreference: "WEEKENDS",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "Concrete Jungle Brass",
    location: "New York, NY",
    artistType: "FULL_BAND",
    memberCount: 8,
    genres: ["Jazz", "Funk", "Soul"],
    bio: "Eight-piece brass ensemble blending New Orleans jazz with NYC grit.",
    drawEstimate: 220,
    typicalSetLength: 75,
    availabilityPreference: "ANY_NIGHT",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "Neon Requiem",
    location: "New York, NY",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Post-Punk", "Shoegaze"],
    bio: "Dark, dreamy walls of sound from the depths of Bushwick.",
    drawEstimate: 90,
    typicalSetLength: 45,
    availabilityPreference: "WEEKNIGHTS",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "DJ Prism",
    location: "New York, NY",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["Electronic", "DJ", "Hip Hop"],
    bio: "Genre-bending DJ with residencies across Manhattan and Brooklyn.",
    drawEstimate: 300,
    typicalSetLength: 90,
    availabilityPreference: "WEEKENDS",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "The Velvet Syndrome",
    location: "New York, NY",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Indie Pop", "Pop"],
    bio: "Catchy hooks and shimmering synths. Your new favorite pop band.",
    drawEstimate: 150,
    typicalSetLength: 50,
    availabilityPreference: "ANY_NIGHT",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "Subway Ghosts",
    location: "New York, NY",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Folk", "Indie Rock"],
    bio: "Started busking on the L train. Now they sell out listening rooms.",
    drawEstimate: 60,
    typicalSetLength: 40,
    availabilityPreference: "ANY_NIGHT",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "The Wrecking Crew",
    location: "New York, NY",
    artistType: "FULL_BAND",
    memberCount: 5,
    genres: ["Punk", "Hardcore"],
    bio: "Fast, loud, uncompromising. Not for the faint of heart.",
    drawEstimate: 250,
    typicalSetLength: 35,
    availabilityPreference: "WEEKENDS",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "Luna Moth",
    location: "New York, NY",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["Singer-Songwriter", "Folk"],
    bio: "Hushed vocals over fingerpicked guitar. Songs about the city at 4am.",
    drawEstimate: 40,
    typicalSetLength: 45,
    availabilityPreference: "WEEKNIGHTS",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "Brass Riot",
    location: "New York, NY",
    artistType: "FULL_BAND",
    memberCount: 7,
    genres: ["Ska", "Punk", "Funk"],
    bio: "Seven-piece ska-punk party machine. Horns so loud they rattle windows.",
    drawEstimate: 200,
    typicalSetLength: 60,
    availabilityPreference: "ANY_NIGHT",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: "Chrome Cathedral",
    location: "New York, NY",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Metal", "Experimental"],
    bio: "Progressive metal meets industrial noise. Tuned to drop Z.",
    drawEstimate: 120,
    typicalSetLength: 55,
    availabilityPreference: "ANY_NIGHT",
    latitude: 40.7128,
    longitude: -74.006,
  },
  // NYC suburbs
  {
    name: "Static Halo",
    location: "Hoboken, NJ",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Electronic", "Ambient"],
    bio: "Ethereal synth duo crafting soundscapes across the Hudson.",
    drawEstimate: 50,
    typicalSetLength: 50,
    availabilityPreference: "WEEKNIGHTS",
    latitude: 40.744,
    longitude: -74.0324,
  },
  {
    name: "The Brownstone Sessions",
    location: "Jersey City, NJ",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["R&B", "Soul"],
    bio: "Velvet voice with a loop pedal. R&B stripped to its bones.",
    drawEstimate: 70,
    typicalSetLength: 45,
    availabilityPreference: "WEEKENDS",
    latitude: 40.7178,
    longitude: -74.0431,
  },

  // ---- AUSTIN, TX (6 in-city + 2 suburb) ----
  {
    name: "Lone Star Revolver",
    location: "Austin, TX",
    artistType: "FULL_BAND",
    memberCount: 5,
    genres: ["Country", "Rock"],
    bio: "Outlaw country meets arena rock. Big riffs, bigger hats.",
    drawEstimate: 180,
    typicalSetLength: 60,
    availabilityPreference: "WEEKENDS",
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    name: "Cactus Bloom",
    location: "Austin, TX",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Folk", "Americana"],
    bio: "Harmonies sharper than a prickly pear. Acoustic Americana at its finest.",
    drawEstimate: 55,
    typicalSetLength: 40,
    availabilityPreference: "ANY_NIGHT",
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    name: "The Armadillo Kings",
    location: "Austin, TX",
    artistType: "FULL_BAND",
    memberCount: 6,
    genres: ["Blues", "Rock", "Funk"],
    bio: "Greasy Texas blues with enough funk to make your boots move.",
    drawEstimate: 140,
    typicalSetLength: 70,
    availabilityPreference: "WEEKENDS",
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    name: "Desert Mirage",
    location: "Austin, TX",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["Electronic", "Ambient"],
    bio: "Hypnotic modular synth performances under the Texas stars.",
    drawEstimate: 45,
    typicalSetLength: 60,
    availabilityPreference: "WEEKNIGHTS",
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    name: "Violet Haze",
    location: "Austin, TX",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Psychedelic", "Garage Rock"],
    bio: "Fuzz pedals and tie-dye. Austin psych-rock at its wobbliest.",
    drawEstimate: 100,
    typicalSetLength: 50,
    availabilityPreference: "ANY_NIGHT",
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    name: "The Porch Sitters",
    location: "Austin, TX",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Bluegrass", "Folk"],
    bio: "Banjo and fiddle on a Sunday afternoon. Front porch music for everyone.",
    drawEstimate: 35,
    typicalSetLength: 45,
    availabilityPreference: "WEEKENDS",
    latitude: 30.2672,
    longitude: -97.7431,
  },
  // Austin suburbs
  {
    name: "Sonic Tumbleweed",
    location: "Round Rock, TX",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Indie Rock", "Alternative"],
    bio: "Suburban restlessness channeled into crunchy indie anthems.",
    drawEstimate: 110,
    typicalSetLength: 45,
    availabilityPreference: "ANY_NIGHT",
    latitude: 30.5083,
    longitude: -97.6789,
  },
  {
    name: "Lady Thunderbird",
    location: "San Marcos, TX",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["Singer-Songwriter", "Country"],
    bio: "A voice that could stop a freight train. Songs about leaving and staying.",
    drawEstimate: 65,
    typicalSetLength: 40,
    availabilityPreference: "WEEKENDS",
    latitude: 29.8833,
    longitude: -97.9414,
  },

  // ---- NASHVILLE, TN (5 in-city + 2 suburb) ----
  {
    name: "Whiskey Sermon",
    location: "Nashville, TN",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["Country", "Blues"],
    bio: "Gravel-voiced troubadour. Whiskey in one hand, guitar in the other.",
    drawEstimate: 50,
    typicalSetLength: 45,
    availabilityPreference: "WEEKENDS",
    latitude: 36.1627,
    longitude: -86.7816,
  },
  {
    name: "The Honky Tonk Heroes",
    location: "Nashville, TN",
    artistType: "FULL_BAND",
    memberCount: 5,
    genres: ["Country", "Americana", "Rock"],
    bio: "Nashville institution. If the pedal steel don't get you, the fiddle will.",
    drawEstimate: 160,
    typicalSetLength: 75,
    availabilityPreference: "WEEKENDS",
    latitude: 36.1627,
    longitude: -86.7816,
  },
  {
    name: "Magnolia Freight",
    location: "Nashville, TN",
    artistType: "FULL_BAND",
    memberCount: 5,
    genres: ["Bluegrass", "Folk"],
    bio: "Bluegrass played at freight-train speed. Fingers flying, crowd stomping.",
    drawEstimate: 90,
    typicalSetLength: 50,
    availabilityPreference: "ANY_NIGHT",
    latitude: 36.1627,
    longitude: -86.7816,
  },
  {
    name: "The Glass Bottles",
    location: "Nashville, TN",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Indie Pop", "Singer-Songwriter"],
    bio: "Delicate melodies and heart-on-sleeve lyrics from East Nashville.",
    drawEstimate: 45,
    typicalSetLength: 40,
    availabilityPreference: "ANY_NIGHT",
    latitude: 36.1627,
    longitude: -86.7816,
  },
  {
    name: "Rattlesnake Rodeo",
    location: "Nashville, TN",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Punk", "Garage Rock"],
    bio: "Nashville's loudest export. Cowpunk chaos every weekend.",
    drawEstimate: 110,
    typicalSetLength: 35,
    availabilityPreference: "WEEKENDS",
    latitude: 36.1627,
    longitude: -86.7816,
  },
  // Nashville suburbs
  {
    name: "Silk & Steel",
    location: "Franklin, TN",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Folk", "Americana"],
    bio: "Husband-and-wife duo from the hills south of Nashville.",
    drawEstimate: 55,
    typicalSetLength: 45,
    availabilityPreference: "WEEKNIGHTS",
    latitude: 35.9251,
    longitude: -86.8689,
  },
  {
    name: "The River Rats",
    location: "Murfreesboro, TN",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Rock", "Blues"],
    bio: "College-town rock band with a blues problem. In the best way.",
    drawEstimate: 75,
    typicalSetLength: 50,
    availabilityPreference: "ANY_NIGHT",
    latitude: 35.8456,
    longitude: -86.3903,
  },

  // ---- ATLANTA, GA (5 in-city + 2 suburb) ----
  {
    name: "Peachtree Funk Collective",
    location: "Atlanta, GA",
    artistType: "FULL_BAND",
    memberCount: 7,
    genres: ["Funk", "Soul", "R&B"],
    bio: "Seven-piece funk army. Tightest rhythm section south of the Mason-Dixon.",
    drawEstimate: 220,
    typicalSetLength: 70,
    availabilityPreference: "WEEKENDS",
    latitude: 33.749,
    longitude: -84.388,
  },
  {
    name: "The ATL Brass Band",
    location: "Atlanta, GA",
    artistType: "FULL_BAND",
    memberCount: 8,
    genres: ["Jazz", "Funk", "Hip Hop"],
    bio: "Marching band meets hip hop. Second line energy at every show.",
    drawEstimate: 180,
    typicalSetLength: 60,
    availabilityPreference: "ANY_NIGHT",
    latitude: 33.749,
    longitude: -84.388,
  },
  {
    name: "Kudzu Kings",
    location: "Atlanta, GA",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Rock", "Blues"],
    bio: "Southern rock that grows on you. Impossible to kill, like its namesake.",
    drawEstimate: 100,
    typicalSetLength: 55,
    availabilityPreference: "WEEKENDS",
    latitude: 33.749,
    longitude: -84.388,
  },
  {
    name: "Indigo Dreams",
    location: "Atlanta, GA",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["R&B", "Soul", "Pop"],
    bio: "Silky R&B vocals over neo-soul production. Late-night vibes only.",
    drawEstimate: 90,
    typicalSetLength: 45,
    availabilityPreference: "ANY_NIGHT",
    latitude: 33.749,
    longitude: -84.388,
  },
  {
    name: "The Treeline",
    location: "Atlanta, GA",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Folk", "Indie Rock"],
    bio: "Quiet songs about loud feelings. Guitar and cello, nothing more.",
    drawEstimate: 40,
    typicalSetLength: 40,
    availabilityPreference: "WEEKNIGHTS",
    latitude: 33.749,
    longitude: -84.388,
  },
  // Atlanta suburbs
  {
    name: "Southside Prophets",
    location: "Decatur, GA",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Hip Hop", "Rap"],
    bio: "Conscious hip hop with a live band. Bars and brass in equal measure.",
    drawEstimate: 130,
    typicalSetLength: 50,
    availabilityPreference: "WEEKENDS",
    latitude: 33.7748,
    longitude: -84.2963,
  },
  {
    name: "The Rust Belt",
    location: "Marietta, GA",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Punk", "Hardcore"],
    bio: "Fast and furious. Named ironically — nothing rusty about these riffs.",
    drawEstimate: 95,
    typicalSetLength: 30,
    availabilityPreference: "ANY_NIGHT",
    latitude: 33.9526,
    longitude: -84.5499,
  },

  // ---- ASHEVILLE, NC (4 in-city + 1 suburb) ----
  {
    name: "Mountain Hymn",
    location: "Asheville, NC",
    artistType: "FULL_BAND",
    memberCount: 5,
    genres: ["Folk", "Bluegrass", "Americana"],
    bio: "Appalachian folk music for the modern age. Banjos and beards.",
    drawEstimate: 80,
    typicalSetLength: 55,
    availabilityPreference: "WEEKENDS",
    latitude: 35.5951,
    longitude: -82.5515,
  },
  {
    name: "The Wildflower Collective",
    location: "Asheville, NC",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Indie Rock", "Psychedelic"],
    bio: "Jam-adjacent indie rock from the mountains. Every show is different.",
    drawEstimate: 110,
    typicalSetLength: 65,
    availabilityPreference: "ANY_NIGHT",
    latitude: 35.5951,
    longitude: -82.5515,
  },
  {
    name: "Appalachian Gothic",
    location: "Asheville, NC",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Folk", "Experimental"],
    bio: "Dark folk from the hollers. Banjo and theremin — you read that right.",
    drawEstimate: 35,
    typicalSetLength: 40,
    availabilityPreference: "WEEKNIGHTS",
    latitude: 35.5951,
    longitude: -82.5515,
  },
  {
    name: "Ember & Ash",
    location: "Asheville, NC",
    artistType: "SOLO",
    memberCount: 1,
    genres: ["Singer-Songwriter", "Folk"],
    bio: "Campfire songs for rainy days. Just a voice and a beaten-up Martin.",
    drawEstimate: 25,
    typicalSetLength: 35,
    availabilityPreference: "ANY_NIGHT",
    latitude: 35.5951,
    longitude: -82.5515,
  },
  // Asheville suburb
  {
    name: "Blue Ridge Outlaws",
    location: "Black Mountain, NC",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Country", "Rock"],
    bio: "Country boys who grew up on punk records. Twang with teeth.",
    drawEstimate: 85,
    typicalSetLength: 50,
    availabilityPreference: "WEEKENDS",
    latitude: 35.6179,
    longitude: -82.3212,
  },

  // ---- GREENVILLE, SC (2 in-city + 1 suburb) ----
  {
    name: "The Reedy River Band",
    location: "Greenville, SC",
    artistType: "FULL_BAND",
    memberCount: 5,
    genres: ["Rock", "Americana"],
    bio: "Greenville's hometown heroes. Named after the falls downtown.",
    drawEstimate: 90,
    typicalSetLength: 55,
    availabilityPreference: "WEEKENDS",
    latitude: 34.8526,
    longitude: -82.394,
  },
  {
    name: "Palmetto Dusk",
    location: "Greenville, SC",
    artistType: "DUO",
    memberCount: 2,
    genres: ["Folk", "Singer-Songwriter"],
    bio: "Gentle harmonies at golden hour. Songs best heard on a porch swing.",
    drawEstimate: 30,
    typicalSetLength: 40,
    availabilityPreference: "ANY_NIGHT",
    latitude: 34.8526,
    longitude: -82.394,
  },
  // Greenville suburb
  {
    name: "Southern Static",
    location: "Spartanburg, SC",
    artistType: "FULL_BAND",
    memberCount: 4,
    genres: ["Punk", "Rock"],
    bio: "Loud and scrappy. Spartanburg's finest export since peaches.",
    drawEstimate: 65,
    typicalSetLength: 35,
    availabilityPreference: "ANY_NIGHT",
    latitude: 34.9496,
    longitude: -81.932,
  },
];

// ---------------------------------------------------------------------------
// Venue seed data (with embedded shows)
// ---------------------------------------------------------------------------
type ShowSeed = {
  title: string;
  daysOut: number; // days from now
  slotsTotal: number;
  genres: string[];
  compensationType: CompensationType | null;
  compensationNote: string;
};

type VenueSeed = {
  name: string;
  city: string;
  address: string;
  capacity: number;
  genres: string[];
  bio: string;
  ageRestriction: "ALL_AGES" | "EIGHTEEN_PLUS" | "TWENTY_ONE_PLUS";
  hasPa: boolean;
  hasBackline: boolean;
  stageSize: string;
  latitude: number;
  longitude: number;
  shows: ShowSeed[];
};

const venues: VenueSeed[] = [
  // ---- NEW YORK CITY ----
  {
    name: "The Bowery Electric",
    city: "New York, NY",
    address: "327 Bowery, New York, NY 10003",
    capacity: 300,
    genres: ["Rock", "Punk", "Indie Rock"],
    bio: "Two stages, zero pretension. A downtown rock institution since 2011.",
    ageRestriction: "TWENTY_ONE_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Medium (20x15)",
    latitude: 40.7128,
    longitude: -74.006,
    shows: [
      {
        title: "Friday Night Fuzz",
        daysOut: 10,
        slotsTotal: 3,
        genres: ["Rock", "Garage Rock", "Punk"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split after expenses",
      },
      {
        title: "Post-Punk After Dark",
        daysOut: 17,
        slotsTotal: 3,
        genres: ["Post-Punk", "Shoegaze", "Indie Rock"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
      {
        title: "Loud & Local",
        daysOut: 24,
        slotsTotal: 4,
        genres: ["Punk", "Hardcore", "Metal"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$150 per band",
      },
    ],
  },
  {
    name: "Blue Note NYC",
    city: "New York, NY",
    address: "131 W 3rd St, New York, NY 10012",
    capacity: 150,
    genres: ["Jazz", "Blues", "Soul"],
    bio: "Legendary Greenwich Village jazz club. World-class sound in an intimate room.",
    ageRestriction: "TWENTY_ONE_PLUS",
    hasPa: true,
    hasBackline: false,
    stageSize: "Small (15x12)",
    latitude: 40.7128,
    longitude: -74.006,
    shows: [
      {
        title: "Late Night Jazz",
        daysOut: 8,
        slotsTotal: 2,
        genres: ["Jazz", "Soul"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$300 per act",
      },
      {
        title: "Blues & Brass",
        daysOut: 15,
        slotsTotal: 2,
        genres: ["Blues", "Jazz", "Funk"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$250 per act",
      },
    ],
  },
  {
    name: "Brooklyn Steel",
    city: "New York, NY",
    address: "319 Frost St, Brooklyn, NY 11222",
    capacity: 800,
    genres: ["Alternative", "Indie Rock", "Electronic"],
    bio: "Williamsburg's premier mid-size venue. Impeccable sound, massive stage.",
    ageRestriction: "EIGHTEEN_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Large (40x25)",
    latitude: 40.7128,
    longitude: -74.006,
    shows: [
      {
        title: "Indie Megashow",
        daysOut: 12,
        slotsTotal: 3,
        genres: ["Indie Rock", "Alternative", "Indie Pop"],
        compensationType: "GUARANTEE_PLUS_DOOR_SPLIT" as CompensationType,
        compensationNote: "$500 guarantee + 80% of door over $2000",
      },
      {
        title: "Electronic Frequencies",
        daysOut: 19,
        slotsTotal: 3,
        genres: ["Electronic", "Ambient", "Experimental"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$400 per act",
      },
    ],
  },
  {
    name: "The Bitter End",
    city: "New York, NY",
    address: "147 Bleecker St, New York, NY 10012",
    capacity: 100,
    genres: ["Folk", "Singer-Songwriter", "Rock"],
    bio: "Since 1961. Where legends played before they were legends.",
    ageRestriction: "ALL_AGES",
    hasPa: true,
    hasBackline: false,
    stageSize: "Small (12x10)",
    latitude: 40.7128,
    longitude: -74.006,
    shows: [
      {
        title: "Songwriter Showcase",
        daysOut: 7,
        slotsTotal: 4,
        genres: ["Singer-Songwriter", "Folk"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "60/40 door split",
      },
      {
        title: "Folk & Friends",
        daysOut: 21,
        slotsTotal: 3,
        genres: ["Folk", "Indie Rock", "Americana"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "65/35 door split",
      },
    ],
  },
  {
    name: "Mercury Lounge",
    city: "New York, NY",
    address: "217 E Houston St, New York, NY 10002",
    capacity: 250,
    genres: ["Indie Rock", "Alternative", "Pop"],
    bio: "LES staple for breaking bands. If they're about to blow up, they play here first.",
    ageRestriction: "TWENTY_ONE_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Medium (18x14)",
    latitude: 40.7128,
    longitude: -74.006,
    shows: [
      {
        title: "Rising Tides",
        daysOut: 9,
        slotsTotal: 3,
        genres: ["Indie Pop", "Pop", "Alternative"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 after $500 expenses",
      },
      {
        title: "Ska-Punk Blowout",
        daysOut: 16,
        slotsTotal: 3,
        genres: ["Ska", "Punk", "Funk"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$200 per band",
      },
      {
        title: "Metal Monday",
        daysOut: 22,
        slotsTotal: 3,
        genres: ["Metal", "Hardcore", "Experimental"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "75/25 door split",
      },
    ],
  },
  {
    name: "Elsewhere",
    city: "New York, NY",
    address: "599 Johnson Ave, Brooklyn, NY 11237",
    capacity: 600,
    genres: ["Electronic", "Hip Hop", "Pop"],
    bio: "Multi-room Bushwick venue. Rooftop, Hall, and Zone — three vibes, one address.",
    ageRestriction: "EIGHTEEN_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Large (35x20)",
    latitude: 40.7128,
    longitude: -74.006,
    shows: [
      {
        title: "R&B After Hours",
        daysOut: 11,
        slotsTotal: 3,
        genres: ["R&B", "Soul", "Pop"],
        compensationType: "GUARANTEE_PLUS_DOOR_SPLIT" as CompensationType,
        compensationNote: "$400 guarantee + door split",
      },
      {
        title: "Bass Culture",
        daysOut: 18,
        slotsTotal: 2,
        genres: ["Electronic", "DJ", "Hip Hop"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$500 per artist",
      },
    ],
  },

  // ---- AUSTIN, TX ----
  {
    name: "Mohawk",
    city: "Austin, TX",
    address: "912 Red River St, Austin, TX 78701",
    capacity: 400,
    genres: ["Rock", "Punk", "Indie Rock"],
    bio: "Red River district anchor. Indoor/outdoor stages on the strip.",
    ageRestriction: "ALL_AGES",
    hasPa: true,
    hasBackline: true,
    stageSize: "Medium (22x16)",
    latitude: 30.2672,
    longitude: -97.7431,
    shows: [
      {
        title: "Red River Rumble",
        daysOut: 14,
        slotsTotal: 4,
        genres: ["Rock", "Punk", "Garage Rock"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
      {
        title: "Psych Night",
        daysOut: 21,
        slotsTotal: 3,
        genres: ["Psychedelic", "Indie Rock", "Experimental"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "65/35 door split",
      },
    ],
  },
  {
    name: "The Continental Club",
    city: "Austin, TX",
    address: "1315 S Congress Ave, Austin, TX 78704",
    capacity: 200,
    genres: ["Country", "Blues", "Americana"],
    bio: "South Congress legend. Honky tonk and blues seven nights a week.",
    ageRestriction: "TWENTY_ONE_PLUS",
    hasPa: true,
    hasBackline: false,
    stageSize: "Small (15x12)",
    latitude: 30.2672,
    longitude: -97.7431,
    shows: [
      {
        title: "Honky Tonk Tuesday",
        daysOut: 11,
        slotsTotal: 2,
        genres: ["Country", "Americana"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "60/40 plus tips",
      },
      {
        title: "Blues Brunch",
        daysOut: 14,
        slotsTotal: 2,
        genres: ["Blues", "Rock", "Funk"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$200 per act",
      },
      {
        title: "Bluegrass Picker's Circle",
        daysOut: 25,
        slotsTotal: 3,
        genres: ["Bluegrass", "Folk"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "All door to artists",
      },
    ],
  },
  {
    name: "Empire Control Room",
    city: "Austin, TX",
    address: "606 E 7th St, Austin, TX 78701",
    capacity: 500,
    genres: ["Electronic", "Hip Hop", "Alternative"],
    bio: "Multi-room east side venue. Garage and Control Room stages.",
    ageRestriction: "EIGHTEEN_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Large (30x18)",
    latitude: 30.2672,
    longitude: -97.7431,
    shows: [
      {
        title: "Frequency Friday",
        daysOut: 10,
        slotsTotal: 3,
        genres: ["Electronic", "Ambient", "DJ"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$350 per act",
      },
      {
        title: "Alt Showcase",
        daysOut: 20,
        slotsTotal: 3,
        genres: ["Alternative", "Indie Rock", "Pop"],
        compensationType: "GUARANTEE_PLUS_DOOR_SPLIT" as CompensationType,
        compensationNote: "$300 guarantee + 70% of door",
      },
    ],
  },
  {
    name: "Hole in the Wall",
    city: "Austin, TX",
    address: "2538 Guadalupe St, Austin, TX 78705",
    capacity: 80,
    genres: ["Indie Rock", "Folk", "Singer-Songwriter"],
    bio: "UT-area dive bar. Cheap beer, loud bands, no pretense since 1974.",
    ageRestriction: "ALL_AGES",
    hasPa: true,
    hasBackline: false,
    stageSize: "Tiny (10x8)",
    latitude: 30.2672,
    longitude: -97.7431,
    shows: [
      {
        title: "Open Mic Spotlight",
        daysOut: 7,
        slotsTotal: 5,
        genres: ["Singer-Songwriter", "Folk"],
        compensationType: "OTHER" as CompensationType,
        compensationNote: "Tip jar — keep what you earn",
      },
      {
        title: "Indie Tuesday",
        daysOut: 18,
        slotsTotal: 3,
        genres: ["Indie Rock", "Indie Pop", "Folk"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "All door to artists",
      },
    ],
  },

  // ---- NASHVILLE, TN ----
  {
    name: "The Basement",
    city: "Nashville, TN",
    address: "1604 8th Ave S, Nashville, TN 37203",
    capacity: 100,
    genres: ["Rock", "Indie Rock", "Punk"],
    bio: "Underground in every sense. Nashville's best-kept rock secret.",
    ageRestriction: "TWENTY_ONE_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Small (14x10)",
    latitude: 36.1627,
    longitude: -86.7816,
    shows: [
      {
        title: "Garage Night",
        daysOut: 9,
        slotsTotal: 3,
        genres: ["Garage Rock", "Punk", "Rock"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
      {
        title: "Indie Spotlight",
        daysOut: 16,
        slotsTotal: 3,
        genres: ["Indie Rock", "Indie Pop", "Singer-Songwriter"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "65/35 door split",
      },
    ],
  },
  {
    name: "The Bluebird Cafe",
    city: "Nashville, TN",
    address: "4104 Hillsboro Pike, Nashville, TN 37215",
    capacity: 90,
    genres: ["Singer-Songwriter", "Folk", "Country"],
    bio: "The songwriter's sanctuary. Where Nashville's best songs get their first audience.",
    ageRestriction: "ALL_AGES",
    hasPa: true,
    hasBackline: false,
    stageSize: "Tiny (10x8)",
    latitude: 36.1627,
    longitude: -86.7816,
    shows: [
      {
        title: "In the Round",
        daysOut: 8,
        slotsTotal: 4,
        genres: ["Singer-Songwriter", "Folk", "Country"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$100 per songwriter",
      },
      {
        title: "Bluegrass Sunday",
        daysOut: 13,
        slotsTotal: 3,
        genres: ["Bluegrass", "Folk", "Americana"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "All door to artists",
      },
    ],
  },
  {
    name: "Exit/In",
    city: "Nashville, TN",
    address: "2208 Elliston Pl, Nashville, TN 37203",
    capacity: 300,
    genres: ["Rock", "Alternative", "Indie Rock"],
    bio: "Elliston Place landmark since 1971. Every genre, every era.",
    ageRestriction: "EIGHTEEN_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Medium (20x15)",
    latitude: 36.1627,
    longitude: -86.7816,
    shows: [
      {
        title: "Rock Block",
        daysOut: 12,
        slotsTotal: 3,
        genres: ["Rock", "Alternative", "Punk"],
        compensationType: "GUARANTEE_PLUS_DOOR_SPLIT" as CompensationType,
        compensationNote: "$200 guarantee + 70% of door",
      },
      {
        title: "Country Crossover",
        daysOut: 19,
        slotsTotal: 3,
        genres: ["Country", "Americana", "Rock"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
      {
        title: "Blues & Brews",
        daysOut: 26,
        slotsTotal: 2,
        genres: ["Blues", "Rock", "Folk"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$250 per act",
      },
    ],
  },

  // ---- ATLANTA, GA ----
  {
    name: "The Earl",
    city: "Atlanta, GA",
    address: "488 Flat Shoals Ave SE, Atlanta, GA 30316",
    capacity: 200,
    genres: ["Rock", "Punk", "Indie Rock"],
    bio: "East Atlanta Village dive. Killer burgers, killer bands.",
    ageRestriction: "TWENTY_ONE_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Small (16x12)",
    latitude: 33.749,
    longitude: -84.388,
    shows: [
      {
        title: "Punk & Pints",
        daysOut: 10,
        slotsTotal: 3,
        genres: ["Punk", "Hardcore", "Rock"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
      {
        title: "Southern Fried Rock",
        daysOut: 17,
        slotsTotal: 3,
        genres: ["Rock", "Blues", "Indie Rock"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "65/35 door split",
      },
    ],
  },
  {
    name: "Terminal West",
    city: "Atlanta, GA",
    address: "887 W Marietta St NW, Atlanta, GA 30318",
    capacity: 600,
    genres: ["Alternative", "Hip Hop", "R&B"],
    bio: "Westside warehouse venue. Big room energy, top-tier production.",
    ageRestriction: "EIGHTEEN_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Large (35x20)",
    latitude: 33.749,
    longitude: -84.388,
    shows: [
      {
        title: "ATL Funk Fest",
        daysOut: 13,
        slotsTotal: 3,
        genres: ["Funk", "Soul", "R&B"],
        compensationType: "GUARANTEE_PLUS_DOOR_SPLIT" as CompensationType,
        compensationNote: "$400 guarantee + 75% of door",
      },
      {
        title: "Hip Hop Live",
        daysOut: 20,
        slotsTotal: 3,
        genres: ["Hip Hop", "Rap", "Jazz"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$350 per act",
      },
      {
        title: "Indie ATL",
        daysOut: 27,
        slotsTotal: 3,
        genres: ["Alternative", "Indie Rock", "Pop"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
    ],
  },
  {
    name: "Eddie's Attic",
    city: "Atlanta, GA",
    address: "515-B N McDonough St, Decatur, GA 30030",
    capacity: 100,
    genres: ["Folk", "Singer-Songwriter"],
    bio: "Decatur listening room. Where John Mayer and the Indigo Girls got started.",
    ageRestriction: "ALL_AGES",
    hasPa: true,
    hasBackline: false,
    stageSize: "Small (12x10)",
    latitude: 33.749,
    longitude: -84.388,
    shows: [
      {
        title: "Songwriter Night",
        daysOut: 9,
        slotsTotal: 4,
        genres: ["Singer-Songwriter", "Folk"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "All door to artists",
      },
      {
        title: "Acoustic Sessions",
        daysOut: 23,
        slotsTotal: 3,
        genres: ["Folk", "Americana", "Blues"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "60/40 door split",
      },
    ],
  },

  // ---- ASHEVILLE, NC ----
  {
    name: "The Orange Peel",
    city: "Asheville, NC",
    address: "101 Biltmore Ave, Asheville, NC 28801",
    capacity: 400,
    genres: ["Rock", "Indie Rock", "Alternative"],
    bio: "Named one of the top rock clubs in America. The mountain town's crown jewel.",
    ageRestriction: "EIGHTEEN_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Large (30x18)",
    latitude: 35.5951,
    longitude: -82.5515,
    shows: [
      {
        title: "Mountain Music Festival",
        daysOut: 15,
        slotsTotal: 4,
        genres: ["Rock", "Indie Rock", "Folk"],
        compensationType: "GUARANTEE_PLUS_DOOR_SPLIT" as CompensationType,
        compensationNote: "$300 guarantee + 70% of door",
      },
      {
        title: "Psychedelic Saturday",
        daysOut: 22,
        slotsTotal: 3,
        genres: ["Psychedelic", "Experimental", "Indie Rock"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
    ],
  },
  {
    name: "Isis Music Hall",
    city: "Asheville, NC",
    address: "743 Haywood Rd, Asheville, NC 28806",
    capacity: 100,
    genres: ["Folk", "Bluegrass", "Singer-Songwriter"],
    bio: "West Asheville gem in a converted theater. Pristine acoustics for roots music.",
    ageRestriction: "ALL_AGES",
    hasPa: true,
    hasBackline: false,
    stageSize: "Small (14x10)",
    latitude: 35.5951,
    longitude: -82.5515,
    shows: [
      {
        title: "Roots & Branches",
        daysOut: 10,
        slotsTotal: 3,
        genres: ["Folk", "Bluegrass", "Americana"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "All door to artists",
      },
      {
        title: "Country Dark",
        daysOut: 24,
        slotsTotal: 2,
        genres: ["Country", "Folk", "Singer-Songwriter"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$150 per act",
      },
    ],
  },

  // ---- GREENVILLE, SC ----
  {
    name: "Radio Room",
    city: "Greenville, SC",
    address: "5 Pendleton St, Greenville, SC 29601",
    capacity: 150,
    genres: ["Indie Rock", "Rock", "Folk"],
    bio: "Downtown Greenville's go-to for touring indie bands and local favorites.",
    ageRestriction: "ALL_AGES",
    hasPa: true,
    hasBackline: true,
    stageSize: "Small (16x12)",
    latitude: 34.8526,
    longitude: -82.394,
    shows: [
      {
        title: "Upstate Showcase",
        daysOut: 11,
        slotsTotal: 3,
        genres: ["Rock", "Indie Rock", "Americana"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "70/30 door split",
      },
      {
        title: "Folk by the Falls",
        daysOut: 18,
        slotsTotal: 3,
        genres: ["Folk", "Singer-Songwriter"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "All door to artists",
      },
    ],
  },
  {
    name: "Gottrocks",
    city: "Greenville, SC",
    address: "439 S Main St, Greenville, SC 29601",
    capacity: 250,
    genres: ["Rock", "Punk", "Alternative"],
    bio: "Main Street rock club. Two floors of loud music and good times.",
    ageRestriction: "EIGHTEEN_PLUS",
    hasPa: true,
    hasBackline: true,
    stageSize: "Medium (20x14)",
    latitude: 34.8526,
    longitude: -82.394,
    shows: [
      {
        title: "Punk Rock Bowling",
        daysOut: 13,
        slotsTotal: 4,
        genres: ["Punk", "Rock", "Hardcore"],
        compensationType: "DOOR_SPLIT" as CompensationType,
        compensationNote: "65/35 door split",
      },
      {
        title: "Southern Indie Night",
        daysOut: 20,
        slotsTotal: 3,
        genres: ["Alternative", "Indie Rock", "Pop"],
        compensationType: "GUARANTEE" as CompensationType,
        compensationNote: "$175 per band",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------
async function main() {
  // 1. Seed genres
  for (const name of genres) {
    await prisma.genre.upsert({
      where: { slug: slug(name) },
      update: {},
      create: { name, slug: slug(name) },
    });
  }
  console.log(`Seeded ${genres.length} genres`);

  // Look up all genres for connecting relations
  const allGenres = await prisma.genre.findMany();
  const genreMap = new Map(allGenres.map((g) => [g.name, g.id]));

  // Shared password hash
  const passwordHash = await hash("password123", 10);

  // Helper: resolve genre names to connect array
  function connectGenres(names: string[]) {
    return names
      .map((n) => genreMap.get(n))
      .filter(Boolean)
      .map((id) => ({ id: id as string }));
  }

  // 2. Seed artists
  let artistCount = 0;
  for (const a of artists) {
    const email = emailify(a.name);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  Skipping artist "${a.name}" (already exists)`);
      continue;
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ARTIST",
        artistProfile: {
          create: {
            name: a.name,
            bio: a.bio,
            location: a.location,
            latitude: a.latitude,
            longitude: a.longitude,
            artistType: a.artistType,
            memberCount: a.memberCount,
            drawEstimate: a.drawEstimate,
            typicalSetLength: a.typicalSetLength,
            availabilityPreference: a.availabilityPreference,
            genres: { connect: connectGenres(a.genres) },
          },
        },
      },
    });
    artistCount++;
  }
  console.log(`Seeded ${artistCount} artists`);

  // 3. Seed venues + shows
  let venueCount = 0;
  let showCount = 0;
  for (const v of venues) {
    const email = emailify(v.name);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  Skipping venue "${v.name}" (already exists)`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "VENUE",
        venueProfile: {
          create: {
            name: v.name,
            bio: v.bio,
            address: v.address,
            city: v.city,
            latitude: v.latitude,
            longitude: v.longitude,
            capacity: v.capacity,
            hasPa: v.hasPa,
            hasBackline: v.hasBackline,
            stageSize: v.stageSize,
            ageRestriction: v.ageRestriction,
            genres: { connect: connectGenres(v.genres) },
          },
        },
      },
      include: { venueProfile: true },
    });

    // Create shows for this venue
    for (const s of v.shows) {
      await prisma.show.create({
        data: {
          venueId: user.venueProfile!.id,
          title: s.title,
          date: daysFromNow(s.daysOut),
          slotsTotal: s.slotsTotal,
          compensationType: s.compensationType as CompensationType,
          compensationNote: s.compensationNote,
          genres: { connect: connectGenres(s.genres) },
        },
      });
      showCount++;
    }
    venueCount++;
  }
  console.log(`Seeded ${venueCount} venues with ${showCount} shows`);

  // 4. Seed super admin
  const adminEmail = "admin@backline.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });
    console.log("Seeded super admin (admin@backline.com)");
  } else {
    console.log("  Skipping admin (already exists)");
  }

  console.log("\nDone! All users have password: password123");
  console.log("Run the matching engine to generate matches.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

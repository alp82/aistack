// src/emoji.ts
import {
  combineTransactionSteps,
  escapeForRegEx,
  findChildrenInRange,
  getChangedRanges,
  InputRule,
  mergeAttributes,
  Node,
  nodeInputRule,
  PasteRule
} from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import emojiRegex from "emoji-regex";
import { isEmojiSupported } from "is-emoji-supported";

// src/data.ts
var emojis = [
  {
    emoji: "\u{1F1E6}",
    name: "regional_indicator_a",
    shortcodes: ["regional_indicator_a"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1E7}",
    name: "regional_indicator_b",
    shortcodes: ["regional_indicator_b"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1E8}",
    name: "regional_indicator_c",
    shortcodes: ["regional_indicator_c"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1E9}",
    name: "regional_indicator_d",
    shortcodes: ["regional_indicator_d"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1EA}",
    name: "regional_indicator_e",
    shortcodes: ["regional_indicator_e"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1EB}",
    name: "regional_indicator_f",
    shortcodes: ["regional_indicator_f"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1EC}",
    name: "regional_indicator_g",
    shortcodes: ["regional_indicator_g"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1ED}",
    name: "regional_indicator_h",
    shortcodes: ["regional_indicator_h"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1EE}",
    name: "regional_indicator_i",
    shortcodes: ["regional_indicator_i"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1EF}",
    name: "regional_indicator_j",
    shortcodes: ["regional_indicator_j"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F0}",
    name: "regional_indicator_k",
    shortcodes: ["regional_indicator_k"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F1}",
    name: "regional_indicator_l",
    shortcodes: ["regional_indicator_l"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F2}",
    name: "regional_indicator_m",
    shortcodes: ["regional_indicator_m"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F3}",
    name: "regional_indicator_n",
    shortcodes: ["regional_indicator_n"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F4}",
    name: "regional_indicator_o",
    shortcodes: ["regional_indicator_o"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F5}",
    name: "regional_indicator_p",
    shortcodes: ["regional_indicator_p"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F6}",
    name: "regional_indicator_q",
    shortcodes: ["regional_indicator_q"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F7}",
    name: "regional_indicator_r",
    shortcodes: ["regional_indicator_r"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F8}",
    name: "regional_indicator_s",
    shortcodes: ["regional_indicator_s"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1F9}",
    name: "regional_indicator_t",
    shortcodes: ["regional_indicator_t"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1FA}",
    name: "regional_indicator_u",
    shortcodes: ["regional_indicator_u"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1FB}",
    name: "regional_indicator_v",
    shortcodes: ["regional_indicator_v"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1FC}",
    name: "regional_indicator_w",
    shortcodes: ["regional_indicator_w"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1FD}",
    name: "regional_indicator_x",
    shortcodes: ["regional_indicator_x"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1FE}",
    name: "regional_indicator_y",
    shortcodes: ["regional_indicator_y"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F1FF}",
    name: "regional_indicator_z",
    shortcodes: ["regional_indicator_z"],
    tags: [],
    group: "",
    emoticons: [],
    version: 0
  },
  {
    emoji: "\u{1F600}",
    name: "grinning",
    shortcodes: ["grinning", "grinning_face"],
    tags: ["face", "grin"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f600.png"
  },
  {
    emoji: "\u{1F603}",
    name: "smiley",
    shortcodes: ["grinning_face_with_big_eyes", "smiley"],
    tags: ["face", "mouth", "open", "smile"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f603.png"
  },
  {
    emoji: "\u{1F604}",
    name: "smile",
    shortcodes: ["grinning_face_with_closed_eyes", "smile"],
    tags: ["eye", "face", "mouth", "open", "smile"],
    group: "",
    emoticons: [":D"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f604.png"
  },
  {
    emoji: "\u{1F601}",
    name: "grin",
    shortcodes: ["beaming_face", "grin"],
    tags: ["eye", "face", "grin", "smile"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f601.png"
  },
  {
    emoji: "\u{1F606}",
    name: "laughing",
    shortcodes: ["laughing", "lol", "satisfied", "squinting_face"],
    tags: ["face", "laugh", "mouth", "satisfied", "smile"],
    group: "",
    emoticons: ["xD", "XD"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f606.png"
  },
  {
    emoji: "\u{1F605}",
    name: "sweat_smile",
    shortcodes: ["grinning_face_with_sweat", "sweat_smile"],
    tags: ["cold", "face", "open", "smile", "sweat"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f605.png"
  },
  {
    emoji: "\u{1F923}",
    name: "rofl",
    shortcodes: ["rofl"],
    tags: ["face", "floor", "laugh", "rofl", "rolling", "rotfl"],
    group: "",
    emoticons: [":'D"],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f923.png"
  },
  {
    emoji: "\u{1F602}",
    name: "joy",
    shortcodes: ["joy", "lmao", "tears_of_joy"],
    tags: ["face", "joy", "laugh", "tear"],
    group: "",
    emoticons: [":')"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f602.png"
  },
  {
    emoji: "\u{1F642}",
    name: "slightly_smiling_face",
    shortcodes: ["slightly_smiling_face"],
    tags: ["face", "smile"],
    group: "",
    emoticons: [":)"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f642.png"
  },
  {
    emoji: "\u{1F643}",
    name: "upside_down_face",
    shortcodes: ["upside_down_face"],
    tags: ["face", "upside-down"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f643.png"
  },
  {
    emoji: "\u{1FAE0}",
    name: "melting_face",
    shortcodes: ["melt", "melting_face"],
    tags: ["disappear", "dissolve", "liquid", "melt"],
    group: "",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F609}",
    name: "wink",
    shortcodes: ["wink", "winking_face"],
    tags: ["face", "wink"],
    group: "",
    emoticons: [";)"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f609.png"
  },
  {
    emoji: "\u{1F60A}",
    name: "blush",
    shortcodes: ["blush", "smiling_face_with_closed_eyes"],
    tags: ["blush", "eye", "face", "smile"],
    group: "",
    emoticons: [":>"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60a.png"
  },
  {
    emoji: "\u{1F607}",
    name: "innocent",
    shortcodes: ["halo", "innocent"],
    tags: ["angel", "face", "fantasy", "halo", "innocent"],
    group: "",
    emoticons: ["o:)", "O:)"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f607.png"
  },
  {
    emoji: "\u{1F970}",
    name: "smiling_face_with_three_hearts",
    shortcodes: ["smiling_face_with_3_hearts"],
    tags: ["adore", "crush", "hearts", "in love"],
    group: "",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f970.png"
  },
  {
    emoji: "\u{1F60D}",
    name: "heart_eyes",
    shortcodes: ["heart_eyes", "smiling_face_with_heart_eyes"],
    tags: ["eye", "face", "love", "smile"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60d.png"
  },
  {
    emoji: "\u{1F929}",
    name: "star_struck",
    shortcodes: ["star_struck"],
    tags: ["eyes", "face", "grinning", "star"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f929.png"
  },
  {
    emoji: "\u{1F618}",
    name: "kissing_heart",
    shortcodes: ["blowing_a_kiss", "kissing_heart"],
    tags: ["face", "kiss"],
    group: "",
    emoticons: [":x", ":X"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f618.png"
  },
  {
    emoji: "\u{1F617}",
    name: "kissing",
    shortcodes: ["kissing", "kissing_face"],
    tags: ["face", "kiss"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f617.png"
  },
  {
    emoji: "\u263A",
    name: "relaxed",
    shortcodes: ["relaxed", "smiling_face"],
    tags: ["face", "outlined", "relaxed", "smile"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/263a-fe0f.png"
  },
  {
    emoji: "\u{1F61A}",
    name: "kissing_closed_eyes",
    shortcodes: ["kissing_closed_eyes", "kissing_face_with_closed_eyes"],
    tags: ["closed", "eye", "face", "kiss"],
    group: "",
    emoticons: [":*"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f61a.png"
  },
  {
    emoji: "\u{1F619}",
    name: "kissing_smiling_eyes",
    shortcodes: ["kissing_face_with_smiling_eyes", "kissing_smiling_eyes"],
    tags: ["eye", "face", "kiss", "smile"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f619.png"
  },
  {
    emoji: "\u{1F972}",
    name: "smiling_face_with_tear",
    shortcodes: ["smiling_face_with_tear"],
    tags: ["grateful", "proud", "relieved", "smiling", "tear", "touched"],
    group: "",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f972.png"
  },
  {
    emoji: "\u{1F60B}",
    name: "yum",
    shortcodes: ["savoring_food", "yum"],
    tags: ["delicious", "face", "savouring", "smile", "yum"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60b.png"
  },
  {
    emoji: "\u{1F61B}",
    name: "stuck_out_tongue",
    shortcodes: ["face_with_tongue", "stuck_out_tongue"],
    tags: ["face", "tongue"],
    group: "",
    emoticons: [":p", ":P"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f61b.png"
  },
  {
    emoji: "\u{1F61C}",
    name: "stuck_out_tongue_winking_eye",
    shortcodes: ["stuck_out_tongue_winking_eye"],
    tags: ["eye", "face", "joke", "tongue", "wink"],
    group: "",
    emoticons: [";p", ";P"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f61c.png"
  },
  {
    emoji: "\u{1F92A}",
    name: "zany_face",
    shortcodes: ["zany", "zany_face"],
    tags: ["eye", "goofy", "large", "small"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f92a.png"
  },
  {
    emoji: "\u{1F61D}",
    name: "stuck_out_tongue_closed_eyes",
    shortcodes: ["stuck_out_tongue_closed_eyes"],
    tags: ["eye", "face", "horrible", "taste", "tongue"],
    group: "",
    emoticons: ["xp", "xP", "XP"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f61d.png"
  },
  {
    emoji: "\u{1F911}",
    name: "money_mouth_face",
    shortcodes: ["money_mouth_face"],
    tags: ["face", "money", "mouth"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f911.png"
  },
  {
    emoji: "\u{1F917}",
    name: "hugs",
    shortcodes: ["hug", "hugging", "hugging_face"],
    tags: ["face", "hug", "hugging", "open hands", "smiling face"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f917.png"
  },
  {
    emoji: "\u{1F92D}",
    name: "hand_over_mouth",
    shortcodes: ["face_with_hand_over_mouth", "hand_over_mouth"],
    tags: ["whoops"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f92d.png"
  },
  {
    emoji: "\u{1FAE2}",
    name: "face_with_open_eyes_and_hand_over_mouth",
    shortcodes: ["face_with_open_eyes_hand_over_mouth", "gasp"],
    tags: ["amazement", "awe", "disbelief", "embarrass", "scared", "surprise"],
    group: "",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FAE3}",
    name: "face_with_peeking_eye",
    shortcodes: ["face_with_peeking_eye", "peek"],
    tags: ["captivated", "peep", "stare"],
    group: "",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F92B}",
    name: "shushing_face",
    shortcodes: ["shush", "shushing_face"],
    tags: ["quiet", "shush"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f92b.png"
  },
  {
    emoji: "\u{1F914}",
    name: "thinking",
    shortcodes: ["thinking", "thinking_face", "wtf"],
    tags: ["face", "thinking"],
    group: "",
    emoticons: [":l", ":L"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f914.png"
  },
  {
    emoji: "\u{1FAE1}",
    name: "saluting_face",
    shortcodes: ["salute", "saluting_face"],
    tags: ["ok", "salute", "sunny", "troops", "yes"],
    group: "",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F910}",
    name: "zipper_mouth_face",
    shortcodes: ["zipper_mouth", "zipper_mouth_face"],
    tags: ["face", "mouth", "zip", "zipper"],
    group: "",
    emoticons: [":z", ":Z"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f910.png"
  },
  {
    emoji: "\u{1F928}",
    name: "raised_eyebrow",
    shortcodes: ["face_with_raised_eyebrow", "raised_eyebrow"],
    tags: ["distrust", "skeptic"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f928.png"
  },
  {
    emoji: "\u{1F610}",
    name: "neutral_face",
    shortcodes: ["neutral", "neutral_face"],
    tags: ["deadpan", "face", "meh", "neutral"],
    group: "",
    emoticons: [":|"],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f610.png"
  },
  {
    emoji: "\u{1F611}",
    name: "expressionless",
    shortcodes: ["expressionless", "expressionless_face"],
    tags: ["expressionless", "face", "inexpressive", "meh", "unexpressive"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f611.png"
  },
  {
    emoji: "\u{1F636}",
    name: "no_mouth",
    shortcodes: ["no_mouth"],
    tags: ["face", "mouth", "quiet", "silent"],
    group: "",
    emoticons: [":#"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f636.png"
  },
  {
    emoji: "\u{1FAE5}",
    name: "dotted_line_face",
    shortcodes: ["dotted_line_face"],
    tags: ["depressed", "disappear", "hide", "introvert", "invisible"],
    group: "",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F636}\u200D\u{1F32B}",
    name: "face_in_clouds",
    shortcodes: ["in_clouds"],
    tags: ["absentminded", "face in the fog", "head in clouds"],
    group: "",
    emoticons: [],
    version: 13.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f636-200d-1f32b-fe0f.png"
  },
  {
    emoji: "\u{1F60F}",
    name: "smirk",
    shortcodes: ["smirk", "smirking", "smirking_face"],
    tags: ["face", "smirk"],
    group: "",
    emoticons: [":j"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60f.png"
  },
  {
    emoji: "\u{1F612}",
    name: "unamused",
    shortcodes: ["unamused", "unamused_face"],
    tags: ["face", "unamused", "unhappy"],
    group: "",
    emoticons: [":?"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f612.png"
  },
  {
    emoji: "\u{1F644}",
    name: "roll_eyes",
    shortcodes: ["rolling_eyes"],
    tags: ["eyeroll", "eyes", "face", "rolling"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f644.png"
  },
  {
    emoji: "\u{1F62C}",
    name: "grimacing",
    shortcodes: ["grimacing", "grimacing_face"],
    tags: ["face", "grimace"],
    group: "",
    emoticons: ["8D"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f62c.png"
  },
  {
    emoji: "\u{1F62E}\u200D\u{1F4A8}",
    name: "face_exhaling",
    shortcodes: ["exhale", "exhaling"],
    tags: ["exhale", "gasp", "groan", "relief", "whisper", "whistle"],
    group: "",
    emoticons: [],
    version: 13.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f62e-200d-1f4a8.png"
  },
  {
    emoji: "\u{1F925}",
    name: "lying_face",
    shortcodes: ["lying", "lying_face"],
    tags: ["face", "lie", "pinocchio"],
    group: "",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f925.png"
  },
  {
    emoji: "\u{1FAE8}",
    name: "shaking_face",
    shortcodes: ["shaking", "shaking_face"],
    tags: ["earthquake", "face", "shaking", "shock", "vibrate"],
    group: "",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F642}\u200D\u2194",
    name: "head_shaking_horizontally",
    shortcodes: ["head_shaking_horizontally"],
    tags: ["no", "shake"],
    group: "",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F642}\u200D\u2195",
    name: "head_shaking_vertically",
    shortcodes: ["head_shaking_vertically"],
    tags: ["nod", "yes"],
    group: "",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F60C}",
    name: "relieved",
    shortcodes: ["relieved", "relieved_face"],
    tags: ["face", "relieved"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60c.png"
  },
  {
    emoji: "\u{1F614}",
    name: "pensive",
    shortcodes: ["pensive", "pensive_face"],
    tags: ["dejected", "face", "pensive"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f614.png"
  },
  {
    emoji: "\u{1F62A}",
    name: "sleepy",
    shortcodes: ["sleepy", "sleepy_face"],
    tags: ["face", "good night", "sleep"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f62a.png"
  },
  {
    emoji: "\u{1F924}",
    name: "drooling_face",
    shortcodes: ["drooling", "drooling_face"],
    tags: ["drooling", "face"],
    group: "",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f924.png"
  },
  {
    emoji: "\u{1F634}",
    name: "sleeping",
    shortcodes: ["sleeping", "sleeping_face"],
    tags: ["face", "good night", "sleep", "zzz"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f634.png"
  },
  {
    emoji: "\u{1F637}",
    name: "mask",
    shortcodes: ["mask", "medical_mask"],
    tags: ["cold", "doctor", "face", "mask", "sick"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f637.png"
  },
  {
    emoji: "\u{1F912}",
    name: "face_with_thermometer",
    shortcodes: ["face_with_thermometer"],
    tags: ["face", "ill", "sick", "thermometer"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f912.png"
  },
  {
    emoji: "\u{1F915}",
    name: "face_with_head_bandage",
    shortcodes: ["face_with_head_bandage"],
    tags: ["bandage", "face", "hurt", "injury"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f915.png"
  },
  {
    emoji: "\u{1F922}",
    name: "nauseated_face",
    shortcodes: ["nauseated", "nauseated_face"],
    tags: ["face", "nauseated", "vomit"],
    group: "",
    emoticons: ["%("],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f922.png"
  },
  {
    emoji: "\u{1F92E}",
    name: "vomiting_face",
    shortcodes: ["face_vomiting", "vomiting"],
    tags: ["puke", "sick", "vomit"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f92e.png"
  },
  {
    emoji: "\u{1F927}",
    name: "sneezing_face",
    shortcodes: ["sneezing", "sneezing_face"],
    tags: ["face", "gesundheit", "sneeze"],
    group: "",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f927.png"
  },
  {
    emoji: "\u{1F975}",
    name: "hot_face",
    shortcodes: ["hot", "hot_face"],
    tags: ["feverish", "heat stroke", "hot", "red-faced", "sweating"],
    group: "",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f975.png"
  },
  {
    emoji: "\u{1F976}",
    name: "cold_face",
    shortcodes: ["cold", "cold_face"],
    tags: ["blue-faced", "cold", "freezing", "frostbite", "icicles"],
    group: "",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f976.png"
  },
  {
    emoji: "\u{1F974}",
    name: "woozy_face",
    shortcodes: ["woozy", "woozy_face"],
    tags: ["dizzy", "intoxicated", "tipsy", "uneven eyes", "wavy mouth"],
    group: "",
    emoticons: [":&"],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f974.png"
  },
  {
    emoji: "\u{1F635}",
    name: "dizzy_face",
    shortcodes: ["dizzy_face", "knocked_out"],
    tags: ["crossed-out eyes", "dead", "face", "knocked out"],
    group: "",
    emoticons: ["xo", "XO"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f635.png"
  },
  {
    emoji: "\u{1F635}\u200D\u{1F4AB}",
    name: "face_with_spiral_eyes",
    shortcodes: ["dizzy_eyes"],
    tags: ["dizzy", "hypnotized", "spiral", "trouble", "whoa"],
    group: "",
    emoticons: [],
    version: 13.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f635-200d-1f4ab.png"
  },
  {
    emoji: "\u{1F92F}",
    name: "exploding_head",
    shortcodes: ["exploding_head"],
    tags: ["mind blown", "shocked"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f92f.png"
  },
  {
    emoji: "\u{1F920}",
    name: "cowboy_hat_face",
    shortcodes: ["cowboy", "cowboy_face"],
    tags: ["cowboy", "cowgirl", "face", "hat"],
    group: "",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f920.png"
  },
  {
    emoji: "\u{1F973}",
    name: "partying_face",
    shortcodes: ["hooray", "partying", "partying_face"],
    tags: ["celebration", "hat", "horn", "party"],
    group: "",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f973.png"
  },
  {
    emoji: "\u{1F978}",
    name: "disguised_face",
    shortcodes: ["disguised", "disguised_face"],
    tags: ["disguise", "face", "glasses", "incognito", "nose"],
    group: "",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f978.png"
  },
  {
    emoji: "\u{1F60E}",
    name: "sunglasses",
    shortcodes: ["smiling_face_with_sunglasses", "sunglasses_cool", "too_cool"],
    tags: ["bright", "cool", "face", "sun", "sunglasses"],
    group: "",
    emoticons: ["8)"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60e.png"
  },
  {
    emoji: "\u{1F913}",
    name: "nerd_face",
    shortcodes: ["nerd", "nerd_face"],
    tags: ["face", "geek", "nerd"],
    group: "",
    emoticons: [":B"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f913.png"
  },
  {
    emoji: "\u{1F9D0}",
    name: "monocle_face",
    shortcodes: ["face_with_monocle"],
    tags: ["face", "monocle", "stuffy"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d0.png"
  },
  {
    emoji: "\u{1F615}",
    name: "confused",
    shortcodes: ["confused", "confused_face"],
    tags: ["confused", "face", "meh"],
    group: "",
    emoticons: [":/"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f615.png"
  },
  {
    emoji: "\u{1FAE4}",
    name: "face_with_diagonal_mouth",
    shortcodes: ["face_with_diagonal_mouth"],
    tags: ["disappointed", "meh", "skeptical", "unsure"],
    group: "",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F61F}",
    name: "worried",
    shortcodes: ["worried", "worried_face"],
    tags: ["face", "worried"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f61f.png"
  },
  {
    emoji: "\u{1F641}",
    name: "slightly_frowning_face",
    shortcodes: ["slightly_frowning_face"],
    tags: ["face", "frown"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f641.png"
  },
  {
    emoji: "\u2639",
    name: "frowning_face",
    shortcodes: ["white_frowning_face"],
    tags: ["face", "frown"],
    group: "",
    emoticons: [":("],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2639-fe0f.png"
  },
  {
    emoji: "\u{1F62E}",
    name: "open_mouth",
    shortcodes: ["face_with_open_mouth", "open_mouth"],
    tags: ["face", "mouth", "open", "sympathy"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f62e.png"
  },
  {
    emoji: "\u{1F62F}",
    name: "hushed",
    shortcodes: ["hushed", "hushed_face"],
    tags: ["face", "hushed", "stunned", "surprised"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f62f.png"
  },
  {
    emoji: "\u{1F632}",
    name: "astonished",
    shortcodes: ["astonished", "astonished_face"],
    tags: ["astonished", "face", "shocked", "totally"],
    group: "",
    emoticons: [":o", ":O"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f632.png"
  },
  {
    emoji: "\u{1F633}",
    name: "flushed",
    shortcodes: ["flushed", "flushed_face"],
    tags: ["dazed", "face", "flushed"],
    group: "",
    emoticons: [":$"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f633.png"
  },
  {
    emoji: "\u{1F97A}",
    name: "pleading_face",
    shortcodes: ["pleading", "pleading_face"],
    tags: ["begging", "mercy", "puppy eyes"],
    group: "",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f97a.png"
  },
  {
    emoji: "\u{1F979}",
    name: "face_holding_back_tears",
    shortcodes: ["face_holding_back_tears", "watery_eyes"],
    tags: ["angry", "cry", "proud", "resist", "sad"],
    group: "",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F626}",
    name: "frowning",
    shortcodes: ["frowning", "frowning_face"],
    tags: ["face", "frown", "mouth", "open"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f626.png"
  },
  {
    emoji: "\u{1F627}",
    name: "anguished",
    shortcodes: ["anguished", "anguished_face"],
    tags: ["anguished", "face"],
    group: "",
    emoticons: [":s", ":S"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f627.png"
  },
  {
    emoji: "\u{1F628}",
    name: "fearful",
    shortcodes: ["fearful", "fearful_face"],
    tags: ["face", "fear", "fearful", "scared"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f628.png"
  },
  {
    emoji: "\u{1F630}",
    name: "cold_sweat",
    shortcodes: ["anxious", "anxious_face", "cold_sweat"],
    tags: ["blue", "cold", "face", "rushed", "sweat"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f630.png"
  },
  {
    emoji: "\u{1F625}",
    name: "disappointed_relieved",
    shortcodes: ["disappointed_relieved", "sad_relieved_face"],
    tags: ["disappointed", "face", "relieved", "whew"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f625.png"
  },
  {
    emoji: "\u{1F622}",
    name: "cry",
    shortcodes: ["cry", "crying_face"],
    tags: ["cry", "face", "sad", "tear"],
    group: "",
    emoticons: [":'("],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f622.png"
  },
  {
    emoji: "\u{1F62D}",
    name: "sob",
    shortcodes: ["loudly_crying_face", "sob"],
    tags: ["cry", "face", "sad", "sob", "tear"],
    group: "",
    emoticons: [":'o"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f62d.png"
  },
  {
    emoji: "\u{1F631}",
    name: "scream",
    shortcodes: ["scream", "screaming_in_fear"],
    tags: ["face", "fear", "munch", "scared", "scream"],
    group: "",
    emoticons: ["Dx"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f631.png"
  },
  {
    emoji: "\u{1F616}",
    name: "confounded",
    shortcodes: ["confounded", "confounded_face"],
    tags: ["confounded", "face"],
    group: "",
    emoticons: ["x(", "X("],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f616.png"
  },
  {
    emoji: "\u{1F623}",
    name: "persevere",
    shortcodes: ["persevere", "persevering_face"],
    tags: ["face", "persevere"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f623.png"
  },
  {
    emoji: "\u{1F61E}",
    name: "disappointed",
    shortcodes: ["disappointed", "disappointed_face"],
    tags: ["disappointed", "face"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f61e.png"
  },
  {
    emoji: "\u{1F613}",
    name: "sweat",
    shortcodes: ["downcast_face", "sweat"],
    tags: ["cold", "face", "sweat"],
    group: "",
    emoticons: [":<"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f613.png"
  },
  {
    emoji: "\u{1F629}",
    name: "weary",
    shortcodes: ["weary", "weary_face"],
    tags: ["face", "tired", "weary"],
    group: "",
    emoticons: ["D:"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f629.png"
  },
  {
    emoji: "\u{1F62B}",
    name: "tired_face",
    shortcodes: ["tired", "tired_face"],
    tags: ["face", "tired"],
    group: "",
    emoticons: [":c", ":C"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f62b.png"
  },
  {
    emoji: "\u{1F971}",
    name: "yawning_face",
    shortcodes: ["yawn", "yawning", "yawning_face"],
    tags: ["bored", "tired", "yawn"],
    group: "",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f971.png"
  },
  {
    emoji: "\u{1F624}",
    name: "triumph",
    shortcodes: ["nose_steam", "triumph"],
    tags: ["face", "triumph", "won"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f624.png"
  },
  {
    emoji: "\u{1F621}",
    name: "pout",
    shortcodes: ["pout", "pouting_face", "rage"],
    tags: ["angry", "enraged", "face", "mad", "pouting", "rage", "red"],
    group: "",
    emoticons: [">:/"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f621.png"
  },
  {
    emoji: "\u{1F620}",
    name: "angry",
    shortcodes: ["angry", "angry_face"],
    tags: ["anger", "angry", "face", "mad"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f620.png"
  },
  {
    emoji: "\u{1F92C}",
    name: "cursing_face",
    shortcodes: ["censored", "face_with_symbols_on_mouth"],
    tags: ["swearing"],
    group: "",
    emoticons: [":@"],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f92c.png"
  },
  {
    emoji: "\u{1F608}",
    name: "smiling_imp",
    shortcodes: ["smiling_imp"],
    tags: ["face", "fairy tale", "fantasy", "horns", "smile"],
    group: "",
    emoticons: [">:)"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f608.png"
  },
  {
    emoji: "\u{1F47F}",
    name: "imp",
    shortcodes: ["angry_imp", "imp"],
    tags: ["demon", "devil", "face", "fantasy", "imp"],
    group: "",
    emoticons: [">:("],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f47f.png"
  },
  {
    emoji: "\u{1F480}",
    name: "skull",
    shortcodes: ["skull"],
    tags: ["death", "face", "fairy tale", "monster"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f480.png"
  },
  {
    emoji: "\u2620",
    name: "skull_and_crossbones",
    shortcodes: ["skull_and_crossbones"],
    tags: ["crossbones", "death", "face", "monster", "skull"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2620-fe0f.png"
  },
  {
    emoji: "\u{1F4A9}",
    name: "hankey",
    shortcodes: ["poop", "shit"],
    tags: ["dung", "face", "monster", "poo", "poop"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a9.png"
  },
  {
    emoji: "\u{1F921}",
    name: "clown_face",
    shortcodes: ["clown", "clown_face"],
    tags: ["clown", "face"],
    group: "",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f921.png"
  },
  {
    emoji: "\u{1F479}",
    name: "japanese_ogre",
    shortcodes: ["japanese_ogre", "ogre"],
    tags: ["creature", "face", "fairy tale", "fantasy", "monster"],
    group: "",
    emoticons: [">0)"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f479.png"
  },
  {
    emoji: "\u{1F47A}",
    name: "japanese_goblin",
    shortcodes: ["goblin", "japanese_goblin"],
    tags: ["creature", "face", "fairy tale", "fantasy", "monster"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f47a.png"
  },
  {
    emoji: "\u{1F47B}",
    name: "ghost",
    shortcodes: ["ghost"],
    tags: ["creature", "face", "fairy tale", "fantasy", "monster"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f47b.png"
  },
  {
    emoji: "\u{1F47D}",
    name: "alien",
    shortcodes: ["alien"],
    tags: ["creature", "extraterrestrial", "face", "fantasy", "ufo"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f47d.png"
  },
  {
    emoji: "\u{1F47E}",
    name: "space_invader",
    shortcodes: ["alien_monster", "space_invader"],
    tags: ["alien", "creature", "extraterrestrial", "face", "monster", "ufo"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f47e.png"
  },
  {
    emoji: "\u{1F916}",
    name: "robot",
    shortcodes: ["robot", "robot_face"],
    tags: ["face", "monster"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f916.png"
  },
  {
    emoji: "\u{1F63A}",
    name: "smiley_cat",
    shortcodes: ["grinning_cat", "smiley_cat"],
    tags: ["cat", "face", "grinning", "mouth", "open", "smile"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f63a.png"
  },
  {
    emoji: "\u{1F638}",
    name: "smile_cat",
    shortcodes: ["grinning_cat_with_closed_eyes", "smile_cat"],
    tags: ["cat", "eye", "face", "grin", "smile"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f638.png"
  },
  {
    emoji: "\u{1F639}",
    name: "joy_cat",
    shortcodes: ["joy_cat", "tears_of_joy_cat"],
    tags: ["cat", "face", "joy", "tear"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f639.png"
  },
  {
    emoji: "\u{1F63B}",
    name: "heart_eyes_cat",
    shortcodes: ["heart_eyes_cat", "smiling_cat_with_heart_eyes"],
    tags: ["cat", "eye", "face", "heart", "love", "smile"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f63b.png"
  },
  {
    emoji: "\u{1F63C}",
    name: "smirk_cat",
    shortcodes: ["smirk_cat", "wry_smile_cat"],
    tags: ["cat", "face", "ironic", "smile", "wry"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f63c.png"
  },
  {
    emoji: "\u{1F63D}",
    name: "kissing_cat",
    shortcodes: ["kissing_cat"],
    tags: ["cat", "eye", "face", "kiss"],
    group: "",
    emoticons: [":3"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f63d.png"
  },
  {
    emoji: "\u{1F640}",
    name: "scream_cat",
    shortcodes: ["scream_cat", "weary_cat"],
    tags: ["cat", "face", "oh", "surprised", "weary"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f640.png"
  },
  {
    emoji: "\u{1F63F}",
    name: "crying_cat_face",
    shortcodes: ["crying_cat"],
    tags: ["cat", "cry", "face", "sad", "tear"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f63f.png"
  },
  {
    emoji: "\u{1F63E}",
    name: "pouting_cat",
    shortcodes: ["pouting_cat"],
    tags: ["cat", "face", "pouting"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f63e.png"
  },
  {
    emoji: "\u{1F648}",
    name: "see_no_evil",
    shortcodes: ["see_no_evil"],
    tags: ["evil", "face", "forbidden", "monkey", "see"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f648.png"
  },
  {
    emoji: "\u{1F649}",
    name: "hear_no_evil",
    shortcodes: ["hear_no_evil"],
    tags: ["evil", "face", "forbidden", "hear", "monkey"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f649.png"
  },
  {
    emoji: "\u{1F64A}",
    name: "speak_no_evil",
    shortcodes: ["speak_no_evil"],
    tags: ["evil", "face", "forbidden", "monkey", "speak"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64a.png"
  },
  {
    emoji: "\u{1F48C}",
    name: "love_letter",
    shortcodes: ["love_letter"],
    tags: ["heart", "letter", "love", "mail"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f48c.png"
  },
  {
    emoji: "\u{1F498}",
    name: "cupid",
    shortcodes: ["cupid", "heart_with_arrow"],
    tags: ["arrow", "cupid"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f498.png"
  },
  {
    emoji: "\u{1F49D}",
    name: "gift_heart",
    shortcodes: ["gift_heart", "heart_with_ribbon"],
    tags: ["ribbon", "valentine"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f49d.png"
  },
  {
    emoji: "\u{1F496}",
    name: "sparkling_heart",
    shortcodes: ["sparkling_heart"],
    tags: ["excited", "sparkle"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f496.png"
  },
  {
    emoji: "\u{1F497}",
    name: "heartpulse",
    shortcodes: ["growing_heart", "heartpulse"],
    tags: ["excited", "growing", "nervous", "pulse"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f497.png"
  },
  {
    emoji: "\u{1F493}",
    name: "heartbeat",
    shortcodes: ["beating_heart", "heartbeat"],
    tags: ["beating", "heartbeat", "pulsating"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f493.png"
  },
  {
    emoji: "\u{1F49E}",
    name: "revolving_hearts",
    shortcodes: ["revolving_hearts"],
    tags: ["revolving"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f49e.png"
  },
  {
    emoji: "\u{1F495}",
    name: "two_hearts",
    shortcodes: ["two_hearts"],
    tags: ["love"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f495.png"
  },
  {
    emoji: "\u{1F49F}",
    name: "heart_decoration",
    shortcodes: ["heart_decoration"],
    tags: ["heart"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f49f.png"
  },
  {
    emoji: "\u2763",
    name: "heavy_heart_exclamation",
    shortcodes: ["heart_exclamation"],
    tags: ["exclamation", "mark", "punctuation"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2763-fe0f.png"
  },
  {
    emoji: "\u{1F494}",
    name: "broken_heart",
    shortcodes: ["broken_heart"],
    tags: ["break", "broken"],
    group: "",
    emoticons: ["</3"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f494.png"
  },
  {
    emoji: "\u2764\u200D\u{1F525}",
    name: "heart_on_fire",
    shortcodes: ["heart_on_fire"],
    tags: ["burn", "heart", "love", "lust", "sacred heart"],
    group: "",
    emoticons: [],
    version: 13.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2764-fe0f-200d-1f525.png"
  },
  {
    emoji: "\u2764\u200D\u{1FA79}",
    name: "mending_heart",
    shortcodes: ["mending_heart"],
    tags: ["healthier", "improving", "mending", "recovering", "recuperating", "well"],
    group: "",
    emoticons: [],
    version: 13.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2764-fe0f-200d-1fa79.png"
  },
  {
    emoji: "\u2764",
    name: "heart",
    shortcodes: ["heart", "red_heart"],
    tags: ["heart"],
    group: "",
    emoticons: ["<3"],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2764-fe0f.png"
  },
  {
    emoji: "\u{1FA77}",
    name: "pink_heart",
    shortcodes: ["pink_heart"],
    tags: ["cute", "heart", "like", "love", "pink"],
    group: "",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F9E1}",
    name: "orange_heart",
    shortcodes: ["orange_heart"],
    tags: ["orange"],
    group: "",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e1.png"
  },
  {
    emoji: "\u{1F49B}",
    name: "yellow_heart",
    shortcodes: ["yellow_heart"],
    tags: ["yellow"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f49b.png"
  },
  {
    emoji: "\u{1F49A}",
    name: "green_heart",
    shortcodes: ["green_heart"],
    tags: ["green"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f49a.png"
  },
  {
    emoji: "\u{1F499}",
    name: "blue_heart",
    shortcodes: ["blue_heart"],
    tags: ["blue"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f499.png"
  },
  {
    emoji: "\u{1FA75}",
    name: "light_blue_heart",
    shortcodes: ["light_blue_heart"],
    tags: ["cyan", "heart", "light blue", "teal"],
    group: "",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F49C}",
    name: "purple_heart",
    shortcodes: ["purple_heart"],
    tags: ["purple"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f49c.png"
  },
  {
    emoji: "\u{1F90E}",
    name: "brown_heart",
    shortcodes: ["brown_heart"],
    tags: ["brown", "heart"],
    group: "",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f90e.png"
  },
  {
    emoji: "\u{1F5A4}",
    name: "black_heart",
    shortcodes: ["black_heart"],
    tags: ["black", "evil", "wicked"],
    group: "",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5a4.png"
  },
  {
    emoji: "\u{1FA76}",
    name: "grey_heart",
    shortcodes: ["gray_heart", "grey_heart"],
    tags: ["gray", "heart", "silver", "slate"],
    group: "",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F90D}",
    name: "white_heart",
    shortcodes: ["white_heart"],
    tags: ["heart", "white"],
    group: "",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f90d.png"
  },
  {
    emoji: "\u{1F48B}",
    name: "kiss",
    shortcodes: ["kiss"],
    tags: ["kiss", "lips"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f48b.png"
  },
  {
    emoji: "\u{1F4AF}",
    name: "100",
    shortcodes: ["100"],
    tags: ["100", "full", "hundred", "score"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4af.png"
  },
  {
    emoji: "\u{1F4A2}",
    name: "anger",
    shortcodes: ["anger"],
    tags: ["angry", "comic", "mad"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a2.png"
  },
  {
    emoji: "\u{1F4A5}",
    name: "boom",
    shortcodes: ["boom", "collision"],
    tags: ["boom", "comic"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a5.png"
  },
  {
    emoji: "\u{1F4AB}",
    name: "dizzy",
    shortcodes: ["dizzy"],
    tags: ["comic", "star"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ab.png"
  },
  {
    emoji: "\u{1F4A6}",
    name: "sweat_drops",
    shortcodes: ["sweat_drops"],
    tags: ["comic", "splashing", "sweat"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a6.png"
  },
  {
    emoji: "\u{1F4A8}",
    name: "dash",
    shortcodes: ["dash", "dashing_away"],
    tags: ["comic", "dash", "running"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a8.png"
  },
  {
    emoji: "\u{1F573}",
    name: "hole",
    shortcodes: ["hole"],
    tags: ["hole"],
    group: "",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f573-fe0f.png"
  },
  {
    emoji: "\u{1F4AC}",
    name: "speech_balloon",
    shortcodes: ["speech_balloon"],
    tags: ["balloon", "bubble", "comic", "dialog", "speech"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ac.png"
  },
  {
    emoji: "\u{1F441}\u200D\u{1F5E8}\uFE0F",
    name: "eye_speech_bubble",
    shortcodes: ["eye_in_speech_bubble"],
    tags: ["balloon", "bubble", "eye", "speech", "witness"],
    group: "",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f441-fe0f-200d-1f5e8-fe0f.png"
  },
  {
    emoji: "\u{1F5E8}",
    name: "left_speech_bubble",
    shortcodes: ["left_speech_bubble"],
    tags: ["balloon", "bubble", "dialog", "speech"],
    group: "",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5e8-fe0f.png"
  },
  {
    emoji: "\u{1F5EF}",
    name: "right_anger_bubble",
    shortcodes: ["right_anger_bubble"],
    tags: ["angry", "balloon", "bubble", "mad"],
    group: "",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5ef-fe0f.png"
  },
  {
    emoji: "\u{1F4AD}",
    name: "thought_balloon",
    shortcodes: ["thought_balloon"],
    tags: ["balloon", "bubble", "comic", "thought"],
    group: "",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ad.png"
  },
  {
    emoji: "\u{1F4A4}",
    name: "zzz",
    shortcodes: ["zzz"],
    tags: ["comic", "good night", "sleep", "zzz"],
    group: "",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a4.png"
  },
  {
    emoji: "\u{1F44B}",
    name: "wave",
    shortcodes: ["wave", "waving_hand"],
    tags: ["hand", "wave", "waving"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44b.png"
  },
  {
    emoji: "\u{1F91A}",
    name: "raised_back_of_hand",
    shortcodes: ["raised_back_of_hand"],
    tags: ["backhand", "raised"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f91a.png"
  },
  {
    emoji: "\u{1F590}",
    name: "raised_hand_with_fingers_splayed",
    shortcodes: ["raised_hand_with_fingers_splayed"],
    tags: ["finger", "hand", "splayed"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f590-fe0f.png"
  },
  {
    emoji: "\u270B",
    name: "hand",
    shortcodes: ["high_five", "raised_hand"],
    tags: ["hand", "high 5", "high five"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/270b.png"
  },
  {
    emoji: "\u{1F596}",
    name: "vulcan_salute",
    shortcodes: ["vulcan"],
    tags: ["finger", "hand", "spock", "vulcan"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f596.png"
  },
  {
    emoji: "\u{1FAF1}",
    name: "rightwards_hand",
    shortcodes: ["rightwards_hand"],
    tags: ["hand", "right", "rightward"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FAF2}",
    name: "leftwards_hand",
    shortcodes: ["leftwards_hand"],
    tags: ["hand", "left", "leftward"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FAF3}",
    name: "palm_down_hand",
    shortcodes: ["palm_down"],
    tags: ["dismiss", "drop", "shoo"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FAF4}",
    name: "palm_up_hand",
    shortcodes: ["palm_up"],
    tags: ["beckon", "catch", "come", "offer"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FAF7}",
    name: "leftwards_pushing_hand",
    shortcodes: ["leftwards_pushing_hand"],
    tags: ["high five", "leftward", "push", "refuse", "stop", "wait"],
    group: "people & body",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1FAF8}",
    name: "rightwards_pushing_hand",
    shortcodes: ["rightwards_pushing_hand"],
    tags: ["high five", "push", "refuse", "rightward", "stop", "wait"],
    group: "people & body",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F44C}",
    name: "ok_hand",
    shortcodes: ["ok_hand"],
    tags: ["hand", "ok"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44c.png"
  },
  {
    emoji: "\u{1F90C}",
    name: "pinched_fingers",
    shortcodes: ["pinch", "pinched_fingers"],
    tags: ["fingers", "hand gesture", "interrogation", "pinched", "sarcastic"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f90c.png"
  },
  {
    emoji: "\u{1F90F}",
    name: "pinching_hand",
    shortcodes: ["pinching_hand"],
    tags: ["small amount"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f90f.png"
  },
  {
    emoji: "\u270C",
    name: "v",
    shortcodes: ["v", "victory"],
    tags: ["hand", "v", "victory"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/270c-fe0f.png"
  },
  {
    emoji: "\u{1F91E}",
    name: "crossed_fingers",
    shortcodes: ["fingers_crossed"],
    tags: ["cross", "finger", "hand", "luck"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f91e.png"
  },
  {
    emoji: "\u{1FAF0}",
    name: "hand_with_index_finger_and_thumb_crossed",
    shortcodes: ["hand_with_index_finger_and_thumb_crossed"],
    tags: ["expensive", "heart", "love", "money", "snap"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F91F}",
    name: "love_you_gesture",
    shortcodes: ["love_you_gesture"],
    tags: ["hand", "ily"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f91f.png"
  },
  {
    emoji: "\u{1F918}",
    name: "metal",
    shortcodes: ["metal", "sign_of_the_horns"],
    tags: ["finger", "hand", "horns", "rock-on"],
    group: "people & body",
    emoticons: ["\\m/", "\\M/"],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f918.png"
  },
  {
    emoji: "\u{1F919}",
    name: "call_me_hand",
    shortcodes: ["call_me_hand"],
    tags: ["call", "hand", "hang loose", "shaka"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f919.png"
  },
  {
    emoji: "\u{1F448}",
    name: "point_left",
    shortcodes: ["point_left"],
    tags: ["backhand", "finger", "hand", "index", "point"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f448.png"
  },
  {
    emoji: "\u{1F449}",
    name: "point_right",
    shortcodes: ["point_right"],
    tags: ["backhand", "finger", "hand", "index", "point"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f449.png"
  },
  {
    emoji: "\u{1F446}",
    name: "point_up_2",
    shortcodes: ["point_up"],
    tags: ["backhand", "finger", "hand", "point", "up"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f446.png"
  },
  {
    emoji: "\u{1F595}",
    name: "fu",
    shortcodes: ["middle_finger"],
    tags: ["finger", "hand"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f595.png"
  },
  {
    emoji: "\u{1F447}",
    name: "point_down",
    shortcodes: ["point_down"],
    tags: ["backhand", "down", "finger", "hand", "point"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f447.png"
  },
  {
    emoji: "\u261D",
    name: "point_up",
    shortcodes: ["point_up_2"],
    tags: ["finger", "hand", "index", "point", "up"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/261d-fe0f.png"
  },
  {
    emoji: "\u{1FAF5}",
    name: "index_pointing_at_the_viewer",
    shortcodes: ["point_forward"],
    tags: ["point", "you"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F44D}",
    name: "+1",
    shortcodes: ["+1", "thumbsup", "yes"],
    tags: ["+1", "hand", "thumb", "up"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44d.png"
  },
  {
    emoji: "\u{1F44E}",
    name: "-1",
    shortcodes: ["-1", "no", "thumbsdown"],
    tags: ["-1", "down", "hand", "thumb"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44e.png"
  },
  {
    emoji: "\u270A",
    name: "fist",
    shortcodes: ["fist"],
    tags: ["clenched", "fist", "hand", "punch"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/270a.png"
  },
  {
    emoji: "\u{1F44A}",
    name: "facepunch",
    shortcodes: ["punch"],
    tags: ["clenched", "fist", "hand", "punch"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44a.png"
  },
  {
    emoji: "\u{1F91B}",
    name: "fist_left",
    shortcodes: ["left_facing_fist"],
    tags: ["fist", "leftwards"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f91b.png"
  },
  {
    emoji: "\u{1F91C}",
    name: "fist_right",
    shortcodes: ["right_facing_fist"],
    tags: ["fist", "rightwards"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f91c.png"
  },
  {
    emoji: "\u{1F44F}",
    name: "clap",
    shortcodes: ["clap", "clapping_hands"],
    tags: ["clap", "hand"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44f.png"
  },
  {
    emoji: "\u{1F64C}",
    name: "raised_hands",
    shortcodes: ["raised_hands"],
    tags: ["celebration", "gesture", "hand", "hooray", "raised"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64c.png"
  },
  {
    emoji: "\u{1FAF6}",
    name: "heart_hands",
    shortcodes: ["heart_hands"],
    tags: ["love"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F450}",
    name: "open_hands",
    shortcodes: ["open_hands"],
    tags: ["hand", "open"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f450.png"
  },
  {
    emoji: "\u{1F932}",
    name: "palms_up_together",
    shortcodes: ["palms_up_together"],
    tags: ["prayer"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f932.png"
  },
  {
    emoji: "\u{1F91D}",
    name: "handshake",
    shortcodes: ["handshake"],
    tags: ["agreement", "hand", "meeting", "shake"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f91d.png"
  },
  {
    emoji: "\u{1F64F}",
    name: "pray",
    shortcodes: ["folded_hands", "pray"],
    tags: ["ask", "hand", "high 5", "high five", "please", "pray", "thanks"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64f.png"
  },
  {
    emoji: "\u270D",
    name: "writing_hand",
    shortcodes: ["writing_hand"],
    tags: ["hand", "write"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/270d-fe0f.png"
  },
  {
    emoji: "\u{1F485}",
    name: "nail_care",
    shortcodes: ["nail_care", "nail_polish"],
    tags: ["care", "cosmetics", "manicure", "nail", "polish"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f485.png"
  },
  {
    emoji: "\u{1F933}",
    name: "selfie",
    shortcodes: ["selfie"],
    tags: ["camera", "phone"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f933.png"
  },
  {
    emoji: "\u{1F4AA}",
    name: "muscle",
    shortcodes: ["muscle", "right_bicep"],
    tags: ["biceps", "comic", "flex", "muscle"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4aa.png"
  },
  {
    emoji: "\u{1F9BE}",
    name: "mechanical_arm",
    shortcodes: ["mechanical_arm"],
    tags: ["accessibility", "prosthetic"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9be.png"
  },
  {
    emoji: "\u{1F9BF}",
    name: "mechanical_leg",
    shortcodes: ["mechanical_leg"],
    tags: ["accessibility", "prosthetic"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9bf.png"
  },
  {
    emoji: "\u{1F9B5}",
    name: "leg",
    shortcodes: ["leg"],
    tags: ["kick", "limb"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b5.png"
  },
  {
    emoji: "\u{1F9B6}",
    name: "foot",
    shortcodes: ["foot"],
    tags: ["kick", "stomp"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b6.png"
  },
  {
    emoji: "\u{1F442}",
    name: "ear",
    shortcodes: ["ear"],
    tags: ["body"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f442.png"
  },
  {
    emoji: "\u{1F9BB}",
    name: "ear_with_hearing_aid",
    shortcodes: ["ear_with_hearing_aid", "hearing_aid"],
    tags: ["accessibility", "hard of hearing"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9bb.png"
  },
  {
    emoji: "\u{1F443}",
    name: "nose",
    shortcodes: ["nose"],
    tags: ["body"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f443.png"
  },
  {
    emoji: "\u{1F9E0}",
    name: "brain",
    shortcodes: ["brain"],
    tags: ["intelligent"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e0.png"
  },
  {
    emoji: "\u{1FAC0}",
    name: "anatomical_heart",
    shortcodes: ["anatomical_heart"],
    tags: ["anatomical", "cardiology", "heart", "organ", "pulse"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fac0.png"
  },
  {
    emoji: "\u{1FAC1}",
    name: "lungs",
    shortcodes: ["lungs"],
    tags: ["breath", "exhalation", "inhalation", "organ", "respiration"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fac1.png"
  },
  {
    emoji: "\u{1F9B7}",
    name: "tooth",
    shortcodes: ["tooth"],
    tags: ["dentist"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b7.png"
  },
  {
    emoji: "\u{1F9B4}",
    name: "bone",
    shortcodes: ["bone"],
    tags: ["skeleton"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b4.png"
  },
  {
    emoji: "\u{1F440}",
    name: "eyes",
    shortcodes: ["eyes"],
    tags: ["eye", "face"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f440.png"
  },
  {
    emoji: "\u{1F441}",
    name: "eye",
    shortcodes: ["eye"],
    tags: ["body"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f441-fe0f.png"
  },
  {
    emoji: "\u{1F445}",
    name: "tongue",
    shortcodes: ["tongue"],
    tags: ["body"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f445.png"
  },
  {
    emoji: "\u{1F444}",
    name: "lips",
    shortcodes: ["lips", "mouth"],
    tags: ["lips"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f444.png"
  },
  {
    emoji: "\u{1FAE6}",
    name: "biting_lip",
    shortcodes: ["biting_lip"],
    tags: ["anxious", "fear", "flirting", "nervous", "uncomfortable", "worried"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F476}",
    name: "baby",
    shortcodes: ["baby"],
    tags: ["young"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f476.png"
  },
  {
    emoji: "\u{1F9D2}",
    name: "child",
    shortcodes: ["child"],
    tags: ["gender-neutral", "unspecified gender", "young"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d2.png"
  },
  {
    emoji: "\u{1F466}",
    name: "boy",
    shortcodes: ["boy"],
    tags: ["young"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f466.png"
  },
  {
    emoji: "\u{1F467}",
    name: "girl",
    shortcodes: ["girl"],
    tags: ["virgo", "young", "zodiac"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f467.png"
  },
  {
    emoji: "\u{1F9D1}",
    name: "adult",
    shortcodes: ["adult"],
    tags: ["adult", "gender-neutral", "unspecified gender"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1.png"
  },
  {
    emoji: "\u{1F471}",
    name: "blond_haired_person",
    shortcodes: ["blond_haired"],
    tags: ["blond", "blond-haired person", "hair"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f471.png"
  },
  {
    emoji: "\u{1F468}",
    name: "man",
    shortcodes: ["man"],
    tags: ["adult"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468.png"
  },
  {
    emoji: "\u{1F9D4}",
    name: "bearded_person",
    shortcodes: ["person_bearded"],
    tags: ["beard", "person"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d4.png"
  },
  {
    emoji: "\u{1F9D4}\u200D\u2642",
    name: "man_beard",
    shortcodes: ["man_bearded"],
    tags: ["beard", "man"],
    group: "people & body",
    emoticons: [],
    version: 13.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d4-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9D4}\u200D\u2640",
    name: "woman_beard",
    shortcodes: ["woman_bearded"],
    tags: ["beard", "woman"],
    group: "people & body",
    emoticons: [],
    version: 13.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d4-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B0}",
    name: "red_haired_man",
    shortcodes: ["man_red_haired"],
    tags: ["adult", "man", "red hair"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f9b0.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B1}",
    name: "curly_haired_man",
    shortcodes: ["man_curly_haired"],
    tags: ["adult", "curly hair", "man"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f9b1.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B3}",
    name: "white_haired_man",
    shortcodes: ["man_white_haired"],
    tags: ["adult", "man", "white hair"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f9b3.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B2}",
    name: "bald_man",
    shortcodes: ["man_bald"],
    tags: ["adult", "bald", "man"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f9b2.png"
  },
  {
    emoji: "\u{1F469}",
    name: "woman",
    shortcodes: ["woman"],
    tags: ["adult"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B0}",
    name: "red_haired_woman",
    shortcodes: ["woman_red_haired"],
    tags: ["adult", "red hair", "woman"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f9b0.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B0}",
    name: "person_red_hair",
    shortcodes: ["red_haired"],
    tags: ["adult", "gender-neutral", "person", "red hair", "unspecified gender"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f9b0.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B1}",
    name: "curly_haired_woman",
    shortcodes: ["woman_curly_haired"],
    tags: ["adult", "curly hair", "woman"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f9b1.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B1}",
    name: "person_curly_hair",
    shortcodes: ["curly_haired"],
    tags: ["adult", "curly hair", "gender-neutral", "person", "unspecified gender"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f9b1.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B3}",
    name: "white_haired_woman",
    shortcodes: ["woman_white_haired"],
    tags: ["adult", "white hair", "woman"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f9b3.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B3}",
    name: "person_white_hair",
    shortcodes: ["white_haired"],
    tags: ["adult", "gender-neutral", "person", "unspecified gender", "white hair"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f9b3.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B2}",
    name: "bald_woman",
    shortcodes: ["woman_bald"],
    tags: ["adult", "bald", "woman"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f9b2.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B2}",
    name: "person_bald",
    shortcodes: ["bald"],
    tags: ["adult", "bald", "gender-neutral", "person", "unspecified gender"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f9b2.png"
  },
  {
    emoji: "\u{1F471}\u200D\u2640",
    name: "blond_haired_woman",
    shortcodes: ["woman_blond_haired"],
    tags: ["blond-haired woman", "blonde", "hair", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f471-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F471}\u200D\u2642",
    name: "blond_haired_man",
    shortcodes: ["man_blond_haired"],
    tags: ["blond", "blond-haired man", "hair", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f471-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9D3}",
    name: "older_adult",
    shortcodes: ["older_adult"],
    tags: ["adult", "gender-neutral", "old", "unspecified gender"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d3.png"
  },
  {
    emoji: "\u{1F474}",
    name: "older_man",
    shortcodes: ["older_man"],
    tags: ["adult", "man", "old"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f474.png"
  },
  {
    emoji: "\u{1F475}",
    name: "older_woman",
    shortcodes: ["older_woman"],
    tags: ["adult", "old", "woman"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f475.png"
  },
  {
    emoji: "\u{1F64D}",
    name: "frowning_person",
    shortcodes: ["person_frowning"],
    tags: ["frown", "gesture"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64d.png"
  },
  {
    emoji: "\u{1F64D}\u200D\u2642",
    name: "frowning_man",
    shortcodes: ["man_frowning"],
    tags: ["frowning", "gesture", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64d-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F64D}\u200D\u2640",
    name: "frowning_woman",
    shortcodes: ["woman_frowning"],
    tags: ["frowning", "gesture", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64d-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F64E}",
    name: "pouting_face",
    shortcodes: ["person_pouting", "pouting"],
    tags: ["gesture", "pouting"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64e.png"
  },
  {
    emoji: "\u{1F64E}\u200D\u2642",
    name: "pouting_man",
    shortcodes: ["man_pouting"],
    tags: ["gesture", "man", "pouting"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64e-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F64E}\u200D\u2640",
    name: "pouting_woman",
    shortcodes: ["woman_pouting"],
    tags: ["gesture", "pouting", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64e-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F645}",
    name: "no_good",
    shortcodes: ["no_good", "person_gesturing_no"],
    tags: ["forbidden", "gesture", "hand", "person gesturing no", "prohibited"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f645.png"
  },
  {
    emoji: "\u{1F645}\u200D\u2642",
    name: "ng_man",
    shortcodes: ["man_gesturing_no"],
    tags: ["forbidden", "gesture", "hand", "man", "man gesturing no", "prohibited"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f645-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F645}\u200D\u2640",
    name: "ng_woman",
    shortcodes: ["woman_gesturing_no"],
    tags: ["forbidden", "gesture", "hand", "prohibited", "woman", "woman gesturing no"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f645-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F646}",
    name: "ok_person",
    shortcodes: ["all_good", "person_gesturing_ok"],
    tags: ["gesture", "hand", "ok", "person gesturing ok"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f646.png"
  },
  {
    emoji: "\u{1F646}\u200D\u2642",
    name: "ok_man",
    shortcodes: ["man_gesturing_ok"],
    tags: ["gesture", "hand", "man", "man gesturing ok", "ok"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f646-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F646}\u200D\u2640",
    name: "ok_woman",
    shortcodes: ["woman_gesturing_ok"],
    tags: ["gesture", "hand", "ok", "woman", "woman gesturing ok"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f646-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F481}",
    name: "information_desk_person",
    shortcodes: ["person_tipping_hand"],
    tags: ["hand", "help", "information", "sassy", "tipping"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f481.png"
  },
  {
    emoji: "\u{1F481}\u200D\u2642",
    name: "sassy_man",
    shortcodes: ["man_tipping_hand"],
    tags: ["man", "sassy", "tipping hand"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f481-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F481}\u200D\u2640",
    name: "sassy_woman",
    shortcodes: ["woman_tipping_hand"],
    tags: ["sassy", "tipping hand", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f481-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F64B}",
    name: "raising_hand",
    shortcodes: ["person_raising_hand"],
    tags: ["gesture", "hand", "happy", "raised"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64b.png"
  },
  {
    emoji: "\u{1F64B}\u200D\u2642",
    name: "raising_hand_man",
    shortcodes: ["man_raising_hand"],
    tags: ["gesture", "man", "raising hand"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64b-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F64B}\u200D\u2640",
    name: "raising_hand_woman",
    shortcodes: ["woman_raising_hand"],
    tags: ["gesture", "raising hand", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64b-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9CF}",
    name: "deaf_person",
    shortcodes: ["deaf_person"],
    tags: ["accessibility", "deaf", "ear", "hear"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9cf.png"
  },
  {
    emoji: "\u{1F9CF}\u200D\u2642",
    name: "deaf_man",
    shortcodes: ["deaf_man"],
    tags: ["deaf", "man"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9cf-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9CF}\u200D\u2640",
    name: "deaf_woman",
    shortcodes: ["deaf_woman"],
    tags: ["deaf", "woman"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9cf-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F647}",
    name: "bow",
    shortcodes: ["bow", "person_bowing"],
    tags: ["apology", "bow", "gesture", "sorry"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f647.png"
  },
  {
    emoji: "\u{1F647}\u200D\u2642",
    name: "bowing_man",
    shortcodes: ["man_bowing"],
    tags: ["apology", "bowing", "favor", "gesture", "man", "sorry"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f647-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F647}\u200D\u2640",
    name: "bowing_woman",
    shortcodes: ["woman_bowing"],
    tags: ["apology", "bowing", "favor", "gesture", "sorry", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f647-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F926}",
    name: "facepalm",
    shortcodes: ["facepalm", "person_facepalming"],
    tags: ["disbelief", "exasperation", "face", "palm"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f926.png"
  },
  {
    emoji: "\u{1F926}\u200D\u2642",
    name: "man_facepalming",
    shortcodes: ["man_facepalming"],
    tags: ["disbelief", "exasperation", "facepalm", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f926-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F926}\u200D\u2640",
    name: "woman_facepalming",
    shortcodes: ["woman_facepalming"],
    tags: ["disbelief", "exasperation", "facepalm", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f926-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F937}",
    name: "shrug",
    shortcodes: ["person_shrugging", "shrug"],
    tags: ["doubt", "ignorance", "indifference", "shrug"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f937.png"
  },
  {
    emoji: "\u{1F937}\u200D\u2642",
    name: "man_shrugging",
    shortcodes: ["man_shrugging"],
    tags: ["doubt", "ignorance", "indifference", "man", "shrug"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f937-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F937}\u200D\u2640",
    name: "woman_shrugging",
    shortcodes: ["woman_shrugging"],
    tags: ["doubt", "ignorance", "indifference", "shrug", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f937-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u2695",
    name: "health_worker",
    shortcodes: ["health_worker"],
    tags: ["doctor", "healthcare", "nurse", "therapist"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-2695-fe0f.png"
  },
  {
    emoji: "\u{1F468}\u200D\u2695",
    name: "man_health_worker",
    shortcodes: ["man_health_worker"],
    tags: ["doctor", "healthcare", "man", "nurse", "therapist"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-2695-fe0f.png"
  },
  {
    emoji: "\u{1F469}\u200D\u2695",
    name: "woman_health_worker",
    shortcodes: ["woman_health_worker"],
    tags: ["doctor", "healthcare", "nurse", "therapist", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-2695-fe0f.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F393}",
    name: "student",
    shortcodes: ["student"],
    tags: ["graduate"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f393.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F393}",
    name: "man_student",
    shortcodes: ["man_student"],
    tags: ["graduate", "man", "student"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f393.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F393}",
    name: "woman_student",
    shortcodes: ["woman_student"],
    tags: ["graduate", "student", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f393.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3EB}",
    name: "teacher",
    shortcodes: ["teacher"],
    tags: ["instructor", "lecturer", "professor"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f3eb.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3EB}",
    name: "man_teacher",
    shortcodes: ["man_teacher"],
    tags: ["instructor", "lecturer", "man", "professor", "teacher"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f3eb.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3EB}",
    name: "woman_teacher",
    shortcodes: ["woman_teacher"],
    tags: ["instructor", "lecturer", "professor", "teacher", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f3eb.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u2696",
    name: "judge",
    shortcodes: ["judge"],
    tags: ["justice", "law", "scales"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-2696-fe0f.png"
  },
  {
    emoji: "\u{1F468}\u200D\u2696",
    name: "man_judge",
    shortcodes: ["man_judge"],
    tags: ["judge", "justice", "law", "man", "scales"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-2696-fe0f.png"
  },
  {
    emoji: "\u{1F469}\u200D\u2696",
    name: "woman_judge",
    shortcodes: ["woman_judge"],
    tags: ["judge", "justice", "law", "scales", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-2696-fe0f.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F33E}",
    name: "farmer",
    shortcodes: ["farmer"],
    tags: ["gardener", "rancher"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f33e.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F33E}",
    name: "man_farmer",
    shortcodes: ["man_farmer"],
    tags: ["farmer", "gardener", "man", "rancher"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f33e.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F33E}",
    name: "woman_farmer",
    shortcodes: ["woman_farmer"],
    tags: ["farmer", "gardener", "rancher", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f33e.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F373}",
    name: "cook",
    shortcodes: ["cook"],
    tags: ["chef"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f373.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F373}",
    name: "man_cook",
    shortcodes: ["man_cook"],
    tags: ["chef", "cook", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f373.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F373}",
    name: "woman_cook",
    shortcodes: ["woman_cook"],
    tags: ["chef", "cook", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f373.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F527}",
    name: "mechanic",
    shortcodes: ["mechanic"],
    tags: ["electrician", "plumber", "tradesperson"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f527.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F527}",
    name: "man_mechanic",
    shortcodes: ["man_mechanic"],
    tags: ["electrician", "man", "mechanic", "plumber", "tradesperson"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f527.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F527}",
    name: "woman_mechanic",
    shortcodes: ["woman_mechanic"],
    tags: ["electrician", "mechanic", "plumber", "tradesperson", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f527.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3ED}",
    name: "factory_worker",
    shortcodes: ["factory_worker"],
    tags: ["assembly", "factory", "industrial", "worker"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f3ed.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3ED}",
    name: "man_factory_worker",
    shortcodes: ["man_factory_worker"],
    tags: ["assembly", "factory", "industrial", "man", "worker"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f3ed.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3ED}",
    name: "woman_factory_worker",
    shortcodes: ["woman_factory_worker"],
    tags: ["assembly", "factory", "industrial", "woman", "worker"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f3ed.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F4BC}",
    name: "office_worker",
    shortcodes: ["office_worker"],
    tags: ["architect", "business", "manager", "white-collar"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f4bc.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F4BC}",
    name: "man_office_worker",
    shortcodes: ["man_office_worker"],
    tags: ["architect", "business", "man", "manager", "white-collar"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f4bc.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F4BC}",
    name: "woman_office_worker",
    shortcodes: ["woman_office_worker"],
    tags: ["architect", "business", "manager", "white-collar", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f4bc.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F52C}",
    name: "scientist",
    shortcodes: ["scientist"],
    tags: ["biologist", "chemist", "engineer", "physicist"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f52c.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F52C}",
    name: "man_scientist",
    shortcodes: ["man_scientist"],
    tags: ["biologist", "chemist", "engineer", "man", "physicist", "scientist"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f52c.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F52C}",
    name: "woman_scientist",
    shortcodes: ["woman_scientist"],
    tags: ["biologist", "chemist", "engineer", "physicist", "scientist", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f52c.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F4BB}",
    name: "technologist",
    shortcodes: ["technologist"],
    tags: ["coder", "developer", "inventor", "software"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f4bb.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F4BB}",
    name: "man_technologist",
    shortcodes: ["man_technologist"],
    tags: ["coder", "developer", "inventor", "man", "software", "technologist"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f4bb.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F4BB}",
    name: "woman_technologist",
    shortcodes: ["woman_technologist"],
    tags: ["coder", "developer", "inventor", "software", "technologist", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f4bb.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3A4}",
    name: "singer",
    shortcodes: ["singer"],
    tags: ["actor", "entertainer", "rock", "star"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f3a4.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3A4}",
    name: "man_singer",
    shortcodes: ["man_singer"],
    tags: ["actor", "entertainer", "man", "rock", "singer", "star"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f3a4.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3A4}",
    name: "woman_singer",
    shortcodes: ["woman_singer"],
    tags: ["actor", "entertainer", "rock", "singer", "star", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f3a4.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3A8}",
    name: "artist",
    shortcodes: ["artist"],
    tags: ["palette"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f3a8.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3A8}",
    name: "man_artist",
    shortcodes: ["man_artist"],
    tags: ["artist", "man", "palette"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f3a8.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3A8}",
    name: "woman_artist",
    shortcodes: ["woman_artist"],
    tags: ["artist", "palette", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f3a8.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u2708",
    name: "pilot",
    shortcodes: ["pilot"],
    tags: ["plane"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-2708-fe0f.png"
  },
  {
    emoji: "\u{1F468}\u200D\u2708",
    name: "man_pilot",
    shortcodes: ["man_pilot"],
    tags: ["man", "pilot", "plane"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-2708-fe0f.png"
  },
  {
    emoji: "\u{1F469}\u200D\u2708",
    name: "woman_pilot",
    shortcodes: ["woman_pilot"],
    tags: ["pilot", "plane", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-2708-fe0f.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F680}",
    name: "astronaut",
    shortcodes: ["astronaut"],
    tags: ["rocket"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f680.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F680}",
    name: "man_astronaut",
    shortcodes: ["man_astronaut"],
    tags: ["astronaut", "man", "rocket"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f680.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F680}",
    name: "woman_astronaut",
    shortcodes: ["woman_astronaut"],
    tags: ["astronaut", "rocket", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f680.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F692}",
    name: "firefighter",
    shortcodes: ["firefighter"],
    tags: ["fire", "firetruck"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f692.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F692}",
    name: "man_firefighter",
    shortcodes: ["man_firefighter"],
    tags: ["firefighter", "firetruck", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f692.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F692}",
    name: "woman_firefighter",
    shortcodes: ["woman_firefighter"],
    tags: ["firefighter", "firetruck", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f692.png"
  },
  {
    emoji: "\u{1F46E}",
    name: "cop",
    shortcodes: ["cop", "police_officer"],
    tags: ["cop", "officer", "police"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46e.png"
  },
  {
    emoji: "\u{1F46E}\u200D\u2642",
    name: "policeman",
    shortcodes: ["man_police_officer"],
    tags: ["cop", "man", "officer", "police"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46e-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F46E}\u200D\u2640",
    name: "policewoman",
    shortcodes: ["woman_police_officer"],
    tags: ["cop", "officer", "police", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46e-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F575}",
    name: "detective",
    shortcodes: ["detective"],
    tags: ["sleuth", "spy"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f575-fe0f.png"
  },
  {
    emoji: "\u{1F575}\u200D\u2642\uFE0F",
    name: "male_detective",
    shortcodes: ["man_detective"],
    tags: ["detective", "man", "sleuth", "spy"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f575-fe0f-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F575}\u200D\u2640\uFE0F",
    name: "female_detective",
    shortcodes: ["woman_detective"],
    tags: ["detective", "sleuth", "spy", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f575-fe0f-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F482}",
    name: "guard",
    shortcodes: ["guard"],
    tags: ["guard"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f482.png"
  },
  {
    emoji: "\u{1F482}\u200D\u2642",
    name: "guardsman",
    shortcodes: ["man_guard"],
    tags: ["guard", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f482-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F482}\u200D\u2640",
    name: "guardswoman",
    shortcodes: ["woman_guard"],
    tags: ["guard", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f482-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F977}",
    name: "ninja",
    shortcodes: ["ninja"],
    tags: ["fighter", "hidden", "stealth"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f977.png"
  },
  {
    emoji: "\u{1F477}",
    name: "construction_worker",
    shortcodes: ["construction_worker"],
    tags: ["construction", "hat", "worker"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f477.png"
  },
  {
    emoji: "\u{1F477}\u200D\u2642",
    name: "construction_worker_man",
    shortcodes: ["man_construction_worker"],
    tags: ["construction", "man", "worker"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f477-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F477}\u200D\u2640",
    name: "construction_worker_woman",
    shortcodes: ["woman_construction_worker"],
    tags: ["construction", "woman", "worker"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f477-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1FAC5}",
    name: "person_with_crown",
    shortcodes: ["person_with_crown", "royalty"],
    tags: ["monarch", "noble", "regal", "royalty"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F934}",
    name: "prince",
    shortcodes: ["prince"],
    tags: ["prince"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f934.png"
  },
  {
    emoji: "\u{1F478}",
    name: "princess",
    shortcodes: ["princess"],
    tags: ["fairy tale", "fantasy"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f478.png"
  },
  {
    emoji: "\u{1F473}",
    name: "person_with_turban",
    shortcodes: ["person_wearing_turban"],
    tags: ["turban"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f473.png"
  },
  {
    emoji: "\u{1F473}\u200D\u2642",
    name: "man_with_turban",
    shortcodes: ["man_wearing_turban"],
    tags: ["man", "turban"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f473-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F473}\u200D\u2640",
    name: "woman_with_turban",
    shortcodes: ["woman_wearing_turban"],
    tags: ["turban", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f473-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F472}",
    name: "man_with_gua_pi_mao",
    shortcodes: ["person_with_skullcap"],
    tags: ["cap", "gua pi mao", "hat", "person", "skullcap"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f472.png"
  },
  {
    emoji: "\u{1F9D5}",
    name: "woman_with_headscarf",
    shortcodes: ["woman_with_headscarf"],
    tags: ["headscarf", "hijab", "mantilla", "tichel"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d5.png"
  },
  {
    emoji: "\u{1F935}",
    name: "person_in_tuxedo",
    shortcodes: ["person_in_tuxedo"],
    tags: ["groom", "person", "tuxedo"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f935.png"
  },
  {
    emoji: "\u{1F935}\u200D\u2642",
    name: "man_in_tuxedo",
    shortcodes: ["man_in_tuxedo"],
    tags: ["man", "tuxedo"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f935-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F935}\u200D\u2640",
    name: "woman_in_tuxedo",
    shortcodes: ["woman_in_tuxedo"],
    tags: ["tuxedo", "woman"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f935-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F470}",
    name: "person_with_veil",
    shortcodes: ["person_with_veil"],
    tags: ["bride", "person", "veil", "wedding"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f470.png"
  },
  {
    emoji: "\u{1F470}\u200D\u2642",
    name: "man_with_veil",
    shortcodes: ["man_with_veil"],
    tags: ["man", "veil"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f470-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F470}\u200D\u2640",
    name: "bride_with_veil",
    shortcodes: ["woman_with_veil"],
    tags: ["veil", "woman"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f470-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F930}",
    name: "pregnant_woman",
    shortcodes: ["pregnant_woman"],
    tags: ["pregnant", "woman"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f930.png"
  },
  {
    emoji: "\u{1FAC3}",
    name: "pregnant_man",
    shortcodes: ["pregnant_man"],
    tags: ["belly", "bloated", "full", "pregnant"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FAC4}",
    name: "pregnant_person",
    shortcodes: ["pregnant_person"],
    tags: ["belly", "bloated", "full", "pregnant"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F931}",
    name: "breast_feeding",
    shortcodes: ["breast_feeding"],
    tags: ["baby", "breast", "nursing"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f931.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F37C}",
    name: "woman_feeding_baby",
    shortcodes: ["woman_feeding_baby"],
    tags: ["baby", "feeding", "nursing", "woman"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f37c.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F37C}",
    name: "man_feeding_baby",
    shortcodes: ["man_feeding_baby"],
    tags: ["baby", "feeding", "man", "nursing"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f37c.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F37C}",
    name: "person_feeding_baby",
    shortcodes: ["person_feeding_baby"],
    tags: ["baby", "feeding", "nursing", "person"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f37c.png"
  },
  {
    emoji: "\u{1F47C}",
    name: "angel",
    shortcodes: ["angel"],
    tags: ["angel", "baby", "face", "fairy tale", "fantasy"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f47c.png"
  },
  {
    emoji: "\u{1F385}",
    name: "santa",
    shortcodes: ["santa"],
    tags: ["celebration", "christmas", "claus", "father", "santa"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f385.png"
  },
  {
    emoji: "\u{1F936}",
    name: "mrs_claus",
    shortcodes: ["mrs_claus"],
    tags: ["celebration", "christmas", "claus", "mother", "mrs."],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f936.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F384}",
    name: "mx_claus",
    shortcodes: ["mx_claus"],
    tags: ["christmas", "claus"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f384.png"
  },
  {
    emoji: "\u{1F9B8}",
    name: "superhero",
    shortcodes: ["superhero"],
    tags: ["good", "hero", "heroine", "superpower"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b8.png"
  },
  {
    emoji: "\u{1F9B8}\u200D\u2642",
    name: "superhero_man",
    shortcodes: ["man_superhero"],
    tags: ["good", "hero", "man", "superpower"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b8-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9B8}\u200D\u2640",
    name: "superhero_woman",
    shortcodes: ["woman_superhero"],
    tags: ["good", "hero", "heroine", "superpower", "woman"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b8-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9B9}",
    name: "supervillain",
    shortcodes: ["supervillain"],
    tags: ["criminal", "evil", "superpower", "villain"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b9.png"
  },
  {
    emoji: "\u{1F9B9}\u200D\u2642",
    name: "supervillain_man",
    shortcodes: ["man_supervillain"],
    tags: ["criminal", "evil", "man", "superpower", "villain"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b9-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9B9}\u200D\u2640",
    name: "supervillain_woman",
    shortcodes: ["woman_supervillain"],
    tags: ["criminal", "evil", "superpower", "villain", "woman"],
    group: "people & body",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9b9-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9D9}",
    name: "mage",
    shortcodes: ["mage"],
    tags: ["sorcerer", "sorceress", "witch", "wizard"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d9.png"
  },
  {
    emoji: "\u{1F9D9}\u200D\u2642",
    name: "mage_man",
    shortcodes: ["man_mage"],
    tags: ["sorcerer", "wizard"],
    group: "people & body",
    emoticons: [":{>"],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d9-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9D9}\u200D\u2640",
    name: "mage_woman",
    shortcodes: ["woman_mage"],
    tags: ["sorceress", "witch"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d9-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9DA}",
    name: "fairy",
    shortcodes: ["fairy"],
    tags: ["oberon", "puck", "titania"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9da.png"
  },
  {
    emoji: "\u{1F9DA}\u200D\u2642",
    name: "fairy_man",
    shortcodes: ["man_fairy"],
    tags: ["oberon", "puck"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9da-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9DA}\u200D\u2640",
    name: "fairy_woman",
    shortcodes: ["woman_fairy"],
    tags: ["titania"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9da-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9DB}",
    name: "vampire",
    shortcodes: ["vampire"],
    tags: ["dracula", "undead"],
    group: "people & body",
    emoticons: [":E"],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9db.png"
  },
  {
    emoji: "\u{1F9DB}\u200D\u2642",
    name: "vampire_man",
    shortcodes: ["man_vampire"],
    tags: ["dracula", "undead"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9db-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9DB}\u200D\u2640",
    name: "vampire_woman",
    shortcodes: ["woman_vampire"],
    tags: ["undead"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9db-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9DC}",
    name: "merperson",
    shortcodes: ["merperson"],
    tags: ["mermaid", "merman", "merwoman"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9dc.png"
  },
  {
    emoji: "\u{1F9DC}\u200D\u2642",
    name: "merman",
    shortcodes: ["merman"],
    tags: ["triton"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9dc-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9DC}\u200D\u2640",
    name: "mermaid",
    shortcodes: ["mermaid"],
    tags: ["merwoman"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9dc-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9DD}",
    name: "elf",
    shortcodes: ["elf"],
    tags: ["magical"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9dd.png"
  },
  {
    emoji: "\u{1F9DD}\u200D\u2642",
    name: "elf_man",
    shortcodes: ["man_elf"],
    tags: ["magical"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9dd-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9DD}\u200D\u2640",
    name: "elf_woman",
    shortcodes: ["woman_elf"],
    tags: ["magical"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9dd-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9DE}",
    name: "genie",
    shortcodes: ["genie"],
    tags: ["djinn"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9de.png"
  },
  {
    emoji: "\u{1F9DE}\u200D\u2642",
    name: "genie_man",
    shortcodes: ["man_genie"],
    tags: ["djinn"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9de-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9DE}\u200D\u2640",
    name: "genie_woman",
    shortcodes: ["woman_genie"],
    tags: ["djinn"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9de-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9DF}",
    name: "zombie",
    shortcodes: ["zombie"],
    tags: ["undead", "walking dead"],
    group: "people & body",
    emoticons: ["8#"],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9df.png"
  },
  {
    emoji: "\u{1F9DF}\u200D\u2642",
    name: "zombie_man",
    shortcodes: ["man_zombie"],
    tags: ["undead", "walking dead"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9df-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9DF}\u200D\u2640",
    name: "zombie_woman",
    shortcodes: ["woman_zombie"],
    tags: ["undead", "walking dead"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9df-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9CC}",
    name: "troll",
    shortcodes: ["troll"],
    tags: ["fairy tale", "fantasy", "monster"],
    group: "people & body",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F486}",
    name: "massage",
    shortcodes: ["massage", "person_getting_massage"],
    tags: ["face", "massage", "salon"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f486.png"
  },
  {
    emoji: "\u{1F486}\u200D\u2642",
    name: "massage_man",
    shortcodes: ["man_getting_massage"],
    tags: ["face", "man", "massage"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f486-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F486}\u200D\u2640",
    name: "massage_woman",
    shortcodes: ["woman_getting_massage"],
    tags: ["face", "massage", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f486-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F487}",
    name: "haircut",
    shortcodes: ["haircut", "person_getting_haircut"],
    tags: ["barber", "beauty", "haircut", "parlor"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f487.png"
  },
  {
    emoji: "\u{1F487}\u200D\u2642",
    name: "haircut_man",
    shortcodes: ["man_getting_haircut"],
    tags: ["haircut", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f487-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F487}\u200D\u2640",
    name: "haircut_woman",
    shortcodes: ["woman_getting_haircut"],
    tags: ["haircut", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f487-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F6B6}",
    name: "walking",
    shortcodes: ["person_walking", "walking"],
    tags: ["hike", "walk", "walking"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b6.png"
  },
  {
    emoji: "\u{1F6B6}\u200D\u2642",
    name: "walking_man",
    shortcodes: ["man_walking"],
    tags: ["hike", "man", "walk"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b6-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F6B6}\u200D\u2640",
    name: "walking_woman",
    shortcodes: ["woman_walking"],
    tags: ["hike", "walk", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b6-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F6B6}\u200D\u27A1",
    name: "person_walking_right",
    shortcodes: ["person_walking_right"],
    tags: ["hike", "person walking", "walk", "walking"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F6B6}\u200D\u2640\u200D\u27A1\uFE0F",
    name: "woman_walking_right",
    shortcodes: ["woman_walking_right"],
    tags: ["hike", "walk", "woman", "woman walking"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F6B6}\u200D\u2642\u200D\u27A1\uFE0F",
    name: "man_walking_right",
    shortcodes: ["man_walking_right"],
    tags: ["hike", "man", "man walking", "walk"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9CD}",
    name: "standing_person",
    shortcodes: ["person_standing", "standing"],
    tags: ["stand", "standing"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9cd.png"
  },
  {
    emoji: "\u{1F9CD}\u200D\u2642",
    name: "standing_man",
    shortcodes: ["man_standing"],
    tags: ["man", "standing"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9cd-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9CD}\u200D\u2640",
    name: "standing_woman",
    shortcodes: ["woman_standing"],
    tags: ["standing", "woman"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9cd-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9CE}",
    name: "kneeling_person",
    shortcodes: ["kneeling", "person_kneeling"],
    tags: ["kneel", "kneeling"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ce.png"
  },
  {
    emoji: "\u{1F9CE}\u200D\u2642",
    name: "kneeling_man",
    shortcodes: ["man_kneeling"],
    tags: ["kneeling", "man"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ce-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9CE}\u200D\u2640",
    name: "kneeling_woman",
    shortcodes: ["woman_kneeling"],
    tags: ["kneeling", "woman"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ce-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9CE}\u200D\u27A1",
    name: "person_kneeling_right",
    shortcodes: ["person_kneeling_right"],
    tags: ["kneel", "kneeling", "person kneeling"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9CE}\u200D\u2640\u200D\u27A1\uFE0F",
    name: "woman_kneeling_right",
    shortcodes: ["woman_kneeling_right"],
    tags: ["kneeling", "woman"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9CE}\u200D\u2642\u200D\u27A1\uFE0F",
    name: "man_kneeling_right",
    shortcodes: ["man_kneeling_right"],
    tags: ["kneeling", "man"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9AF}",
    name: "person_with_probing_cane",
    shortcodes: ["person_with_probing_cane", "person_with_white_cane"],
    tags: ["accessibility", "blind"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f9af.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9AF}\u200D\u27A1",
    name: "person_with_white_cane_right",
    shortcodes: ["person_with_white_cane_right"],
    tags: ["accessibility", "blind", "person with white cane"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9AF}",
    name: "man_with_probing_cane",
    shortcodes: ["man_with_probing_cane", "man_with_white_cane"],
    tags: ["accessibility", "blind", "man"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f9af.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9AF}\u200D\u27A1",
    name: "man_with_white_cane_right",
    shortcodes: ["man_with_white_cane_right"],
    tags: ["accessibility", "blind", "man", "man with white cane"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9AF}",
    name: "woman_with_probing_cane",
    shortcodes: ["woman_with_probing_cane", "woman_with_white_cane"],
    tags: ["accessibility", "blind", "woman"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f9af.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9AF}\u200D\u27A1",
    name: "woman_with_white_cane_right",
    shortcodes: ["woman_with_white_cane_right"],
    tags: ["accessibility", "blind", "woman", "woman with white cane"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9BC}",
    name: "person_in_motorized_wheelchair",
    shortcodes: ["person_in_motorized_wheelchair"],
    tags: ["accessibility", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f9bc.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9BC}\u200D\u27A1",
    name: "person_in_motorized_wheelchair_right",
    shortcodes: ["person_in_motorized_wheelchair_right"],
    tags: ["accessibility", "person in motorized wheelchair", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9BC}",
    name: "man_in_motorized_wheelchair",
    shortcodes: ["man_in_motorized_wheelchair"],
    tags: ["accessibility", "man", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f9bc.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9BC}\u200D\u27A1",
    name: "man_in_motorized_wheelchair_right",
    shortcodes: ["man_in_motorized_wheelchair_right"],
    tags: ["accessibility", "man", "man in motorized wheelchair", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9BC}",
    name: "woman_in_motorized_wheelchair",
    shortcodes: ["woman_in_motorized_wheelchair"],
    tags: ["accessibility", "wheelchair", "woman"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f9bc.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9BC}\u200D\u27A1",
    name: "woman_in_motorized_wheelchair_right",
    shortcodes: ["woman_in_motorized_wheelchair_right"],
    tags: ["accessibility", "wheelchair", "woman", "woman in motorized wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9BD}",
    name: "person_in_manual_wheelchair",
    shortcodes: ["person_in_manual_wheelchair"],
    tags: ["accessibility", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 12.1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f9bd.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9BD}\u200D\u27A1",
    name: "person_in_manual_wheelchair_right",
    shortcodes: ["person_in_manual_wheelchair_right"],
    tags: ["accessibility", "person in manual wheelchair", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9BD}",
    name: "man_in_manual_wheelchair",
    shortcodes: ["man_in_manual_wheelchair"],
    tags: ["accessibility", "man", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f9bd.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9BD}\u200D\u27A1",
    name: "man_in_manual_wheelchair_right",
    shortcodes: ["man_in_manual_wheelchair_right"],
    tags: ["accessibility", "man", "man in manual wheelchair", "wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9BD}",
    name: "woman_in_manual_wheelchair",
    shortcodes: ["woman_in_manual_wheelchair"],
    tags: ["accessibility", "wheelchair", "woman"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f9bd.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9BD}\u200D\u27A1",
    name: "woman_in_manual_wheelchair_right",
    shortcodes: ["woman_in_manual_wheelchair_right"],
    tags: ["accessibility", "wheelchair", "woman", "woman in manual wheelchair"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F3C3}",
    name: "runner",
    shortcodes: ["person_running", "running"],
    tags: ["marathon", "running"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c3.png"
  },
  {
    emoji: "\u{1F3C3}\u200D\u2642",
    name: "running_man",
    shortcodes: ["man_running"],
    tags: ["man", "marathon", "racing", "running"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c3-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F3C3}\u200D\u2640",
    name: "running_woman",
    shortcodes: ["woman_running"],
    tags: ["marathon", "racing", "running", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c3-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F3C3}\u200D\u27A1",
    name: "person_running_right",
    shortcodes: ["person_running_right"],
    tags: ["marathon", "person running", "running"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F3C3}\u200D\u2640\u200D\u27A1\uFE0F",
    name: "woman_running_right",
    shortcodes: ["woman_running_right"],
    tags: ["marathon", "racing", "running", "woman"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F3C3}\u200D\u2642\u200D\u27A1\uFE0F",
    name: "man_running_right",
    shortcodes: ["man_running_right"],
    tags: ["man", "marathon", "racing", "running"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F483}",
    name: "dancer",
    shortcodes: ["dancer", "woman_dancing"],
    tags: ["dance", "dancing", "woman"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f483.png"
  },
  {
    emoji: "\u{1F57A}",
    name: "man_dancing",
    shortcodes: ["man_dancing"],
    tags: ["dance", "dancing", "man"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f57a.png"
  },
  {
    emoji: "\u{1F574}",
    name: "business_suit_levitating",
    shortcodes: ["levitate", "levitating", "person_in_suit_levitating"],
    tags: ["business", "person", "suit"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f574-fe0f.png"
  },
  {
    emoji: "\u{1F46F}",
    name: "dancers",
    shortcodes: ["dancers", "people_with_bunny_ears_partying"],
    tags: ["bunny ear", "dancer", "partying"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46f.png"
  },
  {
    emoji: "\u{1F46F}\u200D\u2642",
    name: "dancing_men",
    shortcodes: ["men_with_bunny_ears_partying"],
    tags: ["bunny ear", "dancer", "men", "partying"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46f-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F46F}\u200D\u2640",
    name: "dancing_women",
    shortcodes: ["women_with_bunny_ears_partying"],
    tags: ["bunny ear", "dancer", "partying", "women"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46f-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9D6}",
    name: "sauna_person",
    shortcodes: ["person_in_steamy_room"],
    tags: ["sauna", "steam room"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d6.png"
  },
  {
    emoji: "\u{1F9D6}\u200D\u2642",
    name: "sauna_man",
    shortcodes: ["man_in_steamy_room"],
    tags: ["sauna", "steam room"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d6-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9D6}\u200D\u2640",
    name: "sauna_woman",
    shortcodes: ["woman_in_steamy_room"],
    tags: ["sauna", "steam room"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d6-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9D7}",
    name: "climbing",
    shortcodes: ["climbing", "person_climbing"],
    tags: ["climber"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d7.png"
  },
  {
    emoji: "\u{1F9D7}\u200D\u2642",
    name: "climbing_man",
    shortcodes: ["man_climbing"],
    tags: ["climber"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d7-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9D7}\u200D\u2640",
    name: "climbing_woman",
    shortcodes: ["woman_climbing"],
    tags: ["climber"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d7-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F93A}",
    name: "person_fencing",
    shortcodes: ["fencer", "fencing", "person_fencing"],
    tags: ["fencer", "fencing", "sword"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93a.png"
  },
  {
    emoji: "\u{1F3C7}",
    name: "horse_racing",
    shortcodes: ["horse_racing"],
    tags: ["horse", "jockey", "racehorse", "racing"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c7.png"
  },
  {
    emoji: "\u26F7",
    name: "skier",
    shortcodes: ["person_skiing", "skier", "skiing"],
    tags: ["ski", "snow"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f7-fe0f.png"
  },
  {
    emoji: "\u{1F3C2}",
    name: "snowboarder",
    shortcodes: ["person_snowboarding", "snowboarder", "snowboarding"],
    tags: ["ski", "snow", "snowboard"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c2.png"
  },
  {
    emoji: "\u{1F3CC}",
    name: "golfing",
    shortcodes: ["golfer", "golfing", "person_golfing"],
    tags: ["ball", "golf"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cc-fe0f.png"
  },
  {
    emoji: "\u{1F3CC}\u200D\u2642\uFE0F",
    name: "golfing_man",
    shortcodes: ["man_golfing"],
    tags: ["golf", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cc-fe0f-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F3CC}\u200D\u2640\uFE0F",
    name: "golfing_woman",
    shortcodes: ["woman_golfing"],
    tags: ["golf", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cc-fe0f-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F3C4}",
    name: "surfer",
    shortcodes: ["person_surfing", "surfer", "surfing"],
    tags: ["surfing"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c4.png"
  },
  {
    emoji: "\u{1F3C4}\u200D\u2642",
    name: "surfing_man",
    shortcodes: ["man_surfing"],
    tags: ["man", "surfing"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c4-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F3C4}\u200D\u2640",
    name: "surfing_woman",
    shortcodes: ["woman_surfing"],
    tags: ["surfing", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c4-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F6A3}",
    name: "rowboat",
    shortcodes: ["person_rowing_boat", "rowboat"],
    tags: ["boat", "rowboat"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a3.png"
  },
  {
    emoji: "\u{1F6A3}\u200D\u2642",
    name: "rowing_man",
    shortcodes: ["man_rowing_boat"],
    tags: ["boat", "man", "rowboat"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a3-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F6A3}\u200D\u2640",
    name: "rowing_woman",
    shortcodes: ["woman_rowing_boat"],
    tags: ["boat", "rowboat", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a3-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F3CA}",
    name: "swimmer",
    shortcodes: ["person_swimming", "swimmer", "swimming"],
    tags: ["swim"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ca.png"
  },
  {
    emoji: "\u{1F3CA}\u200D\u2642",
    name: "swimming_man",
    shortcodes: ["man_swimming"],
    tags: ["man", "swim"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ca-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F3CA}\u200D\u2640",
    name: "swimming_woman",
    shortcodes: ["woman_swimming"],
    tags: ["swim", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ca-200d-2640-fe0f.png"
  },
  {
    emoji: "\u26F9",
    name: "bouncing_ball_person",
    shortcodes: ["person_bouncing_ball"],
    tags: ["ball"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f9-fe0f.png"
  },
  {
    emoji: "\u26F9\u200D\u2642\uFE0F",
    name: "basketball_man",
    shortcodes: ["man_bouncing_ball"],
    tags: ["ball", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f9-fe0f-200d-2642-fe0f.png"
  },
  {
    emoji: "\u26F9\u200D\u2640\uFE0F",
    name: "basketball_woman",
    shortcodes: ["woman_bouncing_ball"],
    tags: ["ball", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f9-fe0f-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F3CB}",
    name: "weight_lifting",
    shortcodes: ["person_lifting_weights", "weight_lifter", "weight_lifting"],
    tags: ["lifter", "weight"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cb-fe0f.png"
  },
  {
    emoji: "\u{1F3CB}\u200D\u2642\uFE0F",
    name: "weight_lifting_man",
    shortcodes: ["man_lifting_weights"],
    tags: ["man", "weight lifter"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cb-fe0f-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F3CB}\u200D\u2640\uFE0F",
    name: "weight_lifting_woman",
    shortcodes: ["woman_lifting_weights"],
    tags: ["weight lifter", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cb-fe0f-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F6B4}",
    name: "bicyclist",
    shortcodes: ["bicyclist", "biking", "person_biking"],
    tags: ["bicycle", "biking", "cyclist"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b4.png"
  },
  {
    emoji: "\u{1F6B4}\u200D\u2642",
    name: "biking_man",
    shortcodes: ["man_biking"],
    tags: ["bicycle", "biking", "cyclist", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b4-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F6B4}\u200D\u2640",
    name: "biking_woman",
    shortcodes: ["woman_biking"],
    tags: ["bicycle", "biking", "cyclist", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b4-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F6B5}",
    name: "mountain_bicyclist",
    shortcodes: ["mountain_bicyclist", "mountain_biking", "person_mountain_biking"],
    tags: ["bicycle", "bicyclist", "bike", "cyclist", "mountain"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b5.png"
  },
  {
    emoji: "\u{1F6B5}\u200D\u2642",
    name: "mountain_biking_man",
    shortcodes: ["man_mountain_biking"],
    tags: ["bicycle", "bike", "cyclist", "man", "mountain"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b5-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F6B5}\u200D\u2640",
    name: "mountain_biking_woman",
    shortcodes: ["woman_mountain_biking"],
    tags: ["bicycle", "bike", "biking", "cyclist", "mountain", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b5-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F938}",
    name: "cartwheeling",
    shortcodes: ["cartwheeling", "person_cartwheel"],
    tags: ["cartwheel", "gymnastics"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f938.png"
  },
  {
    emoji: "\u{1F938}\u200D\u2642",
    name: "man_cartwheeling",
    shortcodes: ["man_cartwheeling"],
    tags: ["cartwheel", "gymnastics", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f938-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F938}\u200D\u2640",
    name: "woman_cartwheeling",
    shortcodes: ["woman_cartwheeling"],
    tags: ["cartwheel", "gymnastics", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f938-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F93C}",
    name: "wrestling",
    shortcodes: ["people_wrestling", "wrestlers", "wrestling"],
    tags: ["wrestle", "wrestler"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93c.png"
  },
  {
    emoji: "\u{1F93C}\u200D\u2642",
    name: "men_wrestling",
    shortcodes: ["men_wrestling"],
    tags: ["men", "wrestle"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93c-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F93C}\u200D\u2640",
    name: "women_wrestling",
    shortcodes: ["women_wrestling"],
    tags: ["women", "wrestle"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93c-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F93D}",
    name: "water_polo",
    shortcodes: ["person_playing_water_polo", "water_polo"],
    tags: ["polo", "water"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93d.png"
  },
  {
    emoji: "\u{1F93D}\u200D\u2642",
    name: "man_playing_water_polo",
    shortcodes: ["man_playing_water_polo"],
    tags: ["man", "water polo"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93d-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F93D}\u200D\u2640",
    name: "woman_playing_water_polo",
    shortcodes: ["woman_playing_water_polo"],
    tags: ["water polo", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93d-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F93E}",
    name: "handball_person",
    shortcodes: ["handball", "person_playing_handball"],
    tags: ["ball", "handball"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93e.png"
  },
  {
    emoji: "\u{1F93E}\u200D\u2642",
    name: "man_playing_handball",
    shortcodes: ["man_playing_handball"],
    tags: ["handball", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93e-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F93E}\u200D\u2640",
    name: "woman_playing_handball",
    shortcodes: ["woman_playing_handball"],
    tags: ["handball", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93e-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F939}",
    name: "juggling_person",
    shortcodes: ["juggler", "juggling", "person_juggling"],
    tags: ["balance", "juggle", "multitask", "skill"],
    group: "people & body",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f939.png"
  },
  {
    emoji: "\u{1F939}\u200D\u2642",
    name: "man_juggling",
    shortcodes: ["man_juggling"],
    tags: ["juggling", "man", "multitask"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f939-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F939}\u200D\u2640",
    name: "woman_juggling",
    shortcodes: ["woman_juggling"],
    tags: ["juggling", "multitask", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f939-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F9D8}",
    name: "lotus_position",
    shortcodes: ["person_in_lotus_position"],
    tags: ["meditation", "yoga"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d8.png"
  },
  {
    emoji: "\u{1F9D8}\u200D\u2642",
    name: "lotus_position_man",
    shortcodes: ["man_in_lotus_position"],
    tags: ["meditation", "yoga"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d8-200d-2642-fe0f.png"
  },
  {
    emoji: "\u{1F9D8}\u200D\u2640",
    name: "lotus_position_woman",
    shortcodes: ["woman_in_lotus_position"],
    tags: ["meditation", "yoga"],
    group: "people & body",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d8-200d-2640-fe0f.png"
  },
  {
    emoji: "\u{1F6C0}",
    name: "bath",
    shortcodes: ["bath", "person_taking_bath"],
    tags: ["bath", "bathtub"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6c0.png"
  },
  {
    emoji: "\u{1F6CC}",
    name: "sleeping_bed",
    shortcodes: ["person_in_bed", "sleeping_accommodation"],
    tags: ["good night", "hotel", "sleep"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6cc.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}",
    name: "people_holding_hands",
    shortcodes: ["people_holding_hands"],
    tags: ["couple", "hand", "hold", "holding hands", "person"],
    group: "people & body",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9d1-200d-1f91d-200d-1f9d1.png"
  },
  {
    emoji: "\u{1F46D}",
    name: "two_women_holding_hands",
    shortcodes: ["two_women_holding_hands"],
    tags: ["couple", "hand", "holding hands", "women"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46d.png"
  },
  {
    emoji: "\u{1F46B}",
    name: "couple",
    shortcodes: ["couple"],
    tags: ["couple", "hand", "hold", "holding hands", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46b.png"
  },
  {
    emoji: "\u{1F46C}",
    name: "two_men_holding_hands",
    shortcodes: ["two_men_holding_hands"],
    tags: ["couple", "gemini", "holding hands", "man", "men", "twins", "zodiac"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46c.png"
  },
  {
    emoji: "\u{1F48F}",
    name: "couplekiss",
    shortcodes: ["couple_kiss", "couplekiss"],
    tags: ["couple"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f48f.png"
  },
  {
    emoji: "\u{1F469}\u200D\u2764\u200D\u{1F48B}\u200D\u{1F468}",
    name: "couplekiss_man_woman",
    shortcodes: ["kiss_mw", "kiss_wm"],
    tags: ["couple", "kiss", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-2764-fe0f-200d-1f48b-200d-1f468.png"
  },
  {
    emoji: "\u{1F468}\u200D\u2764\u200D\u{1F48B}\u200D\u{1F468}",
    name: "couplekiss_man_man",
    shortcodes: ["kiss_mm"],
    tags: ["couple", "kiss", "man"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-2764-fe0f-200d-1f48b-200d-1f468.png"
  },
  {
    emoji: "\u{1F469}\u200D\u2764\u200D\u{1F48B}\u200D\u{1F469}",
    name: "couplekiss_woman_woman",
    shortcodes: ["kiss_ww"],
    tags: ["couple", "kiss", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-2764-fe0f-200d-1f48b-200d-1f469.png"
  },
  {
    emoji: "\u{1F491}",
    name: "couple_with_heart",
    shortcodes: ["couple_with_heart"],
    tags: ["couple", "love"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f491.png"
  },
  {
    emoji: "\u{1F469}\u200D\u2764\u200D\u{1F468}",
    name: "couple_with_heart_woman_man",
    shortcodes: ["couple_with_heart_mw", "couple_with_heart_wm"],
    tags: ["couple", "couple with heart", "love", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-2764-fe0f-200d-1f468.png"
  },
  {
    emoji: "\u{1F468}\u200D\u2764\u200D\u{1F468}",
    name: "couple_with_heart_man_man",
    shortcodes: ["couple_with_heart_mm"],
    tags: ["couple", "couple with heart", "love", "man"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-2764-fe0f-200d-1f468.png"
  },
  {
    emoji: "\u{1F469}\u200D\u2764\u200D\u{1F469}",
    name: "couple_with_heart_woman_woman",
    shortcodes: ["couple_with_heart_ww"],
    tags: ["couple", "couple with heart", "love", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-2764-fe0f-200d-1f469.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}",
    name: "family_man_woman_boy",
    shortcodes: ["family_mwb"],
    tags: ["boy", "family", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f469-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
    name: "family_man_woman_girl",
    shortcodes: ["family_mwg"],
    tags: ["family", "girl", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f469-200d-1f467.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    name: "family_man_woman_girl_boy",
    shortcodes: ["family_mwgb"],
    tags: ["boy", "family", "girl", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f469-200d-1f467-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    name: "family_man_woman_boy_boy",
    shortcodes: ["family_mwbb"],
    tags: ["boy", "family", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f469-200d-1f466-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    name: "family_man_woman_girl_girl",
    shortcodes: ["family_mwgg"],
    tags: ["family", "girl", "man", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f469-200d-1f467-200d-1f467.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}",
    name: "family_man_man_boy",
    shortcodes: ["family_mmb"],
    tags: ["boy", "family", "man"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f468-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}",
    name: "family_man_man_girl",
    shortcodes: ["family_mmg"],
    tags: ["family", "girl", "man"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f468-200d-1f467.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    name: "family_man_man_girl_boy",
    shortcodes: ["family_mmgb"],
    tags: ["boy", "family", "girl", "man"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f468-200d-1f467-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    name: "family_man_man_boy_boy",
    shortcodes: ["family_mmbb"],
    tags: ["boy", "family", "man"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f468-200d-1f466-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    name: "family_man_man_girl_girl",
    shortcodes: ["family_mmgg"],
    tags: ["family", "girl", "man"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f468-200d-1f467-200d-1f467.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}",
    name: "family_woman_woman_boy",
    shortcodes: ["family_wwb"],
    tags: ["boy", "family", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f469-200d-1f466.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}",
    name: "family_woman_woman_girl",
    shortcodes: ["family_wwg"],
    tags: ["family", "girl", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f469-200d-1f467.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    name: "family_woman_woman_girl_boy",
    shortcodes: ["family_wwgb"],
    tags: ["boy", "family", "girl", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f469-200d-1f467-200d-1f466.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    name: "family_woman_woman_boy_boy",
    shortcodes: ["family_wwbb"],
    tags: ["boy", "family", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f469-200d-1f466-200d-1f466.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    name: "family_woman_woman_girl_girl",
    shortcodes: ["family_wwgg"],
    tags: ["family", "girl", "woman"],
    group: "people & body",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f469-200d-1f467-200d-1f467.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F466}",
    name: "family_man_boy",
    shortcodes: ["family_mb"],
    tags: ["boy", "family", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    name: "family_man_boy_boy",
    shortcodes: ["family_mbb"],
    tags: ["boy", "family", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f466-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F467}",
    name: "family_man_girl",
    shortcodes: ["family_mg"],
    tags: ["family", "girl", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f467.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    name: "family_man_girl_boy",
    shortcodes: ["family_mgb"],
    tags: ["boy", "family", "girl", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f467-200d-1f466.png"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    name: "family_man_girl_girl",
    shortcodes: ["family_mgg"],
    tags: ["family", "girl", "man"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-200d-1f467-200d-1f467.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F466}",
    name: "family_woman_boy",
    shortcodes: ["family_wb"],
    tags: ["boy", "family", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f466.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    name: "family_woman_boy_boy",
    shortcodes: ["family_wbb"],
    tags: ["boy", "family", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f466-200d-1f466.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F467}",
    name: "family_woman_girl",
    shortcodes: ["family_wg"],
    tags: ["family", "girl", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f467.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    name: "family_woman_girl_boy",
    shortcodes: ["family_wgb"],
    tags: ["boy", "family", "girl", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f467-200d-1f466.png"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    name: "family_woman_girl_girl",
    shortcodes: ["family_wgg"],
    tags: ["family", "girl", "woman"],
    group: "people & body",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f469-200d-1f467-200d-1f467.png"
  },
  {
    emoji: "\u{1F5E3}",
    name: "speaking_head",
    shortcodes: ["speaking_head"],
    tags: ["face", "head", "silhouette", "speak", "speaking"],
    group: "people & body",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5e3-fe0f.png"
  },
  {
    emoji: "\u{1F464}",
    name: "bust_in_silhouette",
    shortcodes: ["bust_in_silhouette"],
    tags: ["bust", "silhouette"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f464.png"
  },
  {
    emoji: "\u{1F465}",
    name: "busts_in_silhouette",
    shortcodes: ["busts_in_silhouette"],
    tags: ["bust", "silhouette"],
    group: "people & body",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f465.png"
  },
  {
    emoji: "\u{1FAC2}",
    name: "people_hugging",
    shortcodes: ["people_hugging"],
    tags: ["goodbye", "hello", "hug", "thanks"],
    group: "people & body",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fac2.png"
  },
  {
    emoji: "\u{1F46A}",
    name: "family",
    shortcodes: ["family"],
    tags: ["family"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f46a.png"
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9D1}\u200D\u{1F9D2}",
    name: "family_aac",
    shortcodes: ["family_aac"],
    tags: ["family: adult, adult, child"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9D1}\u200D\u{1F9D2}\u200D\u{1F9D2}",
    name: "family_aacc",
    shortcodes: ["family_aacc"],
    tags: ["family: adult, adult, child, child"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9D2}",
    name: "family_ac",
    shortcodes: ["family_ac"],
    tags: ["family: adult, child"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9D2}\u200D\u{1F9D2}",
    name: "family_acc",
    shortcodes: ["family_acc"],
    tags: ["family: adult, child, child"],
    group: "people & body",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F463}",
    name: "footprints",
    shortcodes: ["footprints"],
    tags: ["clothing", "footprint", "print"],
    group: "people & body",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f463.png"
  },
  {
    emoji: "\u{1F3FB}",
    name: "tone1",
    shortcodes: ["tone1", "tone_light"],
    tags: ["skin tone", "type 1\u20132"],
    group: "components",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3fb.png"
  },
  {
    emoji: "\u{1F3FC}",
    name: "tone2",
    shortcodes: ["tone2", "tone_medium_light"],
    tags: ["skin tone", "type 3"],
    group: "components",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3fc.png"
  },
  {
    emoji: "\u{1F3FD}",
    name: "tone3",
    shortcodes: ["tone3", "tone_medium"],
    tags: ["skin tone", "type 4"],
    group: "components",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3fd.png"
  },
  {
    emoji: "\u{1F3FE}",
    name: "tone4",
    shortcodes: ["tone4", "tone_medium_dark"],
    tags: ["skin tone", "type 5"],
    group: "components",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3fe.png"
  },
  {
    emoji: "\u{1F3FF}",
    name: "tone5",
    shortcodes: ["tone5", "tone_dark"],
    tags: ["skin tone", "type 6"],
    group: "components",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ff.png"
  },
  {
    emoji: "\u{1F9B0}",
    name: "red_hair",
    shortcodes: ["red_hair"],
    tags: ["ginger", "redhead"],
    group: "components",
    emoticons: [],
    version: 11
  },
  {
    emoji: "\u{1F9B1}",
    name: "curly_hair",
    shortcodes: ["curly_hair"],
    tags: ["afro", "curly", "ringlets"],
    group: "components",
    emoticons: [],
    version: 11
  },
  {
    emoji: "\u{1F9B3}",
    name: "white_hair",
    shortcodes: ["white_hair"],
    tags: ["gray", "hair", "old", "white"],
    group: "components",
    emoticons: [],
    version: 11
  },
  {
    emoji: "\u{1F9B2}",
    name: "no_hair",
    shortcodes: ["no_hair"],
    tags: ["chemotherapy", "hairless", "no hair", "shaven"],
    group: "components",
    emoticons: [],
    version: 11
  },
  {
    emoji: "\u{1F435}",
    name: "monkey_face",
    shortcodes: ["monkey_face"],
    tags: ["face", "monkey"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f435.png"
  },
  {
    emoji: "\u{1F412}",
    name: "monkey",
    shortcodes: ["monkey"],
    tags: ["monkey"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f412.png"
  },
  {
    emoji: "\u{1F98D}",
    name: "gorilla",
    shortcodes: ["gorilla"],
    tags: ["gorilla"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f98d.png"
  },
  {
    emoji: "\u{1F9A7}",
    name: "orangutan",
    shortcodes: ["orangutan"],
    tags: ["ape"],
    group: "animals & nature",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a7.png"
  },
  {
    emoji: "\u{1F436}",
    name: "dog",
    shortcodes: ["dog_face"],
    tags: ["dog", "face", "pet"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f436.png"
  },
  {
    emoji: "\u{1F415}",
    name: "dog2",
    shortcodes: ["dog"],
    tags: ["pet"],
    group: "animals & nature",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f415.png"
  },
  {
    emoji: "\u{1F9AE}",
    name: "guide_dog",
    shortcodes: ["guide_dog"],
    tags: ["accessibility", "blind", "guide"],
    group: "animals & nature",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ae.png"
  },
  {
    emoji: "\u{1F415}\u200D\u{1F9BA}",
    name: "service_dog",
    shortcodes: ["service_dog"],
    tags: ["accessibility", "assistance", "dog", "service"],
    group: "animals & nature",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f415-200d-1f9ba.png"
  },
  {
    emoji: "\u{1F429}",
    name: "poodle",
    shortcodes: ["poodle"],
    tags: ["dog"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f429.png"
  },
  {
    emoji: "\u{1F43A}",
    name: "wolf",
    shortcodes: ["wolf", "wolf_face"],
    tags: ["face"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f43a.png"
  },
  {
    emoji: "\u{1F98A}",
    name: "fox_face",
    shortcodes: ["fox", "fox_face"],
    tags: ["face"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f98a.png"
  },
  {
    emoji: "\u{1F99D}",
    name: "raccoon",
    shortcodes: ["raccoon"],
    tags: ["curious", "sly"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f99d.png"
  },
  {
    emoji: "\u{1F431}",
    name: "cat",
    shortcodes: ["cat_face"],
    tags: ["cat", "face", "pet"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f431.png"
  },
  {
    emoji: "\u{1F408}",
    name: "cat2",
    shortcodes: ["cat"],
    tags: ["pet"],
    group: "animals & nature",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f408.png"
  },
  {
    emoji: "\u{1F408}\u200D\u2B1B",
    name: "black_cat",
    shortcodes: ["black_cat"],
    tags: ["black", "cat", "unlucky"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f408-200d-2b1b.png"
  },
  {
    emoji: "\u{1F981}",
    name: "lion",
    shortcodes: ["lion", "lion_face"],
    tags: ["face", "leo", "zodiac"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f981.png"
  },
  {
    emoji: "\u{1F42F}",
    name: "tiger",
    shortcodes: ["tiger_face"],
    tags: ["face", "tiger"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f42f.png"
  },
  {
    emoji: "\u{1F405}",
    name: "tiger2",
    shortcodes: ["tiger"],
    tags: ["tiger"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f405.png"
  },
  {
    emoji: "\u{1F406}",
    name: "leopard",
    shortcodes: ["leopard"],
    tags: ["leopard"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f406.png"
  },
  {
    emoji: "\u{1F434}",
    name: "horse",
    shortcodes: ["horse_face"],
    tags: ["face", "horse"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f434.png"
  },
  {
    emoji: "\u{1FACE}",
    name: "moose",
    shortcodes: ["moose"],
    tags: ["animal", "antlers", "elk", "mammal"],
    group: "animals & nature",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1FACF}",
    name: "donkey",
    shortcodes: ["donkey"],
    tags: ["animal", "ass", "burro", "mammal", "mule", "stubborn"],
    group: "animals & nature",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F40E}",
    name: "racehorse",
    shortcodes: ["horse", "racehorse"],
    tags: ["equestrian", "racehorse", "racing"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f40e.png"
  },
  {
    emoji: "\u{1F984}",
    name: "unicorn",
    shortcodes: ["unicorn", "unicorn_face"],
    tags: ["face"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f984.png"
  },
  {
    emoji: "\u{1F993}",
    name: "zebra",
    shortcodes: ["zebra"],
    tags: ["stripe"],
    group: "animals & nature",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f993.png"
  },
  {
    emoji: "\u{1F98C}",
    name: "deer",
    shortcodes: ["deer"],
    tags: ["deer"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f98c.png"
  },
  {
    emoji: "\u{1F9AC}",
    name: "bison",
    shortcodes: ["bison"],
    tags: ["buffalo", "herd", "wisent"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ac.png"
  },
  {
    emoji: "\u{1F42E}",
    name: "cow",
    shortcodes: ["cow_face"],
    tags: ["cow", "face"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f42e.png"
  },
  {
    emoji: "\u{1F402}",
    name: "ox",
    shortcodes: ["ox"],
    tags: ["bull", "taurus", "zodiac"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f402.png"
  },
  {
    emoji: "\u{1F403}",
    name: "water_buffalo",
    shortcodes: ["water_buffalo"],
    tags: ["buffalo", "water"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f403.png"
  },
  {
    emoji: "\u{1F404}",
    name: "cow2",
    shortcodes: ["cow"],
    tags: ["cow"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f404.png"
  },
  {
    emoji: "\u{1F437}",
    name: "pig",
    shortcodes: ["pig_face"],
    tags: ["face", "pig"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f437.png"
  },
  {
    emoji: "\u{1F416}",
    name: "pig2",
    shortcodes: ["pig"],
    tags: ["sow"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f416.png"
  },
  {
    emoji: "\u{1F417}",
    name: "boar",
    shortcodes: ["boar"],
    tags: ["pig"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f417.png"
  },
  {
    emoji: "\u{1F43D}",
    name: "pig_nose",
    shortcodes: ["pig_nose"],
    tags: ["face", "nose", "pig"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f43d.png"
  },
  {
    emoji: "\u{1F40F}",
    name: "ram",
    shortcodes: ["ram"],
    tags: ["aries", "male", "sheep", "zodiac"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f40f.png"
  },
  {
    emoji: "\u{1F411}",
    name: "sheep",
    shortcodes: ["ewe", "sheep"],
    tags: ["female", "sheep"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f411.png"
  },
  {
    emoji: "\u{1F410}",
    name: "goat",
    shortcodes: ["goat"],
    tags: ["capricorn", "zodiac"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f410.png"
  },
  {
    emoji: "\u{1F42A}",
    name: "dromedary_camel",
    shortcodes: ["dromedary_camel"],
    tags: ["dromedary", "hump"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f42a.png"
  },
  {
    emoji: "\u{1F42B}",
    name: "camel",
    shortcodes: ["camel"],
    tags: ["bactrian", "camel", "hump"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f42b.png"
  },
  {
    emoji: "\u{1F999}",
    name: "llama",
    shortcodes: ["llama"],
    tags: ["alpaca", "guanaco", "vicu\xF1a", "wool"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f999.png"
  },
  {
    emoji: "\u{1F992}",
    name: "giraffe",
    shortcodes: ["giraffe"],
    tags: ["spots"],
    group: "animals & nature",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f992.png"
  },
  {
    emoji: "\u{1F418}",
    name: "elephant",
    shortcodes: ["elephant"],
    tags: ["elephant"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f418.png"
  },
  {
    emoji: "\u{1F9A3}",
    name: "mammoth",
    shortcodes: ["mammoth"],
    tags: ["extinction", "large", "tusk", "woolly"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a3.png"
  },
  {
    emoji: "\u{1F98F}",
    name: "rhinoceros",
    shortcodes: ["rhino", "rhinoceros"],
    tags: ["rhinoceros"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f98f.png"
  },
  {
    emoji: "\u{1F99B}",
    name: "hippopotamus",
    shortcodes: ["hippo"],
    tags: ["hippo"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f99b.png"
  },
  {
    emoji: "\u{1F42D}",
    name: "mouse",
    shortcodes: ["mouse_face"],
    tags: ["face", "mouse"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f42d.png"
  },
  {
    emoji: "\u{1F401}",
    name: "mouse2",
    shortcodes: ["mouse"],
    tags: ["mouse"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f401.png"
  },
  {
    emoji: "\u{1F400}",
    name: "rat",
    shortcodes: ["rat"],
    tags: ["rat"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f400.png"
  },
  {
    emoji: "\u{1F439}",
    name: "hamster",
    shortcodes: ["hamster", "hamster_face"],
    tags: ["face", "pet"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f439.png"
  },
  {
    emoji: "\u{1F430}",
    name: "rabbit",
    shortcodes: ["rabbit_face"],
    tags: ["bunny", "face", "pet", "rabbit"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f430.png"
  },
  {
    emoji: "\u{1F407}",
    name: "rabbit2",
    shortcodes: ["rabbit"],
    tags: ["bunny", "pet"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f407.png"
  },
  {
    emoji: "\u{1F43F}",
    name: "chipmunk",
    shortcodes: ["chipmunk"],
    tags: ["squirrel"],
    group: "animals & nature",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f43f-fe0f.png"
  },
  {
    emoji: "\u{1F9AB}",
    name: "beaver",
    shortcodes: ["beaver"],
    tags: ["dam"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ab.png"
  },
  {
    emoji: "\u{1F994}",
    name: "hedgehog",
    shortcodes: ["hedgehog"],
    tags: ["spiny"],
    group: "animals & nature",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f994.png"
  },
  {
    emoji: "\u{1F987}",
    name: "bat",
    shortcodes: ["bat"],
    tags: ["vampire"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f987.png"
  },
  {
    emoji: "\u{1F43B}",
    name: "bear",
    shortcodes: ["bear", "bear_face"],
    tags: ["face"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f43b.png"
  },
  {
    emoji: "\u{1F43B}\u200D\u2744",
    name: "polar_bear",
    shortcodes: ["polar_bear", "polar_bear_face"],
    tags: ["arctic", "bear", "white"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f43b-200d-2744-fe0f.png"
  },
  {
    emoji: "\u{1F428}",
    name: "koala",
    shortcodes: ["koala", "koala_face"],
    tags: ["face", "marsupial"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f428.png"
  },
  {
    emoji: "\u{1F43C}",
    name: "panda_face",
    shortcodes: ["panda", "panda_face"],
    tags: ["face"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f43c.png"
  },
  {
    emoji: "\u{1F9A5}",
    name: "sloth",
    shortcodes: ["sloth"],
    tags: ["lazy", "slow"],
    group: "animals & nature",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a5.png"
  },
  {
    emoji: "\u{1F9A6}",
    name: "otter",
    shortcodes: ["otter"],
    tags: ["fishing", "playful"],
    group: "animals & nature",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a6.png"
  },
  {
    emoji: "\u{1F9A8}",
    name: "skunk",
    shortcodes: ["skunk"],
    tags: ["stink"],
    group: "animals & nature",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a8.png"
  },
  {
    emoji: "\u{1F998}",
    name: "kangaroo",
    shortcodes: ["kangaroo"],
    tags: ["joey", "jump", "marsupial"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f998.png"
  },
  {
    emoji: "\u{1F9A1}",
    name: "badger",
    shortcodes: ["badger"],
    tags: ["honey badger", "pester"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a1.png"
  },
  {
    emoji: "\u{1F43E}",
    name: "feet",
    shortcodes: ["paw_prints"],
    tags: ["feet", "paw", "print"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f43e.png"
  },
  {
    emoji: "\u{1F983}",
    name: "turkey",
    shortcodes: ["turkey"],
    tags: ["bird"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f983.png"
  },
  {
    emoji: "\u{1F414}",
    name: "chicken",
    shortcodes: ["chicken", "chicken_face"],
    tags: ["bird"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f414.png"
  },
  {
    emoji: "\u{1F413}",
    name: "rooster",
    shortcodes: ["rooster"],
    tags: ["bird"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f413.png"
  },
  {
    emoji: "\u{1F423}",
    name: "hatching_chick",
    shortcodes: ["hatching_chick"],
    tags: ["baby", "bird", "chick", "hatching"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f423.png"
  },
  {
    emoji: "\u{1F424}",
    name: "baby_chick",
    shortcodes: ["baby_chick"],
    tags: ["baby", "bird", "chick"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f424.png"
  },
  {
    emoji: "\u{1F425}",
    name: "hatched_chick",
    shortcodes: ["hatched_chick"],
    tags: ["baby", "bird", "chick"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f425.png"
  },
  {
    emoji: "\u{1F426}",
    name: "bird",
    shortcodes: ["bird", "bird_face"],
    tags: ["bird"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f426.png"
  },
  {
    emoji: "\u{1F427}",
    name: "penguin",
    shortcodes: ["penguin", "penguin_face"],
    tags: ["bird"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f427.png"
  },
  {
    emoji: "\u{1F54A}",
    name: "dove",
    shortcodes: ["dove"],
    tags: ["bird", "fly", "peace"],
    group: "animals & nature",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f54a-fe0f.png"
  },
  {
    emoji: "\u{1F985}",
    name: "eagle",
    shortcodes: ["eagle"],
    tags: ["bird"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f985.png"
  },
  {
    emoji: "\u{1F986}",
    name: "duck",
    shortcodes: ["duck"],
    tags: ["bird"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f986.png"
  },
  {
    emoji: "\u{1F9A2}",
    name: "swan",
    shortcodes: ["swan"],
    tags: ["bird", "cygnet", "ugly duckling"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a2.png"
  },
  {
    emoji: "\u{1F989}",
    name: "owl",
    shortcodes: ["owl"],
    tags: ["bird", "wise"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f989.png"
  },
  {
    emoji: "\u{1F9A4}",
    name: "dodo",
    shortcodes: ["dodo"],
    tags: ["extinction", "large", "mauritius"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a4.png"
  },
  {
    emoji: "\u{1FAB6}",
    name: "feather",
    shortcodes: ["feather"],
    tags: ["bird", "flight", "light", "plumage"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fab6.png"
  },
  {
    emoji: "\u{1F9A9}",
    name: "flamingo",
    shortcodes: ["flamingo"],
    tags: ["flamboyant", "tropical"],
    group: "animals & nature",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a9.png"
  },
  {
    emoji: "\u{1F99A}",
    name: "peacock",
    shortcodes: ["peacock"],
    tags: ["bird", "ostentatious", "peahen", "proud"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f99a.png"
  },
  {
    emoji: "\u{1F99C}",
    name: "parrot",
    shortcodes: ["parrot"],
    tags: ["bird", "pirate", "talk"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f99c.png"
  },
  {
    emoji: "\u{1FABD}",
    name: "wing",
    shortcodes: ["wing"],
    tags: ["angelic", "aviation", "bird", "flying", "mythology"],
    group: "animals & nature",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F426}\u200D\u2B1B",
    name: "black_bird",
    shortcodes: ["black_bird"],
    tags: ["bird", "black", "crow", "raven", "rook"],
    group: "animals & nature",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1FABF}",
    name: "goose",
    shortcodes: ["goose"],
    tags: ["bird", "fowl", "honk", "silly"],
    group: "animals & nature",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F426}\u200D\u{1F525}",
    name: "phoenix",
    shortcodes: ["phoenix"],
    tags: ["fantasy", "firebird", "rebirth", "reincarnation"],
    group: "animals & nature",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F438}",
    name: "frog",
    shortcodes: ["frog", "frog_face"],
    tags: ["face"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f438.png"
  },
  {
    emoji: "\u{1F40A}",
    name: "crocodile",
    shortcodes: ["crocodile"],
    tags: ["crocodile"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f40a.png"
  },
  {
    emoji: "\u{1F422}",
    name: "turtle",
    shortcodes: ["turtle"],
    tags: ["terrapin", "tortoise"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f422.png"
  },
  {
    emoji: "\u{1F98E}",
    name: "lizard",
    shortcodes: ["lizard"],
    tags: ["reptile"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f98e.png"
  },
  {
    emoji: "\u{1F40D}",
    name: "snake",
    shortcodes: ["snake"],
    tags: ["bearer", "ophiuchus", "serpent", "zodiac"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f40d.png"
  },
  {
    emoji: "\u{1F432}",
    name: "dragon_face",
    shortcodes: ["dragon_face"],
    tags: ["dragon", "face", "fairy tale"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f432.png"
  },
  {
    emoji: "\u{1F409}",
    name: "dragon",
    shortcodes: ["dragon"],
    tags: ["fairy tale"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f409.png"
  },
  {
    emoji: "\u{1F995}",
    name: "sauropod",
    shortcodes: ["sauropod"],
    tags: ["brachiosaurus", "brontosaurus", "diplodocus"],
    group: "animals & nature",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f995.png"
  },
  {
    emoji: "\u{1F996}",
    name: "t-rex",
    shortcodes: ["t-rex", "trex"],
    tags: ["t-rex", "tyrannosaurus rex"],
    group: "animals & nature",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f996.png"
  },
  {
    emoji: "\u{1F433}",
    name: "whale",
    shortcodes: ["spouting_whale"],
    tags: ["face", "spouting", "whale"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f433.png"
  },
  {
    emoji: "\u{1F40B}",
    name: "whale2",
    shortcodes: ["whale"],
    tags: ["whale"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f40b.png"
  },
  {
    emoji: "\u{1F42C}",
    name: "dolphin",
    shortcodes: ["dolphin"],
    tags: ["flipper"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f42c.png"
  },
  {
    emoji: "\u{1F9AD}",
    name: "seal",
    shortcodes: ["seal"],
    tags: ["sea lion"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ad.png"
  },
  {
    emoji: "\u{1F41F}",
    name: "fish",
    shortcodes: ["fish"],
    tags: ["pisces", "zodiac"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f41f.png"
  },
  {
    emoji: "\u{1F420}",
    name: "tropical_fish",
    shortcodes: ["tropical_fish"],
    tags: ["fish", "tropical"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f420.png"
  },
  {
    emoji: "\u{1F421}",
    name: "blowfish",
    shortcodes: ["blowfish"],
    tags: ["fish"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f421.png"
  },
  {
    emoji: "\u{1F988}",
    name: "shark",
    shortcodes: ["shark"],
    tags: ["fish"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f988.png"
  },
  {
    emoji: "\u{1F419}",
    name: "octopus",
    shortcodes: ["octopus"],
    tags: ["octopus"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f419.png"
  },
  {
    emoji: "\u{1F41A}",
    name: "shell",
    shortcodes: ["shell"],
    tags: ["shell", "spiral"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f41a.png"
  },
  {
    emoji: "\u{1FAB8}",
    name: "coral",
    shortcodes: ["coral"],
    tags: ["ocean", "reef"],
    group: "animals & nature",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FABC}",
    name: "jellyfish",
    shortcodes: ["jellyfish"],
    tags: ["burn", "invertebrate", "jelly", "marine", "ouch", "stinger"],
    group: "animals & nature",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F40C}",
    name: "snail",
    shortcodes: ["snail"],
    tags: ["snail"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f40c.png"
  },
  {
    emoji: "\u{1F98B}",
    name: "butterfly",
    shortcodes: ["butterfly"],
    tags: ["insect", "pretty"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f98b.png"
  },
  {
    emoji: "\u{1F41B}",
    name: "bug",
    shortcodes: ["bug"],
    tags: ["insect"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f41b.png"
  },
  {
    emoji: "\u{1F41C}",
    name: "ant",
    shortcodes: ["ant"],
    tags: ["insect"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f41c.png"
  },
  {
    emoji: "\u{1F41D}",
    name: "bee",
    shortcodes: ["bee"],
    tags: ["bee", "insect"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f41d.png"
  },
  {
    emoji: "\u{1FAB2}",
    name: "beetle",
    shortcodes: ["beetle"],
    tags: ["bug", "insect"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fab2.png"
  },
  {
    emoji: "\u{1F41E}",
    name: "lady_beetle",
    shortcodes: ["lady_beetle"],
    tags: ["beetle", "insect", "ladybird", "ladybug"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f41e.png"
  },
  {
    emoji: "\u{1F997}",
    name: "cricket",
    shortcodes: ["cricket"],
    tags: ["grasshopper"],
    group: "animals & nature",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f997.png"
  },
  {
    emoji: "\u{1FAB3}",
    name: "cockroach",
    shortcodes: ["cockroach"],
    tags: ["insect", "pest", "roach"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fab3.png"
  },
  {
    emoji: "\u{1F577}",
    name: "spider",
    shortcodes: ["spider"],
    tags: ["insect"],
    group: "animals & nature",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f577-fe0f.png"
  },
  {
    emoji: "\u{1F578}",
    name: "spider_web",
    shortcodes: ["spider_web"],
    tags: ["spider", "web"],
    group: "animals & nature",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f578-fe0f.png"
  },
  {
    emoji: "\u{1F982}",
    name: "scorpion",
    shortcodes: ["scorpion"],
    tags: ["scorpio", "zodiac"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f982.png"
  },
  {
    emoji: "\u{1F99F}",
    name: "mosquito",
    shortcodes: ["mosquito"],
    tags: ["disease", "fever", "malaria", "pest", "virus"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f99f.png"
  },
  {
    emoji: "\u{1FAB0}",
    name: "fly",
    shortcodes: ["fly"],
    tags: ["disease", "maggot", "pest", "rotting"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fab0.png"
  },
  {
    emoji: "\u{1FAB1}",
    name: "worm",
    shortcodes: ["worm"],
    tags: ["annelid", "earthworm", "parasite"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fab1.png"
  },
  {
    emoji: "\u{1F9A0}",
    name: "microbe",
    shortcodes: ["microbe"],
    tags: ["amoeba", "bacteria", "virus"],
    group: "animals & nature",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9a0.png"
  },
  {
    emoji: "\u{1F490}",
    name: "bouquet",
    shortcodes: ["bouquet"],
    tags: ["flower"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f490.png"
  },
  {
    emoji: "\u{1F338}",
    name: "cherry_blossom",
    shortcodes: ["cherry_blossom"],
    tags: ["blossom", "cherry", "flower"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f338.png"
  },
  {
    emoji: "\u{1F4AE}",
    name: "white_flower",
    shortcodes: ["white_flower"],
    tags: ["flower"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ae.png"
  },
  {
    emoji: "\u{1FAB7}",
    name: "lotus",
    shortcodes: ["lotus"],
    tags: ["buddhism", "flower", "hinduism", "purity"],
    group: "animals & nature",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F3F5}",
    name: "rosette",
    shortcodes: ["rosette"],
    tags: ["plant"],
    group: "animals & nature",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f5-fe0f.png"
  },
  {
    emoji: "\u{1F339}",
    name: "rose",
    shortcodes: ["rose"],
    tags: ["flower"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f339.png"
  },
  {
    emoji: "\u{1F940}",
    name: "wilted_flower",
    shortcodes: ["wilted_flower"],
    tags: ["flower", "wilted"],
    group: "animals & nature",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f940.png"
  },
  {
    emoji: "\u{1F33A}",
    name: "hibiscus",
    shortcodes: ["hibiscus"],
    tags: ["flower"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f33a.png"
  },
  {
    emoji: "\u{1F33B}",
    name: "sunflower",
    shortcodes: ["sunflower"],
    tags: ["flower", "sun"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f33b.png"
  },
  {
    emoji: "\u{1F33C}",
    name: "blossom",
    shortcodes: ["blossom"],
    tags: ["flower"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f33c.png"
  },
  {
    emoji: "\u{1F337}",
    name: "tulip",
    shortcodes: ["tulip"],
    tags: ["flower"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f337.png"
  },
  {
    emoji: "\u{1FABB}",
    name: "hyacinth",
    shortcodes: ["hyacinth"],
    tags: ["bluebonnet", "flower", "lavender", "lupine", "snapdragon"],
    group: "animals & nature",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F331}",
    name: "seedling",
    shortcodes: ["seedling"],
    tags: ["young"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f331.png"
  },
  {
    emoji: "\u{1FAB4}",
    name: "potted_plant",
    shortcodes: ["potted_plant"],
    tags: ["boring", "grow", "house", "nurturing", "plant", "useless"],
    group: "animals & nature",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fab4.png"
  },
  {
    emoji: "\u{1F332}",
    name: "evergreen_tree",
    shortcodes: ["evergreen_tree"],
    tags: ["tree"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f332.png"
  },
  {
    emoji: "\u{1F333}",
    name: "deciduous_tree",
    shortcodes: ["deciduous_tree"],
    tags: ["deciduous", "shedding", "tree"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f333.png"
  },
  {
    emoji: "\u{1F334}",
    name: "palm_tree",
    shortcodes: ["palm_tree"],
    tags: ["palm", "tree"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f334.png"
  },
  {
    emoji: "\u{1F335}",
    name: "cactus",
    shortcodes: ["cactus"],
    tags: ["plant"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f335.png"
  },
  {
    emoji: "\u{1F33E}",
    name: "ear_of_rice",
    shortcodes: ["ear_of_rice", "sheaf_of_rice"],
    tags: ["ear", "grain", "rice"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f33e.png"
  },
  {
    emoji: "\u{1F33F}",
    name: "herb",
    shortcodes: ["herb"],
    tags: ["leaf"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f33f.png"
  },
  {
    emoji: "\u2618",
    name: "shamrock",
    shortcodes: ["shamrock"],
    tags: ["plant"],
    group: "animals & nature",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2618-fe0f.png"
  },
  {
    emoji: "\u{1F340}",
    name: "four_leaf_clover",
    shortcodes: ["four_leaf_clover"],
    tags: ["4", "clover", "four", "four-leaf clover", "leaf"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f340.png"
  },
  {
    emoji: "\u{1F341}",
    name: "maple_leaf",
    shortcodes: ["maple_leaf"],
    tags: ["falling", "leaf", "maple"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f341.png"
  },
  {
    emoji: "\u{1F342}",
    name: "fallen_leaf",
    shortcodes: ["fallen_leaf"],
    tags: ["falling", "leaf"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f342.png"
  },
  {
    emoji: "\u{1F343}",
    name: "leaves",
    shortcodes: ["leaves"],
    tags: ["blow", "flutter", "leaf", "wind"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f343.png"
  },
  {
    emoji: "\u{1FAB9}",
    name: "empty_nest",
    shortcodes: ["empty_nest", "nest"],
    tags: ["nesting"],
    group: "animals & nature",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FABA}",
    name: "nest_with_eggs",
    shortcodes: ["nest_with_eggs"],
    tags: ["nesting"],
    group: "animals & nature",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F344}",
    name: "mushroom",
    shortcodes: ["mushroom"],
    tags: ["toadstool"],
    group: "animals & nature",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f344.png"
  },
  {
    emoji: "\u{1F347}",
    name: "grapes",
    shortcodes: ["grapes"],
    tags: ["fruit", "grape"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f347.png"
  },
  {
    emoji: "\u{1F348}",
    name: "melon",
    shortcodes: ["melon"],
    tags: ["fruit"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f348.png"
  },
  {
    emoji: "\u{1F349}",
    name: "watermelon",
    shortcodes: ["watermelon"],
    tags: ["fruit"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f349.png"
  },
  {
    emoji: "\u{1F34A}",
    name: "mandarin",
    shortcodes: ["orange", "tangerine"],
    tags: ["fruit", "orange"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f34a.png"
  },
  {
    emoji: "\u{1F34B}",
    name: "lemon",
    shortcodes: ["lemon"],
    tags: ["citrus", "fruit"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f34b.png"
  },
  {
    emoji: "\u{1F34B}\u200D\u{1F7E9}",
    name: "lime",
    shortcodes: ["lime"],
    tags: ["citrus", "fruit", "tropical"],
    group: "food & drink",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F34C}",
    name: "banana",
    shortcodes: ["banana"],
    tags: ["fruit"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f34c.png"
  },
  {
    emoji: "\u{1F34D}",
    name: "pineapple",
    shortcodes: ["pineapple"],
    tags: ["fruit"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f34d.png"
  },
  {
    emoji: "\u{1F96D}",
    name: "mango",
    shortcodes: ["mango"],
    tags: ["fruit", "tropical"],
    group: "food & drink",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f96d.png"
  },
  {
    emoji: "\u{1F34E}",
    name: "apple",
    shortcodes: ["apple", "red_apple"],
    tags: ["apple", "fruit", "red"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f34e.png"
  },
  {
    emoji: "\u{1F34F}",
    name: "green_apple",
    shortcodes: ["green_apple"],
    tags: ["apple", "fruit", "green"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f34f.png"
  },
  {
    emoji: "\u{1F350}",
    name: "pear",
    shortcodes: ["pear"],
    tags: ["fruit"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f350.png"
  },
  {
    emoji: "\u{1F351}",
    name: "peach",
    shortcodes: ["peach"],
    tags: ["fruit"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f351.png"
  },
  {
    emoji: "\u{1F352}",
    name: "cherries",
    shortcodes: ["cherries"],
    tags: ["berries", "cherry", "fruit", "red"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f352.png"
  },
  {
    emoji: "\u{1F353}",
    name: "strawberry",
    shortcodes: ["strawberry"],
    tags: ["berry", "fruit"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f353.png"
  },
  {
    emoji: "\u{1FAD0}",
    name: "blueberries",
    shortcodes: ["blueberries"],
    tags: ["berry", "bilberry", "blue", "blueberry"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fad0.png"
  },
  {
    emoji: "\u{1F95D}",
    name: "kiwi_fruit",
    shortcodes: ["kiwi"],
    tags: ["food", "fruit", "kiwi"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f95d.png"
  },
  {
    emoji: "\u{1F345}",
    name: "tomato",
    shortcodes: ["tomato"],
    tags: ["fruit", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f345.png"
  },
  {
    emoji: "\u{1FAD2}",
    name: "olive",
    shortcodes: ["olive"],
    tags: ["food"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fad2.png"
  },
  {
    emoji: "\u{1F965}",
    name: "coconut",
    shortcodes: ["coconut"],
    tags: ["palm", "pi\xF1a colada"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f965.png"
  },
  {
    emoji: "\u{1F951}",
    name: "avocado",
    shortcodes: ["avocado"],
    tags: ["food", "fruit"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f951.png"
  },
  {
    emoji: "\u{1F346}",
    name: "eggplant",
    shortcodes: ["eggplant"],
    tags: ["aubergine", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f346.png"
  },
  {
    emoji: "\u{1F954}",
    name: "potato",
    shortcodes: ["potato"],
    tags: ["food", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f954.png"
  },
  {
    emoji: "\u{1F955}",
    name: "carrot",
    shortcodes: ["carrot"],
    tags: ["food", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f955.png"
  },
  {
    emoji: "\u{1F33D}",
    name: "corn",
    shortcodes: ["corn", "ear_of_corn"],
    tags: ["corn", "ear", "maize", "maze"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f33d.png"
  },
  {
    emoji: "\u{1F336}",
    name: "hot_pepper",
    shortcodes: ["hot_pepper"],
    tags: ["hot", "pepper"],
    group: "food & drink",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f336-fe0f.png"
  },
  {
    emoji: "\u{1FAD1}",
    name: "bell_pepper",
    shortcodes: ["bell_pepper"],
    tags: ["capsicum", "pepper", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fad1.png"
  },
  {
    emoji: "\u{1F952}",
    name: "cucumber",
    shortcodes: ["cucumber"],
    tags: ["food", "pickle", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f952.png"
  },
  {
    emoji: "\u{1F96C}",
    name: "leafy_green",
    shortcodes: ["leafy_green"],
    tags: ["bok choy", "cabbage", "kale", "lettuce"],
    group: "food & drink",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f96c.png"
  },
  {
    emoji: "\u{1F966}",
    name: "broccoli",
    shortcodes: ["broccoli"],
    tags: ["wild cabbage"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f966.png"
  },
  {
    emoji: "\u{1F9C4}",
    name: "garlic",
    shortcodes: ["garlic"],
    tags: ["flavoring"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c4.png"
  },
  {
    emoji: "\u{1F9C5}",
    name: "onion",
    shortcodes: ["onion"],
    tags: ["flavoring"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c5.png"
  },
  {
    emoji: "\u{1F95C}",
    name: "peanuts",
    shortcodes: ["peanuts"],
    tags: ["food", "nut", "peanut", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f95c.png"
  },
  {
    emoji: "\u{1FAD8}",
    name: "beans",
    shortcodes: ["beans"],
    tags: ["food", "kidney", "legume"],
    group: "food & drink",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F330}",
    name: "chestnut",
    shortcodes: ["chestnut"],
    tags: ["plant"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f330.png"
  },
  {
    emoji: "\u{1FADA}",
    name: "ginger_root",
    shortcodes: ["ginger"],
    tags: ["beer", "root", "spice"],
    group: "food & drink",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1FADB}",
    name: "pea_pod",
    shortcodes: ["pea"],
    tags: ["beans", "edamame", "legume", "pea", "pod", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F344}\u200D\u{1F7EB}",
    name: "brown_mushroom",
    shortcodes: ["brown_mushroom"],
    tags: ["food", "fungus", "nature", "vegetable"],
    group: "food & drink",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u{1F35E}",
    name: "bread",
    shortcodes: ["bread"],
    tags: ["loaf"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f35e.png"
  },
  {
    emoji: "\u{1F950}",
    name: "croissant",
    shortcodes: ["croissant"],
    tags: ["bread", "breakfast", "food", "french", "roll"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f950.png"
  },
  {
    emoji: "\u{1F956}",
    name: "baguette_bread",
    shortcodes: ["baguette_bread"],
    tags: ["baguette", "bread", "food", "french"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f956.png"
  },
  {
    emoji: "\u{1FAD3}",
    name: "flatbread",
    shortcodes: ["flatbread"],
    tags: ["arepa", "lavash", "naan", "pita"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fad3.png"
  },
  {
    emoji: "\u{1F968}",
    name: "pretzel",
    shortcodes: ["pretzel"],
    tags: ["twisted"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f968.png"
  },
  {
    emoji: "\u{1F96F}",
    name: "bagel",
    shortcodes: ["bagel"],
    tags: ["bakery", "breakfast", "schmear"],
    group: "food & drink",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f96f.png"
  },
  {
    emoji: "\u{1F95E}",
    name: "pancakes",
    shortcodes: ["pancakes"],
    tags: ["breakfast", "cr\xEApe", "food", "hotcake", "pancake"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f95e.png"
  },
  {
    emoji: "\u{1F9C7}",
    name: "waffle",
    shortcodes: ["waffle"],
    tags: ["breakfast", "indecisive", "iron"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c7.png"
  },
  {
    emoji: "\u{1F9C0}",
    name: "cheese",
    shortcodes: ["cheese"],
    tags: ["cheese"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c0.png"
  },
  {
    emoji: "\u{1F356}",
    name: "meat_on_bone",
    shortcodes: ["meat_on_bone"],
    tags: ["bone", "meat"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f356.png"
  },
  {
    emoji: "\u{1F357}",
    name: "poultry_leg",
    shortcodes: ["poultry_leg"],
    tags: ["bone", "chicken", "drumstick", "leg", "poultry"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f357.png"
  },
  {
    emoji: "\u{1F969}",
    name: "cut_of_meat",
    shortcodes: ["cut_of_meat"],
    tags: ["chop", "lambchop", "porkchop", "steak"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f969.png"
  },
  {
    emoji: "\u{1F953}",
    name: "bacon",
    shortcodes: ["bacon"],
    tags: ["breakfast", "food", "meat"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f953.png"
  },
  {
    emoji: "\u{1F354}",
    name: "hamburger",
    shortcodes: ["hamburger"],
    tags: ["burger"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f354.png"
  },
  {
    emoji: "\u{1F35F}",
    name: "fries",
    shortcodes: ["french_fries", "fries"],
    tags: ["french", "fries"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f35f.png"
  },
  {
    emoji: "\u{1F355}",
    name: "pizza",
    shortcodes: ["pizza"],
    tags: ["cheese", "slice"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f355.png"
  },
  {
    emoji: "\u{1F32D}",
    name: "hotdog",
    shortcodes: ["hotdog"],
    tags: ["frankfurter", "hotdog", "sausage"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f32d.png"
  },
  {
    emoji: "\u{1F96A}",
    name: "sandwich",
    shortcodes: ["sandwich"],
    tags: ["bread"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f96a.png"
  },
  {
    emoji: "\u{1F32E}",
    name: "taco",
    shortcodes: ["taco"],
    tags: ["mexican"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f32e.png"
  },
  {
    emoji: "\u{1F32F}",
    name: "burrito",
    shortcodes: ["burrito"],
    tags: ["mexican", "wrap"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f32f.png"
  },
  {
    emoji: "\u{1FAD4}",
    name: "tamale",
    shortcodes: ["tamale"],
    tags: ["mexican", "wrapped"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fad4.png"
  },
  {
    emoji: "\u{1F959}",
    name: "stuffed_flatbread",
    shortcodes: ["stuffed_flatbread"],
    tags: ["falafel", "flatbread", "food", "gyro", "kebab", "stuffed"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f959.png"
  },
  {
    emoji: "\u{1F9C6}",
    name: "falafel",
    shortcodes: ["falafel"],
    tags: ["chickpea", "meatball"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c6.png"
  },
  {
    emoji: "\u{1F95A}",
    name: "egg",
    shortcodes: ["egg"],
    tags: ["breakfast", "food"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f95a.png"
  },
  {
    emoji: "\u{1F373}",
    name: "fried_egg",
    shortcodes: ["cooking", "fried_egg"],
    tags: ["breakfast", "egg", "frying", "pan"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f373.png"
  },
  {
    emoji: "\u{1F958}",
    name: "shallow_pan_of_food",
    shortcodes: ["shallow_pan_of_food"],
    tags: ["casserole", "food", "paella", "pan", "shallow"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f958.png"
  },
  {
    emoji: "\u{1F372}",
    name: "stew",
    shortcodes: ["pot_of_food", "stew"],
    tags: ["pot", "stew"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f372.png"
  },
  {
    emoji: "\u{1FAD5}",
    name: "fondue",
    shortcodes: ["fondue"],
    tags: ["cheese", "chocolate", "melted", "pot", "swiss"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fad5.png"
  },
  {
    emoji: "\u{1F963}",
    name: "bowl_with_spoon",
    shortcodes: ["bowl_with_spoon"],
    tags: ["breakfast", "cereal", "congee"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f963.png"
  },
  {
    emoji: "\u{1F957}",
    name: "green_salad",
    shortcodes: ["green_salad", "salad"],
    tags: ["food", "green", "salad"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f957.png"
  },
  {
    emoji: "\u{1F37F}",
    name: "popcorn",
    shortcodes: ["popcorn"],
    tags: ["popcorn"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f37f.png"
  },
  {
    emoji: "\u{1F9C8}",
    name: "butter",
    shortcodes: ["butter"],
    tags: ["dairy"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c8.png"
  },
  {
    emoji: "\u{1F9C2}",
    name: "salt",
    shortcodes: ["salt"],
    tags: ["condiment", "shaker"],
    group: "food & drink",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c2.png"
  },
  {
    emoji: "\u{1F96B}",
    name: "canned_food",
    shortcodes: ["canned_food"],
    tags: ["can"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f96b.png"
  },
  {
    emoji: "\u{1F371}",
    name: "bento",
    shortcodes: ["bento", "bento_box"],
    tags: ["bento", "box"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f371.png"
  },
  {
    emoji: "\u{1F358}",
    name: "rice_cracker",
    shortcodes: ["rice_cracker"],
    tags: ["cracker", "rice"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f358.png"
  },
  {
    emoji: "\u{1F359}",
    name: "rice_ball",
    shortcodes: ["rice_ball"],
    tags: ["ball", "japanese", "rice"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f359.png"
  },
  {
    emoji: "\u{1F35A}",
    name: "rice",
    shortcodes: ["cooked_rice", "rice"],
    tags: ["cooked", "rice"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f35a.png"
  },
  {
    emoji: "\u{1F35B}",
    name: "curry",
    shortcodes: ["curry", "curry_rice"],
    tags: ["curry", "rice"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f35b.png"
  },
  {
    emoji: "\u{1F35C}",
    name: "ramen",
    shortcodes: ["ramen", "steaming_bowl"],
    tags: ["bowl", "noodle", "ramen", "steaming"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f35c.png"
  },
  {
    emoji: "\u{1F35D}",
    name: "spaghetti",
    shortcodes: ["spaghetti"],
    tags: ["pasta"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f35d.png"
  },
  {
    emoji: "\u{1F360}",
    name: "sweet_potato",
    shortcodes: ["sweet_potato"],
    tags: ["potato", "roasted", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f360.png"
  },
  {
    emoji: "\u{1F362}",
    name: "oden",
    shortcodes: ["oden"],
    tags: ["kebab", "seafood", "skewer", "stick"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f362.png"
  },
  {
    emoji: "\u{1F363}",
    name: "sushi",
    shortcodes: ["sushi"],
    tags: ["sushi"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f363.png"
  },
  {
    emoji: "\u{1F364}",
    name: "fried_shrimp",
    shortcodes: ["fried_shrimp"],
    tags: ["fried", "prawn", "shrimp", "tempura"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f364.png"
  },
  {
    emoji: "\u{1F365}",
    name: "fish_cake",
    shortcodes: ["fish_cake"],
    tags: ["cake", "fish", "pastry", "swirl"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f365.png"
  },
  {
    emoji: "\u{1F96E}",
    name: "moon_cake",
    shortcodes: ["moon_cake"],
    tags: ["autumn", "festival", "yu\xE8b\u01D0ng"],
    group: "food & drink",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f96e.png"
  },
  {
    emoji: "\u{1F361}",
    name: "dango",
    shortcodes: ["dango"],
    tags: ["dessert", "japanese", "skewer", "stick", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f361.png"
  },
  {
    emoji: "\u{1F95F}",
    name: "dumpling",
    shortcodes: ["dumpling"],
    tags: ["empanada", "gy\u014Dza", "jiaozi", "pierogi", "potsticker"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f95f.png"
  },
  {
    emoji: "\u{1F960}",
    name: "fortune_cookie",
    shortcodes: ["fortune_cookie"],
    tags: ["prophecy"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f960.png"
  },
  {
    emoji: "\u{1F961}",
    name: "takeout_box",
    shortcodes: ["takeout_box"],
    tags: ["oyster pail"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f961.png"
  },
  {
    emoji: "\u{1F980}",
    name: "crab",
    shortcodes: ["crab"],
    tags: ["cancer", "zodiac"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f980.png"
  },
  {
    emoji: "\u{1F99E}",
    name: "lobster",
    shortcodes: ["lobster"],
    tags: ["bisque", "claws", "seafood"],
    group: "food & drink",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f99e.png"
  },
  {
    emoji: "\u{1F990}",
    name: "shrimp",
    shortcodes: ["shrimp"],
    tags: ["food", "shellfish", "small"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f990.png"
  },
  {
    emoji: "\u{1F991}",
    name: "squid",
    shortcodes: ["squid"],
    tags: ["food", "molusc"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f991.png"
  },
  {
    emoji: "\u{1F9AA}",
    name: "oyster",
    shortcodes: ["oyster"],
    tags: ["diving", "pearl"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9aa.png"
  },
  {
    emoji: "\u{1F366}",
    name: "icecream",
    shortcodes: ["icecream", "soft_serve"],
    tags: ["cream", "dessert", "ice", "icecream", "soft", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f366.png"
  },
  {
    emoji: "\u{1F367}",
    name: "shaved_ice",
    shortcodes: ["shaved_ice"],
    tags: ["dessert", "ice", "shaved", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f367.png"
  },
  {
    emoji: "\u{1F368}",
    name: "ice_cream",
    shortcodes: ["ice_cream"],
    tags: ["cream", "dessert", "ice", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f368.png"
  },
  {
    emoji: "\u{1F369}",
    name: "doughnut",
    shortcodes: ["doughnut"],
    tags: ["breakfast", "dessert", "donut", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f369.png"
  },
  {
    emoji: "\u{1F36A}",
    name: "cookie",
    shortcodes: ["cookie"],
    tags: ["dessert", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f36a.png"
  },
  {
    emoji: "\u{1F382}",
    name: "birthday",
    shortcodes: ["birthday", "birthday_cake"],
    tags: ["birthday", "cake", "celebration", "dessert", "pastry", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f382.png"
  },
  {
    emoji: "\u{1F370}",
    name: "cake",
    shortcodes: ["cake", "shortcake"],
    tags: ["cake", "dessert", "pastry", "slice", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f370.png"
  },
  {
    emoji: "\u{1F9C1}",
    name: "cupcake",
    shortcodes: ["cupcake"],
    tags: ["bakery", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c1.png"
  },
  {
    emoji: "\u{1F967}",
    name: "pie",
    shortcodes: ["pie"],
    tags: ["filling", "pastry"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f967.png"
  },
  {
    emoji: "\u{1F36B}",
    name: "chocolate_bar",
    shortcodes: ["chocolate_bar"],
    tags: ["bar", "chocolate", "dessert", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f36b.png"
  },
  {
    emoji: "\u{1F36C}",
    name: "candy",
    shortcodes: ["candy"],
    tags: ["dessert", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f36c.png"
  },
  {
    emoji: "\u{1F36D}",
    name: "lollipop",
    shortcodes: ["lollipop"],
    tags: ["candy", "dessert", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f36d.png"
  },
  {
    emoji: "\u{1F36E}",
    name: "custard",
    shortcodes: ["custard"],
    tags: ["dessert", "pudding", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f36e.png"
  },
  {
    emoji: "\u{1F36F}",
    name: "honey_pot",
    shortcodes: ["honey_pot"],
    tags: ["honey", "honeypot", "pot", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f36f.png"
  },
  {
    emoji: "\u{1F37C}",
    name: "baby_bottle",
    shortcodes: ["baby_bottle"],
    tags: ["baby", "bottle", "drink", "milk"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f37c.png"
  },
  {
    emoji: "\u{1F95B}",
    name: "milk_glass",
    shortcodes: ["glass_of_milk", "milk"],
    tags: ["drink", "glass", "milk"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f95b.png"
  },
  {
    emoji: "\u2615",
    name: "coffee",
    shortcodes: ["coffee"],
    tags: ["beverage", "coffee", "drink", "hot", "steaming", "tea"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2615.png"
  },
  {
    emoji: "\u{1FAD6}",
    name: "teapot",
    shortcodes: ["teapot"],
    tags: ["drink", "pot", "tea"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fad6.png"
  },
  {
    emoji: "\u{1F375}",
    name: "tea",
    shortcodes: ["tea"],
    tags: ["beverage", "cup", "drink", "tea", "teacup"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f375.png"
  },
  {
    emoji: "\u{1F376}",
    name: "sake",
    shortcodes: ["sake"],
    tags: ["bar", "beverage", "bottle", "cup", "drink"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f376.png"
  },
  {
    emoji: "\u{1F37E}",
    name: "champagne",
    shortcodes: ["champagne"],
    tags: ["bar", "bottle", "cork", "drink", "popping"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f37e.png"
  },
  {
    emoji: "\u{1F377}",
    name: "wine_glass",
    shortcodes: ["wine_glass"],
    tags: ["bar", "beverage", "drink", "glass", "wine"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f377.png"
  },
  {
    emoji: "\u{1F378}",
    name: "cocktail",
    shortcodes: ["cocktail"],
    tags: ["bar", "cocktail", "drink", "glass"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f378.png"
  },
  {
    emoji: "\u{1F379}",
    name: "tropical_drink",
    shortcodes: ["tropical_drink"],
    tags: ["bar", "drink", "tropical"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f379.png"
  },
  {
    emoji: "\u{1F37A}",
    name: "beer",
    shortcodes: ["beer"],
    tags: ["bar", "beer", "drink", "mug"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f37a.png"
  },
  {
    emoji: "\u{1F37B}",
    name: "beers",
    shortcodes: ["beers"],
    tags: ["bar", "beer", "clink", "drink", "mug"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f37b.png"
  },
  {
    emoji: "\u{1F942}",
    name: "clinking_glasses",
    shortcodes: ["clinking_glasses"],
    tags: ["celebrate", "clink", "drink", "glass"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f942.png"
  },
  {
    emoji: "\u{1F943}",
    name: "tumbler_glass",
    shortcodes: ["tumbler_glass", "whisky"],
    tags: ["glass", "liquor", "shot", "tumbler", "whisky"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f943.png"
  },
  {
    emoji: "\u{1FAD7}",
    name: "pouring_liquid",
    shortcodes: ["pour", "pouring_liquid"],
    tags: ["drink", "empty", "glass", "spill"],
    group: "food & drink",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F964}",
    name: "cup_with_straw",
    shortcodes: ["cup_with_straw"],
    tags: ["juice", "soda"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f964.png"
  },
  {
    emoji: "\u{1F9CB}",
    name: "bubble_tea",
    shortcodes: ["boba_drink", "bubble_tea"],
    tags: ["bubble", "milk", "pearl", "tea"],
    group: "food & drink",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9cb.png"
  },
  {
    emoji: "\u{1F9C3}",
    name: "beverage_box",
    shortcodes: ["beverage_box", "juice_box"],
    tags: ["beverage", "box", "juice", "straw", "sweet"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c3.png"
  },
  {
    emoji: "\u{1F9C9}",
    name: "mate",
    shortcodes: ["mate"],
    tags: ["drink"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9c9.png"
  },
  {
    emoji: "\u{1F9CA}",
    name: "ice_cube",
    shortcodes: ["ice", "ice_cube"],
    tags: ["cold", "ice cube", "iceberg"],
    group: "food & drink",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ca.png"
  },
  {
    emoji: "\u{1F962}",
    name: "chopsticks",
    shortcodes: ["chopsticks"],
    tags: ["hashi"],
    group: "food & drink",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f962.png"
  },
  {
    emoji: "\u{1F37D}",
    name: "plate_with_cutlery",
    shortcodes: ["fork_knife_plate"],
    tags: ["cooking", "fork", "knife", "plate"],
    group: "food & drink",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f37d-fe0f.png"
  },
  {
    emoji: "\u{1F374}",
    name: "fork_and_knife",
    shortcodes: ["fork_and_knife"],
    tags: ["cooking", "cutlery", "fork", "knife"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f374.png"
  },
  {
    emoji: "\u{1F944}",
    name: "spoon",
    shortcodes: ["spoon"],
    tags: ["tableware"],
    group: "food & drink",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f944.png"
  },
  {
    emoji: "\u{1F52A}",
    name: "hocho",
    shortcodes: ["knife"],
    tags: ["cooking", "hocho", "knife", "tool", "weapon"],
    group: "food & drink",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f52a.png"
  },
  {
    emoji: "\u{1FAD9}",
    name: "jar",
    shortcodes: ["jar"],
    tags: ["condiment", "container", "empty", "sauce", "store"],
    group: "food & drink",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F3FA}",
    name: "amphora",
    shortcodes: ["amphora"],
    tags: ["aquarius", "cooking", "drink", "jug", "zodiac"],
    group: "food & drink",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3fa.png"
  },
  {
    emoji: "\u{1F30D}",
    name: "earth_africa",
    shortcodes: ["earth_africa", "earth_europe"],
    tags: ["africa", "earth", "europe", "globe", "globe showing europe-africa", "world"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f30d.png"
  },
  {
    emoji: "\u{1F30E}",
    name: "earth_americas",
    shortcodes: ["earth_americas"],
    tags: ["americas", "earth", "globe", "globe showing americas", "world"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f30e.png"
  },
  {
    emoji: "\u{1F30F}",
    name: "earth_asia",
    shortcodes: ["earth_asia"],
    tags: ["asia", "australia", "earth", "globe", "globe showing asia-australia", "world"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f30f.png"
  },
  {
    emoji: "\u{1F310}",
    name: "globe_with_meridians",
    shortcodes: ["globe_with_meridians"],
    tags: ["earth", "globe", "meridians", "world"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f310.png"
  },
  {
    emoji: "\u{1F5FA}",
    name: "world_map",
    shortcodes: ["world_map"],
    tags: ["map", "world"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5fa-fe0f.png"
  },
  {
    emoji: "\u{1F5FE}",
    name: "japan",
    shortcodes: ["japan_map"],
    tags: ["japan", "map", "map of japan"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5fe.png"
  },
  {
    emoji: "\u{1F9ED}",
    name: "compass",
    shortcodes: ["compass"],
    tags: ["magnetic", "navigation", "orienteering"],
    group: "travel & places",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ed.png"
  },
  {
    emoji: "\u{1F3D4}",
    name: "mountain_snow",
    shortcodes: ["mountain_snow"],
    tags: ["cold", "mountain", "snow"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d4-fe0f.png"
  },
  {
    emoji: "\u26F0",
    name: "mountain",
    shortcodes: ["mountain"],
    tags: ["mountain"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f0-fe0f.png"
  },
  {
    emoji: "\u{1F30B}",
    name: "volcano",
    shortcodes: ["volcano"],
    tags: ["eruption", "mountain"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f30b.png"
  },
  {
    emoji: "\u{1F5FB}",
    name: "mount_fuji",
    shortcodes: ["mount_fuji"],
    tags: ["fuji", "mountain"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5fb.png"
  },
  {
    emoji: "\u{1F3D5}",
    name: "camping",
    shortcodes: ["camping"],
    tags: ["camping"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d5-fe0f.png"
  },
  {
    emoji: "\u{1F3D6}",
    name: "beach_umbrella",
    shortcodes: ["beach", "beach_with_umbrella"],
    tags: ["beach", "umbrella"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d6-fe0f.png"
  },
  {
    emoji: "\u{1F3DC}",
    name: "desert",
    shortcodes: ["desert"],
    tags: ["desert"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3dc-fe0f.png"
  },
  {
    emoji: "\u{1F3DD}",
    name: "desert_island",
    shortcodes: ["desert_island", "island"],
    tags: ["desert", "island"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3dd-fe0f.png"
  },
  {
    emoji: "\u{1F3DE}",
    name: "national_park",
    shortcodes: ["national_park"],
    tags: ["park"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3de-fe0f.png"
  },
  {
    emoji: "\u{1F3DF}",
    name: "stadium",
    shortcodes: ["stadium"],
    tags: ["stadium"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3df-fe0f.png"
  },
  {
    emoji: "\u{1F3DB}",
    name: "classical_building",
    shortcodes: ["classical_building"],
    tags: ["classical"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3db-fe0f.png"
  },
  {
    emoji: "\u{1F3D7}",
    name: "building_construction",
    shortcodes: ["building_construction", "construction_site"],
    tags: ["construction"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d7-fe0f.png"
  },
  {
    emoji: "\u{1F9F1}",
    name: "bricks",
    shortcodes: ["bricks"],
    tags: ["bricks", "clay", "mortar", "wall"],
    group: "travel & places",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f1.png"
  },
  {
    emoji: "\u{1FAA8}",
    name: "rock",
    shortcodes: ["rock"],
    tags: ["boulder", "heavy", "solid", "stone"],
    group: "travel & places",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa8.png"
  },
  {
    emoji: "\u{1FAB5}",
    name: "wood",
    shortcodes: ["wood"],
    tags: ["log", "lumber", "timber"],
    group: "travel & places",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fab5.png"
  },
  {
    emoji: "\u{1F6D6}",
    name: "hut",
    shortcodes: ["hut"],
    tags: ["house", "roundhouse", "yurt"],
    group: "travel & places",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6d6.png"
  },
  {
    emoji: "\u{1F3D8}",
    name: "houses",
    shortcodes: ["homes", "houses"],
    tags: ["houses"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d8-fe0f.png"
  },
  {
    emoji: "\u{1F3DA}",
    name: "derelict_house",
    shortcodes: ["derelict_house", "house_abandoned"],
    tags: ["derelict", "house"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3da-fe0f.png"
  },
  {
    emoji: "\u{1F3E0}",
    name: "house",
    shortcodes: ["house"],
    tags: ["home"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e0.png"
  },
  {
    emoji: "\u{1F3E1}",
    name: "house_with_garden",
    shortcodes: ["house_with_garden"],
    tags: ["garden", "home", "house"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e1.png"
  },
  {
    emoji: "\u{1F3E2}",
    name: "office",
    shortcodes: ["office"],
    tags: ["building"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e2.png"
  },
  {
    emoji: "\u{1F3E3}",
    name: "post_office",
    shortcodes: ["post_office"],
    tags: ["japanese", "japanese post office", "post"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e3.png"
  },
  {
    emoji: "\u{1F3E4}",
    name: "european_post_office",
    shortcodes: ["european_post_office"],
    tags: ["european", "post"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e4.png"
  },
  {
    emoji: "\u{1F3E5}",
    name: "hospital",
    shortcodes: ["hospital"],
    tags: ["doctor", "medicine"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e5.png"
  },
  {
    emoji: "\u{1F3E6}",
    name: "bank",
    shortcodes: ["bank"],
    tags: ["building"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e6.png"
  },
  {
    emoji: "\u{1F3E8}",
    name: "hotel",
    shortcodes: ["hotel"],
    tags: ["building"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e8.png"
  },
  {
    emoji: "\u{1F3E9}",
    name: "love_hotel",
    shortcodes: ["love_hotel"],
    tags: ["hotel", "love"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e9.png"
  },
  {
    emoji: "\u{1F3EA}",
    name: "convenience_store",
    shortcodes: ["convenience_store"],
    tags: ["convenience", "store"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ea.png"
  },
  {
    emoji: "\u{1F3EB}",
    name: "school",
    shortcodes: ["school"],
    tags: ["building"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3eb.png"
  },
  {
    emoji: "\u{1F3EC}",
    name: "department_store",
    shortcodes: ["department_store"],
    tags: ["department", "store"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ec.png"
  },
  {
    emoji: "\u{1F3ED}",
    name: "factory",
    shortcodes: ["factory"],
    tags: ["building"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ed.png"
  },
  {
    emoji: "\u{1F3EF}",
    name: "japanese_castle",
    shortcodes: ["japanese_castle"],
    tags: ["castle", "japanese"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ef.png"
  },
  {
    emoji: "\u{1F3F0}",
    name: "european_castle",
    shortcodes: ["castle", "european_castle"],
    tags: ["european"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f0.png"
  },
  {
    emoji: "\u{1F492}",
    name: "wedding",
    shortcodes: ["wedding"],
    tags: ["chapel", "romance"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f492.png"
  },
  {
    emoji: "\u{1F5FC}",
    name: "tokyo_tower",
    shortcodes: ["tokyo_tower"],
    tags: ["tokyo", "tower"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5fc.png"
  },
  {
    emoji: "\u{1F5FD}",
    name: "statue_of_liberty",
    shortcodes: ["statue_of_liberty"],
    tags: ["liberty", "statue", "statue of liberty"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5fd.png"
  },
  {
    emoji: "\u26EA",
    name: "church",
    shortcodes: ["church"],
    tags: ["christian", "cross", "religion"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26ea.png"
  },
  {
    emoji: "\u{1F54C}",
    name: "mosque",
    shortcodes: ["mosque"],
    tags: ["islam", "muslim", "religion"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f54c.png"
  },
  {
    emoji: "\u{1F6D5}",
    name: "hindu_temple",
    shortcodes: ["hindu_temple"],
    tags: ["hindu", "temple"],
    group: "travel & places",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6d5.png"
  },
  {
    emoji: "\u{1F54D}",
    name: "synagogue",
    shortcodes: ["synagogue"],
    tags: ["jew", "jewish", "religion", "temple"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f54d.png"
  },
  {
    emoji: "\u26E9",
    name: "shinto_shrine",
    shortcodes: ["shinto_shrine"],
    tags: ["religion", "shinto", "shrine"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26e9-fe0f.png"
  },
  {
    emoji: "\u{1F54B}",
    name: "kaaba",
    shortcodes: ["kaaba"],
    tags: ["islam", "muslim", "religion"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f54b.png"
  },
  {
    emoji: "\u26F2",
    name: "fountain",
    shortcodes: ["fountain"],
    tags: ["fountain"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f2.png"
  },
  {
    emoji: "\u26FA",
    name: "tent",
    shortcodes: ["tent"],
    tags: ["camping"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26fa.png"
  },
  {
    emoji: "\u{1F301}",
    name: "foggy",
    shortcodes: ["foggy"],
    tags: ["fog"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f301.png"
  },
  {
    emoji: "\u{1F303}",
    name: "night_with_stars",
    shortcodes: ["night_with_stars"],
    tags: ["night", "star"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f303.png"
  },
  {
    emoji: "\u{1F3D9}",
    name: "cityscape",
    shortcodes: ["cityscape"],
    tags: ["city"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d9-fe0f.png"
  },
  {
    emoji: "\u{1F304}",
    name: "sunrise_over_mountains",
    shortcodes: ["sunrise_over_mountains"],
    tags: ["morning", "mountain", "sun", "sunrise"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f304.png"
  },
  {
    emoji: "\u{1F305}",
    name: "sunrise",
    shortcodes: ["sunrise"],
    tags: ["morning", "sun"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f305.png"
  },
  {
    emoji: "\u{1F306}",
    name: "city_sunset",
    shortcodes: ["city_dusk"],
    tags: ["city", "dusk", "evening", "landscape", "sunset"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f306.png"
  },
  {
    emoji: "\u{1F307}",
    name: "city_sunrise",
    shortcodes: ["city_sunrise", "city_sunset"],
    tags: ["dusk", "sun"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f307.png"
  },
  {
    emoji: "\u{1F309}",
    name: "bridge_at_night",
    shortcodes: ["bridge_at_night"],
    tags: ["bridge", "night"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f309.png"
  },
  {
    emoji: "\u2668",
    name: "hotsprings",
    shortcodes: ["hotsprings"],
    tags: ["hot", "hotsprings", "springs", "steaming"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2668-fe0f.png"
  },
  {
    emoji: "\u{1F3A0}",
    name: "carousel_horse",
    shortcodes: ["carousel_horse"],
    tags: ["carousel", "horse"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a0.png"
  },
  {
    emoji: "\u{1F6DD}",
    name: "playground_slide",
    shortcodes: ["playground_slide", "slide"],
    tags: ["amusement park", "play", "theme park"],
    group: "travel & places",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F3A1}",
    name: "ferris_wheel",
    shortcodes: ["ferris_wheel"],
    tags: ["amusement park", "ferris", "theme park", "wheel"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a1.png"
  },
  {
    emoji: "\u{1F3A2}",
    name: "roller_coaster",
    shortcodes: ["roller_coaster"],
    tags: ["amusement park", "coaster", "roller", "theme park"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a2.png"
  },
  {
    emoji: "\u{1F488}",
    name: "barber",
    shortcodes: ["barber", "barber_pole"],
    tags: ["barber", "haircut", "pole"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f488.png"
  },
  {
    emoji: "\u{1F3AA}",
    name: "circus_tent",
    shortcodes: ["circus_tent"],
    tags: ["circus", "tent"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3aa.png"
  },
  {
    emoji: "\u{1F682}",
    name: "steam_locomotive",
    shortcodes: ["steam_locomotive"],
    tags: ["engine", "railway", "steam", "train"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f682.png"
  },
  {
    emoji: "\u{1F683}",
    name: "railway_car",
    shortcodes: ["railway_car"],
    tags: ["car", "electric", "railway", "train", "tram", "trolleybus"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f683.png"
  },
  {
    emoji: "\u{1F684}",
    name: "bullettrain_side",
    shortcodes: ["bullettrain_side"],
    tags: ["railway", "shinkansen", "speed", "train"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f684.png"
  },
  {
    emoji: "\u{1F685}",
    name: "bullettrain_front",
    shortcodes: ["bullettrain_front"],
    tags: ["bullet", "railway", "shinkansen", "speed", "train"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f685.png"
  },
  {
    emoji: "\u{1F686}",
    name: "train2",
    shortcodes: ["train"],
    tags: ["railway"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f686.png"
  },
  {
    emoji: "\u{1F687}",
    name: "metro",
    shortcodes: ["metro"],
    tags: ["subway"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f687.png"
  },
  {
    emoji: "\u{1F688}",
    name: "light_rail",
    shortcodes: ["light_rail"],
    tags: ["railway"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f688.png"
  },
  {
    emoji: "\u{1F689}",
    name: "station",
    shortcodes: ["station"],
    tags: ["railway", "train"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f689.png"
  },
  {
    emoji: "\u{1F68A}",
    name: "tram",
    shortcodes: ["tram"],
    tags: ["trolleybus"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f68a.png"
  },
  {
    emoji: "\u{1F69D}",
    name: "monorail",
    shortcodes: ["monorail"],
    tags: ["vehicle"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f69d.png"
  },
  {
    emoji: "\u{1F69E}",
    name: "mountain_railway",
    shortcodes: ["mountain_railway"],
    tags: ["car", "mountain", "railway"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f69e.png"
  },
  {
    emoji: "\u{1F68B}",
    name: "train",
    shortcodes: ["tram_car"],
    tags: ["car", "tram", "trolleybus"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f68b.png"
  },
  {
    emoji: "\u{1F68C}",
    name: "bus",
    shortcodes: ["bus"],
    tags: ["vehicle"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f68c.png"
  },
  {
    emoji: "\u{1F68D}",
    name: "oncoming_bus",
    shortcodes: ["oncoming_bus"],
    tags: ["bus", "oncoming"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f68d.png"
  },
  {
    emoji: "\u{1F68E}",
    name: "trolleybus",
    shortcodes: ["trolleybus"],
    tags: ["bus", "tram", "trolley"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f68e.png"
  },
  {
    emoji: "\u{1F690}",
    name: "minibus",
    shortcodes: ["minibus"],
    tags: ["bus"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f690.png"
  },
  {
    emoji: "\u{1F691}",
    name: "ambulance",
    shortcodes: ["ambulance"],
    tags: ["vehicle"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f691.png"
  },
  {
    emoji: "\u{1F692}",
    name: "fire_engine",
    shortcodes: ["fire_engine"],
    tags: ["engine", "fire", "truck"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f692.png"
  },
  {
    emoji: "\u{1F693}",
    name: "police_car",
    shortcodes: ["police_car"],
    tags: ["car", "patrol", "police"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f693.png"
  },
  {
    emoji: "\u{1F694}",
    name: "oncoming_police_car",
    shortcodes: ["oncoming_police_car"],
    tags: ["car", "oncoming", "police"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f694.png"
  },
  {
    emoji: "\u{1F695}",
    name: "taxi",
    shortcodes: ["taxi"],
    tags: ["vehicle"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f695.png"
  },
  {
    emoji: "\u{1F696}",
    name: "oncoming_taxi",
    shortcodes: ["oncoming_taxi"],
    tags: ["oncoming", "taxi"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f696.png"
  },
  {
    emoji: "\u{1F697}",
    name: "car",
    shortcodes: ["car", "red_car"],
    tags: ["car"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f697.png"
  },
  {
    emoji: "\u{1F698}",
    name: "oncoming_automobile",
    shortcodes: ["oncoming_automobile"],
    tags: ["automobile", "car", "oncoming"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f698.png"
  },
  {
    emoji: "\u{1F699}",
    name: "blue_car",
    shortcodes: ["blue_car", "suv"],
    tags: ["recreational", "sport utility"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f699.png"
  },
  {
    emoji: "\u{1F6FB}",
    name: "pickup_truck",
    shortcodes: ["pickup_truck"],
    tags: ["pick-up", "pickup", "truck"],
    group: "travel & places",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6fb.png"
  },
  {
    emoji: "\u{1F69A}",
    name: "truck",
    shortcodes: ["delivery_truck", "truck"],
    tags: ["delivery", "truck"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f69a.png"
  },
  {
    emoji: "\u{1F69B}",
    name: "articulated_lorry",
    shortcodes: ["articulated_lorry"],
    tags: ["lorry", "semi", "truck"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f69b.png"
  },
  {
    emoji: "\u{1F69C}",
    name: "tractor",
    shortcodes: ["tractor"],
    tags: ["vehicle"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f69c.png"
  },
  {
    emoji: "\u{1F3CE}",
    name: "racing_car",
    shortcodes: ["racing_car"],
    tags: ["car", "racing"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ce-fe0f.png"
  },
  {
    emoji: "\u{1F3CD}",
    name: "motorcycle",
    shortcodes: ["motorcycle"],
    tags: ["racing"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cd-fe0f.png"
  },
  {
    emoji: "\u{1F6F5}",
    name: "motor_scooter",
    shortcodes: ["motor_scooter"],
    tags: ["motor", "scooter"],
    group: "travel & places",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f5.png"
  },
  {
    emoji: "\u{1F9BD}",
    name: "manual_wheelchair",
    shortcodes: ["manual_wheelchair"],
    tags: ["accessibility"],
    group: "travel & places",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9bd.png"
  },
  {
    emoji: "\u{1F9BC}",
    name: "motorized_wheelchair",
    shortcodes: ["motorized_wheelchair"],
    tags: ["accessibility"],
    group: "travel & places",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9bc.png"
  },
  {
    emoji: "\u{1F6FA}",
    name: "auto_rickshaw",
    shortcodes: ["auto_rickshaw"],
    tags: ["tuk tuk"],
    group: "travel & places",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6fa.png"
  },
  {
    emoji: "\u{1F6B2}",
    name: "bike",
    shortcodes: ["bicycle", "bike"],
    tags: ["bike"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b2.png"
  },
  {
    emoji: "\u{1F6F4}",
    name: "kick_scooter",
    shortcodes: ["scooter"],
    tags: ["kick", "scooter"],
    group: "travel & places",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f4.png"
  },
  {
    emoji: "\u{1F6F9}",
    name: "skateboard",
    shortcodes: ["skateboard"],
    tags: ["board"],
    group: "travel & places",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f9.png"
  },
  {
    emoji: "\u{1F6FC}",
    name: "roller_skate",
    shortcodes: ["roller_skate"],
    tags: ["roller", "skate"],
    group: "travel & places",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6fc.png"
  },
  {
    emoji: "\u{1F68F}",
    name: "busstop",
    shortcodes: ["busstop"],
    tags: ["bus", "stop"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f68f.png"
  },
  {
    emoji: "\u{1F6E3}",
    name: "motorway",
    shortcodes: ["motorway"],
    tags: ["highway", "road"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6e3-fe0f.png"
  },
  {
    emoji: "\u{1F6E4}",
    name: "railway_track",
    shortcodes: ["railway_track"],
    tags: ["railway", "train"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6e4-fe0f.png"
  },
  {
    emoji: "\u{1F6E2}",
    name: "oil_drum",
    shortcodes: ["oil_drum"],
    tags: ["drum", "oil"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6e2-fe0f.png"
  },
  {
    emoji: "\u26FD",
    name: "fuelpump",
    shortcodes: ["fuelpump"],
    tags: ["diesel", "fuel", "fuelpump", "gas", "pump", "station"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26fd.png"
  },
  {
    emoji: "\u{1F6DE}",
    name: "wheel",
    shortcodes: ["wheel"],
    tags: ["circle", "tire", "turn"],
    group: "travel & places",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F6A8}",
    name: "rotating_light",
    shortcodes: ["rotating_light"],
    tags: ["beacon", "car", "light", "police", "revolving"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a8.png"
  },
  {
    emoji: "\u{1F6A5}",
    name: "traffic_light",
    shortcodes: ["traffic_light"],
    tags: ["light", "signal", "traffic"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a5.png"
  },
  {
    emoji: "\u{1F6A6}",
    name: "vertical_traffic_light",
    shortcodes: ["vertical_traffic_light"],
    tags: ["light", "signal", "traffic"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a6.png"
  },
  {
    emoji: "\u{1F6D1}",
    name: "stop_sign",
    shortcodes: ["octagonal_sign", "stop_sign"],
    tags: ["octagonal", "sign", "stop"],
    group: "travel & places",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6d1.png"
  },
  {
    emoji: "\u{1F6A7}",
    name: "construction",
    shortcodes: ["construction"],
    tags: ["barrier"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a7.png"
  },
  {
    emoji: "\u2693",
    name: "anchor",
    shortcodes: ["anchor"],
    tags: ["ship", "tool"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2693.png"
  },
  {
    emoji: "\u{1F6DF}",
    name: "ring_buoy",
    shortcodes: ["lifebuoy", "ring_buoy"],
    tags: ["float", "life preserver", "life saver", "rescue", "safety"],
    group: "travel & places",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u26F5",
    name: "boat",
    shortcodes: ["sailboat"],
    tags: ["boat", "resort", "sea", "yacht"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f5.png"
  },
  {
    emoji: "\u{1F6F6}",
    name: "canoe",
    shortcodes: ["canoe"],
    tags: ["boat"],
    group: "travel & places",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f6.png"
  },
  {
    emoji: "\u{1F6A4}",
    name: "speedboat",
    shortcodes: ["speedboat"],
    tags: ["boat"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a4.png"
  },
  {
    emoji: "\u{1F6F3}",
    name: "passenger_ship",
    shortcodes: ["cruise_ship", "passenger_ship"],
    tags: ["passenger", "ship"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f3-fe0f.png"
  },
  {
    emoji: "\u26F4",
    name: "ferry",
    shortcodes: ["ferry"],
    tags: ["boat", "passenger"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f4-fe0f.png"
  },
  {
    emoji: "\u{1F6E5}",
    name: "motor_boat",
    shortcodes: ["motorboat"],
    tags: ["boat", "motorboat"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6e5-fe0f.png"
  },
  {
    emoji: "\u{1F6A2}",
    name: "ship",
    shortcodes: ["ship"],
    tags: ["boat", "passenger"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a2.png"
  },
  {
    emoji: "\u2708",
    name: "airplane",
    shortcodes: ["airplane"],
    tags: ["aeroplane"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2708-fe0f.png"
  },
  {
    emoji: "\u{1F6E9}",
    name: "small_airplane",
    shortcodes: ["small_airplane"],
    tags: ["aeroplane", "airplane"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6e9-fe0f.png"
  },
  {
    emoji: "\u{1F6EB}",
    name: "flight_departure",
    shortcodes: ["airplane_departure"],
    tags: ["aeroplane", "airplane", "check-in", "departure", "departures"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6eb.png"
  },
  {
    emoji: "\u{1F6EC}",
    name: "flight_arrival",
    shortcodes: ["airplane_arriving"],
    tags: ["aeroplane", "airplane", "arrivals", "arriving", "landing"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6ec.png"
  },
  {
    emoji: "\u{1FA82}",
    name: "parachute",
    shortcodes: ["parachute"],
    tags: ["hang-glide", "parasail", "skydive"],
    group: "travel & places",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa82.png"
  },
  {
    emoji: "\u{1F4BA}",
    name: "seat",
    shortcodes: ["seat"],
    tags: ["chair"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ba.png"
  },
  {
    emoji: "\u{1F681}",
    name: "helicopter",
    shortcodes: ["helicopter"],
    tags: ["vehicle"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f681.png"
  },
  {
    emoji: "\u{1F69F}",
    name: "suspension_railway",
    shortcodes: ["suspension_railway"],
    tags: ["railway", "suspension"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f69f.png"
  },
  {
    emoji: "\u{1F6A0}",
    name: "mountain_cableway",
    shortcodes: ["mountain_cableway"],
    tags: ["cable", "gondola", "mountain"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a0.png"
  },
  {
    emoji: "\u{1F6A1}",
    name: "aerial_tramway",
    shortcodes: ["aerial_tramway"],
    tags: ["aerial", "cable", "car", "gondola", "tramway"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a1.png"
  },
  {
    emoji: "\u{1F6F0}",
    name: "artificial_satellite",
    shortcodes: ["satellite"],
    tags: ["space"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f0-fe0f.png"
  },
  {
    emoji: "\u{1F680}",
    name: "rocket",
    shortcodes: ["rocket"],
    tags: ["space"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f680.png"
  },
  {
    emoji: "\u{1F6F8}",
    name: "flying_saucer",
    shortcodes: ["flying_saucer"],
    tags: ["ufo"],
    group: "travel & places",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f8.png"
  },
  {
    emoji: "\u{1F6CE}",
    name: "bellhop_bell",
    shortcodes: ["bellhop"],
    tags: ["bell", "bellhop", "hotel"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6ce-fe0f.png"
  },
  {
    emoji: "\u{1F9F3}",
    name: "luggage",
    shortcodes: ["luggage"],
    tags: ["packing", "travel"],
    group: "travel & places",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f3.png"
  },
  {
    emoji: "\u231B",
    name: "hourglass",
    shortcodes: ["hourglass"],
    tags: ["sand", "timer"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/231b.png"
  },
  {
    emoji: "\u23F3",
    name: "hourglass_flowing_sand",
    shortcodes: ["hourglass_flowing_sand"],
    tags: ["hourglass", "sand", "timer"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23f3.png"
  },
  {
    emoji: "\u231A",
    name: "watch",
    shortcodes: ["watch"],
    tags: ["clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/231a.png"
  },
  {
    emoji: "\u23F0",
    name: "alarm_clock",
    shortcodes: ["alarm_clock"],
    tags: ["alarm", "clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23f0.png"
  },
  {
    emoji: "\u23F1",
    name: "stopwatch",
    shortcodes: ["stopwatch"],
    tags: ["clock"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23f1-fe0f.png"
  },
  {
    emoji: "\u23F2",
    name: "timer_clock",
    shortcodes: ["timer_clock"],
    tags: ["clock", "timer"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23f2-fe0f.png"
  },
  {
    emoji: "\u{1F570}",
    name: "mantelpiece_clock",
    shortcodes: ["clock"],
    tags: ["clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f570-fe0f.png"
  },
  {
    emoji: "\u{1F55B}",
    name: "clock12",
    shortcodes: ["clock12"],
    tags: ["00", "12", "12:00", "clock", "o\u2019clock", "twelve"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f55b.png"
  },
  {
    emoji: "\u{1F567}",
    name: "clock1230",
    shortcodes: ["clock1230"],
    tags: ["12", "12:30", "clock", "thirty", "twelve"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f567.png"
  },
  {
    emoji: "\u{1F550}",
    name: "clock1",
    shortcodes: ["clock1"],
    tags: ["00", "1", "1:00", "clock", "one", "o\u2019clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f550.png"
  },
  {
    emoji: "\u{1F55C}",
    name: "clock130",
    shortcodes: ["clock130"],
    tags: ["1", "1:30", "clock", "one", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f55c.png"
  },
  {
    emoji: "\u{1F551}",
    name: "clock2",
    shortcodes: ["clock2"],
    tags: ["00", "2", "2:00", "clock", "o\u2019clock", "two"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f551.png"
  },
  {
    emoji: "\u{1F55D}",
    name: "clock230",
    shortcodes: ["clock230"],
    tags: ["2", "2:30", "clock", "thirty", "two"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f55d.png"
  },
  {
    emoji: "\u{1F552}",
    name: "clock3",
    shortcodes: ["clock3"],
    tags: ["00", "3", "3:00", "clock", "o\u2019clock", "three"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f552.png"
  },
  {
    emoji: "\u{1F55E}",
    name: "clock330",
    shortcodes: ["clock330"],
    tags: ["3", "3:30", "clock", "thirty", "three"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f55e.png"
  },
  {
    emoji: "\u{1F553}",
    name: "clock4",
    shortcodes: ["clock4"],
    tags: ["00", "4", "4:00", "clock", "four", "o\u2019clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f553.png"
  },
  {
    emoji: "\u{1F55F}",
    name: "clock430",
    shortcodes: ["clock430"],
    tags: ["4", "4:30", "clock", "four", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f55f.png"
  },
  {
    emoji: "\u{1F554}",
    name: "clock5",
    shortcodes: ["clock5"],
    tags: ["00", "5", "5:00", "clock", "five", "o\u2019clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f554.png"
  },
  {
    emoji: "\u{1F560}",
    name: "clock530",
    shortcodes: ["clock530"],
    tags: ["5", "5:30", "clock", "five", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f560.png"
  },
  {
    emoji: "\u{1F555}",
    name: "clock6",
    shortcodes: ["clock6"],
    tags: ["00", "6", "6:00", "clock", "o\u2019clock", "six"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f555.png"
  },
  {
    emoji: "\u{1F561}",
    name: "clock630",
    shortcodes: ["clock630"],
    tags: ["6", "6:30", "clock", "six", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f561.png"
  },
  {
    emoji: "\u{1F556}",
    name: "clock7",
    shortcodes: ["clock7"],
    tags: ["00", "7", "7:00", "clock", "o\u2019clock", "seven"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f556.png"
  },
  {
    emoji: "\u{1F562}",
    name: "clock730",
    shortcodes: ["clock730"],
    tags: ["7", "7:30", "clock", "seven", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f562.png"
  },
  {
    emoji: "\u{1F557}",
    name: "clock8",
    shortcodes: ["clock8"],
    tags: ["00", "8", "8:00", "clock", "eight", "o\u2019clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f557.png"
  },
  {
    emoji: "\u{1F563}",
    name: "clock830",
    shortcodes: ["clock830"],
    tags: ["8", "8:30", "clock", "eight", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f563.png"
  },
  {
    emoji: "\u{1F558}",
    name: "clock9",
    shortcodes: ["clock9"],
    tags: ["00", "9", "9:00", "clock", "nine", "o\u2019clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f558.png"
  },
  {
    emoji: "\u{1F564}",
    name: "clock930",
    shortcodes: ["clock930"],
    tags: ["9", "9:30", "clock", "nine", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f564.png"
  },
  {
    emoji: "\u{1F559}",
    name: "clock10",
    shortcodes: ["clock10"],
    tags: ["00", "10", "10:00", "clock", "o\u2019clock", "ten"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f559.png"
  },
  {
    emoji: "\u{1F565}",
    name: "clock1030",
    shortcodes: ["clock1030"],
    tags: ["10", "10:30", "clock", "ten", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f565.png"
  },
  {
    emoji: "\u{1F55A}",
    name: "clock11",
    shortcodes: ["clock11"],
    tags: ["00", "11", "11:00", "clock", "eleven", "o\u2019clock"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f55a.png"
  },
  {
    emoji: "\u{1F566}",
    name: "clock1130",
    shortcodes: ["clock1130"],
    tags: ["11", "11:30", "clock", "eleven", "thirty"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f566.png"
  },
  {
    emoji: "\u{1F311}",
    name: "new_moon",
    shortcodes: ["new_moon"],
    tags: ["dark", "moon"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f311.png"
  },
  {
    emoji: "\u{1F312}",
    name: "waxing_crescent_moon",
    shortcodes: ["waxing_crescent_moon"],
    tags: ["crescent", "moon", "waxing"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f312.png"
  },
  {
    emoji: "\u{1F313}",
    name: "first_quarter_moon",
    shortcodes: ["first_quarter_moon"],
    tags: ["moon", "quarter"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f313.png"
  },
  {
    emoji: "\u{1F314}",
    name: "moon",
    shortcodes: ["waxing_gibbous_moon"],
    tags: ["gibbous", "moon", "waxing"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f314.png"
  },
  {
    emoji: "\u{1F315}",
    name: "full_moon",
    shortcodes: ["full_moon"],
    tags: ["full", "moon"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f315.png"
  },
  {
    emoji: "\u{1F316}",
    name: "waning_gibbous_moon",
    shortcodes: ["waning_gibbous_moon"],
    tags: ["gibbous", "moon", "waning"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f316.png"
  },
  {
    emoji: "\u{1F317}",
    name: "last_quarter_moon",
    shortcodes: ["last_quarter_moon"],
    tags: ["moon", "quarter"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f317.png"
  },
  {
    emoji: "\u{1F318}",
    name: "waning_crescent_moon",
    shortcodes: ["waning_crescent_moon"],
    tags: ["crescent", "moon", "waning"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f318.png"
  },
  {
    emoji: "\u{1F319}",
    name: "crescent_moon",
    shortcodes: ["crescent_moon"],
    tags: ["crescent", "moon"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f319.png"
  },
  {
    emoji: "\u{1F31A}",
    name: "new_moon_with_face",
    shortcodes: ["new_moon_with_face"],
    tags: ["face", "moon"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f31a.png"
  },
  {
    emoji: "\u{1F31B}",
    name: "first_quarter_moon_with_face",
    shortcodes: ["first_quarter_moon_with_face"],
    tags: ["face", "moon", "quarter"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f31b.png"
  },
  {
    emoji: "\u{1F31C}",
    name: "last_quarter_moon_with_face",
    shortcodes: ["last_quarter_moon_with_face"],
    tags: ["face", "moon", "quarter"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f31c.png"
  },
  {
    emoji: "\u{1F321}",
    name: "thermometer",
    shortcodes: ["thermometer"],
    tags: ["weather"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f321-fe0f.png"
  },
  {
    emoji: "\u2600",
    name: "sunny",
    shortcodes: ["sun"],
    tags: ["bright", "rays", "sunny"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2600-fe0f.png"
  },
  {
    emoji: "\u{1F31D}",
    name: "full_moon_with_face",
    shortcodes: ["full_moon_with_face"],
    tags: ["bright", "face", "full", "moon"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f31d.png"
  },
  {
    emoji: "\u{1F31E}",
    name: "sun_with_face",
    shortcodes: ["sun_with_face"],
    tags: ["bright", "face", "sun"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f31e.png"
  },
  {
    emoji: "\u{1FA90}",
    name: "ringed_planet",
    shortcodes: ["ringed_planet", "saturn"],
    tags: ["saturn", "saturnine"],
    group: "travel & places",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa90.png"
  },
  {
    emoji: "\u2B50",
    name: "star",
    shortcodes: ["star"],
    tags: ["star"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2b50.png"
  },
  {
    emoji: "\u{1F31F}",
    name: "star2",
    shortcodes: ["glowing_star", "star2"],
    tags: ["glittery", "glow", "shining", "sparkle", "star"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f31f.png"
  },
  {
    emoji: "\u{1F320}",
    name: "stars",
    shortcodes: ["shooting_star", "stars"],
    tags: ["falling", "shooting", "star"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f320.png"
  },
  {
    emoji: "\u{1F30C}",
    name: "milky_way",
    shortcodes: ["milky_way"],
    tags: ["space"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f30c.png"
  },
  {
    emoji: "\u2601",
    name: "cloud",
    shortcodes: ["cloud"],
    tags: ["weather"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2601-fe0f.png"
  },
  {
    emoji: "\u26C5",
    name: "partly_sunny",
    shortcodes: ["partly_sunny", "sun_behind_cloud"],
    tags: ["cloud", "sun"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26c5.png"
  },
  {
    emoji: "\u26C8",
    name: "cloud_with_lightning_and_rain",
    shortcodes: ["stormy", "thunder_cloud_and_rain"],
    tags: ["cloud", "rain", "thunder"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26c8-fe0f.png"
  },
  {
    emoji: "\u{1F324}",
    name: "sun_behind_small_cloud",
    shortcodes: ["sun_behind_small_cloud", "sunny"],
    tags: ["cloud", "sun"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f324-fe0f.png"
  },
  {
    emoji: "\u{1F325}",
    name: "sun_behind_large_cloud",
    shortcodes: ["cloudy", "sun_behind_large_cloud"],
    tags: ["cloud", "sun"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f325-fe0f.png"
  },
  {
    emoji: "\u{1F326}",
    name: "sun_behind_rain_cloud",
    shortcodes: ["sun_and_rain", "sun_behind_rain_cloud"],
    tags: ["cloud", "rain", "sun"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f326-fe0f.png"
  },
  {
    emoji: "\u{1F327}",
    name: "cloud_with_rain",
    shortcodes: ["cloud_with_rain", "rainy"],
    tags: ["cloud", "rain"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f327-fe0f.png"
  },
  {
    emoji: "\u{1F328}",
    name: "cloud_with_snow",
    shortcodes: ["cloud_with_snow", "snowy"],
    tags: ["cloud", "cold", "snow"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f328-fe0f.png"
  },
  {
    emoji: "\u{1F329}",
    name: "cloud_with_lightning",
    shortcodes: ["cloud_with_lightning", "lightning"],
    tags: ["cloud", "lightning"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f329-fe0f.png"
  },
  {
    emoji: "\u{1F32A}",
    name: "tornado",
    shortcodes: ["tornado"],
    tags: ["cloud", "whirlwind"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f32a-fe0f.png"
  },
  {
    emoji: "\u{1F32B}",
    name: "fog",
    shortcodes: ["fog"],
    tags: ["cloud"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f32b-fe0f.png"
  },
  {
    emoji: "\u{1F32C}",
    name: "wind_face",
    shortcodes: ["wind_blowing_face"],
    tags: ["blow", "cloud", "face", "wind"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f32c-fe0f.png"
  },
  {
    emoji: "\u{1F300}",
    name: "cyclone",
    shortcodes: ["cyclone"],
    tags: ["dizzy", "hurricane", "twister", "typhoon"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f300.png"
  },
  {
    emoji: "\u{1F308}",
    name: "rainbow",
    shortcodes: ["rainbow"],
    tags: ["rain"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f308.png"
  },
  {
    emoji: "\u{1F302}",
    name: "closed_umbrella",
    shortcodes: ["closed_umbrella"],
    tags: ["clothing", "rain", "umbrella"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f302.png"
  },
  {
    emoji: "\u2602",
    name: "open_umbrella",
    shortcodes: ["umbrella"],
    tags: ["clothing", "rain"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2602-fe0f.png"
  },
  {
    emoji: "\u2614",
    name: "umbrella",
    shortcodes: ["umbrella_with_rain"],
    tags: ["clothing", "drop", "rain", "umbrella"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2614.png"
  },
  {
    emoji: "\u26F1",
    name: "parasol_on_ground",
    shortcodes: ["beach_umbrella", "umbrella_on_ground"],
    tags: ["rain", "sun", "umbrella"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f1-fe0f.png"
  },
  {
    emoji: "\u26A1",
    name: "zap",
    shortcodes: ["high_voltage", "zap"],
    tags: ["danger", "electric", "lightning", "voltage", "zap"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26a1.png"
  },
  {
    emoji: "\u2744",
    name: "snowflake",
    shortcodes: ["snowflake"],
    tags: ["cold", "snow"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2744-fe0f.png"
  },
  {
    emoji: "\u2603",
    name: "snowman_with_snow",
    shortcodes: ["snowman2"],
    tags: ["cold", "snow"],
    group: "travel & places",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2603-fe0f.png"
  },
  {
    emoji: "\u26C4",
    name: "snowman",
    shortcodes: ["snowman"],
    tags: ["cold", "snow", "snowman"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26c4.png"
  },
  {
    emoji: "\u2604",
    name: "comet",
    shortcodes: ["comet"],
    tags: ["space"],
    group: "travel & places",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2604-fe0f.png"
  },
  {
    emoji: "\u{1F525}",
    name: "fire",
    shortcodes: ["fire"],
    tags: ["flame", "tool"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f525.png"
  },
  {
    emoji: "\u{1F4A7}",
    name: "droplet",
    shortcodes: ["droplet"],
    tags: ["cold", "comic", "drop", "sweat"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a7.png"
  },
  {
    emoji: "\u{1F30A}",
    name: "ocean",
    shortcodes: ["ocean", "water_wave"],
    tags: ["ocean", "water", "wave"],
    group: "travel & places",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f30a.png"
  },
  {
    emoji: "\u{1F383}",
    name: "jack_o_lantern",
    shortcodes: ["jack_o_lantern"],
    tags: ["celebration", "halloween", "jack", "lantern"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f383.png"
  },
  {
    emoji: "\u{1F384}",
    name: "christmas_tree",
    shortcodes: ["christmas_tree"],
    tags: ["celebration", "christmas", "tree"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f384.png"
  },
  {
    emoji: "\u{1F386}",
    name: "fireworks",
    shortcodes: ["fireworks"],
    tags: ["celebration"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f386.png"
  },
  {
    emoji: "\u{1F387}",
    name: "sparkler",
    shortcodes: ["sparkler"],
    tags: ["celebration", "fireworks", "sparkle"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f387.png"
  },
  {
    emoji: "\u{1F9E8}",
    name: "firecracker",
    shortcodes: ["firecracker"],
    tags: ["dynamite", "explosive", "fireworks"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e8.png"
  },
  {
    emoji: "\u2728",
    name: "sparkles",
    shortcodes: ["sparkles"],
    tags: ["*", "sparkle", "star"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2728.png"
  },
  {
    emoji: "\u{1F388}",
    name: "balloon",
    shortcodes: ["balloon"],
    tags: ["celebration"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f388.png"
  },
  {
    emoji: "\u{1F389}",
    name: "tada",
    shortcodes: ["party", "party_popper", "tada"],
    tags: ["celebration", "party", "popper", "tada"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f389.png"
  },
  {
    emoji: "\u{1F38A}",
    name: "confetti_ball",
    shortcodes: ["confetti_ball"],
    tags: ["ball", "celebration", "confetti"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f38a.png"
  },
  {
    emoji: "\u{1F38B}",
    name: "tanabata_tree",
    shortcodes: ["tanabata_tree"],
    tags: ["banner", "celebration", "japanese", "tree"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f38b.png"
  },
  {
    emoji: "\u{1F38D}",
    name: "bamboo",
    shortcodes: ["bamboo"],
    tags: ["bamboo", "celebration", "japanese", "pine"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f38d.png"
  },
  {
    emoji: "\u{1F38E}",
    name: "dolls",
    shortcodes: ["dolls"],
    tags: ["celebration", "doll", "festival", "japanese", "japanese dolls"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f38e.png"
  },
  {
    emoji: "\u{1F38F}",
    name: "flags",
    shortcodes: ["carp_streamer", "flags"],
    tags: ["carp", "celebration", "streamer"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f38f.png"
  },
  {
    emoji: "\u{1F390}",
    name: "wind_chime",
    shortcodes: ["wind_chime"],
    tags: ["bell", "celebration", "chime", "wind"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f390.png"
  },
  {
    emoji: "\u{1F391}",
    name: "rice_scene",
    shortcodes: ["moon_ceremony", "rice_scene"],
    tags: ["celebration", "ceremony", "moon"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f391.png"
  },
  {
    emoji: "\u{1F9E7}",
    name: "red_envelope",
    shortcodes: ["red_envelope"],
    tags: ["gift", "good luck", "h\xF3ngb\u0101o", "lai see", "money"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e7.png"
  },
  {
    emoji: "\u{1F380}",
    name: "ribbon",
    shortcodes: ["ribbon"],
    tags: ["celebration"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f380.png"
  },
  {
    emoji: "\u{1F381}",
    name: "gift",
    shortcodes: ["gift"],
    tags: ["box", "celebration", "gift", "present", "wrapped"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f381.png"
  },
  {
    emoji: "\u{1F397}",
    name: "reminder_ribbon",
    shortcodes: ["reminder_ribbon"],
    tags: ["celebration", "reminder", "ribbon"],
    group: "activities",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f397-fe0f.png"
  },
  {
    emoji: "\u{1F39F}",
    name: "tickets",
    shortcodes: ["admission_tickets", "tickets"],
    tags: ["admission", "ticket"],
    group: "activities",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f39f-fe0f.png"
  },
  {
    emoji: "\u{1F3AB}",
    name: "ticket",
    shortcodes: ["ticket"],
    tags: ["admission"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ab.png"
  },
  {
    emoji: "\u{1F396}",
    name: "medal_military",
    shortcodes: ["military_medal"],
    tags: ["celebration", "medal", "military"],
    group: "activities",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f396-fe0f.png"
  },
  {
    emoji: "\u{1F3C6}",
    name: "trophy",
    shortcodes: ["trophy"],
    tags: ["prize"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c6.png"
  },
  {
    emoji: "\u{1F3C5}",
    name: "medal_sports",
    shortcodes: ["sports_medal"],
    tags: ["medal"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c5.png"
  },
  {
    emoji: "\u{1F947}",
    name: "1st_place_medal",
    shortcodes: ["1st", "first_place_medal"],
    tags: ["first", "gold", "medal"],
    group: "activities",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f947.png"
  },
  {
    emoji: "\u{1F948}",
    name: "2nd_place_medal",
    shortcodes: ["2nd", "second_place_medal"],
    tags: ["medal", "second", "silver"],
    group: "activities",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f948.png"
  },
  {
    emoji: "\u{1F949}",
    name: "3rd_place_medal",
    shortcodes: ["3rd", "third_place_medal"],
    tags: ["bronze", "medal", "third"],
    group: "activities",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f949.png"
  },
  {
    emoji: "\u26BD",
    name: "soccer",
    shortcodes: ["soccer"],
    tags: ["ball", "football", "soccer"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26bd.png"
  },
  {
    emoji: "\u26BE",
    name: "baseball",
    shortcodes: ["baseball"],
    tags: ["ball"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26be.png"
  },
  {
    emoji: "\u{1F94E}",
    name: "softball",
    shortcodes: ["softball"],
    tags: ["ball", "glove", "underarm"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f94e.png"
  },
  {
    emoji: "\u{1F3C0}",
    name: "basketball",
    shortcodes: ["basketball"],
    tags: ["ball", "hoop"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c0.png"
  },
  {
    emoji: "\u{1F3D0}",
    name: "volleyball",
    shortcodes: ["volleyball"],
    tags: ["ball", "game"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d0.png"
  },
  {
    emoji: "\u{1F3C8}",
    name: "football",
    shortcodes: ["football"],
    tags: ["american", "ball", "football"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c8.png"
  },
  {
    emoji: "\u{1F3C9}",
    name: "rugby_football",
    shortcodes: ["rugby_football"],
    tags: ["ball", "football", "rugby"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c9.png"
  },
  {
    emoji: "\u{1F3BE}",
    name: "tennis",
    shortcodes: ["tennis"],
    tags: ["ball", "racquet"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3be.png"
  },
  {
    emoji: "\u{1F94F}",
    name: "flying_disc",
    shortcodes: ["flying_disc"],
    tags: ["ultimate"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f94f.png"
  },
  {
    emoji: "\u{1F3B3}",
    name: "bowling",
    shortcodes: ["bowling"],
    tags: ["ball", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b3.png"
  },
  {
    emoji: "\u{1F3CF}",
    name: "cricket_game",
    shortcodes: ["cricket_game"],
    tags: ["ball", "bat", "game"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3cf.png"
  },
  {
    emoji: "\u{1F3D1}",
    name: "field_hockey",
    shortcodes: ["field_hockey"],
    tags: ["ball", "field", "game", "hockey", "stick"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d1.png"
  },
  {
    emoji: "\u{1F3D2}",
    name: "ice_hockey",
    shortcodes: ["hockey"],
    tags: ["game", "hockey", "ice", "puck", "stick"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d2.png"
  },
  {
    emoji: "\u{1F94D}",
    name: "lacrosse",
    shortcodes: ["lacrosse"],
    tags: ["ball", "goal", "stick"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f94d.png"
  },
  {
    emoji: "\u{1F3D3}",
    name: "ping_pong",
    shortcodes: ["ping_pong"],
    tags: ["ball", "bat", "game", "paddle", "table tennis"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3d3.png"
  },
  {
    emoji: "\u{1F3F8}",
    name: "badminton",
    shortcodes: ["badminton"],
    tags: ["birdie", "game", "racquet", "shuttlecock"],
    group: "activities",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f8.png"
  },
  {
    emoji: "\u{1F94A}",
    name: "boxing_glove",
    shortcodes: ["boxing_glove"],
    tags: ["boxing", "glove"],
    group: "activities",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f94a.png"
  },
  {
    emoji: "\u{1F94B}",
    name: "martial_arts_uniform",
    shortcodes: ["martial_arts_uniform"],
    tags: ["judo", "karate", "martial arts", "taekwondo", "uniform"],
    group: "activities",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f94b.png"
  },
  {
    emoji: "\u{1F945}",
    name: "goal_net",
    shortcodes: ["goal_net"],
    tags: ["goal", "net"],
    group: "activities",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f945.png"
  },
  {
    emoji: "\u26F3",
    name: "golf",
    shortcodes: ["golf"],
    tags: ["golf", "hole"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f3.png"
  },
  {
    emoji: "\u26F8",
    name: "ice_skate",
    shortcodes: ["ice_skate"],
    tags: ["ice", "skate"],
    group: "activities",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26f8-fe0f.png"
  },
  {
    emoji: "\u{1F3A3}",
    name: "fishing_pole_and_fish",
    shortcodes: ["fishing_pole", "fishing_pole_and_fish"],
    tags: ["fish", "pole"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a3.png"
  },
  {
    emoji: "\u{1F93F}",
    name: "diving_mask",
    shortcodes: ["diving_mask"],
    tags: ["diving", "scuba", "snorkeling"],
    group: "activities",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f93f.png"
  },
  {
    emoji: "\u{1F3BD}",
    name: "running_shirt_with_sash",
    shortcodes: ["running_shirt", "running_shirt_with_sash"],
    tags: ["athletics", "running", "sash", "shirt"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3bd.png"
  },
  {
    emoji: "\u{1F3BF}",
    name: "ski",
    shortcodes: ["ski"],
    tags: ["ski", "snow"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3bf.png"
  },
  {
    emoji: "\u{1F6F7}",
    name: "sled",
    shortcodes: ["sled"],
    tags: ["sledge", "sleigh"],
    group: "activities",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6f7.png"
  },
  {
    emoji: "\u{1F94C}",
    name: "curling_stone",
    shortcodes: ["curling_stone"],
    tags: ["game", "rock"],
    group: "activities",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f94c.png"
  },
  {
    emoji: "\u{1F3AF}",
    name: "dart",
    shortcodes: ["bullseye", "dart", "direct_hit"],
    tags: ["dart", "direct hit", "game", "hit", "target"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3af.png"
  },
  {
    emoji: "\u{1FA80}",
    name: "yo_yo",
    shortcodes: ["yo_yo"],
    tags: ["fluctuate", "toy"],
    group: "activities",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa80.png"
  },
  {
    emoji: "\u{1FA81}",
    name: "kite",
    shortcodes: ["kite"],
    tags: ["fly", "soar"],
    group: "activities",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa81.png"
  },
  {
    emoji: "\u{1F52B}",
    name: "gun",
    shortcodes: ["gun", "pistol"],
    tags: ["gun", "handgun", "pistol", "revolver", "tool", "water", "weapon"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f52b.png"
  },
  {
    emoji: "\u{1F3B1}",
    name: "8ball",
    shortcodes: ["8ball", "billiards"],
    tags: ["8", "ball", "billiard", "eight", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b1.png"
  },
  {
    emoji: "\u{1F52E}",
    name: "crystal_ball",
    shortcodes: ["crystal_ball"],
    tags: ["ball", "crystal", "fairy tale", "fantasy", "fortune", "tool"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f52e.png"
  },
  {
    emoji: "\u{1FA84}",
    name: "magic_wand",
    shortcodes: ["magic_wand"],
    tags: ["magic", "witch", "wizard"],
    group: "activities",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa84.png"
  },
  {
    emoji: "\u{1F3AE}",
    name: "video_game",
    shortcodes: ["controller", "video_game"],
    tags: ["controller", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ae.png"
  },
  {
    emoji: "\u{1F579}",
    name: "joystick",
    shortcodes: ["joystick"],
    tags: ["game", "video game"],
    group: "activities",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f579-fe0f.png"
  },
  {
    emoji: "\u{1F3B0}",
    name: "slot_machine",
    shortcodes: ["slot_machine"],
    tags: ["game", "slot"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b0.png"
  },
  {
    emoji: "\u{1F3B2}",
    name: "game_die",
    shortcodes: ["game_die"],
    tags: ["dice", "die", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b2.png"
  },
  {
    emoji: "\u{1F9E9}",
    name: "jigsaw",
    shortcodes: ["jigsaw", "puzzle_piece"],
    tags: ["clue", "interlocking", "jigsaw", "piece", "puzzle"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e9.png"
  },
  {
    emoji: "\u{1F9F8}",
    name: "teddy_bear",
    shortcodes: ["teddy_bear"],
    tags: ["plaything", "plush", "stuffed", "toy"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f8.png"
  },
  {
    emoji: "\u{1FA85}",
    name: "pinata",
    shortcodes: ["pinata"],
    tags: ["celebration", "party"],
    group: "activities",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa85.png"
  },
  {
    emoji: "\u{1FAA9}",
    name: "mirror_ball",
    shortcodes: ["disco", "disco_ball", "mirror_ball"],
    tags: ["dance", "disco", "glitter", "party"],
    group: "activities",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FA86}",
    name: "nesting_dolls",
    shortcodes: ["nesting_dolls"],
    tags: ["doll", "nesting", "russia"],
    group: "activities",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa86.png"
  },
  {
    emoji: "\u2660",
    name: "spades",
    shortcodes: ["spades"],
    tags: ["card", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2660-fe0f.png"
  },
  {
    emoji: "\u2665",
    name: "hearts",
    shortcodes: ["hearts"],
    tags: ["card", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2665-fe0f.png"
  },
  {
    emoji: "\u2666",
    name: "diamonds",
    shortcodes: ["diamonds"],
    tags: ["card", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2666-fe0f.png"
  },
  {
    emoji: "\u2663",
    name: "clubs",
    shortcodes: ["clubs"],
    tags: ["card", "game"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2663-fe0f.png"
  },
  {
    emoji: "\u265F",
    name: "chess_pawn",
    shortcodes: ["chess_pawn"],
    tags: ["chess", "dupe", "expendable"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/265f-fe0f.png"
  },
  {
    emoji: "\u{1F0CF}",
    name: "black_joker",
    shortcodes: ["black_joker"],
    tags: ["card", "game", "wildcard"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f0cf.png"
  },
  {
    emoji: "\u{1F004}",
    name: "mahjong",
    shortcodes: ["mahjong"],
    tags: ["game", "mahjong", "red"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f004.png"
  },
  {
    emoji: "\u{1F3B4}",
    name: "flower_playing_cards",
    shortcodes: ["flower_playing_cards"],
    tags: ["card", "flower", "game", "japanese", "playing"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b4.png"
  },
  {
    emoji: "\u{1F3AD}",
    name: "performing_arts",
    shortcodes: ["performing_arts"],
    tags: ["art", "mask", "performing", "theater", "theatre"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ad.png"
  },
  {
    emoji: "\u{1F5BC}",
    name: "framed_picture",
    shortcodes: ["frame_with_picture", "framed_picture"],
    tags: ["art", "frame", "museum", "painting", "picture"],
    group: "activities",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5bc-fe0f.png"
  },
  {
    emoji: "\u{1F3A8}",
    name: "art",
    shortcodes: ["art", "palette"],
    tags: ["art", "museum", "painting", "palette"],
    group: "activities",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a8.png"
  },
  {
    emoji: "\u{1F9F5}",
    name: "thread",
    shortcodes: ["thread"],
    tags: ["needle", "sewing", "spool", "string"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f5.png"
  },
  {
    emoji: "\u{1FAA1}",
    name: "sewing_needle",
    shortcodes: ["sewing_needle"],
    tags: ["embroidery", "needle", "sewing", "stitches", "sutures", "tailoring"],
    group: "activities",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa1.png"
  },
  {
    emoji: "\u{1F9F6}",
    name: "yarn",
    shortcodes: ["yarn"],
    tags: ["ball", "crochet", "knit"],
    group: "activities",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f6.png"
  },
  {
    emoji: "\u{1FAA2}",
    name: "knot",
    shortcodes: ["knot"],
    tags: ["rope", "tangled", "tie", "twine", "twist"],
    group: "activities",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa2.png"
  },
  {
    emoji: "\u{1F453}",
    name: "eyeglasses",
    shortcodes: ["eyeglasses", "glasses"],
    tags: ["clothing", "eye", "eyeglasses", "eyewear"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f453.png"
  },
  {
    emoji: "\u{1F576}",
    name: "dark_sunglasses",
    shortcodes: ["sunglasses"],
    tags: ["dark", "eye", "eyewear", "glasses"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f576-fe0f.png"
  },
  {
    emoji: "\u{1F97D}",
    name: "goggles",
    shortcodes: ["goggles"],
    tags: ["eye protection", "swimming", "welding"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f97d.png"
  },
  {
    emoji: "\u{1F97C}",
    name: "lab_coat",
    shortcodes: ["lab_coat"],
    tags: ["doctor", "experiment", "scientist"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f97c.png"
  },
  {
    emoji: "\u{1F9BA}",
    name: "safety_vest",
    shortcodes: ["safety_vest"],
    tags: ["emergency", "safety", "vest"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ba.png"
  },
  {
    emoji: "\u{1F454}",
    name: "necktie",
    shortcodes: ["necktie"],
    tags: ["clothing", "tie"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f454.png"
  },
  {
    emoji: "\u{1F455}",
    name: "shirt",
    shortcodes: ["shirt"],
    tags: ["clothing", "shirt", "tshirt"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f455.png"
  },
  {
    emoji: "\u{1F456}",
    name: "jeans",
    shortcodes: ["jeans"],
    tags: ["clothing", "pants", "trousers"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f456.png"
  },
  {
    emoji: "\u{1F9E3}",
    name: "scarf",
    shortcodes: ["scarf"],
    tags: ["neck"],
    group: "objects",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e3.png"
  },
  {
    emoji: "\u{1F9E4}",
    name: "gloves",
    shortcodes: ["gloves"],
    tags: ["hand"],
    group: "objects",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e4.png"
  },
  {
    emoji: "\u{1F9E5}",
    name: "coat",
    shortcodes: ["coat"],
    tags: ["jacket"],
    group: "objects",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e5.png"
  },
  {
    emoji: "\u{1F9E6}",
    name: "socks",
    shortcodes: ["socks"],
    tags: ["stocking"],
    group: "objects",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e6.png"
  },
  {
    emoji: "\u{1F457}",
    name: "dress",
    shortcodes: ["dress"],
    tags: ["clothing"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f457.png"
  },
  {
    emoji: "\u{1F458}",
    name: "kimono",
    shortcodes: ["kimono"],
    tags: ["clothing"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f458.png"
  },
  {
    emoji: "\u{1F97B}",
    name: "sari",
    shortcodes: ["sari"],
    tags: ["clothing", "dress"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f97b.png"
  },
  {
    emoji: "\u{1FA71}",
    name: "one_piece_swimsuit",
    shortcodes: ["one_piece_swimsuit"],
    tags: ["bathing suit"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa71.png"
  },
  {
    emoji: "\u{1FA72}",
    name: "swim_brief",
    shortcodes: ["briefs"],
    tags: ["bathing suit", "one-piece", "swimsuit", "underwear"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa72.png"
  },
  {
    emoji: "\u{1FA73}",
    name: "shorts",
    shortcodes: ["shorts"],
    tags: ["bathing suit", "pants", "underwear"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa73.png"
  },
  {
    emoji: "\u{1F459}",
    name: "bikini",
    shortcodes: ["bikini"],
    tags: ["clothing", "swim"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f459.png"
  },
  {
    emoji: "\u{1F45A}",
    name: "womans_clothes",
    shortcodes: ["womans_clothes"],
    tags: ["clothing", "woman"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f45a.png"
  },
  {
    emoji: "\u{1FAAD}",
    name: "folding_hand_fan",
    shortcodes: ["folding_fan"],
    tags: ["cooling", "dance", "fan", "flutter", "hot", "shy"],
    group: "objects",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F45B}",
    name: "purse",
    shortcodes: ["purse"],
    tags: ["clothing", "coin"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f45b.png"
  },
  {
    emoji: "\u{1F45C}",
    name: "handbag",
    shortcodes: ["handbag"],
    tags: ["bag", "clothing", "purse"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f45c.png"
  },
  {
    emoji: "\u{1F45D}",
    name: "pouch",
    shortcodes: ["clutch_bag", "pouch"],
    tags: ["bag", "clothing", "pouch"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f45d.png"
  },
  {
    emoji: "\u{1F6CD}",
    name: "shopping",
    shortcodes: ["shopping_bags"],
    tags: ["bag", "hotel", "shopping"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6cd-fe0f.png"
  },
  {
    emoji: "\u{1F392}",
    name: "school_satchel",
    shortcodes: ["backpack", "school_satchel"],
    tags: ["bag", "rucksack", "satchel", "school"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f392.png"
  },
  {
    emoji: "\u{1FA74}",
    name: "thong_sandal",
    shortcodes: ["thong_sandal"],
    tags: ["beach sandals", "sandals", "thong sandals", "thongs", "z\u014Dri"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa74.png"
  },
  {
    emoji: "\u{1F45E}",
    name: "mans_shoe",
    shortcodes: ["mans_shoe"],
    tags: ["clothing", "man", "shoe"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f45e.png"
  },
  {
    emoji: "\u{1F45F}",
    name: "athletic_shoe",
    shortcodes: ["athletic_shoe", "sneaker"],
    tags: ["athletic", "clothing", "shoe", "sneaker"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f45f.png"
  },
  {
    emoji: "\u{1F97E}",
    name: "hiking_boot",
    shortcodes: ["hiking_boot"],
    tags: ["backpacking", "boot", "camping", "hiking"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f97e.png"
  },
  {
    emoji: "\u{1F97F}",
    name: "flat_shoe",
    shortcodes: ["flat_shoe", "womans_flat_shoe"],
    tags: ["ballet flat", "slip-on", "slipper"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f97f.png"
  },
  {
    emoji: "\u{1F460}",
    name: "high_heel",
    shortcodes: ["high_heel"],
    tags: ["clothing", "heel", "shoe", "woman"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f460.png"
  },
  {
    emoji: "\u{1F461}",
    name: "sandal",
    shortcodes: ["sandal"],
    tags: ["clothing", "sandal", "shoe", "woman"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f461.png"
  },
  {
    emoji: "\u{1FA70}",
    name: "ballet_shoes",
    shortcodes: ["ballet_shoes"],
    tags: ["ballet", "dance"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa70.png"
  },
  {
    emoji: "\u{1F462}",
    name: "boot",
    shortcodes: ["boot"],
    tags: ["boot", "clothing", "shoe", "woman"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f462.png"
  },
  {
    emoji: "\u{1FAAE}",
    name: "hair_pick",
    shortcodes: ["hair_pick"],
    tags: ["afro", "comb", "hair", "pick"],
    group: "objects",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F451}",
    name: "crown",
    shortcodes: ["crown"],
    tags: ["clothing", "king", "queen"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f451.png"
  },
  {
    emoji: "\u{1F452}",
    name: "womans_hat",
    shortcodes: ["womans_hat"],
    tags: ["clothing", "hat", "woman"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f452.png"
  },
  {
    emoji: "\u{1F3A9}",
    name: "tophat",
    shortcodes: ["top_hat", "tophat"],
    tags: ["clothing", "hat", "top", "tophat"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a9.png"
  },
  {
    emoji: "\u{1F393}",
    name: "mortar_board",
    shortcodes: ["graduation_cap", "mortar_board"],
    tags: ["cap", "celebration", "clothing", "graduation", "hat"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f393.png"
  },
  {
    emoji: "\u{1F9E2}",
    name: "billed_cap",
    shortcodes: ["billed_cap"],
    tags: ["baseball cap"],
    group: "objects",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9e2.png"
  },
  {
    emoji: "\u{1FA96}",
    name: "military_helmet",
    shortcodes: ["military_helmet"],
    tags: ["army", "helmet", "military", "soldier", "warrior"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa96.png"
  },
  {
    emoji: "\u26D1",
    name: "rescue_worker_helmet",
    shortcodes: ["helmet_with_cross", "rescue_worker_helmet"],
    tags: ["aid", "cross", "face", "hat", "helmet"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26d1-fe0f.png"
  },
  {
    emoji: "\u{1F4FF}",
    name: "prayer_beads",
    shortcodes: ["prayer_beads"],
    tags: ["beads", "clothing", "necklace", "prayer", "religion"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ff.png"
  },
  {
    emoji: "\u{1F484}",
    name: "lipstick",
    shortcodes: ["lipstick"],
    tags: ["cosmetics", "makeup"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f484.png"
  },
  {
    emoji: "\u{1F48D}",
    name: "ring",
    shortcodes: ["ring"],
    tags: ["diamond"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f48d.png"
  },
  {
    emoji: "\u{1F48E}",
    name: "gem",
    shortcodes: ["gem"],
    tags: ["diamond", "gem", "jewel"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f48e.png"
  },
  {
    emoji: "\u{1F507}",
    name: "mute",
    shortcodes: ["mute", "no_sound"],
    tags: ["mute", "quiet", "silent", "speaker"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f507.png"
  },
  {
    emoji: "\u{1F508}",
    name: "speaker",
    shortcodes: ["low_volume", "quiet_sound", "speaker"],
    tags: ["soft"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f508.png"
  },
  {
    emoji: "\u{1F509}",
    name: "sound",
    shortcodes: ["medium_volumne", "sound"],
    tags: ["medium"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f509.png"
  },
  {
    emoji: "\u{1F50A}",
    name: "loud_sound",
    shortcodes: ["high_volume", "loud_sound"],
    tags: ["loud"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f50a.png"
  },
  {
    emoji: "\u{1F4E2}",
    name: "loudspeaker",
    shortcodes: ["loudspeaker"],
    tags: ["loud", "public address"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e2.png"
  },
  {
    emoji: "\u{1F4E3}",
    name: "mega",
    shortcodes: ["mega", "megaphone"],
    tags: ["cheering"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e3.png"
  },
  {
    emoji: "\u{1F4EF}",
    name: "postal_horn",
    shortcodes: ["postal_horn"],
    tags: ["horn", "post", "postal"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ef.png"
  },
  {
    emoji: "\u{1F514}",
    name: "bell",
    shortcodes: ["bell"],
    tags: ["bell"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f514.png"
  },
  {
    emoji: "\u{1F515}",
    name: "no_bell",
    shortcodes: ["no_bell"],
    tags: ["bell", "forbidden", "mute", "quiet", "silent"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f515.png"
  },
  {
    emoji: "\u{1F3BC}",
    name: "musical_score",
    shortcodes: ["musical_score"],
    tags: ["music", "score"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3bc.png"
  },
  {
    emoji: "\u{1F3B5}",
    name: "musical_note",
    shortcodes: ["musical_note"],
    tags: ["music", "note"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b5.png"
  },
  {
    emoji: "\u{1F3B6}",
    name: "notes",
    shortcodes: ["musical_notes", "notes"],
    tags: ["music", "note", "notes"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b6.png"
  },
  {
    emoji: "\u{1F399}",
    name: "studio_microphone",
    shortcodes: ["studio_microphone"],
    tags: ["mic", "microphone", "music", "studio"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f399-fe0f.png"
  },
  {
    emoji: "\u{1F39A}",
    name: "level_slider",
    shortcodes: ["level_slider"],
    tags: ["level", "music", "slider"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f39a-fe0f.png"
  },
  {
    emoji: "\u{1F39B}",
    name: "control_knobs",
    shortcodes: ["control_knobs"],
    tags: ["control", "knobs", "music"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f39b-fe0f.png"
  },
  {
    emoji: "\u{1F3A4}",
    name: "microphone",
    shortcodes: ["microphone"],
    tags: ["karaoke", "mic"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a4.png"
  },
  {
    emoji: "\u{1F3A7}",
    name: "headphones",
    shortcodes: ["headphones"],
    tags: ["earbud"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a7.png"
  },
  {
    emoji: "\u{1F4FB}",
    name: "radio",
    shortcodes: ["radio"],
    tags: ["video"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4fb.png"
  },
  {
    emoji: "\u{1F3B7}",
    name: "saxophone",
    shortcodes: ["saxophone"],
    tags: ["instrument", "music", "sax"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b7.png"
  },
  {
    emoji: "\u{1FA97}",
    name: "accordion",
    shortcodes: ["accordion"],
    tags: ["concertina", "squeeze box"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa97.png"
  },
  {
    emoji: "\u{1F3B8}",
    name: "guitar",
    shortcodes: ["guitar"],
    tags: ["instrument", "music"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b8.png"
  },
  {
    emoji: "\u{1F3B9}",
    name: "musical_keyboard",
    shortcodes: ["musical_keyboard"],
    tags: ["instrument", "keyboard", "music", "piano"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3b9.png"
  },
  {
    emoji: "\u{1F3BA}",
    name: "trumpet",
    shortcodes: ["trumpet"],
    tags: ["instrument", "music"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ba.png"
  },
  {
    emoji: "\u{1F3BB}",
    name: "violin",
    shortcodes: ["violin"],
    tags: ["instrument", "music"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3bb.png"
  },
  {
    emoji: "\u{1FA95}",
    name: "banjo",
    shortcodes: ["banjo"],
    tags: ["music", "stringed"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa95.png"
  },
  {
    emoji: "\u{1F941}",
    name: "drum",
    shortcodes: ["drum"],
    tags: ["drumsticks", "music"],
    group: "objects",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f941.png"
  },
  {
    emoji: "\u{1FA98}",
    name: "long_drum",
    shortcodes: ["long_drum"],
    tags: ["beat", "conga", "drum", "rhythm"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa98.png"
  },
  {
    emoji: "\u{1FA87}",
    name: "maracas",
    shortcodes: ["maracas"],
    tags: ["instrument", "music", "percussion", "rattle", "shake"],
    group: "objects",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1FA88}",
    name: "flute",
    shortcodes: ["flute"],
    tags: ["fife", "music", "pipe", "recorder", "woodwind"],
    group: "objects",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F4F1}",
    name: "iphone",
    shortcodes: ["android", "iphone", "mobile_phone"],
    tags: ["cell", "mobile", "phone", "telephone"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f1.png"
  },
  {
    emoji: "\u{1F4F2}",
    name: "calling",
    shortcodes: ["calling", "mobile_phone_arrow"],
    tags: ["arrow", "cell", "mobile", "phone", "receive"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f2.png"
  },
  {
    emoji: "\u260E",
    name: "phone",
    shortcodes: ["telephone"],
    tags: ["phone"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/260e-fe0f.png"
  },
  {
    emoji: "\u{1F4DE}",
    name: "telephone_receiver",
    shortcodes: ["telephone_receiver"],
    tags: ["phone", "receiver", "telephone"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4de.png"
  },
  {
    emoji: "\u{1F4DF}",
    name: "pager",
    shortcodes: ["pager"],
    tags: ["pager"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4df.png"
  },
  {
    emoji: "\u{1F4E0}",
    name: "fax",
    shortcodes: ["fax", "fax_machine"],
    tags: ["fax"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e0.png"
  },
  {
    emoji: "\u{1F50B}",
    name: "battery",
    shortcodes: ["battery"],
    tags: ["battery"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f50b.png"
  },
  {
    emoji: "\u{1FAAB}",
    name: "low_battery",
    shortcodes: ["low_battery"],
    tags: ["electronic", "low energy"],
    group: "objects",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F50C}",
    name: "electric_plug",
    shortcodes: ["electric_plug"],
    tags: ["electric", "electricity", "plug"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f50c.png"
  },
  {
    emoji: "\u{1F4BB}",
    name: "computer",
    shortcodes: ["laptop"],
    tags: ["computer", "pc", "personal"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4bb.png"
  },
  {
    emoji: "\u{1F5A5}",
    name: "desktop_computer",
    shortcodes: ["computer", "desktop_computer"],
    tags: ["computer", "desktop"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5a5-fe0f.png"
  },
  {
    emoji: "\u{1F5A8}",
    name: "printer",
    shortcodes: ["printer"],
    tags: ["computer"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5a8-fe0f.png"
  },
  {
    emoji: "\u2328",
    name: "keyboard",
    shortcodes: ["keyboard"],
    tags: ["computer"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2328-fe0f.png"
  },
  {
    emoji: "\u{1F5B1}",
    name: "computer_mouse",
    shortcodes: ["computer_mouse"],
    tags: ["computer"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5b1-fe0f.png"
  },
  {
    emoji: "\u{1F5B2}",
    name: "trackball",
    shortcodes: ["trackball"],
    tags: ["computer"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5b2-fe0f.png"
  },
  {
    emoji: "\u{1F4BD}",
    name: "minidisc",
    shortcodes: ["computer_disk", "minidisc"],
    tags: ["computer", "disk", "minidisk", "optical"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4bd.png"
  },
  {
    emoji: "\u{1F4BE}",
    name: "floppy_disk",
    shortcodes: ["floppy_disk"],
    tags: ["computer", "disk", "floppy"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4be.png"
  },
  {
    emoji: "\u{1F4BF}",
    name: "cd",
    shortcodes: ["cd", "optical_disk"],
    tags: ["cd", "computer", "disk", "optical"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4bf.png"
  },
  {
    emoji: "\u{1F4C0}",
    name: "dvd",
    shortcodes: ["dvd"],
    tags: ["blu-ray", "computer", "disk", "optical"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c0.png"
  },
  {
    emoji: "\u{1F9EE}",
    name: "abacus",
    shortcodes: ["abacus"],
    tags: ["calculation"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ee.png"
  },
  {
    emoji: "\u{1F3A5}",
    name: "movie_camera",
    shortcodes: ["movie_camera"],
    tags: ["camera", "cinema", "movie"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a5.png"
  },
  {
    emoji: "\u{1F39E}",
    name: "film_strip",
    shortcodes: ["film_frames"],
    tags: ["cinema", "film", "frames", "movie"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f39e-fe0f.png"
  },
  {
    emoji: "\u{1F4FD}",
    name: "film_projector",
    shortcodes: ["film_projector"],
    tags: ["cinema", "film", "movie", "projector", "video"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4fd-fe0f.png"
  },
  {
    emoji: "\u{1F3AC}",
    name: "clapper",
    shortcodes: ["clapper"],
    tags: ["clapper", "movie"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ac.png"
  },
  {
    emoji: "\u{1F4FA}",
    name: "tv",
    shortcodes: ["tv"],
    tags: ["tv", "video"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4fa.png"
  },
  {
    emoji: "\u{1F4F7}",
    name: "camera",
    shortcodes: ["camera"],
    tags: ["video"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f7.png"
  },
  {
    emoji: "\u{1F4F8}",
    name: "camera_flash",
    shortcodes: ["camera_with_flash"],
    tags: ["camera", "flash", "video"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f8.png"
  },
  {
    emoji: "\u{1F4F9}",
    name: "video_camera",
    shortcodes: ["video_camera"],
    tags: ["camera", "video"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f9.png"
  },
  {
    emoji: "\u{1F4FC}",
    name: "vhs",
    shortcodes: ["vhs", "videocassette"],
    tags: ["tape", "vhs", "video"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4fc.png"
  },
  {
    emoji: "\u{1F50D}",
    name: "mag",
    shortcodes: ["mag"],
    tags: ["glass", "magnifying", "search", "tool"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f50d.png"
  },
  {
    emoji: "\u{1F50E}",
    name: "mag_right",
    shortcodes: ["mag_right"],
    tags: ["glass", "magnifying", "search", "tool"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f50e.png"
  },
  {
    emoji: "\u{1F56F}",
    name: "candle",
    shortcodes: ["candle"],
    tags: ["light"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f56f-fe0f.png"
  },
  {
    emoji: "\u{1F4A1}",
    name: "bulb",
    shortcodes: ["bulb", "light_bulb"],
    tags: ["bulb", "comic", "electric", "idea", "light"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a1.png"
  },
  {
    emoji: "\u{1F526}",
    name: "flashlight",
    shortcodes: ["flashlight"],
    tags: ["electric", "light", "tool", "torch"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f526.png"
  },
  {
    emoji: "\u{1F3EE}",
    name: "izakaya_lantern",
    shortcodes: ["izakaya_lantern", "red_paper_lantern"],
    tags: ["bar", "lantern", "light", "red"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3ee.png"
  },
  {
    emoji: "\u{1FA94}",
    name: "diya_lamp",
    shortcodes: ["diya_lamp"],
    tags: ["diya", "lamp", "oil"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa94.png"
  },
  {
    emoji: "\u{1F4D4}",
    name: "notebook_with_decorative_cover",
    shortcodes: ["notebook_with_decorative_cover"],
    tags: ["book", "cover", "decorated", "notebook"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d4.png"
  },
  {
    emoji: "\u{1F4D5}",
    name: "closed_book",
    shortcodes: ["closed_book"],
    tags: ["book", "closed"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d5.png"
  },
  {
    emoji: "\u{1F4D6}",
    name: "book",
    shortcodes: ["book", "open_book"],
    tags: ["book", "open"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d6.png"
  },
  {
    emoji: "\u{1F4D7}",
    name: "green_book",
    shortcodes: ["green_book"],
    tags: ["book", "green"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d7.png"
  },
  {
    emoji: "\u{1F4D8}",
    name: "blue_book",
    shortcodes: ["blue_book"],
    tags: ["blue", "book"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d8.png"
  },
  {
    emoji: "\u{1F4D9}",
    name: "orange_book",
    shortcodes: ["orange_book"],
    tags: ["book", "orange"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d9.png"
  },
  {
    emoji: "\u{1F4DA}",
    name: "books",
    shortcodes: ["books"],
    tags: ["book"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4da.png"
  },
  {
    emoji: "\u{1F4D3}",
    name: "notebook",
    shortcodes: ["notebook"],
    tags: ["notebook"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d3.png"
  },
  {
    emoji: "\u{1F4D2}",
    name: "ledger",
    shortcodes: ["ledger"],
    tags: ["notebook"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d2.png"
  },
  {
    emoji: "\u{1F4C3}",
    name: "page_with_curl",
    shortcodes: ["page_with_curl"],
    tags: ["curl", "document", "page"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c3.png"
  },
  {
    emoji: "\u{1F4DC}",
    name: "scroll",
    shortcodes: ["scroll"],
    tags: ["paper"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4dc.png"
  },
  {
    emoji: "\u{1F4C4}",
    name: "page_facing_up",
    shortcodes: ["page_facing_up"],
    tags: ["document", "page"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c4.png"
  },
  {
    emoji: "\u{1F4F0}",
    name: "newspaper",
    shortcodes: ["newspaper"],
    tags: ["news", "paper"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f0.png"
  },
  {
    emoji: "\u{1F5DE}",
    name: "newspaper_roll",
    shortcodes: ["rolled_up_newspaper"],
    tags: ["news", "newspaper", "paper", "rolled"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5de-fe0f.png"
  },
  {
    emoji: "\u{1F4D1}",
    name: "bookmark_tabs",
    shortcodes: ["bookmark_tabs"],
    tags: ["bookmark", "mark", "marker", "tabs"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d1.png"
  },
  {
    emoji: "\u{1F516}",
    name: "bookmark",
    shortcodes: ["bookmark"],
    tags: ["mark"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f516.png"
  },
  {
    emoji: "\u{1F3F7}",
    name: "label",
    shortcodes: ["label"],
    tags: ["label"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f7-fe0f.png"
  },
  {
    emoji: "\u{1F4B0}",
    name: "moneybag",
    shortcodes: ["moneybag"],
    tags: ["bag", "dollar", "money", "moneybag"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b0.png"
  },
  {
    emoji: "\u{1FA99}",
    name: "coin",
    shortcodes: ["coin"],
    tags: ["gold", "metal", "money", "silver", "treasure"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa99.png"
  },
  {
    emoji: "\u{1F4B4}",
    name: "yen",
    shortcodes: ["yen"],
    tags: ["banknote", "bill", "currency", "money", "note", "yen"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b4.png"
  },
  {
    emoji: "\u{1F4B5}",
    name: "dollar",
    shortcodes: ["dollar"],
    tags: ["banknote", "bill", "currency", "dollar", "money", "note"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b5.png"
  },
  {
    emoji: "\u{1F4B6}",
    name: "euro",
    shortcodes: ["euro"],
    tags: ["banknote", "bill", "currency", "euro", "money", "note"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b6.png"
  },
  {
    emoji: "\u{1F4B7}",
    name: "pound",
    shortcodes: ["pound"],
    tags: ["banknote", "bill", "currency", "money", "note", "pound"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b7.png"
  },
  {
    emoji: "\u{1F4B8}",
    name: "money_with_wings",
    shortcodes: ["money_with_wings"],
    tags: ["banknote", "bill", "fly", "money", "wings"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b8.png"
  },
  {
    emoji: "\u{1F4B3}",
    name: "credit_card",
    shortcodes: ["credit_card"],
    tags: ["card", "credit", "money"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b3.png"
  },
  {
    emoji: "\u{1F9FE}",
    name: "receipt",
    shortcodes: ["receipt"],
    tags: ["accounting", "bookkeeping", "evidence", "proof"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9fe.png"
  },
  {
    emoji: "\u{1F4B9}",
    name: "chart",
    shortcodes: ["chart"],
    tags: ["chart", "graph", "growth", "money", "yen"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b9.png"
  },
  {
    emoji: "\u2709",
    name: "envelope",
    shortcodes: ["envelope"],
    tags: ["email", "letter"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2709-fe0f.png"
  },
  {
    emoji: "\u{1F4E7}",
    name: "e-mail",
    shortcodes: ["e-mail", "email"],
    tags: ["email", "letter", "mail"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e7.png"
  },
  {
    emoji: "\u{1F4E8}",
    name: "incoming_envelope",
    shortcodes: ["incoming_envelope"],
    tags: ["e-mail", "email", "envelope", "incoming", "letter", "receive"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e8.png"
  },
  {
    emoji: "\u{1F4E9}",
    name: "envelope_with_arrow",
    shortcodes: ["envelope_with_arrow"],
    tags: ["arrow", "e-mail", "email", "envelope", "outgoing"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e9.png"
  },
  {
    emoji: "\u{1F4E4}",
    name: "outbox_tray",
    shortcodes: ["outbox_tray"],
    tags: ["box", "letter", "mail", "outbox", "sent", "tray"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e4.png"
  },
  {
    emoji: "\u{1F4E5}",
    name: "inbox_tray",
    shortcodes: ["inbox_tray"],
    tags: ["box", "inbox", "letter", "mail", "receive", "tray"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e5.png"
  },
  {
    emoji: "\u{1F4E6}",
    name: "package",
    shortcodes: ["package"],
    tags: ["box", "parcel"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e6.png"
  },
  {
    emoji: "\u{1F4EB}",
    name: "mailbox",
    shortcodes: ["mailbox"],
    tags: ["closed", "mail", "mailbox", "postbox"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4eb.png"
  },
  {
    emoji: "\u{1F4EA}",
    name: "mailbox_closed",
    shortcodes: ["mailbox_closed"],
    tags: ["closed", "lowered", "mail", "mailbox", "postbox"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ea.png"
  },
  {
    emoji: "\u{1F4EC}",
    name: "mailbox_with_mail",
    shortcodes: ["mailbox_with_mail"],
    tags: ["mail", "mailbox", "open", "postbox"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ec.png"
  },
  {
    emoji: "\u{1F4ED}",
    name: "mailbox_with_no_mail",
    shortcodes: ["mailbox_with_no_mail"],
    tags: ["lowered", "mail", "mailbox", "open", "postbox"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ed.png"
  },
  {
    emoji: "\u{1F4EE}",
    name: "postbox",
    shortcodes: ["postbox"],
    tags: ["mail", "mailbox"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ee.png"
  },
  {
    emoji: "\u{1F5F3}",
    name: "ballot_box",
    shortcodes: ["ballot_box"],
    tags: ["ballot", "box"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5f3-fe0f.png"
  },
  {
    emoji: "\u270F",
    name: "pencil2",
    shortcodes: ["pencil"],
    tags: ["pencil"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/270f-fe0f.png"
  },
  {
    emoji: "\u2712",
    name: "black_nib",
    shortcodes: ["black_nib"],
    tags: ["nib", "pen"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2712-fe0f.png"
  },
  {
    emoji: "\u{1F58B}",
    name: "fountain_pen",
    shortcodes: ["fountain_pen"],
    tags: ["fountain", "pen"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f58b-fe0f.png"
  },
  {
    emoji: "\u{1F58A}",
    name: "pen",
    shortcodes: ["pen"],
    tags: ["ballpoint"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f58a-fe0f.png"
  },
  {
    emoji: "\u{1F58C}",
    name: "paintbrush",
    shortcodes: ["paintbrush"],
    tags: ["painting"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f58c-fe0f.png"
  },
  {
    emoji: "\u{1F58D}",
    name: "crayon",
    shortcodes: ["crayon"],
    tags: ["crayon"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f58d-fe0f.png"
  },
  {
    emoji: "\u{1F4DD}",
    name: "memo",
    shortcodes: ["memo"],
    tags: ["pencil"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4dd.png"
  },
  {
    emoji: "\u{1F4BC}",
    name: "briefcase",
    shortcodes: ["briefcase"],
    tags: ["briefcase"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4bc.png"
  },
  {
    emoji: "\u{1F4C1}",
    name: "file_folder",
    shortcodes: ["file_folder"],
    tags: ["file", "folder"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c1.png"
  },
  {
    emoji: "\u{1F4C2}",
    name: "open_file_folder",
    shortcodes: ["open_file_folder"],
    tags: ["file", "folder", "open"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c2.png"
  },
  {
    emoji: "\u{1F5C2}",
    name: "card_index_dividers",
    shortcodes: ["card_index_dividers"],
    tags: ["card", "dividers", "index"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5c2-fe0f.png"
  },
  {
    emoji: "\u{1F4C5}",
    name: "date",
    shortcodes: ["date"],
    tags: ["date"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c5.png"
  },
  {
    emoji: "\u{1F4C6}",
    name: "calendar",
    shortcodes: ["calendar"],
    tags: ["calendar"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c6.png"
  },
  {
    emoji: "\u{1F5D2}",
    name: "spiral_notepad",
    shortcodes: ["notepad_spiral"],
    tags: ["note", "pad", "spiral"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5d2-fe0f.png"
  },
  {
    emoji: "\u{1F5D3}",
    name: "spiral_calendar",
    shortcodes: ["calendar_spiral"],
    tags: ["calendar", "pad", "spiral"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5d3-fe0f.png"
  },
  {
    emoji: "\u{1F4C7}",
    name: "card_index",
    shortcodes: ["card_index"],
    tags: ["card", "index", "rolodex"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c7.png"
  },
  {
    emoji: "\u{1F4C8}",
    name: "chart_with_upwards_trend",
    shortcodes: ["chart_increasing", "chart_with_upwards_trend"],
    tags: ["chart", "graph", "growth", "trend", "upward"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c8.png"
  },
  {
    emoji: "\u{1F4C9}",
    name: "chart_with_downwards_trend",
    shortcodes: ["chart_decreasing", "chart_with_downwards_trend"],
    tags: ["chart", "down", "graph", "trend"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4c9.png"
  },
  {
    emoji: "\u{1F4CA}",
    name: "bar_chart",
    shortcodes: ["bar_chart"],
    tags: ["bar", "chart", "graph"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ca.png"
  },
  {
    emoji: "\u{1F4CB}",
    name: "clipboard",
    shortcodes: ["clipboard"],
    tags: ["clipboard"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4cb.png"
  },
  {
    emoji: "\u{1F4CC}",
    name: "pushpin",
    shortcodes: ["pushpin"],
    tags: ["pin"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4cc.png"
  },
  {
    emoji: "\u{1F4CD}",
    name: "round_pushpin",
    shortcodes: ["round_pushpin"],
    tags: ["pin", "pushpin"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4cd.png"
  },
  {
    emoji: "\u{1F4CE}",
    name: "paperclip",
    shortcodes: ["paperclip"],
    tags: ["paperclip"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4ce.png"
  },
  {
    emoji: "\u{1F587}",
    name: "paperclips",
    shortcodes: ["paperclips"],
    tags: ["link", "paperclip"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f587-fe0f.png"
  },
  {
    emoji: "\u{1F4CF}",
    name: "straight_ruler",
    shortcodes: ["straight_ruler"],
    tags: ["ruler", "straight edge"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4cf.png"
  },
  {
    emoji: "\u{1F4D0}",
    name: "triangular_ruler",
    shortcodes: ["triangular_ruler"],
    tags: ["ruler", "set", "triangle"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4d0.png"
  },
  {
    emoji: "\u2702",
    name: "scissors",
    shortcodes: ["scissors"],
    tags: ["cutting", "tool"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2702-fe0f.png"
  },
  {
    emoji: "\u{1F5C3}",
    name: "card_file_box",
    shortcodes: ["card_file_box"],
    tags: ["box", "card", "file"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5c3-fe0f.png"
  },
  {
    emoji: "\u{1F5C4}",
    name: "file_cabinet",
    shortcodes: ["file_cabinet"],
    tags: ["cabinet", "file", "filing"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5c4-fe0f.png"
  },
  {
    emoji: "\u{1F5D1}",
    name: "wastebasket",
    shortcodes: ["trashcan", "wastebasket"],
    tags: ["wastebasket"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5d1-fe0f.png"
  },
  {
    emoji: "\u{1F512}",
    name: "lock",
    shortcodes: ["lock", "locked"],
    tags: ["closed"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f512.png"
  },
  {
    emoji: "\u{1F513}",
    name: "unlock",
    shortcodes: ["unlock", "unlocked"],
    tags: ["lock", "open", "unlock"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f513.png"
  },
  {
    emoji: "\u{1F50F}",
    name: "lock_with_ink_pen",
    shortcodes: ["lock_with_ink_pen", "locked_with_pen"],
    tags: ["ink", "lock", "nib", "pen", "privacy"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f50f.png"
  },
  {
    emoji: "\u{1F510}",
    name: "closed_lock_with_key",
    shortcodes: ["closed_lock_with_key", "locked_with_key"],
    tags: ["closed", "key", "lock", "secure"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f510.png"
  },
  {
    emoji: "\u{1F511}",
    name: "key",
    shortcodes: ["key"],
    tags: ["lock", "password"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f511.png"
  },
  {
    emoji: "\u{1F5DD}",
    name: "old_key",
    shortcodes: ["old_key"],
    tags: ["clue", "key", "lock", "old"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5dd-fe0f.png"
  },
  {
    emoji: "\u{1F528}",
    name: "hammer",
    shortcodes: ["hammer"],
    tags: ["tool"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f528.png"
  },
  {
    emoji: "\u{1FA93}",
    name: "axe",
    shortcodes: ["axe"],
    tags: ["chop", "hatchet", "split", "wood"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa93.png"
  },
  {
    emoji: "\u26CF",
    name: "pick",
    shortcodes: ["pick"],
    tags: ["mining", "tool"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26cf-fe0f.png"
  },
  {
    emoji: "\u2692",
    name: "hammer_and_pick",
    shortcodes: ["hammer_and_pick"],
    tags: ["hammer", "pick", "tool"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2692-fe0f.png"
  },
  {
    emoji: "\u{1F6E0}",
    name: "hammer_and_wrench",
    shortcodes: ["hammer_and_wrench"],
    tags: ["hammer", "spanner", "tool", "wrench"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6e0-fe0f.png"
  },
  {
    emoji: "\u{1F5E1}",
    name: "dagger",
    shortcodes: ["dagger"],
    tags: ["knife", "weapon"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5e1-fe0f.png"
  },
  {
    emoji: "\u2694",
    name: "crossed_swords",
    shortcodes: ["crossed_swords"],
    tags: ["crossed", "swords", "weapon"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2694-fe0f.png"
  },
  {
    emoji: "\u{1F4A3}",
    name: "bomb",
    shortcodes: ["bomb"],
    tags: ["comic"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a3.png"
  },
  {
    emoji: "\u{1FA83}",
    name: "boomerang",
    shortcodes: ["boomerang"],
    tags: ["rebound", "repercussion"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa83.png"
  },
  {
    emoji: "\u{1F3F9}",
    name: "bow_and_arrow",
    shortcodes: ["bow_and_arrow"],
    tags: ["archer", "arrow", "bow", "sagittarius", "zodiac"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f9.png"
  },
  {
    emoji: "\u{1F6E1}",
    name: "shield",
    shortcodes: ["shield"],
    tags: ["weapon"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6e1-fe0f.png"
  },
  {
    emoji: "\u{1FA9A}",
    name: "carpentry_saw",
    shortcodes: ["carpentry_saw"],
    tags: ["carpenter", "lumber", "saw", "tool"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa9a.png"
  },
  {
    emoji: "\u{1F527}",
    name: "wrench",
    shortcodes: ["wrench"],
    tags: ["spanner", "tool"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f527.png"
  },
  {
    emoji: "\u{1FA9B}",
    name: "screwdriver",
    shortcodes: ["screwdriver"],
    tags: ["screw", "tool"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa9b.png"
  },
  {
    emoji: "\u{1F529}",
    name: "nut_and_bolt",
    shortcodes: ["nut_and_bolt"],
    tags: ["bolt", "nut", "tool"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f529.png"
  },
  {
    emoji: "\u2699",
    name: "gear",
    shortcodes: ["gear"],
    tags: ["cog", "cogwheel", "tool"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2699-fe0f.png"
  },
  {
    emoji: "\u{1F5DC}",
    name: "clamp",
    shortcodes: ["clamp", "compression"],
    tags: ["compress", "tool", "vice"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5dc-fe0f.png"
  },
  {
    emoji: "\u2696",
    name: "balance_scale",
    shortcodes: ["scales"],
    tags: ["balance", "justice", "libra", "scale", "zodiac"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2696-fe0f.png"
  },
  {
    emoji: "\u{1F9AF}",
    name: "probing_cane",
    shortcodes: ["probing_cane", "white_cane"],
    tags: ["accessibility", "blind"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9af.png"
  },
  {
    emoji: "\u{1F517}",
    name: "link",
    shortcodes: ["link"],
    tags: ["link"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f517.png"
  },
  {
    emoji: "\u26D3\u200D\u{1F4A5}",
    name: "broken_chain",
    shortcodes: ["broken_chain"],
    tags: ["break", "breaking", "chain", "cuffs", "freedom"],
    group: "objects",
    emoticons: [],
    version: 15.1
  },
  {
    emoji: "\u26D3",
    name: "chains",
    shortcodes: ["chains"],
    tags: ["chain"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26d3-fe0f.png"
  },
  {
    emoji: "\u{1FA9D}",
    name: "hook",
    shortcodes: ["hook"],
    tags: ["catch", "crook", "curve", "ensnare", "selling point"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa9d.png"
  },
  {
    emoji: "\u{1F9F0}",
    name: "toolbox",
    shortcodes: ["toolbox"],
    tags: ["chest", "mechanic", "tool"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f0.png"
  },
  {
    emoji: "\u{1F9F2}",
    name: "magnet",
    shortcodes: ["magnet"],
    tags: ["attraction", "horseshoe", "magnetic"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f2.png"
  },
  {
    emoji: "\u{1FA9C}",
    name: "ladder",
    shortcodes: ["ladder"],
    tags: ["climb", "rung", "step"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa9c.png"
  },
  {
    emoji: "\u2697",
    name: "alembic",
    shortcodes: ["alembic"],
    tags: ["chemistry", "tool"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2697-fe0f.png"
  },
  {
    emoji: "\u{1F9EA}",
    name: "test_tube",
    shortcodes: ["test_tube"],
    tags: ["chemist", "chemistry", "experiment", "lab", "science"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ea.png"
  },
  {
    emoji: "\u{1F9EB}",
    name: "petri_dish",
    shortcodes: ["petri_dish"],
    tags: ["bacteria", "biologist", "biology", "culture", "lab"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9eb.png"
  },
  {
    emoji: "\u{1F9EC}",
    name: "dna",
    shortcodes: ["dna", "double_helix"],
    tags: ["biologist", "evolution", "gene", "genetics", "life"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ec.png"
  },
  {
    emoji: "\u{1F52C}",
    name: "microscope",
    shortcodes: ["microscope"],
    tags: ["science", "tool"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f52c.png"
  },
  {
    emoji: "\u{1F52D}",
    name: "telescope",
    shortcodes: ["telescope"],
    tags: ["science", "tool"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f52d.png"
  },
  {
    emoji: "\u{1F4E1}",
    name: "satellite",
    shortcodes: ["satellite_antenna"],
    tags: ["antenna", "dish", "satellite"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e1.png"
  },
  {
    emoji: "\u{1F489}",
    name: "syringe",
    shortcodes: ["syringe"],
    tags: ["medicine", "needle", "shot", "sick"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f489.png"
  },
  {
    emoji: "\u{1FA78}",
    name: "drop_of_blood",
    shortcodes: ["drop_of_blood"],
    tags: ["bleed", "blood donation", "injury", "medicine", "menstruation"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa78.png"
  },
  {
    emoji: "\u{1F48A}",
    name: "pill",
    shortcodes: ["pill"],
    tags: ["doctor", "medicine", "sick"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f48a.png"
  },
  {
    emoji: "\u{1FA79}",
    name: "adhesive_bandage",
    shortcodes: ["adhesive_bandage", "bandaid"],
    tags: ["bandage"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa79.png"
  },
  {
    emoji: "\u{1FA7C}",
    name: "crutch",
    shortcodes: ["crutch"],
    tags: ["cane", "disability", "hurt", "mobility aid", "stick"],
    group: "objects",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FA7A}",
    name: "stethoscope",
    shortcodes: ["stethoscope"],
    tags: ["doctor", "heart", "medicine"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa7a.png"
  },
  {
    emoji: "\u{1FA7B}",
    name: "x_ray",
    shortcodes: ["x-ray", "xray"],
    tags: ["bones", "doctor", "medical", "skeleton"],
    group: "objects",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F6AA}",
    name: "door",
    shortcodes: ["door"],
    tags: ["door"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6aa.png"
  },
  {
    emoji: "\u{1F6D7}",
    name: "elevator",
    shortcodes: ["elevator"],
    tags: ["accessibility", "hoist", "lift"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6d7.png"
  },
  {
    emoji: "\u{1FA9E}",
    name: "mirror",
    shortcodes: ["mirror"],
    tags: ["reflection", "reflector", "speculum"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa9e.png"
  },
  {
    emoji: "\u{1FA9F}",
    name: "window",
    shortcodes: ["window"],
    tags: ["frame", "fresh air", "opening", "transparent", "view"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa9f.png"
  },
  {
    emoji: "\u{1F6CF}",
    name: "bed",
    shortcodes: ["bed"],
    tags: ["hotel", "sleep"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6cf-fe0f.png"
  },
  {
    emoji: "\u{1F6CB}",
    name: "couch_and_lamp",
    shortcodes: ["couch_and_lamp"],
    tags: ["couch", "hotel", "lamp"],
    group: "objects",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6cb-fe0f.png"
  },
  {
    emoji: "\u{1FA91}",
    name: "chair",
    shortcodes: ["chair"],
    tags: ["seat", "sit"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa91.png"
  },
  {
    emoji: "\u{1F6BD}",
    name: "toilet",
    shortcodes: ["toilet"],
    tags: ["toilet"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6bd.png"
  },
  {
    emoji: "\u{1FAA0}",
    name: "plunger",
    shortcodes: ["plunger"],
    tags: ["force cup", "plumber", "suction", "toilet"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa0.png"
  },
  {
    emoji: "\u{1F6BF}",
    name: "shower",
    shortcodes: ["shower"],
    tags: ["water"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6bf.png"
  },
  {
    emoji: "\u{1F6C1}",
    name: "bathtub",
    shortcodes: ["bathtub"],
    tags: ["bath"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6c1.png"
  },
  {
    emoji: "\u{1FAA4}",
    name: "mouse_trap",
    shortcodes: ["mouse_trap"],
    tags: ["bait", "mousetrap", "snare", "trap"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa4.png"
  },
  {
    emoji: "\u{1FA92}",
    name: "razor",
    shortcodes: ["razor"],
    tags: ["sharp", "shave"],
    group: "objects",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1fa92.png"
  },
  {
    emoji: "\u{1F9F4}",
    name: "lotion_bottle",
    shortcodes: ["lotion_bottle"],
    tags: ["lotion", "moisturizer", "shampoo", "sunscreen"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f4.png"
  },
  {
    emoji: "\u{1F9F7}",
    name: "safety_pin",
    shortcodes: ["safety_pin"],
    tags: ["diaper", "punk rock"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f7.png"
  },
  {
    emoji: "\u{1F9F9}",
    name: "broom",
    shortcodes: ["broom"],
    tags: ["cleaning", "sweeping", "witch"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9f9.png"
  },
  {
    emoji: "\u{1F9FA}",
    name: "basket",
    shortcodes: ["basket"],
    tags: ["farming", "laundry", "picnic"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9fa.png"
  },
  {
    emoji: "\u{1F9FB}",
    name: "roll_of_paper",
    shortcodes: ["roll_of_paper", "toilet_paper"],
    tags: ["paper towels", "toilet paper"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9fb.png"
  },
  {
    emoji: "\u{1FAA3}",
    name: "bucket",
    shortcodes: ["bucket"],
    tags: ["cask", "pail", "vat"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa3.png"
  },
  {
    emoji: "\u{1F9FC}",
    name: "soap",
    shortcodes: ["soap"],
    tags: ["bar", "bathing", "cleaning", "lather", "soapdish"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9fc.png"
  },
  {
    emoji: "\u{1FAE7}",
    name: "bubbles",
    shortcodes: ["bubbles"],
    tags: ["burp", "clean", "soap", "underwater"],
    group: "objects",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1FAA5}",
    name: "toothbrush",
    shortcodes: ["toothbrush"],
    tags: ["bathroom", "brush", "clean", "dental", "hygiene", "teeth"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa5.png"
  },
  {
    emoji: "\u{1F9FD}",
    name: "sponge",
    shortcodes: ["sponge"],
    tags: ["absorbing", "cleaning", "porous"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9fd.png"
  },
  {
    emoji: "\u{1F9EF}",
    name: "fire_extinguisher",
    shortcodes: ["fire_extinguisher"],
    tags: ["extinguish", "fire", "quench"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ef.png"
  },
  {
    emoji: "\u{1F6D2}",
    name: "shopping_cart",
    shortcodes: ["shopping_cart"],
    tags: ["cart", "shopping", "trolley"],
    group: "objects",
    emoticons: [],
    version: 3,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6d2.png"
  },
  {
    emoji: "\u{1F6AC}",
    name: "smoking",
    shortcodes: ["cigarette", "smoking"],
    tags: ["smoking"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6ac.png"
  },
  {
    emoji: "\u26B0",
    name: "coffin",
    shortcodes: ["coffin"],
    tags: ["death"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26b0-fe0f.png"
  },
  {
    emoji: "\u{1FAA6}",
    name: "headstone",
    shortcodes: ["headstone"],
    tags: ["cemetery", "grave", "graveyard", "tombstone"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa6.png"
  },
  {
    emoji: "\u26B1",
    name: "funeral_urn",
    shortcodes: ["funeral_urn"],
    tags: ["ashes", "death", "funeral", "urn"],
    group: "objects",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26b1-fe0f.png"
  },
  {
    emoji: "\u{1F9FF}",
    name: "nazar_amulet",
    shortcodes: ["nazar_amulet"],
    tags: ["bead", "charm", "evil-eye", "nazar", "talisman"],
    group: "objects",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ff.png"
  },
  {
    emoji: "\u{1FAAC}",
    name: "hamsa",
    shortcodes: ["hamsa"],
    tags: ["amulet", "fatima", "hand", "mary", "miriam", "protection"],
    group: "objects",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F5FF}",
    name: "moyai",
    shortcodes: ["moai", "moyai"],
    tags: ["face", "moyai", "statue"],
    group: "objects",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f5ff.png"
  },
  {
    emoji: "\u{1FAA7}",
    name: "placard",
    shortcodes: ["placard"],
    tags: ["demonstration", "picket", "protest", "sign"],
    group: "objects",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1faa7.png"
  },
  {
    emoji: "\u{1FAAA}",
    name: "identification_card",
    shortcodes: ["id_card"],
    tags: ["credentials", "id", "license", "security"],
    group: "objects",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u{1F3E7}",
    name: "atm",
    shortcodes: ["atm"],
    tags: ["atm", "atm sign", "automated", "bank", "teller"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3e7.png"
  },
  {
    emoji: "\u{1F6AE}",
    name: "put_litter_in_its_place",
    shortcodes: ["litter_bin", "put_litter_in_its_place"],
    tags: ["litter", "litter bin"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6ae.png"
  },
  {
    emoji: "\u{1F6B0}",
    name: "potable_water",
    shortcodes: ["potable_water"],
    tags: ["drinking", "potable", "water"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b0.png"
  },
  {
    emoji: "\u267F",
    name: "wheelchair",
    shortcodes: ["handicapped", "wheelchair"],
    tags: ["access"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/267f.png"
  },
  {
    emoji: "\u{1F6B9}",
    name: "mens",
    shortcodes: ["mens"],
    tags: ["bathroom", "lavatory", "man", "restroom", "toilet", "wc"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b9.png"
  },
  {
    emoji: "\u{1F6BA}",
    name: "womens",
    shortcodes: ["womens"],
    tags: ["bathroom", "lavatory", "restroom", "toilet", "wc", "woman"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6ba.png"
  },
  {
    emoji: "\u{1F6BB}",
    name: "restroom",
    shortcodes: ["bathroom", "restroom"],
    tags: ["bathroom", "lavatory", "toilet", "wc"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6bb.png"
  },
  {
    emoji: "\u{1F6BC}",
    name: "baby_symbol",
    shortcodes: ["baby_symbol"],
    tags: ["baby", "changing"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6bc.png"
  },
  {
    emoji: "\u{1F6BE}",
    name: "wc",
    shortcodes: ["water_closet", "wc"],
    tags: ["bathroom", "closet", "lavatory", "restroom", "toilet", "water", "wc"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6be.png"
  },
  {
    emoji: "\u{1F6C2}",
    name: "passport_control",
    shortcodes: ["passport_control"],
    tags: ["control", "passport"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6c2.png"
  },
  {
    emoji: "\u{1F6C3}",
    name: "customs",
    shortcodes: ["customs"],
    tags: ["customs"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6c3.png"
  },
  {
    emoji: "\u{1F6C4}",
    name: "baggage_claim",
    shortcodes: ["baggage_claim"],
    tags: ["baggage", "claim"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6c4.png"
  },
  {
    emoji: "\u{1F6C5}",
    name: "left_luggage",
    shortcodes: ["left_luggage"],
    tags: ["baggage", "locker", "luggage"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6c5.png"
  },
  {
    emoji: "\u26A0",
    name: "warning",
    shortcodes: ["warning"],
    tags: ["warning"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26a0-fe0f.png"
  },
  {
    emoji: "\u{1F6B8}",
    name: "children_crossing",
    shortcodes: ["children_crossing"],
    tags: ["child", "crossing", "pedestrian", "traffic"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b8.png"
  },
  {
    emoji: "\u26D4",
    name: "no_entry",
    shortcodes: ["no_entry"],
    tags: ["entry", "forbidden", "no", "not", "prohibited", "traffic"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26d4.png"
  },
  {
    emoji: "\u{1F6AB}",
    name: "no_entry_sign",
    shortcodes: ["no_entry_sign"],
    tags: ["entry", "forbidden", "no", "not"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6ab.png"
  },
  {
    emoji: "\u{1F6B3}",
    name: "no_bicycles",
    shortcodes: ["no_bicycles"],
    tags: ["bicycle", "bike", "forbidden", "no", "prohibited"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b3.png"
  },
  {
    emoji: "\u{1F6AD}",
    name: "no_smoking",
    shortcodes: ["no_smoking"],
    tags: ["forbidden", "no", "not", "prohibited", "smoking"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6ad.png"
  },
  {
    emoji: "\u{1F6AF}",
    name: "do_not_litter",
    shortcodes: ["do_not_litter", "no_littering"],
    tags: ["forbidden", "litter", "no", "not", "prohibited"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6af.png"
  },
  {
    emoji: "\u{1F6B1}",
    name: "non-potable_water",
    shortcodes: ["non-potable_water"],
    tags: ["non-drinking", "non-potable", "water"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b1.png"
  },
  {
    emoji: "\u{1F6B7}",
    name: "no_pedestrians",
    shortcodes: ["no_pedestrians"],
    tags: ["forbidden", "no", "not", "pedestrian", "prohibited"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6b7.png"
  },
  {
    emoji: "\u{1F4F5}",
    name: "no_mobile_phones",
    shortcodes: ["no_mobile_phones"],
    tags: ["cell", "forbidden", "mobile", "no", "phone"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f5.png"
  },
  {
    emoji: "\u{1F51E}",
    name: "underage",
    shortcodes: ["no_one_under_18", "underage"],
    tags: ["18", "age restriction", "eighteen", "prohibited", "underage"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f51e.png"
  },
  {
    emoji: "\u2622",
    name: "radioactive",
    shortcodes: ["radioactive"],
    tags: ["sign"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2622-fe0f.png"
  },
  {
    emoji: "\u2623",
    name: "biohazard",
    shortcodes: ["biohazard"],
    tags: ["sign"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2623-fe0f.png"
  },
  {
    emoji: "\u2B06",
    name: "arrow_up",
    shortcodes: ["arrow_up"],
    tags: ["arrow", "cardinal", "direction", "north"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2b06-fe0f.png"
  },
  {
    emoji: "\u2197",
    name: "arrow_upper_right",
    shortcodes: ["arrow_upper_right"],
    tags: ["arrow", "direction", "intercardinal", "northeast"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2197-fe0f.png"
  },
  {
    emoji: "\u27A1",
    name: "arrow_right",
    shortcodes: ["arrow_right"],
    tags: ["arrow", "cardinal", "direction", "east"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/27a1-fe0f.png"
  },
  {
    emoji: "\u2198",
    name: "arrow_lower_right",
    shortcodes: ["arrow_lower_right"],
    tags: ["arrow", "direction", "intercardinal", "southeast"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2198-fe0f.png"
  },
  {
    emoji: "\u2B07",
    name: "arrow_down",
    shortcodes: ["arrow_down"],
    tags: ["arrow", "cardinal", "direction", "down", "south"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2b07-fe0f.png"
  },
  {
    emoji: "\u2199",
    name: "arrow_lower_left",
    shortcodes: ["arrow_lower_left"],
    tags: ["arrow", "direction", "intercardinal", "southwest"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2199-fe0f.png"
  },
  {
    emoji: "\u2B05",
    name: "arrow_left",
    shortcodes: ["arrow_left"],
    tags: ["arrow", "cardinal", "direction", "west"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2b05-fe0f.png"
  },
  {
    emoji: "\u2196",
    name: "arrow_upper_left",
    shortcodes: ["arrow_upper_left"],
    tags: ["arrow", "direction", "intercardinal", "northwest"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2196-fe0f.png"
  },
  {
    emoji: "\u2195",
    name: "arrow_up_down",
    shortcodes: ["arrow_up_down"],
    tags: ["arrow"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2195-fe0f.png"
  },
  {
    emoji: "\u2194",
    name: "left_right_arrow",
    shortcodes: ["left_right_arrow"],
    tags: ["arrow"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2194-fe0f.png"
  },
  {
    emoji: "\u21A9",
    name: "leftwards_arrow_with_hook",
    shortcodes: ["arrow_left_hook", "leftwards_arrow_with_hook"],
    tags: ["arrow"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/21a9-fe0f.png"
  },
  {
    emoji: "\u21AA",
    name: "arrow_right_hook",
    shortcodes: ["arrow_right_hook", "rightwards_arrow_with_hook"],
    tags: ["arrow"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/21aa-fe0f.png"
  },
  {
    emoji: "\u2934",
    name: "arrow_heading_up",
    shortcodes: ["arrow_heading_up"],
    tags: ["arrow"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2934-fe0f.png"
  },
  {
    emoji: "\u2935",
    name: "arrow_heading_down",
    shortcodes: ["arrow_heading_down"],
    tags: ["arrow", "down"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2935-fe0f.png"
  },
  {
    emoji: "\u{1F503}",
    name: "arrows_clockwise",
    shortcodes: ["arrows_clockwise", "clockwise"],
    tags: ["arrow", "clockwise", "reload"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f503.png"
  },
  {
    emoji: "\u{1F504}",
    name: "arrows_counterclockwise",
    shortcodes: ["arrows_counterclockwise", "counterclockwise"],
    tags: ["anticlockwise", "arrow", "counterclockwise", "withershins"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f504.png"
  },
  {
    emoji: "\u{1F519}",
    name: "back",
    shortcodes: ["back"],
    tags: ["arrow", "back"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f519.png"
  },
  {
    emoji: "\u{1F51A}",
    name: "end",
    shortcodes: ["end"],
    tags: ["arrow", "end"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f51a.png"
  },
  {
    emoji: "\u{1F51B}",
    name: "on",
    shortcodes: ["on"],
    tags: ["arrow", "mark", "on", "on!"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f51b.png"
  },
  {
    emoji: "\u{1F51C}",
    name: "soon",
    shortcodes: ["soon"],
    tags: ["arrow", "soon"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f51c.png"
  },
  {
    emoji: "\u{1F51D}",
    name: "top",
    shortcodes: ["top"],
    tags: ["arrow", "top", "up"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f51d.png"
  },
  {
    emoji: "\u{1F6D0}",
    name: "place_of_worship",
    shortcodes: ["place_of_worship"],
    tags: ["religion", "worship"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6d0.png"
  },
  {
    emoji: "\u269B",
    name: "atom_symbol",
    shortcodes: ["atom", "atom_symbol"],
    tags: ["atheist", "atom"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/269b-fe0f.png"
  },
  {
    emoji: "\u{1F549}",
    name: "om",
    shortcodes: ["om"],
    tags: ["hindu", "religion"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f549-fe0f.png"
  },
  {
    emoji: "\u2721",
    name: "star_of_david",
    shortcodes: ["star_of_david"],
    tags: ["david", "jew", "jewish", "religion", "star", "star of david"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2721-fe0f.png"
  },
  {
    emoji: "\u2638",
    name: "wheel_of_dharma",
    shortcodes: ["wheel_of_dharma"],
    tags: ["buddhist", "dharma", "religion", "wheel"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2638-fe0f.png"
  },
  {
    emoji: "\u262F",
    name: "yin_yang",
    shortcodes: ["yin_yang"],
    tags: ["religion", "tao", "taoist", "yang", "yin"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/262f-fe0f.png"
  },
  {
    emoji: "\u271D",
    name: "latin_cross",
    shortcodes: ["latin_cross"],
    tags: ["christian", "cross", "religion"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/271d-fe0f.png"
  },
  {
    emoji: "\u2626",
    name: "orthodox_cross",
    shortcodes: ["orthodox_cross"],
    tags: ["christian", "cross", "religion"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2626-fe0f.png"
  },
  {
    emoji: "\u262A",
    name: "star_and_crescent",
    shortcodes: ["star_and_crescent"],
    tags: ["islam", "muslim", "religion"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/262a-fe0f.png"
  },
  {
    emoji: "\u262E",
    name: "peace_symbol",
    shortcodes: ["peace", "peace_symbol"],
    tags: ["peace"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/262e-fe0f.png"
  },
  {
    emoji: "\u{1F54E}",
    name: "menorah",
    shortcodes: ["menorah"],
    tags: ["candelabrum", "candlestick", "religion"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f54e.png"
  },
  {
    emoji: "\u{1F52F}",
    name: "six_pointed_star",
    shortcodes: ["six_pointed_star"],
    tags: ["fortune", "star"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f52f.png"
  },
  {
    emoji: "\u{1FAAF}",
    name: "khanda",
    shortcodes: ["khanda"],
    tags: ["religion", "sikh"],
    group: "symbols",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u2648",
    name: "aries",
    shortcodes: ["aries"],
    tags: ["aries", "ram", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2648.png"
  },
  {
    emoji: "\u2649",
    name: "taurus",
    shortcodes: ["taurus"],
    tags: ["bull", "ox", "taurus", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2649.png"
  },
  {
    emoji: "\u264A",
    name: "gemini",
    shortcodes: ["gemini"],
    tags: ["gemini", "twins", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/264a.png"
  },
  {
    emoji: "\u264B",
    name: "cancer",
    shortcodes: ["cancer"],
    tags: ["cancer", "crab", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/264b.png"
  },
  {
    emoji: "\u264C",
    name: "leo",
    shortcodes: ["leo"],
    tags: ["leo", "lion", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/264c.png"
  },
  {
    emoji: "\u264D",
    name: "virgo",
    shortcodes: ["virgo"],
    tags: ["virgo", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/264d.png"
  },
  {
    emoji: "\u264E",
    name: "libra",
    shortcodes: ["libra"],
    tags: ["balance", "justice", "libra", "scales", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/264e.png"
  },
  {
    emoji: "\u264F",
    name: "scorpius",
    shortcodes: ["scorpius"],
    tags: ["scorpio", "scorpion", "scorpius", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/264f.png"
  },
  {
    emoji: "\u2650",
    name: "sagittarius",
    shortcodes: ["sagittarius"],
    tags: ["archer", "sagittarius", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2650.png"
  },
  {
    emoji: "\u2651",
    name: "capricorn",
    shortcodes: ["capricorn"],
    tags: ["capricorn", "goat", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2651.png"
  },
  {
    emoji: "\u2652",
    name: "aquarius",
    shortcodes: ["aquarius"],
    tags: ["aquarius", "bearer", "water", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2652.png"
  },
  {
    emoji: "\u2653",
    name: "pisces",
    shortcodes: ["pisces"],
    tags: ["fish", "pisces", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2653.png"
  },
  {
    emoji: "\u26CE",
    name: "ophiuchus",
    shortcodes: ["ophiuchus"],
    tags: ["bearer", "ophiuchus", "serpent", "snake", "zodiac"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26ce.png"
  },
  {
    emoji: "\u{1F500}",
    name: "twisted_rightwards_arrows",
    shortcodes: ["shuffle", "twisted_rightwards_arrows"],
    tags: ["arrow", "crossed"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f500.png"
  },
  {
    emoji: "\u{1F501}",
    name: "repeat",
    shortcodes: ["repeat"],
    tags: ["arrow", "clockwise", "repeat"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f501.png"
  },
  {
    emoji: "\u{1F502}",
    name: "repeat_one",
    shortcodes: ["repeat_one"],
    tags: ["arrow", "clockwise", "once"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f502.png"
  },
  {
    emoji: "\u25B6",
    name: "arrow_forward",
    shortcodes: ["arrow_forward", "play"],
    tags: ["arrow", "play", "right", "triangle"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25b6-fe0f.png"
  },
  {
    emoji: "\u23E9",
    name: "fast_forward",
    shortcodes: ["fast_forward"],
    tags: ["arrow", "double", "fast", "forward"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23e9.png"
  },
  {
    emoji: "\u23ED",
    name: "next_track_button",
    shortcodes: ["next_track"],
    tags: ["arrow", "next scene", "next track", "triangle"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23ed-fe0f.png"
  },
  {
    emoji: "\u23EF",
    name: "play_or_pause_button",
    shortcodes: ["play_pause"],
    tags: ["arrow", "pause", "play", "right", "triangle"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23ef-fe0f.png"
  },
  {
    emoji: "\u25C0",
    name: "arrow_backward",
    shortcodes: ["arrow_backward", "reverse"],
    tags: ["arrow", "left", "reverse", "triangle"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25c0-fe0f.png"
  },
  {
    emoji: "\u23EA",
    name: "rewind",
    shortcodes: ["fast_reverse", "rewind"],
    tags: ["arrow", "double", "rewind"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23ea.png"
  },
  {
    emoji: "\u23EE",
    name: "previous_track_button",
    shortcodes: ["previous_track"],
    tags: ["arrow", "previous scene", "previous track", "triangle"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23ee-fe0f.png"
  },
  {
    emoji: "\u{1F53C}",
    name: "arrow_up_small",
    shortcodes: ["arrow_up_small", "up"],
    tags: ["arrow", "button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f53c.png"
  },
  {
    emoji: "\u23EB",
    name: "arrow_double_up",
    shortcodes: ["arrow_double_up", "fast_up"],
    tags: ["arrow", "double"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23eb.png"
  },
  {
    emoji: "\u{1F53D}",
    name: "arrow_down_small",
    shortcodes: ["arrow_down_small", "down"],
    tags: ["arrow", "button", "down"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f53d.png"
  },
  {
    emoji: "\u23EC",
    name: "arrow_double_down",
    shortcodes: ["arrow_double_down", "fast_down"],
    tags: ["arrow", "double", "down"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23ec.png"
  },
  {
    emoji: "\u23F8",
    name: "pause_button",
    shortcodes: ["pause"],
    tags: ["bar", "double", "pause", "vertical"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23f8-fe0f.png"
  },
  {
    emoji: "\u23F9",
    name: "stop_button",
    shortcodes: ["stop"],
    tags: ["square", "stop"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23f9-fe0f.png"
  },
  {
    emoji: "\u23FA",
    name: "record_button",
    shortcodes: ["record"],
    tags: ["circle", "record"],
    group: "symbols",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23fa-fe0f.png"
  },
  {
    emoji: "\u23CF",
    name: "eject_button",
    shortcodes: ["eject"],
    tags: ["eject"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/23cf-fe0f.png"
  },
  {
    emoji: "\u{1F3A6}",
    name: "cinema",
    shortcodes: ["cinema"],
    tags: ["camera", "film", "movie"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3a6.png"
  },
  {
    emoji: "\u{1F505}",
    name: "low_brightness",
    shortcodes: ["dim_button", "low_brightness"],
    tags: ["brightness", "dim", "low"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f505.png"
  },
  {
    emoji: "\u{1F506}",
    name: "high_brightness",
    shortcodes: ["bright_button", "high_brightness"],
    tags: ["bright", "brightness"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f506.png"
  },
  {
    emoji: "\u{1F4F6}",
    name: "signal_strength",
    shortcodes: ["antenna_bars", "signal_strength"],
    tags: ["antenna", "bar", "cell", "mobile", "phone"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f6.png"
  },
  {
    emoji: "\u{1F6DC}",
    name: "wireless",
    shortcodes: ["wireless"],
    tags: ["computer", "internet", "network", "wi-fi", "wifi"],
    group: "symbols",
    emoticons: [],
    version: 15
  },
  {
    emoji: "\u{1F4F3}",
    name: "vibration_mode",
    shortcodes: ["vibration_mode"],
    tags: ["cell", "mobile", "mode", "phone", "telephone", "vibration"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f3.png"
  },
  {
    emoji: "\u{1F4F4}",
    name: "mobile_phone_off",
    shortcodes: ["mobile_phone_off"],
    tags: ["cell", "mobile", "off", "phone", "telephone"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4f4.png"
  },
  {
    emoji: "\u2640",
    name: "female_sign",
    shortcodes: ["female", "female_sign"],
    tags: ["woman"],
    group: "symbols",
    emoticons: [],
    version: 4
  },
  {
    emoji: "\u2642",
    name: "male_sign",
    shortcodes: ["male", "male_sign"],
    tags: ["man"],
    group: "symbols",
    emoticons: [],
    version: 4
  },
  {
    emoji: "\u26A7",
    name: "transgender_symbol",
    shortcodes: ["transgender_symbol"],
    tags: ["transgender"],
    group: "symbols",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26a7-fe0f.png"
  },
  {
    emoji: "\u2716",
    name: "heavy_multiplication_x",
    shortcodes: ["multiplication", "multiply"],
    tags: ["cancel", "multiplication", "sign", "x", "\xD7"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2716-fe0f.png"
  },
  {
    emoji: "\u2795",
    name: "heavy_plus_sign",
    shortcodes: ["plus"],
    tags: ["+", "math", "sign"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2795.png"
  },
  {
    emoji: "\u2796",
    name: "heavy_minus_sign",
    shortcodes: ["minus"],
    tags: ["-", "math", "sign", "\u2212"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2796.png"
  },
  {
    emoji: "\u2797",
    name: "heavy_division_sign",
    shortcodes: ["divide", "division"],
    tags: ["division", "math", "sign", "\xF7"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2797.png"
  },
  {
    emoji: "\u{1F7F0}",
    name: "heavy_equals_sign",
    shortcodes: ["heavy_equals_sign"],
    tags: ["equality", "math"],
    group: "symbols",
    emoticons: [],
    version: 14
  },
  {
    emoji: "\u267E",
    name: "infinity",
    shortcodes: ["infinity"],
    tags: ["forever", "unbounded", "universal"],
    group: "symbols",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/267e-fe0f.png"
  },
  {
    emoji: "\u203C",
    name: "bangbang",
    shortcodes: ["bangbang", "double_exclamation"],
    tags: ["!", "!!", "bangbang", "exclamation", "mark"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/203c-fe0f.png"
  },
  {
    emoji: "\u2049",
    name: "interrobang",
    shortcodes: ["exclamation_question", "interrobang"],
    tags: ["!", "!?", "?", "exclamation", "interrobang", "mark", "punctuation", "question"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2049-fe0f.png"
  },
  {
    emoji: "\u2753",
    name: "question",
    shortcodes: ["question"],
    tags: ["?", "mark", "punctuation", "question"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2753.png"
  },
  {
    emoji: "\u2754",
    name: "grey_question",
    shortcodes: ["white_question"],
    tags: ["?", "mark", "outlined", "punctuation", "question"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2754.png"
  },
  {
    emoji: "\u2755",
    name: "grey_exclamation",
    shortcodes: ["white_exclamation"],
    tags: ["!", "exclamation", "mark", "outlined", "punctuation"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2755.png"
  },
  {
    emoji: "\u2757",
    name: "exclamation",
    shortcodes: ["exclamation"],
    tags: ["!", "exclamation", "mark", "punctuation"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2757.png"
  },
  {
    emoji: "\u3030",
    name: "wavy_dash",
    shortcodes: ["wavy_dash"],
    tags: ["dash", "punctuation", "wavy"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/3030-fe0f.png"
  },
  {
    emoji: "\u{1F4B1}",
    name: "currency_exchange",
    shortcodes: ["currency_exchange"],
    tags: ["bank", "currency", "exchange", "money"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b1.png"
  },
  {
    emoji: "\u{1F4B2}",
    name: "heavy_dollar_sign",
    shortcodes: ["heavy_dollar_sign"],
    tags: ["currency", "dollar", "money"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4b2.png"
  },
  {
    emoji: "\u2695",
    name: "medical_symbol",
    shortcodes: ["medical", "medical_symbol"],
    tags: ["aesculapius", "medicine", "staff"],
    group: "symbols",
    emoticons: [],
    version: 4
  },
  {
    emoji: "\u267B",
    name: "recycle",
    shortcodes: ["recycle", "recycling_symbol"],
    tags: ["recycle"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/267b-fe0f.png"
  },
  {
    emoji: "\u269C",
    name: "fleur_de_lis",
    shortcodes: ["fleur-de-lis"],
    tags: ["fleur-de-lis"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/269c-fe0f.png"
  },
  {
    emoji: "\u{1F531}",
    name: "trident",
    shortcodes: ["trident"],
    tags: ["anchor", "emblem", "ship", "tool", "trident"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f531.png"
  },
  {
    emoji: "\u{1F4DB}",
    name: "name_badge",
    shortcodes: ["name_badge"],
    tags: ["badge", "name"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4db.png"
  },
  {
    emoji: "\u{1F530}",
    name: "beginner",
    shortcodes: ["beginner"],
    tags: ["beginner", "chevron", "japanese", "japanese symbol for beginner", "leaf"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f530.png"
  },
  {
    emoji: "\u2B55",
    name: "o",
    shortcodes: ["hollow_red_circle", "red_o"],
    tags: ["circle", "large", "o", "red"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2b55.png"
  },
  {
    emoji: "\u2705",
    name: "white_check_mark",
    shortcodes: ["check_mark_button", "white_check_mark"],
    tags: ["button", "check", "mark", "\u2713"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2705.png"
  },
  {
    emoji: "\u2611",
    name: "ballot_box_with_check",
    shortcodes: ["ballot_box_with_check"],
    tags: ["box", "check", "\u2713"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2611-fe0f.png"
  },
  {
    emoji: "\u2714",
    name: "heavy_check_mark",
    shortcodes: ["check_mark", "heavy_check_mark"],
    tags: ["check", "mark", "\u2713"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2714-fe0f.png"
  },
  {
    emoji: "\u274C",
    name: "x",
    shortcodes: ["cross_mark", "x"],
    tags: ["cancel", "cross", "mark", "multiplication", "multiply", "x", "\xD7"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/274c.png"
  },
  {
    emoji: "\u274E",
    name: "negative_squared_cross_mark",
    shortcodes: ["cross_mark_button", "negative_squared_cross_mark"],
    tags: ["mark", "square", "x", "\xD7"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/274e.png"
  },
  {
    emoji: "\u27B0",
    name: "curly_loop",
    shortcodes: ["curly_loop"],
    tags: ["curl", "loop"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/27b0.png"
  },
  {
    emoji: "\u27BF",
    name: "loop",
    shortcodes: ["double_curly_loop", "loop"],
    tags: ["curl", "double", "loop"],
    group: "symbols",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/27bf.png"
  },
  {
    emoji: "\u303D",
    name: "part_alternation_mark",
    shortcodes: ["part_alternation_mark"],
    tags: ["mark", "part"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/303d-fe0f.png"
  },
  {
    emoji: "\u2733",
    name: "eight_spoked_asterisk",
    shortcodes: ["eight_spoked_asterisk"],
    tags: ["*", "asterisk"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2733-fe0f.png"
  },
  {
    emoji: "\u2734",
    name: "eight_pointed_black_star",
    shortcodes: ["eight_pointed_black_star"],
    tags: ["*", "star"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2734-fe0f.png"
  },
  {
    emoji: "\u2747",
    name: "sparkle",
    shortcodes: ["sparkle"],
    tags: ["*"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2747-fe0f.png"
  },
  {
    emoji: "\xA9",
    name: "copyright",
    shortcodes: ["copyright"],
    tags: ["c"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/00a9-fe0f.png"
  },
  {
    emoji: "\xAE",
    name: "registered",
    shortcodes: ["registered"],
    tags: ["r"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/00ae-fe0f.png"
  },
  {
    emoji: "\u2122",
    name: "tm",
    shortcodes: ["tm", "trade_mark"],
    tags: ["mark", "tm", "trademark"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2122-fe0f.png"
  },
  {
    emoji: "#\u20E3",
    name: "hash",
    shortcodes: ["hash", "number_sign"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0023-fe0f-20e3.png"
  },
  {
    emoji: "*\u20E3",
    name: "asterisk",
    shortcodes: ["asterisk"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/002a-fe0f-20e3.png"
  },
  {
    emoji: "0\u20E3",
    name: "zero",
    shortcodes: ["zero"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0030-fe0f-20e3.png"
  },
  {
    emoji: "1\u20E3",
    name: "one",
    shortcodes: ["one"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0031-fe0f-20e3.png"
  },
  {
    emoji: "2\u20E3",
    name: "two",
    shortcodes: ["two"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0032-fe0f-20e3.png"
  },
  {
    emoji: "3\u20E3",
    name: "three",
    shortcodes: ["three"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0033-fe0f-20e3.png"
  },
  {
    emoji: "4\u20E3",
    name: "four",
    shortcodes: ["four"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0034-fe0f-20e3.png"
  },
  {
    emoji: "5\u20E3",
    name: "five",
    shortcodes: ["five"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0035-fe0f-20e3.png"
  },
  {
    emoji: "6\u20E3",
    name: "six",
    shortcodes: ["six"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0036-fe0f-20e3.png"
  },
  {
    emoji: "7\u20E3",
    name: "seven",
    shortcodes: ["seven"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0037-fe0f-20e3.png"
  },
  {
    emoji: "8\u20E3",
    name: "eight",
    shortcodes: ["eight"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0038-fe0f-20e3.png"
  },
  {
    emoji: "9\u20E3",
    name: "nine",
    shortcodes: ["nine"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/0039-fe0f-20e3.png"
  },
  {
    emoji: "\u{1F51F}",
    name: "keycap_ten",
    shortcodes: ["ten"],
    tags: ["keycap"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f51f.png"
  },
  {
    emoji: "\u{1F520}",
    name: "capital_abcd",
    shortcodes: ["capital_abcd"],
    tags: ["abcd", "input", "latin", "letters", "uppercase"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f520.png"
  },
  {
    emoji: "\u{1F521}",
    name: "abcd",
    shortcodes: ["abcd"],
    tags: ["abcd", "input", "latin", "letters", "lowercase"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f521.png"
  },
  {
    emoji: "\u{1F522}",
    name: "1234",
    shortcodes: ["1234"],
    tags: ["1234", "input", "numbers"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f522.png"
  },
  {
    emoji: "\u{1F523}",
    name: "symbols",
    shortcodes: ["symbols"],
    tags: ["input", "\u3012\u266A&%"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f523.png"
  },
  {
    emoji: "\u{1F524}",
    name: "abc",
    shortcodes: ["abc"],
    tags: ["abc", "alphabet", "input", "latin", "letters"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f524.png"
  },
  {
    emoji: "\u{1F170}",
    name: "a",
    shortcodes: ["a", "a_blood"],
    tags: ["a", "a button (blood type)", "blood type"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f170-fe0f.png"
  },
  {
    emoji: "\u{1F18E}",
    name: "ab",
    shortcodes: ["ab", "ab_blood"],
    tags: ["ab", "ab button (blood type)", "blood type"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f18e.png"
  },
  {
    emoji: "\u{1F171}",
    name: "b",
    shortcodes: ["b", "b_blood"],
    tags: ["b", "b button (blood type)", "blood type"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f171-fe0f.png"
  },
  {
    emoji: "\u{1F191}",
    name: "cl",
    shortcodes: ["cl"],
    tags: ["cl", "cl button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f191.png"
  },
  {
    emoji: "\u{1F192}",
    name: "cool",
    shortcodes: ["cool"],
    tags: ["cool", "cool button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f192.png"
  },
  {
    emoji: "\u{1F193}",
    name: "free",
    shortcodes: ["free"],
    tags: ["free", "free button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f193.png"
  },
  {
    emoji: "\u2139",
    name: "information_source",
    shortcodes: ["info", "information_source"],
    tags: ["i"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2139-fe0f.png"
  },
  {
    emoji: "\u{1F194}",
    name: "id",
    shortcodes: ["id"],
    tags: ["id", "id button", "identity"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f194.png"
  },
  {
    emoji: "\u24C2",
    name: "m",
    shortcodes: ["m"],
    tags: ["circle", "circled m", "m"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/24c2-fe0f.png"
  },
  {
    emoji: "\u{1F195}",
    name: "new",
    shortcodes: ["new"],
    tags: ["new", "new button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f195.png"
  },
  {
    emoji: "\u{1F196}",
    name: "ng",
    shortcodes: ["ng"],
    tags: ["ng", "ng button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f196.png"
  },
  {
    emoji: "\u{1F17E}",
    name: "o2",
    shortcodes: ["o", "o_blood"],
    tags: ["blood type", "o", "o button (blood type)"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f17e-fe0f.png"
  },
  {
    emoji: "\u{1F197}",
    name: "ok",
    shortcodes: ["ok"],
    tags: ["ok", "ok button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f197.png"
  },
  {
    emoji: "\u{1F17F}",
    name: "parking",
    shortcodes: ["parking"],
    tags: ["p", "p button", "parking"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f17f-fe0f.png"
  },
  {
    emoji: "\u{1F198}",
    name: "sos",
    shortcodes: ["sos"],
    tags: ["help", "sos", "sos button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f198.png"
  },
  {
    emoji: "\u{1F199}",
    name: "up",
    shortcodes: ["up2"],
    tags: ["mark", "up", "up!", "up! button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f199.png"
  },
  {
    emoji: "\u{1F19A}",
    name: "vs",
    shortcodes: ["vs"],
    tags: ["versus", "vs", "vs button"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f19a.png"
  },
  {
    emoji: "\u{1F201}",
    name: "koko",
    shortcodes: ["ja_here", "koko"],
    tags: ["japanese", "japanese \u201Chere\u201D button", "katakana", "\u201Chere\u201D", "\u30B3\u30B3"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f201.png"
  },
  {
    emoji: "\u{1F202}",
    name: "sa",
    shortcodes: ["ja_service_charge"],
    tags: ["japanese", "japanese \u201Cservice charge\u201D button", "katakana", "\u201Cservice charge\u201D", "\u30B5"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f202-fe0f.png"
  },
  {
    emoji: "\u{1F237}",
    name: "u6708",
    shortcodes: ["ja_monthly_amount"],
    tags: ["ideograph", "japanese", "japanese \u201Cmonthly amount\u201D button", "\u201Cmonthly amount\u201D", "\u6708"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f237-fe0f.png"
  },
  {
    emoji: "\u{1F236}",
    name: "u6709",
    shortcodes: ["ja_not_free_of_carge"],
    tags: ["ideograph", "japanese", "japanese \u201Cnot free of charge\u201D button", "\u201Cnot free of charge\u201D", "\u6709"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f236.png"
  },
  {
    emoji: "\u{1F22F}",
    name: "u6307",
    shortcodes: ["ja_reserved"],
    tags: ["ideograph", "japanese", "japanese \u201Creserved\u201D button", "\u201Creserved\u201D", "\u6307"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f22f.png"
  },
  {
    emoji: "\u{1F250}",
    name: "ideograph_advantage",
    shortcodes: ["ideograph_advantage", "ja_bargain"],
    tags: ["ideograph", "japanese", "japanese \u201Cbargain\u201D button", "\u201Cbargain\u201D", "\u5F97"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f250.png"
  },
  {
    emoji: "\u{1F239}",
    name: "u5272",
    shortcodes: ["ja_discount"],
    tags: ["ideograph", "japanese", "japanese \u201Cdiscount\u201D button", "\u201Cdiscount\u201D", "\u5272"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f239.png"
  },
  {
    emoji: "\u{1F21A}",
    name: "u7121",
    shortcodes: ["ja_free_of_charge"],
    tags: ["ideograph", "japanese", "japanese \u201Cfree of charge\u201D button", "\u201Cfree of charge\u201D", "\u7121"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f21a.png"
  },
  {
    emoji: "\u{1F232}",
    name: "u7981",
    shortcodes: ["ja_prohibited"],
    tags: ["ideograph", "japanese", "japanese \u201Cprohibited\u201D button", "\u201Cprohibited\u201D", "\u7981"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f232.png"
  },
  {
    emoji: "\u{1F251}",
    name: "accept",
    shortcodes: ["accept", "ja_acceptable"],
    tags: ["ideograph", "japanese", "japanese \u201Cacceptable\u201D button", "\u201Cacceptable\u201D", "\u53EF"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f251.png"
  },
  {
    emoji: "\u{1F238}",
    name: "u7533",
    shortcodes: ["ja_application"],
    tags: ["ideograph", "japanese", "japanese \u201Capplication\u201D button", "\u201Capplication\u201D", "\u7533"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f238.png"
  },
  {
    emoji: "\u{1F234}",
    name: "u5408",
    shortcodes: ["ja_passing_grade"],
    tags: ["ideograph", "japanese", "japanese \u201Cpassing grade\u201D button", "\u201Cpassing grade\u201D", "\u5408"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f234.png"
  },
  {
    emoji: "\u{1F233}",
    name: "u7a7a",
    shortcodes: ["ja_vacancy"],
    tags: ["ideograph", "japanese", "japanese \u201Cvacancy\u201D button", "\u201Cvacancy\u201D", "\u7A7A"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f233.png"
  },
  {
    emoji: "\u3297",
    name: "congratulations",
    shortcodes: ["congratulations", "ja_congratulations"],
    tags: ["ideograph", "japanese", "japanese \u201Ccongratulations\u201D button", "\u201Ccongratulations\u201D", "\u795D"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/3297-fe0f.png"
  },
  {
    emoji: "\u3299",
    name: "secret",
    shortcodes: ["ja_secret", "secret"],
    tags: ["ideograph", "japanese", "japanese \u201Csecret\u201D button", "\u201Csecret\u201D", "\u79D8"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/3299-fe0f.png"
  },
  {
    emoji: "\u{1F23A}",
    name: "u55b6",
    shortcodes: ["ja_open_for_business"],
    tags: ["ideograph", "japanese", "japanese \u201Copen for business\u201D button", "\u201Copen for business\u201D", "\u55B6"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f23a.png"
  },
  {
    emoji: "\u{1F235}",
    name: "u6e80",
    shortcodes: ["ja_no_vacancy"],
    tags: ["ideograph", "japanese", "japanese \u201Cno vacancy\u201D button", "\u201Cno vacancy\u201D", "\u6E80"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f235.png"
  },
  {
    emoji: "\u{1F534}",
    name: "red_circle",
    shortcodes: ["red_circle"],
    tags: ["circle", "geometric", "red"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f534.png"
  },
  {
    emoji: "\u{1F7E0}",
    name: "orange_circle",
    shortcodes: ["orange_circle"],
    tags: ["circle", "orange"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e0.png"
  },
  {
    emoji: "\u{1F7E1}",
    name: "yellow_circle",
    shortcodes: ["yellow_circle"],
    tags: ["circle", "yellow"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e1.png"
  },
  {
    emoji: "\u{1F7E2}",
    name: "green_circle",
    shortcodes: ["green_circle"],
    tags: ["circle", "green"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e2.png"
  },
  {
    emoji: "\u{1F535}",
    name: "large_blue_circle",
    shortcodes: ["blue_circle"],
    tags: ["blue", "circle", "geometric"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f535.png"
  },
  {
    emoji: "\u{1F7E3}",
    name: "purple_circle",
    shortcodes: ["purple_circle"],
    tags: ["circle", "purple"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e3.png"
  },
  {
    emoji: "\u{1F7E4}",
    name: "brown_circle",
    shortcodes: ["brown_circle"],
    tags: ["brown", "circle"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e4.png"
  },
  {
    emoji: "\u26AB",
    name: "black_circle",
    shortcodes: ["black_circle"],
    tags: ["circle", "geometric"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26ab.png"
  },
  {
    emoji: "\u26AA",
    name: "white_circle",
    shortcodes: ["white_circle"],
    tags: ["circle", "geometric"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26aa.png"
  },
  {
    emoji: "\u{1F7E5}",
    name: "red_square",
    shortcodes: ["red_square"],
    tags: ["red", "square"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e5.png"
  },
  {
    emoji: "\u{1F7E7}",
    name: "orange_square",
    shortcodes: ["orange_square"],
    tags: ["orange", "square"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e7.png"
  },
  {
    emoji: "\u{1F7E8}",
    name: "yellow_square",
    shortcodes: ["yellow_square"],
    tags: ["square", "yellow"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e8.png"
  },
  {
    emoji: "\u{1F7E9}",
    name: "green_square",
    shortcodes: ["green_square"],
    tags: ["green", "square"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e9.png"
  },
  {
    emoji: "\u{1F7E6}",
    name: "blue_square",
    shortcodes: ["blue_square"],
    tags: ["blue", "square"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7e6.png"
  },
  {
    emoji: "\u{1F7EA}",
    name: "purple_square",
    shortcodes: ["purple_square"],
    tags: ["purple", "square"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7ea.png"
  },
  {
    emoji: "\u{1F7EB}",
    name: "brown_square",
    shortcodes: ["brown_square"],
    tags: ["brown", "square"],
    group: "symbols",
    emoticons: [],
    version: 12,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f7eb.png"
  },
  {
    emoji: "\u2B1B",
    name: "black_large_square",
    shortcodes: ["black_large_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2b1b.png"
  },
  {
    emoji: "\u2B1C",
    name: "white_large_square",
    shortcodes: ["white_large_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2b1c.png"
  },
  {
    emoji: "\u25FC",
    name: "black_medium_square",
    shortcodes: ["black_medium_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25fc-fe0f.png"
  },
  {
    emoji: "\u25FB",
    name: "white_medium_square",
    shortcodes: ["white_medium_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25fb-fe0f.png"
  },
  {
    emoji: "\u25FE",
    name: "black_medium_small_square",
    shortcodes: ["black_medium_small_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25fe.png"
  },
  {
    emoji: "\u25FD",
    name: "white_medium_small_square",
    shortcodes: ["white_medium_small_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25fd.png"
  },
  {
    emoji: "\u25AA",
    name: "black_small_square",
    shortcodes: ["black_small_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25aa-fe0f.png"
  },
  {
    emoji: "\u25AB",
    name: "white_small_square",
    shortcodes: ["white_small_square"],
    tags: ["geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/25ab-fe0f.png"
  },
  {
    emoji: "\u{1F536}",
    name: "large_orange_diamond",
    shortcodes: ["large_orange_diamond"],
    tags: ["diamond", "geometric", "orange"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f536.png"
  },
  {
    emoji: "\u{1F537}",
    name: "large_blue_diamond",
    shortcodes: ["large_blue_diamond"],
    tags: ["blue", "diamond", "geometric"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f537.png"
  },
  {
    emoji: "\u{1F538}",
    name: "small_orange_diamond",
    shortcodes: ["small_orange_diamond"],
    tags: ["diamond", "geometric", "orange"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f538.png"
  },
  {
    emoji: "\u{1F539}",
    name: "small_blue_diamond",
    shortcodes: ["small_blue_diamond"],
    tags: ["blue", "diamond", "geometric"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f539.png"
  },
  {
    emoji: "\u{1F53A}",
    name: "small_red_triangle",
    shortcodes: ["small_red_triangle"],
    tags: ["geometric", "red"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f53a.png"
  },
  {
    emoji: "\u{1F53B}",
    name: "small_red_triangle_down",
    shortcodes: ["small_red_triangle_down"],
    tags: ["down", "geometric", "red"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f53b.png"
  },
  {
    emoji: "\u{1F4A0}",
    name: "diamond_shape_with_a_dot_inside",
    shortcodes: ["diamond_shape_with_a_dot_inside", "diamond_with_a_dot"],
    tags: ["comic", "diamond", "geometric", "inside"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a0.png"
  },
  {
    emoji: "\u{1F518}",
    name: "radio_button",
    shortcodes: ["radio_button"],
    tags: ["button", "geometric", "radio"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f518.png"
  },
  {
    emoji: "\u{1F533}",
    name: "white_square_button",
    shortcodes: ["white_square_button"],
    tags: ["button", "geometric", "outlined", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f533.png"
  },
  {
    emoji: "\u{1F532}",
    name: "black_square_button",
    shortcodes: ["black_square_button"],
    tags: ["button", "geometric", "square"],
    group: "symbols",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f532.png"
  },
  {
    emoji: "\u{1F3C1}",
    name: "checkered_flag",
    shortcodes: ["checkered_flag"],
    tags: ["checkered", "chequered", "racing"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3c1.png"
  },
  {
    emoji: "\u{1F6A9}",
    name: "triangular_flag_on_post",
    shortcodes: ["triangular_flag", "triangular_flag_on_post"],
    tags: ["post"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f6a9.png"
  },
  {
    emoji: "\u{1F38C}",
    name: "crossed_flags",
    shortcodes: ["crossed_flags"],
    tags: ["celebration", "cross", "crossed", "japanese"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f38c.png"
  },
  {
    emoji: "\u{1F3F4}",
    name: "black_flag",
    shortcodes: ["black_flag"],
    tags: ["waving"],
    group: "flags",
    emoticons: [],
    version: 1,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f4.png"
  },
  {
    emoji: "\u{1F3F3}",
    name: "white_flag",
    shortcodes: ["white_flag"],
    tags: ["waving"],
    group: "flags",
    emoticons: [],
    version: 0.7,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f3-fe0f.png"
  },
  {
    emoji: "\u{1F3F3}\u200D\u{1F308}",
    name: "rainbow_flag",
    shortcodes: ["rainbow_flag"],
    tags: ["pride", "rainbow"],
    group: "flags",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f3-fe0f-200d-1f308.png"
  },
  {
    emoji: "\u{1F3F3}\u200D\u26A7\uFE0F",
    name: "transgender_flag",
    shortcodes: ["transgender_flag"],
    tags: ["flag", "light blue", "pink", "transgender", "white"],
    group: "flags",
    emoticons: [],
    version: 13,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f3-fe0f-200d-26a7-fe0f.png"
  },
  {
    emoji: "\u{1F3F4}\u200D\u2620",
    name: "pirate_flag",
    shortcodes: ["jolly_roger", "pirate_flag"],
    tags: ["jolly roger", "pirate", "plunder", "treasure"],
    group: "flags",
    emoticons: [],
    version: 11,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f4-200d-2620-fe0f.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1E8}",
    name: "ascension_island",
    shortcodes: ["ascension_island", "flag_ac"],
    tags: ["AC", "flag", "flag: ascension island"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1e8.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1E9}",
    name: "andorra",
    shortcodes: ["andorra", "flag_ad"],
    tags: ["AD", "flag", "flag: andorra"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1e9.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EA}",
    name: "united_arab_emirates",
    shortcodes: ["flag_ae", "united_arab_emirates"],
    tags: ["AE", "flag", "flag: united arab emirates"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1ea.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EB}",
    name: "afghanistan",
    shortcodes: ["afghanistan", "flag_af"],
    tags: ["AF", "flag", "flag: afghanistan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1eb.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EC}",
    name: "antigua_barbuda",
    shortcodes: ["antigua_barbuda", "flag_ag"],
    tags: ["AG", "flag", "flag: antigua & barbuda"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1ec.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EE}",
    name: "anguilla",
    shortcodes: ["anguilla", "flag_ai"],
    tags: ["AI", "flag", "flag: anguilla"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1ee.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F1}",
    name: "albania",
    shortcodes: ["albania", "flag_al"],
    tags: ["AL", "flag", "flag: albania"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1f1.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F2}",
    name: "armenia",
    shortcodes: ["armenia", "flag_am"],
    tags: ["AM", "flag", "flag: armenia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1f2.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F4}",
    name: "angola",
    shortcodes: ["angola", "flag_ao"],
    tags: ["AO", "flag", "flag: angola"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1f4.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F6}",
    name: "antarctica",
    shortcodes: ["antarctica", "flag_aq"],
    tags: ["AQ", "flag", "flag: antarctica"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1f6.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F7}",
    name: "argentina",
    shortcodes: ["argentina", "flag_ar"],
    tags: ["AR", "flag", "flag: argentina"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1f7.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F8}",
    name: "american_samoa",
    shortcodes: ["american_samoa", "flag_as"],
    tags: ["AS", "flag", "flag: american samoa"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1f8.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F9}",
    name: "austria",
    shortcodes: ["austria", "flag_at"],
    tags: ["AT", "flag", "flag: austria"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1f9.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FA}",
    name: "australia",
    shortcodes: ["australia", "flag_au"],
    tags: ["AU", "flag", "flag: australia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1fa.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FC}",
    name: "aruba",
    shortcodes: ["aruba", "flag_aw"],
    tags: ["AW", "flag", "flag: aruba"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1fc.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FD}",
    name: "aland_islands",
    shortcodes: ["aland_islands", "flag_ax"],
    tags: ["AX", "flag", "flag: \xE5land islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1fd.png"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FF}",
    name: "azerbaijan",
    shortcodes: ["azerbaijan", "flag_az"],
    tags: ["AZ", "flag", "flag: azerbaijan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e6-1f1ff.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1E6}",
    name: "bosnia_herzegovina",
    shortcodes: ["bosnia_herzegovina", "flag_ba"],
    tags: ["BA", "flag", "flag: bosnia & herzegovina"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1e6.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1E7}",
    name: "barbados",
    shortcodes: ["barbados", "flag_bb"],
    tags: ["BB", "flag", "flag: barbados"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1e7.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1E9}",
    name: "bangladesh",
    shortcodes: ["bangladesh", "flag_bd"],
    tags: ["BD", "flag", "flag: bangladesh"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1e9.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EA}",
    name: "belgium",
    shortcodes: ["belgium", "flag_be"],
    tags: ["BE", "flag", "flag: belgium"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1ea.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EB}",
    name: "burkina_faso",
    shortcodes: ["burkina_faso", "flag_bf"],
    tags: ["BF", "flag", "flag: burkina faso"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1eb.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EC}",
    name: "bulgaria",
    shortcodes: ["bulgaria", "flag_bg"],
    tags: ["BG", "flag", "flag: bulgaria"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1ec.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1ED}",
    name: "bahrain",
    shortcodes: ["bahrain", "flag_bh"],
    tags: ["BH", "flag", "flag: bahrain"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1ed.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EE}",
    name: "burundi",
    shortcodes: ["burundi", "flag_bi"],
    tags: ["BI", "flag", "flag: burundi"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1ee.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EF}",
    name: "benin",
    shortcodes: ["benin", "flag_bj"],
    tags: ["BJ", "flag", "flag: benin"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1ef.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F1}",
    name: "st_barthelemy",
    shortcodes: ["flag_bl", "st_barthelemy"],
    tags: ["BL", "flag", "flag: st. barth\xE9lemy"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f1.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F2}",
    name: "bermuda",
    shortcodes: ["bermuda", "flag_bm"],
    tags: ["BM", "flag", "flag: bermuda"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f2.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F3}",
    name: "brunei",
    shortcodes: ["brunei", "flag_bn"],
    tags: ["BN", "flag", "flag: brunei"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f3.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F4}",
    name: "bolivia",
    shortcodes: ["bolivia", "flag_bo"],
    tags: ["BO", "flag", "flag: bolivia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f4.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F6}",
    name: "caribbean_netherlands",
    shortcodes: ["caribbean_netherlands", "flag_bq"],
    tags: ["BQ", "flag", "flag: caribbean netherlands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f6.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F7}",
    name: "brazil",
    shortcodes: ["brazil", "flag_br"],
    tags: ["BR", "flag", "flag: brazil"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f7.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F8}",
    name: "bahamas",
    shortcodes: ["bahamas", "flag_bs"],
    tags: ["BS", "flag", "flag: bahamas"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f8.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F9}",
    name: "bhutan",
    shortcodes: ["bhutan", "flag_bt"],
    tags: ["BT", "flag", "flag: bhutan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1f9.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FB}",
    name: "bouvet_island",
    shortcodes: ["bouvet_island", "flag_bv"],
    tags: ["BV", "flag", "flag: bouvet island"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1fb.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FC}",
    name: "botswana",
    shortcodes: ["botswana", "flag_bw"],
    tags: ["BW", "flag", "flag: botswana"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1fc.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FE}",
    name: "belarus",
    shortcodes: ["belarus", "flag_by"],
    tags: ["BY", "flag", "flag: belarus"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1fe.png"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FF}",
    name: "belize",
    shortcodes: ["belize", "flag_bz"],
    tags: ["BZ", "flag", "flag: belize"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e7-1f1ff.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1E6}",
    name: "canada",
    shortcodes: ["canada", "flag_ca"],
    tags: ["CA", "flag", "flag: canada"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1e6.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1E8}",
    name: "cocos_islands",
    shortcodes: ["cocos_islands", "flag_cc"],
    tags: ["CC", "flag", "flag: cocos (keeling) islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1e8.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1E9}",
    name: "congo_kinshasa",
    shortcodes: ["congo_kinshasa", "flag_cd"],
    tags: ["CD", "flag", "flag: congo - kinshasa"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1e9.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1EB}",
    name: "central_african_republic",
    shortcodes: ["central_african_republic", "flag_cf"],
    tags: ["CF", "flag", "flag: central african republic"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1eb.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1EC}",
    name: "congo_brazzaville",
    shortcodes: ["congo_brazzaville", "flag_cg"],
    tags: ["CG", "flag", "flag: congo - brazzaville"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1ec.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1ED}",
    name: "switzerland",
    shortcodes: ["flag_ch", "switzerland"],
    tags: ["CH", "flag", "flag: switzerland"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1ed.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1EE}",
    name: "cote_divoire",
    shortcodes: ["cote_divoire", "flag_ci"],
    tags: ["CI", "flag", "flag: c\xF4te d\u2019ivoire"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1ee.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F0}",
    name: "cook_islands",
    shortcodes: ["cook_islands", "flag_ck"],
    tags: ["CK", "flag", "flag: cook islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1f0.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F1}",
    name: "chile",
    shortcodes: ["chile", "flag_cl"],
    tags: ["CL", "flag", "flag: chile"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1f1.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F2}",
    name: "cameroon",
    shortcodes: ["cameroon", "flag_cm"],
    tags: ["CM", "flag", "flag: cameroon"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1f2.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F3}",
    name: "cn",
    shortcodes: ["china", "flag_cn"],
    tags: ["CN", "flag", "flag: china"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1f3.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F4}",
    name: "colombia",
    shortcodes: ["colombia", "flag_co"],
    tags: ["CO", "flag", "flag: colombia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1f4.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F5}",
    name: "clipperton_island",
    shortcodes: ["clipperton_island", "flag_cp"],
    tags: ["CP", "flag", "flag: clipperton island"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1f5.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F7}",
    name: "costa_rica",
    shortcodes: ["costa_rica", "flag_cr"],
    tags: ["CR", "flag", "flag: costa rica"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1f7.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FA}",
    name: "cuba",
    shortcodes: ["cuba", "flag_cu"],
    tags: ["CU", "flag", "flag: cuba"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1fa.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FB}",
    name: "cape_verde",
    shortcodes: ["cape_verde", "flag_cv"],
    tags: ["CV", "flag", "flag: cape verde"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1fb.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FC}",
    name: "curacao",
    shortcodes: ["curacao", "flag_cw"],
    tags: ["CW", "flag", "flag: cura\xE7ao"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1fc.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FD}",
    name: "christmas_island",
    shortcodes: ["christmas_island", "flag_cx"],
    tags: ["CX", "flag", "flag: christmas island"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1fd.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FE}",
    name: "cyprus",
    shortcodes: ["cyprus", "flag_cy"],
    tags: ["CY", "flag", "flag: cyprus"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1fe.png"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FF}",
    name: "czech_republic",
    shortcodes: ["czech_republic", "czechia", "flag_cz"],
    tags: ["CZ", "flag", "flag: czechia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e8-1f1ff.png"
  },
  {
    emoji: "\u{1F1E9}\u{1F1EA}",
    name: "de",
    shortcodes: ["flag_de", "germany"],
    tags: ["DE", "flag", "flag: germany"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e9-1f1ea.png"
  },
  {
    emoji: "\u{1F1E9}\u{1F1EC}",
    name: "diego_garcia",
    shortcodes: ["diego_garcia", "flag_dg"],
    tags: ["DG", "flag", "flag: diego garcia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e9-1f1ec.png"
  },
  {
    emoji: "\u{1F1E9}\u{1F1EF}",
    name: "djibouti",
    shortcodes: ["djibouti", "flag_dj"],
    tags: ["DJ", "flag", "flag: djibouti"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e9-1f1ef.png"
  },
  {
    emoji: "\u{1F1E9}\u{1F1F0}",
    name: "denmark",
    shortcodes: ["denmark", "flag_dk"],
    tags: ["DK", "flag", "flag: denmark"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e9-1f1f0.png"
  },
  {
    emoji: "\u{1F1E9}\u{1F1F2}",
    name: "dominica",
    shortcodes: ["dominica", "flag_dm"],
    tags: ["DM", "flag", "flag: dominica"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e9-1f1f2.png"
  },
  {
    emoji: "\u{1F1E9}\u{1F1F4}",
    name: "dominican_republic",
    shortcodes: ["dominican_republic", "flag_do"],
    tags: ["DO", "flag", "flag: dominican republic"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e9-1f1f4.png"
  },
  {
    emoji: "\u{1F1E9}\u{1F1FF}",
    name: "algeria",
    shortcodes: ["algeria", "flag_dz"],
    tags: ["DZ", "flag", "flag: algeria"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1e9-1f1ff.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1E6}",
    name: "ceuta_melilla",
    shortcodes: ["ceuta_melilla", "flag_ea"],
    tags: ["EA", "flag", "flag: ceuta & melilla"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1e6.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1E8}",
    name: "ecuador",
    shortcodes: ["ecuador", "flag_ec"],
    tags: ["EC", "flag", "flag: ecuador"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1e8.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1EA}",
    name: "estonia",
    shortcodes: ["estonia", "flag_ee"],
    tags: ["EE", "flag", "flag: estonia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1ea.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1EC}",
    name: "egypt",
    shortcodes: ["egypt", "flag_eg"],
    tags: ["EG", "flag", "flag: egypt"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1ec.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1ED}",
    name: "western_sahara",
    shortcodes: ["flag_eh", "western_sahara"],
    tags: ["EH", "flag", "flag: western sahara"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1ed.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1F7}",
    name: "eritrea",
    shortcodes: ["eritrea", "flag_er"],
    tags: ["ER", "flag", "flag: eritrea"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1f7.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1F8}",
    name: "es",
    shortcodes: ["flag_es", "spain"],
    tags: ["ES", "flag", "flag: spain"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1f8.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1F9}",
    name: "ethiopia",
    shortcodes: ["ethiopia", "flag_et"],
    tags: ["ET", "flag", "flag: ethiopia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1f9.png"
  },
  {
    emoji: "\u{1F1EA}\u{1F1FA}",
    name: "eu",
    shortcodes: ["european_union", "flag_eu"],
    tags: ["EU", "flag", "flag: european union"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ea-1f1fa.png"
  },
  {
    emoji: "\u{1F1EB}\u{1F1EE}",
    name: "finland",
    shortcodes: ["finland", "flag_fi"],
    tags: ["FI", "flag", "flag: finland"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1eb-1f1ee.png"
  },
  {
    emoji: "\u{1F1EB}\u{1F1EF}",
    name: "fiji",
    shortcodes: ["fiji", "flag_fj"],
    tags: ["FJ", "flag", "flag: fiji"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1eb-1f1ef.png"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F0}",
    name: "falkland_islands",
    shortcodes: ["falkland_islands", "flag_fk"],
    tags: ["FK", "flag", "flag: falkland islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1eb-1f1f0.png"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F2}",
    name: "micronesia",
    shortcodes: ["flag_fm", "micronesia"],
    tags: ["FM", "flag", "flag: micronesia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1eb-1f1f2.png"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F4}",
    name: "faroe_islands",
    shortcodes: ["faroe_islands", "flag_fo"],
    tags: ["FO", "flag", "flag: faroe islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1eb-1f1f4.png"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F7}",
    name: "fr",
    shortcodes: ["flag_fr", "france"],
    tags: ["FR", "flag", "flag: france"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1eb-1f1f7.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1E6}",
    name: "gabon",
    shortcodes: ["flag_ga", "gabon"],
    tags: ["GA", "flag", "flag: gabon"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1e6.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1E7}",
    name: "gb",
    shortcodes: ["flag_gb", "uk", "united_kingdom"],
    tags: ["GB", "flag", "flag: united kingdom"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1e7.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1E9}",
    name: "grenada",
    shortcodes: ["flag_gd", "grenada"],
    tags: ["GD", "flag", "flag: grenada"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1e9.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EA}",
    name: "georgia",
    shortcodes: ["flag_ge", "georgia"],
    tags: ["GE", "flag", "flag: georgia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1ea.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EB}",
    name: "french_guiana",
    shortcodes: ["flag_gf", "french_guiana"],
    tags: ["GF", "flag", "flag: french guiana"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1eb.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EC}",
    name: "guernsey",
    shortcodes: ["flag_gg", "guernsey"],
    tags: ["GG", "flag", "flag: guernsey"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1ec.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1ED}",
    name: "ghana",
    shortcodes: ["flag_gh", "ghana"],
    tags: ["GH", "flag", "flag: ghana"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1ed.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EE}",
    name: "gibraltar",
    shortcodes: ["flag_gi", "gibraltar"],
    tags: ["GI", "flag", "flag: gibraltar"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1ee.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F1}",
    name: "greenland",
    shortcodes: ["flag_gl", "greenland"],
    tags: ["GL", "flag", "flag: greenland"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f1.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F2}",
    name: "gambia",
    shortcodes: ["flag_gm", "gambia"],
    tags: ["GM", "flag", "flag: gambia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f2.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F3}",
    name: "guinea",
    shortcodes: ["flag_gn", "guinea"],
    tags: ["GN", "flag", "flag: guinea"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f3.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F5}",
    name: "guadeloupe",
    shortcodes: ["flag_gp", "guadeloupe"],
    tags: ["GP", "flag", "flag: guadeloupe"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f5.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F6}",
    name: "equatorial_guinea",
    shortcodes: ["equatorial_guinea", "flag_gq"],
    tags: ["GQ", "flag", "flag: equatorial guinea"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f6.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F7}",
    name: "greece",
    shortcodes: ["flag_gr", "greece"],
    tags: ["GR", "flag", "flag: greece"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f7.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F8}",
    name: "south_georgia_south_sandwich_islands",
    shortcodes: ["flag_gs", "south_georgia_south_sandwich_islands"],
    tags: ["GS", "flag", "flag: south georgia & south sandwich islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f8.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F9}",
    name: "guatemala",
    shortcodes: ["flag_gt", "guatemala"],
    tags: ["GT", "flag", "flag: guatemala"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1f9.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1FA}",
    name: "guam",
    shortcodes: ["flag_gu", "guam"],
    tags: ["GU", "flag", "flag: guam"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1fa.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1FC}",
    name: "guinea_bissau",
    shortcodes: ["flag_gw", "guinea_bissau"],
    tags: ["GW", "flag", "flag: guinea-bissau"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1fc.png"
  },
  {
    emoji: "\u{1F1EC}\u{1F1FE}",
    name: "guyana",
    shortcodes: ["flag_gy", "guyana"],
    tags: ["GY", "flag", "flag: guyana"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ec-1f1fe.png"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F0}",
    name: "hong_kong",
    shortcodes: ["flag_hk", "hong_kong"],
    tags: ["HK", "flag", "flag: hong kong sar china"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ed-1f1f0.png"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F2}",
    name: "heard_mcdonald_islands",
    shortcodes: ["flag_hm", "heard_mcdonald_islands"],
    tags: ["HM", "flag", "flag: heard & mcdonald islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ed-1f1f2.png"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F3}",
    name: "honduras",
    shortcodes: ["flag_hn", "honduras"],
    tags: ["HN", "flag", "flag: honduras"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ed-1f1f3.png"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F7}",
    name: "croatia",
    shortcodes: ["croatia", "flag_hr"],
    tags: ["HR", "flag", "flag: croatia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ed-1f1f7.png"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F9}",
    name: "haiti",
    shortcodes: ["flag_ht", "haiti"],
    tags: ["HT", "flag", "flag: haiti"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ed-1f1f9.png"
  },
  {
    emoji: "\u{1F1ED}\u{1F1FA}",
    name: "hungary",
    shortcodes: ["flag_hu", "hungary"],
    tags: ["HU", "flag", "flag: hungary"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ed-1f1fa.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1E8}",
    name: "canary_islands",
    shortcodes: ["canary_islands", "flag_ic"],
    tags: ["IC", "flag", "flag: canary islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1e8.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1E9}",
    name: "indonesia",
    shortcodes: ["flag_id", "indonesia"],
    tags: ["ID", "flag", "flag: indonesia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1e9.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1EA}",
    name: "ireland",
    shortcodes: ["flag_ie", "ireland"],
    tags: ["IE", "flag", "flag: ireland"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1ea.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F1}",
    name: "israel",
    shortcodes: ["flag_il", "israel"],
    tags: ["IL", "flag", "flag: israel"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f1.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F2}",
    name: "isle_of_man",
    shortcodes: ["flag_im", "isle_of_man"],
    tags: ["IM", "flag", "flag: isle of man"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f2.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F3}",
    name: "india",
    shortcodes: ["flag_in", "india"],
    tags: ["IN", "flag", "flag: india"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f3.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F4}",
    name: "british_indian_ocean_territory",
    shortcodes: ["british_indian_ocean_territory", "flag_io"],
    tags: ["IO", "flag", "flag: british indian ocean territory"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f4.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F6}",
    name: "iraq",
    shortcodes: ["flag_iq", "iraq"],
    tags: ["IQ", "flag", "flag: iraq"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f6.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F7}",
    name: "iran",
    shortcodes: ["flag_ir", "iran"],
    tags: ["IR", "flag", "flag: iran"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f7.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F8}",
    name: "iceland",
    shortcodes: ["flag_is", "iceland"],
    tags: ["IS", "flag", "flag: iceland"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f8.png"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F9}",
    name: "it",
    shortcodes: ["flag_it", "italy"],
    tags: ["IT", "flag", "flag: italy"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ee-1f1f9.png"
  },
  {
    emoji: "\u{1F1EF}\u{1F1EA}",
    name: "jersey",
    shortcodes: ["flag_je", "jersey"],
    tags: ["JE", "flag", "flag: jersey"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ef-1f1ea.png"
  },
  {
    emoji: "\u{1F1EF}\u{1F1F2}",
    name: "jamaica",
    shortcodes: ["flag_jm", "jamaica"],
    tags: ["JM", "flag", "flag: jamaica"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ef-1f1f2.png"
  },
  {
    emoji: "\u{1F1EF}\u{1F1F4}",
    name: "jordan",
    shortcodes: ["flag_jo", "jordan"],
    tags: ["JO", "flag", "flag: jordan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ef-1f1f4.png"
  },
  {
    emoji: "\u{1F1EF}\u{1F1F5}",
    name: "jp",
    shortcodes: ["flag_jp", "japan"],
    tags: ["JP", "flag", "flag: japan"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ef-1f1f5.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1EA}",
    name: "kenya",
    shortcodes: ["flag_ke", "kenya"],
    tags: ["KE", "flag", "flag: kenya"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1ea.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1EC}",
    name: "kyrgyzstan",
    shortcodes: ["flag_kg", "kyrgyzstan"],
    tags: ["KG", "flag", "flag: kyrgyzstan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1ec.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1ED}",
    name: "cambodia",
    shortcodes: ["cambodia", "flag_kh"],
    tags: ["KH", "flag", "flag: cambodia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1ed.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1EE}",
    name: "kiribati",
    shortcodes: ["flag_ki", "kiribati"],
    tags: ["KI", "flag", "flag: kiribati"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1ee.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F2}",
    name: "comoros",
    shortcodes: ["comoros", "flag_km"],
    tags: ["KM", "flag", "flag: comoros"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1f2.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F3}",
    name: "st_kitts_nevis",
    shortcodes: ["flag_kn", "st_kitts_nevis"],
    tags: ["KN", "flag", "flag: st. kitts & nevis"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1f3.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F5}",
    name: "north_korea",
    shortcodes: ["flag_kp", "north_korea"],
    tags: ["KP", "flag", "flag: north korea"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1f5.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F7}",
    name: "kr",
    shortcodes: ["flag_kr", "south_korea"],
    tags: ["KR", "flag", "flag: south korea"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1f7.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1FC}",
    name: "kuwait",
    shortcodes: ["flag_kw", "kuwait"],
    tags: ["KW", "flag", "flag: kuwait"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1fc.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1FE}",
    name: "cayman_islands",
    shortcodes: ["cayman_islands", "flag_ky"],
    tags: ["KY", "flag", "flag: cayman islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1fe.png"
  },
  {
    emoji: "\u{1F1F0}\u{1F1FF}",
    name: "kazakhstan",
    shortcodes: ["flag_kz", "kazakhstan"],
    tags: ["KZ", "flag", "flag: kazakhstan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f0-1f1ff.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1E6}",
    name: "laos",
    shortcodes: ["flag_la", "laos"],
    tags: ["LA", "flag", "flag: laos"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1e6.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1E7}",
    name: "lebanon",
    shortcodes: ["flag_lb", "lebanon"],
    tags: ["LB", "flag", "flag: lebanon"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1e7.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1E8}",
    name: "st_lucia",
    shortcodes: ["flag_lc", "st_lucia"],
    tags: ["LC", "flag", "flag: st. lucia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1e8.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1EE}",
    name: "liechtenstein",
    shortcodes: ["flag_li", "liechtenstein"],
    tags: ["LI", "flag", "flag: liechtenstein"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1ee.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F0}",
    name: "sri_lanka",
    shortcodes: ["flag_lk", "sri_lanka"],
    tags: ["LK", "flag", "flag: sri lanka"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1f0.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F7}",
    name: "liberia",
    shortcodes: ["flag_lr", "liberia"],
    tags: ["LR", "flag", "flag: liberia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1f7.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F8}",
    name: "lesotho",
    shortcodes: ["flag_ls", "lesotho"],
    tags: ["LS", "flag", "flag: lesotho"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1f8.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F9}",
    name: "lithuania",
    shortcodes: ["flag_lt", "lithuania"],
    tags: ["LT", "flag", "flag: lithuania"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1f9.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1FA}",
    name: "luxembourg",
    shortcodes: ["flag_lu", "luxembourg"],
    tags: ["LU", "flag", "flag: luxembourg"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1fa.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1FB}",
    name: "latvia",
    shortcodes: ["flag_lv", "latvia"],
    tags: ["LV", "flag", "flag: latvia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1fb.png"
  },
  {
    emoji: "\u{1F1F1}\u{1F1FE}",
    name: "libya",
    shortcodes: ["flag_ly", "libya"],
    tags: ["LY", "flag", "flag: libya"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f1-1f1fe.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1E6}",
    name: "morocco",
    shortcodes: ["flag_ma", "morocco"],
    tags: ["MA", "flag", "flag: morocco"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1e6.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1E8}",
    name: "monaco",
    shortcodes: ["flag_mc", "monaco"],
    tags: ["MC", "flag", "flag: monaco"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1e8.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1E9}",
    name: "moldova",
    shortcodes: ["flag_md", "moldova"],
    tags: ["MD", "flag", "flag: moldova"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1e9.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1EA}",
    name: "montenegro",
    shortcodes: ["flag_me", "montenegro"],
    tags: ["ME", "flag", "flag: montenegro"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1ea.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1EB}",
    name: "st_martin",
    shortcodes: ["flag_mf", "st_martin"],
    tags: ["MF", "flag", "flag: st. martin"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1eb.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1EC}",
    name: "madagascar",
    shortcodes: ["flag_mg", "madagascar"],
    tags: ["MG", "flag", "flag: madagascar"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1ec.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1ED}",
    name: "marshall_islands",
    shortcodes: ["flag_mh", "marshall_islands"],
    tags: ["MH", "flag", "flag: marshall islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1ed.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F0}",
    name: "macedonia",
    shortcodes: ["flag_mk", "macedonia"],
    tags: ["MK", "flag", "flag: north macedonia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f0.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F1}",
    name: "mali",
    shortcodes: ["flag_ml", "mali"],
    tags: ["ML", "flag", "flag: mali"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f1.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F2}",
    name: "myanmar",
    shortcodes: ["burma", "flag_mm", "myanmar"],
    tags: ["MM", "flag", "flag: myanmar (burma)"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f2.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F3}",
    name: "mongolia",
    shortcodes: ["flag_mn", "mongolia"],
    tags: ["MN", "flag", "flag: mongolia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f3.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F4}",
    name: "macau",
    shortcodes: ["flag_mo", "macao", "macau"],
    tags: ["MO", "flag", "flag: macao sar china"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f4.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F5}",
    name: "northern_mariana_islands",
    shortcodes: ["flag_mp", "northern_mariana_islands"],
    tags: ["MP", "flag", "flag: northern mariana islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f5.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F6}",
    name: "martinique",
    shortcodes: ["flag_mq", "martinique"],
    tags: ["MQ", "flag", "flag: martinique"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f6.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F7}",
    name: "mauritania",
    shortcodes: ["flag_mr", "mauritania"],
    tags: ["MR", "flag", "flag: mauritania"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f7.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F8}",
    name: "montserrat",
    shortcodes: ["flag_ms", "montserrat"],
    tags: ["MS", "flag", "flag: montserrat"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f8.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F9}",
    name: "malta",
    shortcodes: ["flag_mt", "malta"],
    tags: ["MT", "flag", "flag: malta"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1f9.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FA}",
    name: "mauritius",
    shortcodes: ["flag_mu", "mauritius"],
    tags: ["MU", "flag", "flag: mauritius"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1fa.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FB}",
    name: "maldives",
    shortcodes: ["flag_mv", "maldives"],
    tags: ["MV", "flag", "flag: maldives"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1fb.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FC}",
    name: "malawi",
    shortcodes: ["flag_mw", "malawi"],
    tags: ["MW", "flag", "flag: malawi"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1fc.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FD}",
    name: "mexico",
    shortcodes: ["flag_mx", "mexico"],
    tags: ["MX", "flag", "flag: mexico"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1fd.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FE}",
    name: "malaysia",
    shortcodes: ["flag_my", "malaysia"],
    tags: ["MY", "flag", "flag: malaysia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1fe.png"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FF}",
    name: "mozambique",
    shortcodes: ["flag_mz", "mozambique"],
    tags: ["MZ", "flag", "flag: mozambique"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f2-1f1ff.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1E6}",
    name: "namibia",
    shortcodes: ["flag_na", "namibia"],
    tags: ["NA", "flag", "flag: namibia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1e6.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1E8}",
    name: "new_caledonia",
    shortcodes: ["flag_nc", "new_caledonia"],
    tags: ["NC", "flag", "flag: new caledonia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1e8.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EA}",
    name: "niger",
    shortcodes: ["flag_ne", "niger"],
    tags: ["NE", "flag", "flag: niger"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1ea.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EB}",
    name: "norfolk_island",
    shortcodes: ["flag_nf", "norfolk_island"],
    tags: ["NF", "flag", "flag: norfolk island"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1eb.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EC}",
    name: "nigeria",
    shortcodes: ["flag_ng", "nigeria"],
    tags: ["NG", "flag", "flag: nigeria"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1ec.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EE}",
    name: "nicaragua",
    shortcodes: ["flag_ni", "nicaragua"],
    tags: ["NI", "flag", "flag: nicaragua"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1ee.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F1}",
    name: "netherlands",
    shortcodes: ["flag_nl", "netherlands"],
    tags: ["NL", "flag", "flag: netherlands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1f1.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F4}",
    name: "norway",
    shortcodes: ["flag_no", "norway"],
    tags: ["NO", "flag", "flag: norway"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1f4.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F5}",
    name: "nepal",
    shortcodes: ["flag_np", "nepal"],
    tags: ["NP", "flag", "flag: nepal"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1f5.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F7}",
    name: "nauru",
    shortcodes: ["flag_nr", "nauru"],
    tags: ["NR", "flag", "flag: nauru"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1f7.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1FA}",
    name: "niue",
    shortcodes: ["flag_nu", "niue"],
    tags: ["NU", "flag", "flag: niue"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1fa.png"
  },
  {
    emoji: "\u{1F1F3}\u{1F1FF}",
    name: "new_zealand",
    shortcodes: ["flag_nz", "new_zealand"],
    tags: ["NZ", "flag", "flag: new zealand"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f3-1f1ff.png"
  },
  {
    emoji: "\u{1F1F4}\u{1F1F2}",
    name: "oman",
    shortcodes: ["flag_om", "oman"],
    tags: ["OM", "flag", "flag: oman"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f4-1f1f2.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1E6}",
    name: "panama",
    shortcodes: ["flag_pa", "panama"],
    tags: ["PA", "flag", "flag: panama"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1e6.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1EA}",
    name: "peru",
    shortcodes: ["flag_pe", "peru"],
    tags: ["PE", "flag", "flag: peru"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1ea.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1EB}",
    name: "french_polynesia",
    shortcodes: ["flag_pf", "french_polynesia"],
    tags: ["PF", "flag", "flag: french polynesia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1eb.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1EC}",
    name: "papua_new_guinea",
    shortcodes: ["flag_pg", "papua_new_guinea"],
    tags: ["PG", "flag", "flag: papua new guinea"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1ec.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1ED}",
    name: "philippines",
    shortcodes: ["flag_ph", "philippines"],
    tags: ["PH", "flag", "flag: philippines"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1ed.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F0}",
    name: "pakistan",
    shortcodes: ["flag_pk", "pakistan"],
    tags: ["PK", "flag", "flag: pakistan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1f0.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F1}",
    name: "poland",
    shortcodes: ["flag_pl", "poland"],
    tags: ["PL", "flag", "flag: poland"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1f1.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F2}",
    name: "st_pierre_miquelon",
    shortcodes: ["flag_pm", "st_pierre_miquelon"],
    tags: ["PM", "flag", "flag: st. pierre & miquelon"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1f2.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F3}",
    name: "pitcairn_islands",
    shortcodes: ["flag_pn", "pitcairn_islands"],
    tags: ["PN", "flag", "flag: pitcairn islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1f3.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F7}",
    name: "puerto_rico",
    shortcodes: ["flag_pr", "puerto_rico"],
    tags: ["PR", "flag", "flag: puerto rico"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1f7.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F8}",
    name: "palestinian_territories",
    shortcodes: ["flag_ps", "palestinian_territories"],
    tags: ["PS", "flag", "flag: palestinian territories"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1f8.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F9}",
    name: "portugal",
    shortcodes: ["flag_pt", "portugal"],
    tags: ["PT", "flag", "flag: portugal"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1f9.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1FC}",
    name: "palau",
    shortcodes: ["flag_pw", "palau"],
    tags: ["PW", "flag", "flag: palau"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1fc.png"
  },
  {
    emoji: "\u{1F1F5}\u{1F1FE}",
    name: "paraguay",
    shortcodes: ["flag_py", "paraguay"],
    tags: ["PY", "flag", "flag: paraguay"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f5-1f1fe.png"
  },
  {
    emoji: "\u{1F1F6}\u{1F1E6}",
    name: "qatar",
    shortcodes: ["flag_qa", "qatar"],
    tags: ["QA", "flag", "flag: qatar"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f6-1f1e6.png"
  },
  {
    emoji: "\u{1F1F7}\u{1F1EA}",
    name: "reunion",
    shortcodes: ["flag_re", "reunion"],
    tags: ["RE", "flag", "flag: r\xE9union"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f7-1f1ea.png"
  },
  {
    emoji: "\u{1F1F7}\u{1F1F4}",
    name: "romania",
    shortcodes: ["flag_ro", "romania"],
    tags: ["RO", "flag", "flag: romania"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f7-1f1f4.png"
  },
  {
    emoji: "\u{1F1F7}\u{1F1F8}",
    name: "serbia",
    shortcodes: ["flag_rs", "serbia"],
    tags: ["RS", "flag", "flag: serbia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f7-1f1f8.png"
  },
  {
    emoji: "\u{1F1F7}\u{1F1FA}",
    name: "ru",
    shortcodes: ["flag_ru", "russia"],
    tags: ["RU", "flag", "flag: russia"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f7-1f1fa.png"
  },
  {
    emoji: "\u{1F1F7}\u{1F1FC}",
    name: "rwanda",
    shortcodes: ["flag_rw", "rwanda"],
    tags: ["RW", "flag", "flag: rwanda"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f7-1f1fc.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E6}",
    name: "saudi_arabia",
    shortcodes: ["flag_sa", "saudi_arabia"],
    tags: ["SA", "flag", "flag: saudi arabia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1e6.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E7}",
    name: "solomon_islands",
    shortcodes: ["flag_sb", "solomon_islands"],
    tags: ["SB", "flag", "flag: solomon islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1e7.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E8}",
    name: "seychelles",
    shortcodes: ["flag_sc", "seychelles"],
    tags: ["SC", "flag", "flag: seychelles"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1e8.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E9}",
    name: "sudan",
    shortcodes: ["flag_sd", "sudan"],
    tags: ["SD", "flag", "flag: sudan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1e9.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EA}",
    name: "sweden",
    shortcodes: ["flag_se", "sweden"],
    tags: ["SE", "flag", "flag: sweden"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1ea.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EC}",
    name: "singapore",
    shortcodes: ["flag_sg", "singapore"],
    tags: ["SG", "flag", "flag: singapore"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1ec.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1ED}",
    name: "st_helena",
    shortcodes: ["flag_sh", "st_helena"],
    tags: ["SH", "flag", "flag: st. helena"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1ed.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EE}",
    name: "slovenia",
    shortcodes: ["flag_si", "slovenia"],
    tags: ["SI", "flag", "flag: slovenia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1ee.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EF}",
    name: "svalbard_jan_mayen",
    shortcodes: ["flag_sj", "svalbard_jan_mayen"],
    tags: ["SJ", "flag", "flag: svalbard & jan mayen"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1ef.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F0}",
    name: "slovakia",
    shortcodes: ["flag_sk", "slovakia"],
    tags: ["SK", "flag", "flag: slovakia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f0.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F1}",
    name: "sierra_leone",
    shortcodes: ["flag_sl", "sierra_leone"],
    tags: ["SL", "flag", "flag: sierra leone"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f1.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F2}",
    name: "san_marino",
    shortcodes: ["flag_sm", "san_marino"],
    tags: ["SM", "flag", "flag: san marino"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f2.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F3}",
    name: "senegal",
    shortcodes: ["flag_sn", "senegal"],
    tags: ["SN", "flag", "flag: senegal"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f3.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F4}",
    name: "somalia",
    shortcodes: ["flag_so", "somalia"],
    tags: ["SO", "flag", "flag: somalia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f4.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F7}",
    name: "suriname",
    shortcodes: ["flag_sr", "suriname"],
    tags: ["SR", "flag", "flag: suriname"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f7.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F8}",
    name: "south_sudan",
    shortcodes: ["flag_ss", "south_sudan"],
    tags: ["SS", "flag", "flag: south sudan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f8.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F9}",
    name: "sao_tome_principe",
    shortcodes: ["flag_st", "sao_tome_principe"],
    tags: ["ST", "flag", "flag: s\xE3o tom\xE9 & pr\xEDncipe"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1f9.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FB}",
    name: "el_salvador",
    shortcodes: ["el_salvador", "flag_sv"],
    tags: ["SV", "flag", "flag: el salvador"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1fb.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FD}",
    name: "sint_maarten",
    shortcodes: ["flag_sx", "sint_maarten"],
    tags: ["SX", "flag", "flag: sint maarten"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1fd.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FE}",
    name: "syria",
    shortcodes: ["flag_sy", "syria"],
    tags: ["SY", "flag", "flag: syria"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1fe.png"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FF}",
    name: "swaziland",
    shortcodes: ["eswatini", "flag_sz", "swaziland"],
    tags: ["SZ", "flag", "flag: eswatini"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f8-1f1ff.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1E6}",
    name: "tristan_da_cunha",
    shortcodes: ["flag_ta", "tristan_da_cunha"],
    tags: ["TA", "flag", "flag: tristan da cunha"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1e6.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1E8}",
    name: "turks_caicos_islands",
    shortcodes: ["flag_tc", "turks_caicos_islands"],
    tags: ["TC", "flag", "flag: turks & caicos islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1e8.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1E9}",
    name: "chad",
    shortcodes: ["chad", "flag_td"],
    tags: ["TD", "flag", "flag: chad"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1e9.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1EB}",
    name: "french_southern_territories",
    shortcodes: ["flag_tf", "french_southern_territories"],
    tags: ["TF", "flag", "flag: french southern territories"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1eb.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1EC}",
    name: "togo",
    shortcodes: ["flag_tg", "togo"],
    tags: ["TG", "flag", "flag: togo"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1ec.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1ED}",
    name: "thailand",
    shortcodes: ["flag_th", "thailand"],
    tags: ["TH", "flag", "flag: thailand"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1ed.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1EF}",
    name: "tajikistan",
    shortcodes: ["flag_tj", "tajikistan"],
    tags: ["TJ", "flag", "flag: tajikistan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1ef.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F0}",
    name: "tokelau",
    shortcodes: ["flag_tk", "tokelau"],
    tags: ["TK", "flag", "flag: tokelau"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1f0.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F1}",
    name: "timor_leste",
    shortcodes: ["flag_tl", "timor_leste"],
    tags: ["TL", "flag", "flag: timor-leste"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1f1.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F2}",
    name: "turkmenistan",
    shortcodes: ["flag_tm", "turkmenistan"],
    tags: ["TM", "flag", "flag: turkmenistan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1f2.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F3}",
    name: "tunisia",
    shortcodes: ["flag_tn", "tunisia"],
    tags: ["TN", "flag", "flag: tunisia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1f3.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F4}",
    name: "tonga",
    shortcodes: ["flag_to", "tonga"],
    tags: ["TO", "flag", "flag: tonga"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1f4.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F7}",
    name: "tr",
    shortcodes: ["flag_tr", "turkey_tr"],
    tags: ["TR", "flag", "flag: t\xFCrkiye"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1f7.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F9}",
    name: "trinidad_tobago",
    shortcodes: ["flag_tt", "trinidad_tobago"],
    tags: ["TT", "flag", "flag: trinidad & tobago"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1f9.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1FB}",
    name: "tuvalu",
    shortcodes: ["flag_tv", "tuvalu"],
    tags: ["TV", "flag", "flag: tuvalu"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1fb.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1FC}",
    name: "taiwan",
    shortcodes: ["flag_tw", "taiwan"],
    tags: ["TW", "flag", "flag: taiwan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1fc.png"
  },
  {
    emoji: "\u{1F1F9}\u{1F1FF}",
    name: "tanzania",
    shortcodes: ["flag_tz", "tanzania"],
    tags: ["TZ", "flag", "flag: tanzania"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1f9-1f1ff.png"
  },
  {
    emoji: "\u{1F1FA}\u{1F1E6}",
    name: "ukraine",
    shortcodes: ["flag_ua", "ukraine"],
    tags: ["UA", "flag", "flag: ukraine"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fa-1f1e6.png"
  },
  {
    emoji: "\u{1F1FA}\u{1F1EC}",
    name: "uganda",
    shortcodes: ["flag_ug", "uganda"],
    tags: ["UG", "flag", "flag: uganda"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fa-1f1ec.png"
  },
  {
    emoji: "\u{1F1FA}\u{1F1F2}",
    name: "us_outlying_islands",
    shortcodes: ["flag_um", "us_outlying_islands"],
    tags: ["UM", "flag", "flag: u.s. outlying islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fa-1f1f2.png"
  },
  {
    emoji: "\u{1F1FA}\u{1F1F3}",
    name: "united_nations",
    shortcodes: ["flag_un", "un", "united_nations"],
    tags: ["UN", "flag", "flag: united nations"],
    group: "flags",
    emoticons: [],
    version: 4,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fa-1f1f3.png"
  },
  {
    emoji: "\u{1F1FA}\u{1F1F8}",
    name: "us",
    shortcodes: ["flag_us", "united_states", "usa"],
    tags: ["US", "flag", "flag: united states"],
    group: "flags",
    emoticons: [],
    version: 0.6,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fa-1f1f8.png"
  },
  {
    emoji: "\u{1F1FA}\u{1F1FE}",
    name: "uruguay",
    shortcodes: ["flag_uy", "uruguay"],
    tags: ["UY", "flag", "flag: uruguay"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fa-1f1fe.png"
  },
  {
    emoji: "\u{1F1FA}\u{1F1FF}",
    name: "uzbekistan",
    shortcodes: ["flag_uz", "uzbekistan"],
    tags: ["UZ", "flag", "flag: uzbekistan"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fa-1f1ff.png"
  },
  {
    emoji: "\u{1F1FB}\u{1F1E6}",
    name: "vatican_city",
    shortcodes: ["flag_va", "vatican_city"],
    tags: ["VA", "flag", "flag: vatican city"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fb-1f1e6.png"
  },
  {
    emoji: "\u{1F1FB}\u{1F1E8}",
    name: "st_vincent_grenadines",
    shortcodes: ["flag_vc", "st_vincent_grenadines"],
    tags: ["VC", "flag", "flag: st. vincent & grenadines"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fb-1f1e8.png"
  },
  {
    emoji: "\u{1F1FB}\u{1F1EA}",
    name: "venezuela",
    shortcodes: ["flag_ve", "venezuela"],
    tags: ["VE", "flag", "flag: venezuela"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fb-1f1ea.png"
  },
  {
    emoji: "\u{1F1FB}\u{1F1EC}",
    name: "british_virgin_islands",
    shortcodes: ["british_virgin_islands", "flag_vg"],
    tags: ["VG", "flag", "flag: british virgin islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fb-1f1ec.png"
  },
  {
    emoji: "\u{1F1FB}\u{1F1EE}",
    name: "us_virgin_islands",
    shortcodes: ["flag_vi", "us_virgin_islands"],
    tags: ["VI", "flag", "flag: u.s. virgin islands"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fb-1f1ee.png"
  },
  {
    emoji: "\u{1F1FB}\u{1F1F3}",
    name: "vietnam",
    shortcodes: ["flag_vn", "vietnam"],
    tags: ["VN", "flag", "flag: vietnam"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fb-1f1f3.png"
  },
  {
    emoji: "\u{1F1FB}\u{1F1FA}",
    name: "vanuatu",
    shortcodes: ["flag_vu", "vanuatu"],
    tags: ["VU", "flag", "flag: vanuatu"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fb-1f1fa.png"
  },
  {
    emoji: "\u{1F1FC}\u{1F1EB}",
    name: "wallis_futuna",
    shortcodes: ["flag_wf", "wallis_futuna"],
    tags: ["WF", "flag", "flag: wallis & futuna"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fc-1f1eb.png"
  },
  {
    emoji: "\u{1F1FC}\u{1F1F8}",
    name: "samoa",
    shortcodes: ["flag_ws", "samoa"],
    tags: ["WS", "flag", "flag: samoa"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fc-1f1f8.png"
  },
  {
    emoji: "\u{1F1FD}\u{1F1F0}",
    name: "kosovo",
    shortcodes: ["flag_xk", "kosovo"],
    tags: ["XK", "flag", "flag: kosovo"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fd-1f1f0.png"
  },
  {
    emoji: "\u{1F1FE}\u{1F1EA}",
    name: "yemen",
    shortcodes: ["flag_ye", "yemen"],
    tags: ["YE", "flag", "flag: yemen"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fe-1f1ea.png"
  },
  {
    emoji: "\u{1F1FE}\u{1F1F9}",
    name: "mayotte",
    shortcodes: ["flag_yt", "mayotte"],
    tags: ["YT", "flag", "flag: mayotte"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1fe-1f1f9.png"
  },
  {
    emoji: "\u{1F1FF}\u{1F1E6}",
    name: "south_africa",
    shortcodes: ["flag_za", "south_africa"],
    tags: ["ZA", "flag", "flag: south africa"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ff-1f1e6.png"
  },
  {
    emoji: "\u{1F1FF}\u{1F1F2}",
    name: "zambia",
    shortcodes: ["flag_zm", "zambia"],
    tags: ["ZM", "flag", "flag: zambia"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ff-1f1f2.png"
  },
  {
    emoji: "\u{1F1FF}\u{1F1FC}",
    name: "zimbabwe",
    shortcodes: ["flag_zw", "zimbabwe"],
    tags: ["ZW", "flag", "flag: zimbabwe"],
    group: "flags",
    emoticons: [],
    version: 2,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f1ff-1f1fc.png"
  },
  {
    emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    name: "england",
    shortcodes: ["england", "flag_gbeng"],
    tags: ["flag", "flag: england", "gbeng"],
    group: "flags",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f4-e0067-e0062-e0065-e006e-e0067-e007f.png"
  },
  {
    emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    name: "scotland",
    shortcodes: ["flag_gbsct", "scotland"],
    tags: ["flag", "flag: scotland", "gbsct"],
    group: "flags",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f4-e0067-e0062-e0073-e0063-e0074-e007f.png"
  },
  {
    emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
    name: "wales",
    shortcodes: ["flag_gbwls", "wales"],
    tags: ["flag", "flag: wales", "gbwls"],
    group: "flags",
    emoticons: [],
    version: 5,
    fallbackImage: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f3f4-e0067-e0062-e0077-e006c-e0073-e007f.png"
  }
];
var gitHubCustomEmojis = [
  {
    name: "atom",
    shortcodes: ["atom"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/atom.png"
  },
  {
    name: "basecamp",
    shortcodes: ["basecamp"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/basecamp.png"
  },
  {
    name: "basecampy",
    shortcodes: ["basecampy"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/basecampy.png"
  },
  {
    name: "bowtie",
    shortcodes: ["bowtie"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/bowtie.png"
  },
  {
    name: "electron",
    shortcodes: ["electron"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/electron.png"
  },
  {
    name: "feelsgood",
    shortcodes: ["feelsgood"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/feelsgood.png"
  },
  {
    name: "finnadie",
    shortcodes: ["finnadie"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/finnadie.png"
  },
  {
    name: "goberserk",
    shortcodes: ["goberserk"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/goberserk.png"
  },
  {
    name: "godmode",
    shortcodes: ["godmode"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/godmode.png"
  },
  {
    name: "hurtrealbad",
    shortcodes: ["hurtrealbad"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/hurtrealbad.png"
  },
  {
    name: "neckbeard",
    shortcodes: ["neckbeard"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/neckbeard.png"
  },
  {
    name: "octocat",
    shortcodes: ["octocat"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/octocat.png"
  },
  {
    name: "rage1",
    shortcodes: ["rage1"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/rage1.png"
  },
  {
    name: "rage2",
    shortcodes: ["rage2"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/rage2.png"
  },
  {
    name: "rage3",
    shortcodes: ["rage3"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/rage3.png"
  },
  {
    name: "rage4",
    shortcodes: ["rage4"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/rage4.png"
  },
  {
    name: "shipit",
    shortcodes: ["shipit"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/shipit.png"
  },
  {
    name: "suspect",
    shortcodes: ["suspect"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/suspect.png"
  },
  {
    name: "trollface",
    shortcodes: ["trollface"],
    tags: [],
    group: "GitHub",
    fallbackImage: "https://github.githubassets.com/images/icons/emoji/trollface.png"
  }
];
var gitHubEmojis = [...emojis, ...gitHubCustomEmojis];

// src/helpers/removeVariationSelector.ts
function removeVariationSelector(value) {
  return value.replace("\uFE0E", "").replace("\uFE0F", "");
}

// src/helpers/emojiToShortcode.ts
function emojiToShortcode(emoji, emojis2) {
  var _a;
  return (_a = emojis2.find((item) => item.emoji === removeVariationSelector(emoji))) == null ? void 0 : _a.shortcodes[0];
}

// src/helpers/removeDuplicates.ts
function removeDuplicates(array, by = JSON.stringify) {
  const seen = {};
  return array.filter((item) => {
    const key = by(item);
    return Object.prototype.hasOwnProperty.call(seen, key) ? false : seen[key] = true;
  });
}

// src/helpers/shortcodeToEmoji.ts
function shortcodeToEmoji(shortcode, emojis2) {
  return emojis2.find((item) => shortcode === item.name || item.shortcodes.includes(shortcode));
}

// src/emoji.ts
var EmojiSuggestionPluginKey = new PluginKey("emojiSuggestion");
var inputRegex = /:([a-zA-Z0-9_+-]+):$/;
var pasteRegex = /(^|\s):([a-zA-Z0-9_+-]+):/g;
var Emoji = Node.create({
  name: "emoji",
  inline: true,
  group: "inline",
  selectable: false,
  addOptions() {
    return {
      HTMLAttributes: {},
      emojis,
      enableEmoticons: false,
      forceFallbackImages: false,
      suggestion: {
        char: ":",
        pluginKey: EmojiSuggestionPluginKey,
        command: ({ editor, range, props }) => {
          var _a;
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = (_a = nodeAfter == null ? void 0 : nodeAfter.text) == null ? void 0 : _a.startsWith(" ");
          if (overrideSpace) {
            range.to += 1;
          }
          editor.chain().focus().insertContentAt(range, [
            {
              type: this.name,
              attrs: props
            },
            {
              type: "text",
              text: " "
            }
          ]).command(({ tr, state }) => {
            tr.setStoredMarks(state.doc.resolve(state.selection.to - 2).marks());
            return true;
          }).run();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const type = state.schema.nodes[this.name];
          const allow = !!$from.parent.type.contentMatch.matchType(type);
          return allow;
        }
      }
    };
  },
  addStorage() {
    const { emojis: emojis2 } = this.options;
    const supportMap = removeDuplicates(emojis2.map((item) => item.version)).filter((version) => typeof version === "number").reduce((versions, version) => {
      const emoji = emojis2.find((item) => item.version === version && item.emoji);
      return {
        ...versions,
        [version]: emoji ? isEmojiSupported(emoji.emoji) : false
      };
    }, {});
    return {
      emojis: this.options.emojis,
      isSupported: (emojiItem) => {
        return emojiItem.version ? supportMap[emojiItem.version] : false;
      }
    };
  },
  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.dataset.name,
        renderHTML: (attributes) => ({
          "data-name": attributes.name
        })
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`
      }
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis);
    const attributes = mergeAttributes(HTMLAttributes, this.options.HTMLAttributes, { "data-type": this.name });
    if (!emojiItem) {
      return ["span", attributes, `:${node.attrs.name}:`];
    }
    const isSupported = this.storage.isSupported(emojiItem);
    const hasEmoji = !!(emojiItem == null ? void 0 : emojiItem.emoji);
    const hasFallbackImage = !!(emojiItem == null ? void 0 : emojiItem.fallbackImage);
    const renderFallbackImage = this.options.forceFallbackImages && !hasEmoji || this.options.forceFallbackImages && hasFallbackImage || this.options.forceFallbackImages && !isSupported && hasFallbackImage || (!isSupported || !hasEmoji) && hasFallbackImage;
    return [
      "span",
      attributes,
      renderFallbackImage ? [
        "img",
        {
          src: emojiItem.fallbackImage,
          draggable: "false",
          loading: "lazy",
          align: "absmiddle",
          alt: `${emojiItem.name} emoji`
        }
      ] : emojiItem.emoji || `:${emojiItem.shortcodes[0]}:`
    ];
  },
  renderText({ node }) {
    const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis);
    return (emojiItem == null ? void 0 : emojiItem.emoji) || `:${node.attrs.name}:`;
  },
  renderMarkdown: (node) => {
    var _a;
    if (!((_a = node.attrs) == null ? void 0 : _a.name)) {
      return "";
    }
    return `:${node.attrs.name}:`;
  },
  addCommands() {
    return {
      setEmoji: (shortcode) => ({ chain }) => {
        const emojiItem = shortcodeToEmoji(shortcode, this.options.emojis);
        if (!emojiItem) {
          return false;
        }
        chain().insertContent({
          type: this.name,
          attrs: {
            name: emojiItem.name
          }
        }).command(({ tr, state }) => {
          tr.setStoredMarks(state.doc.resolve(state.selection.to - 1).marks());
          return true;
        }).run();
        return true;
      }
    };
  },
  addInputRules() {
    const inputRules = [];
    inputRules.push(
      new InputRule({
        find: inputRegex,
        handler: ({ range, match, chain }) => {
          const name = match[1];
          if (!shortcodeToEmoji(name, this.options.emojis)) {
            return;
          }
          chain().insertContentAt(range, {
            type: this.name,
            attrs: {
              name
            }
          }).command(({ tr, state }) => {
            tr.setStoredMarks(state.doc.resolve(state.selection.to - 1).marks());
            return true;
          }).run();
        }
      })
    );
    if (this.options.enableEmoticons) {
      const emoticons = this.options.emojis.flatMap((item) => item.emoticons).filter((item) => item);
      const emoticonRegex = new RegExp(`(?:^|\\s)(${emoticons.map((item) => escapeForRegEx(item)).join("|")}) $`);
      inputRules.push(
        nodeInputRule({
          find: emoticonRegex,
          type: this.type,
          getAttributes: (match) => {
            const emoji = this.options.emojis.find((item) => {
              var _a;
              return (_a = item.emoticons) == null ? void 0 : _a.includes(match[1]);
            });
            if (!emoji) {
              return;
            }
            return {
              name: emoji.name
            };
          }
        })
      );
    }
    return inputRules;
  },
  addPasteRules() {
    return [
      new PasteRule({
        find: pasteRegex,
        handler: ({ range, match, chain }) => {
          const prefix = match[1] || "";
          const name = match[2];
          if (!shortcodeToEmoji(name, this.options.emojis)) {
            return;
          }
          const shortcodeFrom = range.from + prefix.length;
          const shortcodeTo = range.to;
          chain().insertContentAt(
            { from: shortcodeFrom, to: shortcodeTo },
            {
              type: this.name,
              attrs: {
                name
              }
            },
            {
              updateSelection: false
            }
          ).command(({ tr, state }) => {
            tr.setStoredMarks(state.doc.resolve(state.selection.to - 1).marks());
            return true;
          }).run();
        }
      })
    ];
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      }),
      new Plugin({
        key: new PluginKey("emoji"),
        props: {
          // double click to select emoji doesn’t work by default
          // that’s why we simulate this behavior
          handleDoubleClickOn: (view, pos, node) => {
            if (node.type !== this.type) {
              return false;
            }
            const from = pos;
            const to = from + node.nodeSize;
            this.editor.commands.setTextSelection({
              from,
              to
            });
            return true;
          }
        },
        // replace text emojis with emoji node on any change
        appendTransaction: (transactions, oldState, newState) => {
          if (this.editor.view.composing) {
            return;
          }
          const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
          if (!docChanges) {
            return;
          }
          const { tr } = newState;
          const transform = combineTransactionSteps(oldState.doc, transactions);
          const changes = getChangedRanges(transform);
          changes.forEach(({ newRange }) => {
            if (newState.doc.resolve(newRange.from).parent.type.spec.code) {
              return;
            }
            const textNodes = findChildrenInRange(newState.doc, newRange, (node) => node.type.isText);
            textNodes.forEach(({ node, pos }) => {
              if (!node.text) {
                return;
              }
              const matches = [...node.text.matchAll(emojiRegex())];
              matches.forEach((match) => {
                if (match.index === void 0) {
                  return;
                }
                const emoji = match[0];
                const name = emojiToShortcode(emoji, this.options.emojis);
                if (!name) {
                  return;
                }
                const from = tr.mapping.map(pos + match.index);
                if (newState.doc.resolve(from).parent.type.spec.code) {
                  return;
                }
                const to = from + emoji.length;
                const emojiNode = this.type.create({
                  name
                });
                tr.replaceRangeWith(from, to, emojiNode);
                tr.setStoredMarks(newState.doc.resolve(from).marks());
              });
            });
          });
          if (!tr.steps.length) {
            return;
          }
          return tr;
        }
      })
    ];
  }
});

// src/index.ts
var index_default = Emoji;
export {
  Emoji,
  EmojiSuggestionPluginKey,
  index_default as default,
  emojiToShortcode,
  emojis,
  gitHubCustomEmojis,
  gitHubEmojis,
  inputRegex,
  pasteRegex,
  shortcodeToEmoji
};
//# sourceMappingURL=index.js.map
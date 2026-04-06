'use client'

import React from 'react'
const { useState, useMemo, useCallback, useEffect } = React

// ── Supabase helpers (now using API routes) ──
const SB_URL = ''; // Moved to server-side env vars
const SB_ANON_KEY = ''; // Moved to server-side env vars
let sbClient = true; // Connection indicator — API routes handle DB

const LS_KEY = 'ks-gear-analyzer-v2';
function lsLoad() { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch(e) { return null; } }
function lsSave(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {} }

function exportJSON(data) { const b = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'kingshot-config-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(a.href); }
function importJSON(cb) { const i = document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=e=>{const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{try{cb(JSON.parse(ev.target.result))}catch(e){alert('Invalid JSON')}}; r.readAsText(f)}; i.click(); }

async function sbInsert(table, data) { try { const r=await fetch('/api/'+table.replace('_','-'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); const j=await r.json(); return r.ok?{ok:true}:{error:j.error||'Failed'}; } catch(e){return{error:e.message}} }
async function sbSelect(table, adminKey) { try { const r=await fetch('/api/admin?table='+table+'&admin_key='+encodeURIComponent(adminKey||'')); const j=await r.json(); if(!r.ok) return{error:j.error||'HTTP '+r.status}; return{data:j.data}; } catch(e){return{error:e.message}} }

const GOV_GEAR_LEVELS = [{
  id: "none",
  label: "None",
  bonus: 0,
  tier: "none"
}, {
  id: "green0",
  label: "Green ☆0",
  bonus: 9.35,
  tier: "green"
}, {
  id: "green1",
  label: "Green ☆1",
  bonus: 12.75,
  tier: "green"
}, {
  id: "blue0",
  label: "Blue ☆0",
  bonus: 17.0,
  tier: "blue"
}, {
  id: "blue1",
  label: "Blue ☆1",
  bonus: 21.25,
  tier: "blue"
}, {
  id: "blue2",
  label: "Blue ☆2",
  bonus: 25.5,
  tier: "blue"
}, {
  id: "blue3",
  label: "Blue ☆3",
  bonus: 29.75,
  tier: "blue"
}, {
  id: "purple0",
  label: "Purple ☆0",
  bonus: 34.0,
  tier: "purple"
}, {
  id: "purple1",
  label: "Purple ☆1",
  bonus: 36.89,
  tier: "purple"
}, {
  id: "purple2",
  label: "Purple ☆2",
  bonus: 39.78,
  tier: "purple"
}, {
  id: "purple3",
  label: "Purple ☆3",
  bonus: 42.67,
  tier: "purple"
}, {
  id: "purpleT1_0",
  label: "Purple T1 ☆0",
  bonus: 45.56,
  tier: "purpleT1"
}, {
  id: "purpleT1_1",
  label: "Purple T1 ☆1",
  bonus: 48.45,
  tier: "purpleT1"
}, {
  id: "purpleT1_2",
  label: "Purple T1 ☆2",
  bonus: 51.34,
  tier: "purpleT1"
}, {
  id: "purpleT1_3",
  label: "Purple T1 ☆3",
  bonus: 54.23,
  tier: "purpleT1"
}, {
  id: "gold0",
  label: "Gold ☆0",
  bonus: 56.78,
  tier: "gold"
}, {
  id: "gold1",
  label: "Gold ☆1",
  bonus: 59.33,
  tier: "gold"
}, {
  id: "gold2",
  label: "Gold ☆2",
  bonus: 61.88,
  tier: "gold"
}, {
  id: "gold3",
  label: "Gold ☆3",
  bonus: 64.43,
  tier: "gold"
}, {
  id: "goldT1_0",
  label: "Gold T1 ☆0",
  bonus: 66.98,
  tier: "goldT1"
}, {
  id: "goldT1_1",
  label: "Gold T1 ☆1",
  bonus: 69.53,
  tier: "goldT1"
}, {
  id: "goldT1_2",
  label: "Gold T1 ☆2",
  bonus: 72.08,
  tier: "goldT1"
}, {
  id: "goldT1_3",
  label: "Gold T1 ☆3",
  bonus: 74.63,
  tier: "goldT1"
}, {
  id: "goldT2_0",
  label: "Gold T2 ☆0",
  bonus: 77.18,
  tier: "goldT2"
}, {
  id: "goldT2_1",
  label: "Gold T2 ☆1",
  bonus: 79.73,
  tier: "goldT2"
}, {
  id: "goldT2_2",
  label: "Gold T2 ☆2",
  bonus: 82.28,
  tier: "goldT2"
}, {
  id: "goldT2_3",
  label: "Gold T2 ☆3",
  bonus: 84.83,
  tier: "goldT2"
}, {
  id: "goldT3_0",
  label: "Gold T3 ☆0",
  bonus: 87.38,
  tier: "goldT3"
}, {
  id: "goldT3_1",
  label: "Gold T3 ☆1",
  bonus: 89.93,
  tier: "goldT3"
}, {
  id: "goldT3_2",
  label: "Gold T3 ☆2",
  bonus: 92.48,
  tier: "goldT3"
}, {
  id: "goldT3_3",
  label: "Gold T3 ☆3",
  bonus: 95.0,
  tier: "goldT3"
}, {
  id: "red0",
  label: "Red ☆0",
  bonus: 97.5,
  tier: "red"
}, {
  id: "red1",
  label: "Red ☆1",
  bonus: 100.0,
  tier: "red"
}, {
  id: "red2",
  label: "Red ☆2",
  bonus: 102.5,
  tier: "red"
}, {
  id: "red3",
  label: "Red ☆3",
  bonus: 105.0,
  tier: "red"
}, {
  id: "redT1_0",
  label: "Red T1 ☆0",
  bonus: 107.5,
  tier: "redT1"
}, {
  id: "redT1_1",
  label: "Red T1 ☆1",
  bonus: 110.0,
  tier: "redT1"
}, {
  id: "redT1_2",
  label: "Red T1 ☆2",
  bonus: 112.5,
  tier: "redT1"
}, {
  id: "redT1_3",
  label: "Red T1 ☆3",
  bonus: 115.0,
  tier: "redT1"
}, {
  id: "redT2_0",
  label: "Red T2 ☆0",
  bonus: 117.5,
  tier: "redT2"
}, {
  id: "redT2_1",
  label: "Red T2 ☆1",
  bonus: 120.0,
  tier: "redT2"
}, {
  id: "redT2_2",
  label: "Red T2 ☆2",
  bonus: 122.5,
  tier: "redT2"
}, {
  id: "redT2_3",
  label: "Red T2 ☆3",
  bonus: 125.0,
  tier: "redT2"
}, {
  id: "redT3_0",
  label: "Red T3 ☆0",
  bonus: 127.75,
  tier: "redT3"
}, {
  id: "redT3_1",
  label: "Red T3 ☆1",
  bonus: 130.5,
  tier: "redT3"
}, {
  id: "redT3_2",
  label: "Red T3 ☆2",
  bonus: 133.25,
  tier: "redT3"
}, {
  id: "redT3_3",
  label: "Red T3 ☆3",
  bonus: 136.0,
  tier: "redT3"
}, {
  id: "redT4_0",
  label: "Red T4 ☆0",
  bonus: 138.75,
  tier: "redT4"
}, {
  id: "redT4_1",
  label: "Red T4 ☆1",
  bonus: 141.5,
  tier: "redT4"
}, {
  id: "redT4_2",
  label: "Red T4 ☆2",
  bonus: 144.25,
  tier: "redT4"
}, {
  id: "redT4_3",
  label: "Red T4 ☆3",
  bonus: 147.0,
  tier: "redT4"
}, {
  id: "redT5_0",
  label: "Red T5 ☆0",
  bonus: 150.0,
  tier: "redT5"
}, {
  id: "redT5_1",
  label: "Red T5 ☆1",
  bonus: 153.0,
  tier: "redT5"
}, {
  id: "redT5_2",
  label: "Red T5 ☆2",
  bonus: 156.0,
  tier: "redT5"
}, {
  id: "redT5_3",
  label: "Red T5 ☆3",
  bonus: 159.0,
  tier: "redT5"
}, {
  id: "redT6_0",
  label: "Red T6 ☆0",
  bonus: 162.0,
  tier: "redT6"
}, {
  id: "redT6_1",
  label: "Red T6 ☆1",
  bonus: 165.0,
  tier: "redT6"
}, {
  id: "redT6_2",
  label: "Red T6 ☆2",
  bonus: 168.0,
  tier: "redT6"
}, {
  id: "redT6_3",
  label: "Red T6 ☆3",
  bonus: 171.0,
  tier: "redT6"
}];

// Set Bonus: 3pc same quality = Defense%, 6pc same quality = Attack% (ALL troop types)
// The game checks the MINIMUM tier across all 6 pieces for set qualification
// Tier groups for set bonus purposes: green, blue, purple, purpleT1, gold, goldT1-T3, red, redT1-T6
// Set bonus values scale with tier. Exact values from community research + in-game screenshots
// Format: { tierGroup: "label", defBonus3pc: %, atkBonus6pc: % }
const SET_BONUSES = [{
  tier: "green",
  label: "Green",
  def3: 3.0,
  atk6: 3.0
}, {
  tier: "blue",
  label: "Blue",
  def3: 5.0,
  atk6: 5.0
}, {
  tier: "purple",
  label: "Purple",
  def3: 8.0,
  atk6: 8.0
}, {
  tier: "purpleT1",
  label: "Purple T1",
  def3: 10.0,
  atk6: 10.0
}, {
  tier: "gold",
  label: "Gold",
  def3: 12.0,
  atk6: 14.0
}, {
  tier: "goldT1",
  label: "Gold T1",
  def3: 14.0,
  atk6: 16.0
}, {
  tier: "goldT2",
  label: "Gold T2",
  def3: 16.5,
  atk6: 19.0
}, {
  tier: "goldT3",
  label: "Gold T3",
  def3: 19.0,
  atk6: 22.0
}, {
  tier: "red",
  label: "Red",
  def3: 22.0,
  atk6: 25.0
}, {
  tier: "redT1",
  label: "Red T1",
  def3: 25.0,
  atk6: 28.0
}, {
  tier: "redT2",
  label: "Red T2",
  def3: 28.0,
  atk6: 31.0
}, {
  tier: "redT3",
  label: "Red T3",
  def3: 31.0,
  atk6: 34.0
}, {
  tier: "redT4",
  label: "Red T4",
  def3: 34.0,
  atk6: 37.0
}, {
  tier: "redT5",
  label: "Red T5",
  def3: 37.0,
  atk6: 40.0
}, {
  tier: "redT6",
  label: "Red T6",
  def3: 40.0,
  atk6: 43.0
}];

// Governor Gear pieces and their troop type mappings
const GOV_GEAR_PIECES = [{
  key: "wreath",
  label: "Wreath",
  troop: "cav",
  icon: "👑"
}, {
  key: "charmstone",
  label: "Charmstone",
  troop: "cav",
  icon: "💎"
}, {
  key: "garb",
  label: "Garb",
  troop: "inf",
  icon: "🛡️"
}, {
  key: "gaiters",
  label: "Gaiters",
  troop: "inf",
  icon: "👢"
}, {
  key: "ring",
  label: "Ring",
  troop: "arch",
  icon: "💍"
}, {
  key: "shortstaff",
  label: "Shortstaff",
  troop: "arch",
  icon: "🪄"
}];

// Governor Gear CUMULATIVE material costs per piece (verified from kingshot.net + kingshotwiki)
const GOV_GEAR_COSTS = [{
  id: "none",
  satin: 0,
  gilded: 0,
  vision: 0
}, {
  id: "green0",
  satin: 1500,
  gilded: 15,
  vision: 0
}, {
  id: "green1",
  satin: 5300,
  gilded: 55,
  vision: 0
}, {
  id: "blue0",
  satin: 12300,
  gilded: 125,
  vision: 0
}, {
  id: "blue1",
  satin: 22000,
  gilded: 220,
  vision: 0
}, {
  id: "blue2",
  satin: 23000,
  gilded: 230,
  vision: 45
}, {
  id: "blue3",
  satin: 24000,
  gilded: 240,
  vision: 95
}, {
  id: "purple0",
  satin: 25500,
  gilded: 255,
  vision: 155
}, {
  id: "purple1",
  satin: 27000,
  gilded: 270,
  vision: 225
}, {
  id: "purple2",
  satin: 33500,
  gilded: 335,
  vision: 265
}, {
  id: "purple3",
  satin: 41500,
  gilded: 415,
  vision: 315
}, {
  id: "purpleT1_0",
  satin: 51500,
  gilded: 510,
  vision: 375
}, {
  id: "purpleT1_1",
  satin: 62500,
  gilded: 620,
  vision: 445
}, {
  id: "purpleT1_2",
  satin: 75500,
  gilded: 750,
  vision: 530
}, {
  id: "purpleT1_3",
  satin: 90500,
  gilded: 910,
  vision: 630
}, {
  id: "gold0",
  satin: 112500,
  gilded: 1130,
  vision: 670
}, {
  id: "gold1",
  satin: 135500,
  gilded: 1360,
  vision: 710
}, {
  id: "gold2",
  satin: 160500,
  gilded: 1610,
  vision: 755
}, {
  id: "gold3",
  satin: 186500,
  gilded: 1870,
  vision: 800
}, {
  id: "goldT1_0",
  satin: 214500,
  gilded: 2150,
  vision: 845
}, {
  id: "goldT1_1",
  satin: 244500,
  gilded: 2450,
  vision: 900
}, {
  id: "goldT1_2",
  satin: 276500,
  gilded: 2770,
  vision: 955
}, {
  id: "goldT1_3",
  satin: 311500,
  gilded: 3110,
  vision: 1010
}, {
  id: "goldT2_0",
  satin: 349500,
  gilded: 3500,
  vision: 1065
}, {
  id: "goldT2_1",
  satin: 392500,
  gilded: 3930,
  vision: 1140
}, {
  id: "goldT2_2",
  satin: 437500,
  gilded: 4390,
  vision: 1220
}, {
  id: "goldT2_3",
  satin: 485500,
  gilded: 4890,
  vision: 1305
}, {
  id: "goldT3_0",
  satin: 545500,
  gilded: 5490,
  vision: 1425
}, {
  id: "goldT3_1",
  satin: 615500,
  gilded: 6190,
  vision: 1565
}, {
  id: "goldT3_2",
  satin: 695500,
  gilded: 6990,
  vision: 1725
}, {
  id: "goldT3_3",
  satin: 785500,
  gilded: 7890,
  vision: 1905
}, {
  id: "red0",
  satin: 893500,
  gilded: 8970,
  vision: 2125
}, {
  id: "red1",
  satin: 1007500,
  gilded: 10110,
  vision: 2355
}, {
  id: "red2",
  satin: 1128500,
  gilded: 11320,
  vision: 2595
}, {
  id: "red3",
  satin: 1256500,
  gilded: 12600,
  vision: 2845
}, {
  id: "redT1_0",
  satin: 1410500,
  gilded: 14140,
  vision: 3145
}, {
  id: "redT1_1",
  satin: 1573500,
  gilded: 15770,
  vision: 3465
}, {
  id: "redT1_2",
  satin: 1746500,
  gilded: 17500,
  vision: 3805
}, {
  id: "redT1_3",
  satin: 1929500,
  gilded: 19330,
  vision: 4165
}, {
  id: "redT2_0",
  satin: 2149500,
  gilded: 21530,
  vision: 4595
}, {
  id: "redT2_1",
  satin: 2382500,
  gilded: 23860,
  vision: 5055
}, {
  id: "redT2_2",
  satin: 2629500,
  gilded: 26330,
  vision: 5545
}, {
  id: "redT2_3",
  satin: 2893500,
  gilded: 28970,
  vision: 6065
}, {
  id: "redT3_0",
  satin: 3199500,
  gilded: 32030,
  vision: 6675
}, {
  id: "redT3_1",
  satin: 3522500,
  gilded: 35260,
  vision: 7325
}, {
  id: "redT3_2",
  satin: 3862500,
  gilded: 38660,
  vision: 8015
}, {
  id: "redT3_3",
  satin: 4219500,
  gilded: 42230,
  vision: 8745
}, {
  id: "redT4_0",
  satin: 4631500,
  gilded: 46350,
  vision: 9585
}, {
  id: "redT4_1",
  satin: 5064500,
  gilded: 50680,
  vision: 10475
}, {
  id: "redT4_2",
  satin: 5518500,
  gilded: 55220,
  vision: 11415
}, {
  id: "redT4_3",
  satin: 5993500,
  gilded: 59970,
  vision: 12405
}, {
  id: "redT5_0",
  satin: 6472500,
  gilded: 64760,
  vision: 12405
}, {
  id: "redT5_1",
  satin: 6965500,
  gilded: 69690,
  vision: 12405
}, {
  id: "redT5_2",
  satin: 6965500,
  gilded: 69690,
  vision: 12405
}, {
  id: "redT5_3",
  satin: 6965500,
  gilded: 69690,
  vision: 12405
}, {
  id: "redT6_0",
  satin: 6965500,
  gilded: 69690,
  vision: 12405
}, {
  id: "redT6_1",
  satin: 7530500,
  gilded: 75340,
  vision: 13545
}, {
  id: "redT6_2",
  satin: 8112500,
  gilded: 81160,
  vision: 14715
}, {
  id: "redT6_3",
  satin: 8711500,
  gilded: 87150,
  vision: 15925
}];

// Charm material costs PER LEVEL (Charm Guides + Charm Designs) from kingshot.net
const CHARM_COSTS = [{
  level: 1,
  guides: 5,
  designs: 5
}, {
  level: 2,
  guides: 40,
  designs: 15
}, {
  level: 3,
  guides: 60,
  designs: 40
}, {
  level: 4,
  guides: 80,
  designs: 100
}, {
  level: 5,
  guides: 100,
  designs: 200
}, {
  level: 6,
  guides: 120,
  designs: 300
}, {
  level: 7,
  guides: 140,
  designs: 400
}, {
  level: 8,
  guides: 200,
  designs: 400
}, {
  level: 9,
  guides: 300,
  designs: 400
}, {
  level: 10,
  guides: 420,
  designs: 420
}, {
  level: 11,
  guides: 560,
  designs: 420
}, {
  level: 12,
  guides: 580,
  designs: 600
}, {
  level: 13,
  guides: 610,
  designs: 780
}, {
  level: 14,
  guides: 645,
  designs: 960
}, {
  level: 15,
  guides: 685,
  designs: 1140
}, {
  level: 16,
  guides: 730,
  designs: 1320
}, {
  level: 17,
  guides: 780,
  designs: 1500
}, {
  level: 18,
  guides: 835,
  designs: 1680
}, {
  level: 19,
  guides: 895,
  designs: 1860
}, {
  level: 20,
  guides: 960,
  designs: 2040
}, {
  level: 21,
  guides: 1030,
  designs: 2220
}, {
  level: 22,
  guides: 1105,
  designs: 2400
}];

// Hero Gear enhance XP per-level bands (cost per band of 20 levels)
const ENHANCE_BANDS = [{
  from: 0,
  to: 20,
  xp: 52650,
  mithril: 10,
  mhg: 5
}, {
  from: 20,
  to: 40,
  xp: 75050,
  mithril: 20,
  mhg: 5
}, {
  from: 40,
  to: 60,
  xp: 93100,
  mithril: 30,
  mhg: 5
}, {
  from: 60,
  to: 80,
  xp: 121600,
  mithril: 40,
  mhg: 10
}, {
  from: 80,
  to: 100,
  xp: 159600,
  mithril: 50,
  mhg: 10
},
// Red bands (101-200): XP continues to scale, Mithril needed every 20 levels
{
  from: 100,
  to: 120,
  xp: 198000,
  mithril: 60,
  mhg: 15
}, {
  from: 120,
  to: 140,
  xp: 240000,
  mithril: 70,
  mhg: 15
}, {
  from: 140,
  to: 160,
  xp: 286000,
  mithril: 80,
  mhg: 20
}, {
  from: 160,
  to: 180,
  xp: 336000,
  mithril: 90,
  mhg: 20
}, {
  from: 180,
  to: 200,
  xp: 390000,
  mithril: 100,
  mhg: 25
}];

// Forgehammer costs per mastery level
const FORGE_COSTS = Array.from({
  length: 20
}, (_, i) => ({
  level: i + 1,
  hammers: (i + 1) * 10,
  mhg: i >= 10 ? i - 9 : 0
}));

// Cost calculation helpers
function calcGovUpgradeCost(fromId, toId, numPieces) {
  const fromC = GOV_GEAR_COSTS.find(c => c.id === fromId) || GOV_GEAR_COSTS[0];
  const toC = GOV_GEAR_COSTS.find(c => c.id === toId) || GOV_GEAR_COSTS[0];
  return {
    satin: Math.max(0, toC.satin - fromC.satin) * numPieces,
    gilded: Math.max(0, toC.gilded - fromC.gilded) * numPieces,
    vision: Math.max(0, toC.vision - fromC.vision) * numPieces
  };
}
function calcCharmUpgradeCost(fromLv, toLv, numCharms) {
  let guides = 0,
    designs = 0;
  for (let lv = fromLv + 1; lv <= toLv; lv++) {
    const c = CHARM_COSTS.find(x => x.level === lv);
    if (c) {
      guides += c.guides;
      designs += c.designs;
    }
  }
  return {
    guides: guides * numCharms,
    designs: designs * numCharms
  };
}
function calcEnhanceUpgradeCost(fromLv, toLv, numPieces) {
  let xp = 0,
    mithril = 0,
    mhg = 0;
  for (const band of ENHANCE_BANDS) {
    const lo = Math.max(fromLv, band.from);
    const hi = Math.min(toLv, band.to);
    if (hi > lo) {
      const frac = (hi - lo) / (band.to - band.from);
      xp += band.xp * frac;
      mithril += band.mithril * frac;
      mhg += band.mhg * frac;
    }
  }
  return {
    xp: Math.round(xp) * numPieces,
    mithril: Math.round(mithril) * numPieces,
    mhg: Math.round(mhg) * numPieces
  };
}
function calcForgeUpgradeCost(fromLv, toLv, numPieces) {
  let hammers = 0,
    mhg = 0;
  for (let i = fromLv; i < toLv; i++) {
    const c = FORGE_COSTS[i];
    if (c) {
      hammers += c.hammers;
      mhg += c.mhg;
    }
  }
  return {
    hammers: hammers * numPieces,
    mhg: mhg * numPieces
  };
}

// Charm levels 0-22: each charm gives Lethality% AND Health% for its troop type
// Verified from kingshot.net/database/governor-charm
const CHARM_LEVELS = [{
  level: 0,
  bonus: 0
}, {
  level: 1,
  bonus: 9.0
}, {
  level: 2,
  bonus: 12.0
}, {
  level: 3,
  bonus: 16.0
}, {
  level: 4,
  bonus: 19.0
}, {
  level: 5,
  bonus: 25.0
}, {
  level: 6,
  bonus: 30.0
}, {
  level: 7,
  bonus: 35.0
}, {
  level: 8,
  bonus: 40.0
}, {
  level: 9,
  bonus: 45.0
}, {
  level: 10,
  bonus: 50.0
}, {
  level: 11,
  bonus: 55.0
}, {
  level: 12,
  bonus: 59.0
}, {
  level: 13,
  bonus: 63.0
}, {
  level: 14,
  bonus: 67.0
}, {
  level: 15,
  bonus: 71.0
}, {
  level: 16,
  bonus: 75.0
}, {
  level: 17,
  bonus: 79.0
}, {
  level: 18,
  bonus: 83.0
}, {
  level: 19,
  bonus: 87.0
}, {
  level: 20,
  bonus: 91.0
}, {
  level: 21,
  bonus: 95.0
}, {
  level: 22,
  bonus: 99.0
}];

// Charm slots: 3 per gov gear piece = 18 total, 6 per troop type
const CHARM_SLOTS = [{
  key: "cav1",
  troop: "cav",
  label: "Cav 1"
}, {
  key: "cav2",
  troop: "cav",
  label: "Cav 2"
}, {
  key: "cav3",
  troop: "cav",
  label: "Cav 3"
}, {
  key: "cav4",
  troop: "cav",
  label: "Cav 4"
}, {
  key: "cav5",
  troop: "cav",
  label: "Cav 5"
}, {
  key: "cav6",
  troop: "cav",
  label: "Cav 6"
}, {
  key: "inf1",
  troop: "inf",
  label: "Inf 1"
}, {
  key: "inf2",
  troop: "inf",
  label: "Inf 2"
}, {
  key: "inf3",
  troop: "inf",
  label: "Inf 3"
}, {
  key: "inf4",
  troop: "inf",
  label: "Inf 4"
}, {
  key: "inf5",
  troop: "inf",
  label: "Inf 5"
}, {
  key: "inf6",
  troop: "inf",
  label: "Inf 6"
}, {
  key: "arch1",
  troop: "arch",
  label: "Arc 1"
}, {
  key: "arch2",
  troop: "arch",
  label: "Arc 2"
}, {
  key: "arch3",
  troop: "arch",
  label: "Arc 3"
}, {
  key: "arch4",
  troop: "arch",
  label: "Arc 4"
}, {
  key: "arch5",
  troop: "arch",
  label: "Arc 5"
}, {
  key: "arch6",
  troop: "arch",
  label: "Arc 6"
}];

// Hero Gear slots: 3 heroes × 4 pieces
// Helm/Greaves = Lethality, Gloves/Shroud = Health
// Mythic (Gold) formula: Final = (50 + 0.5 * enhanceLevel) * (1 + forgeLv * 0.10), max enhance=100
// Red formula: same formula but enhance goes to 200, base is higher
// Red base at enhance 0 = 100% (vs Mythic 50%), because red is imbued from Lv100 mythic
// Red: Final = (100 + 0.5 * (enhanceLevel - 100)) * (1 + forgeLv * 0.10) for levels 101-200
// Actually, Red continues the same enhance scale but the enhance level shown resets or continues
// From screenshots: Red +100 enhance with Forge 20 = 300%, matching Mythic +100 Forge 20
// So Red essentially just extends enhance to 200 with same 0.5/level formula
const HERO_GEAR_SLOTS = [{
  key: "inf_helm",
  hero: "inf",
  label: "Helm",
  stat: "leth",
  icon: "⛑️"
}, {
  key: "inf_gloves",
  hero: "inf",
  label: "Gloves",
  stat: "hp",
  icon: "🧤"
}, {
  key: "inf_shroud",
  hero: "inf",
  label: "Shroud",
  stat: "hp",
  icon: "🦺"
}, {
  key: "inf_greaves",
  hero: "inf",
  label: "Greaves",
  stat: "leth",
  icon: "🥾"
}, {
  key: "cav_helm",
  hero: "cav",
  label: "Helm",
  stat: "leth",
  icon: "⛑️"
}, {
  key: "cav_gloves",
  hero: "cav",
  label: "Gloves",
  stat: "hp",
  icon: "🧤"
}, {
  key: "cav_shroud",
  hero: "cav",
  label: "Shroud",
  stat: "hp",
  icon: "🦺"
}, {
  key: "cav_greaves",
  hero: "cav",
  label: "Greaves",
  stat: "leth",
  icon: "🥾"
}, {
  key: "arch_helm",
  hero: "arch",
  label: "Helm",
  stat: "leth",
  icon: "⛑️"
}, {
  key: "arch_gloves",
  hero: "arch",
  label: "Gloves",
  stat: "hp",
  icon: "🧤"
}, {
  key: "arch_shroud",
  hero: "arch",
  label: "Shroud",
  stat: "hp",
  icon: "🦺"
}, {
  key: "arch_greaves",
  hero: "arch",
  label: "Greaves",
  stat: "leth",
  icon: "🥾"
}];
const TROOP_NAMES = {
  inf: "Infantry",
  cav: "Cavalry",
  arch: "Archer"
};
const TROOP_COLORS = {
  inf: "#2dd4bf",
  cav: "#60a5fa",
  arch: "#f472b6"
};
const STAT_LABELS = {
  atk: "Attack",
  def: "Defense",
  leth: "Lethality",
  hp: "Health"
};

// ═══════════════════════════════════════════════════════════════
// CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════

function calcHeroGearStat(enhanceLv, forgeLv, isRed) {
  // Mythic: base=50 at enhance 0, +0.5 per enhance, max enhance=100
  // Red: continues from where mythic left off. enhance 0 on red = mythic enhance 100
  // Red enhance goes 0-200 but effectively the gear keeps enhance level continuous
  // For simplicity: if Red, enhance can go 0-200. Base is still 50 + 0.5*enhance
  // because Red gear retains the mythic enhance level + extends it
  // User inputs enhance level as the number shown on the gear
  const base = 50 + 0.5 * enhanceLv;
  return base * (1 + forgeLv * 0.1);
}
function calcHeroGearImbuement(enhanceLv, stat) {
  let atkBonus = 0,
    defBonus = 0;
  if (stat === "leth") {
    if (enhanceLv >= 20) atkBonus += 20;
    if (enhanceLv >= 60) defBonus += 30;
    if (enhanceLv >= 100) atkBonus += 50;
    // Red imbuements at 120/160/200
    if (enhanceLv >= 120) defBonus += 20;
    if (enhanceLv >= 160) atkBonus += 30;
    if (enhanceLv >= 200) defBonus += 50;
  } else {
    if (enhanceLv >= 20) defBonus += 20;
    if (enhanceLv >= 60) atkBonus += 30;
    if (enhanceLv >= 100) defBonus += 50;
    if (enhanceLv >= 120) atkBonus += 20;
    if (enhanceLv >= 160) defBonus += 30;
    if (enhanceLv >= 200) atkBonus += 50;
  }
  return {
    atkBonus,
    defBonus
  };
}

// Determine the minimum tier across all 6 governor gear pieces for set bonus
const TIER_ORDER = ["none", "green", "blue", "purple", "purpleT1", "gold", "goldT1", "goldT2", "goldT3", "red", "redT1", "redT2", "redT3", "redT4", "redT5", "redT6"];
function getTierRank(tierId) {
  const idx = TIER_ORDER.indexOf(tierId);
  return idx >= 0 ? idx : 0;
}
function calcSetBonuses(govGear) {
  // Get the tier of each piece
  const tiers = GOV_GEAR_PIECES.map(p => {
    const levelId = govGear[p.key];
    const level = GOV_GEAR_LEVELS.find(g => g.id === levelId);
    return level ? level.tier : "none";
  });

  // Count pieces at each tier rank or above
  const tierRanks = tiers.map(t => getTierRank(t));

  // For set bonuses: check which tier ALL 3 or ALL 6 pieces meet
  // 3pc: min of top 3 pieces (sorted desc)
  // 6pc: min of all 6 pieces
  const sorted = [...tierRanks].sort((a, b) => b - a);
  const min3 = sorted[2]; // 3rd highest = minimum of top 3
  const min6 = sorted[5]; // lowest of all 6

  let def3 = 0,
    atk6 = 0;
  const tier3Name = TIER_ORDER[min3];
  const tier6Name = TIER_ORDER[min6];
  const setBonus3 = SET_BONUSES.find(s => s.tier === tier3Name);
  const setBonus6 = SET_BONUSES.find(s => s.tier === tier6Name);
  if (setBonus3) def3 = setBonus3.def3;
  if (setBonus6) atk6 = setBonus6.atk6;
  return {
    def3,
    atk6,
    tier3Name,
    tier6Name
  };
}
function computeAllStats(playerData) {
  const stats = {};
  for (const troop of ["inf", "cav", "arch"]) {
    stats[troop] = {
      atk: 0,
      def: 0,
      leth: 0,
      hp: 0
    };
  }

  // Governor Gear per-piece stats
  for (const piece of GOV_GEAR_PIECES) {
    const levelId = playerData.govGear[piece.key];
    const level = GOV_GEAR_LEVELS.find(g => g.id === levelId);
    if (level) {
      stats[piece.troop].atk += level.bonus;
      stats[piece.troop].def += level.bonus;
    }
  }

  // Governor Gear set bonuses (apply to ALL troop types)
  const setB = calcSetBonuses(playerData.govGear);
  for (const troop of ["inf", "cav", "arch"]) {
    stats[troop].def += setB.def3;
    stats[troop].atk += setB.atk6;
  }

  // Charms
  for (const slot of CHARM_SLOTS) {
    const charmLv = playerData.charms[slot.key] || 0;
    const charm = CHARM_LEVELS.find(c => c.level === charmLv);
    if (charm) {
      stats[slot.troop].leth += charm.bonus;
      stats[slot.troop].hp += charm.bonus;
    }
  }

  // Hero Gear
  for (const slot of HERO_GEAR_SLOTS) {
    const gear = playerData.heroGear[slot.key] || {
      enhance: 0,
      forge: 0,
      isRed: false
    };
    const maxEnh = gear.isRed ? 200 : 100;
    const enh = Math.min(gear.enhance, maxEnh);
    const expStat = calcHeroGearStat(enh, gear.forge, gear.isRed);
    if (slot.stat === "leth") stats[slot.hero].leth += expStat;else stats[slot.hero].hp += expStat;
    const imb = calcHeroGearImbuement(enh, slot.stat);
    stats[slot.hero].atk += imb.atkBonus;
    stats[slot.hero].def += imb.defBonus;
  }

  // Pet power
  const petPower = playerData.petPower || 0;
  for (const troop of ["inf", "cav", "arch"]) {
    stats[troop].atk += petPower * 0.001;
    stats[troop].def += petPower * 0.001;
  }
  return stats;
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE
// ═══════════════════════════════════════════════════════════════

function generateRecommendations(myData, oppData) {
  const myStats = computeAllStats(myData);
  const oppStats = computeAllStats(oppData);
  const recs = [];

  // Gov Gear upgrades
  for (const piece of GOV_GEAR_PIECES) {
    const currentId = myData.govGear[piece.key];
    const currentIdx = GOV_GEAR_LEVELS.findIndex(g => g.id === currentId);
    if (currentIdx < GOV_GEAR_LEVELS.length - 1) {
      const nextLevel = GOV_GEAR_LEVELS[currentIdx + 1];
      const currentLevel = GOV_GEAR_LEVELS[currentIdx];
      const statGain = nextLevel.bonus - currentLevel.bonus;
      const atkGap = oppStats[piece.troop].atk - myStats[piece.troop].atk;
      const defGap = oppStats[piece.troop].def - myStats[piece.troop].def;
      const gapRelevance = Math.max(0, atkGap, defGap) > 0 ? 2.0 : 1.0;
      const impact = statGain * 2 * gapRelevance;
      const costScore = Math.max(1, currentIdx * 2);
      recs.push({
        type: "govGear",
        piece: piece.key,
        troop: piece.troop,
        label: `${piece.icon} ${piece.label} → ${nextLevel.label}`,
        statGain: `+${statGain.toFixed(2)}% Atk & Def`,
        impact,
        costScore,
        efficiency: impact / costScore
      });
    }
  }

  // Charm upgrades
  for (const slot of CHARM_SLOTS) {
    const currentLv = myData.charms[slot.key] || 0;
    if (currentLv < 22) {
      const currentBonus = CHARM_LEVELS[currentLv]?.bonus || 0;
      const nextBonus = CHARM_LEVELS[currentLv + 1]?.bonus || 0;
      const gain = nextBonus - currentBonus;
      const lethGap = oppStats[slot.troop].leth - myStats[slot.troop].leth;
      const hpGap = oppStats[slot.troop].hp - myStats[slot.troop].hp;
      const gapRelevance = Math.max(0, lethGap, hpGap) > 0 ? 2.0 : 1.0;
      const impact = gain * 2 * gapRelevance;
      const costScore = Math.max(1, (currentLv + 1) * 2.5);
      recs.push({
        type: "charm",
        piece: slot.key,
        troop: slot.troop,
        label: `${slot.label} Lv${currentLv} → Lv${currentLv + 1}`,
        statGain: `+${gain.toFixed(1)}% Leth & HP`,
        impact,
        costScore,
        efficiency: impact / costScore
      });
    }
  }

  // Hero Gear upgrades
  for (const slot of HERO_GEAR_SLOTS) {
    const gear = myData.heroGear[slot.key] || {
      enhance: 0,
      forge: 0,
      isRed: false
    };
    const maxEnh = gear.isRed ? 200 : 100;
    if (gear.enhance < maxEnh) {
      const step = Math.min(10, maxEnh - gear.enhance);
      const newEnh = gear.enhance + step;
      const oldStat = calcHeroGearStat(gear.enhance, gear.forge, gear.isRed);
      const newStat = calcHeroGearStat(newEnh, gear.forge, gear.isRed);
      const gain = newStat - oldStat;
      const relevantGap = slot.stat === "leth" ? oppStats[slot.hero].leth - myStats[slot.hero].leth : oppStats[slot.hero].hp - myStats[slot.hero].hp;
      const gapRelevance = relevantGap > 0 ? 2.0 : 1.0;
      const impact = gain * gapRelevance;
      const costScore = Math.max(1, gear.enhance / 5 + 2);
      recs.push({
        type: "heroEnhance",
        piece: slot.key,
        troop: slot.hero,
        label: `${slot.icon} ${TROOP_NAMES[slot.hero]} ${slot.label} +${gear.enhance}→+${newEnh}`,
        statGain: `+${gain.toFixed(1)}% ${slot.stat === "leth" ? "Leth" : "HP"}`,
        impact,
        costScore,
        efficiency: impact / costScore
      });
    }
    if (gear.forge < 20) {
      const oldStat = calcHeroGearStat(gear.enhance, gear.forge, gear.isRed);
      const newStat = calcHeroGearStat(gear.enhance, gear.forge + 1, gear.isRed);
      const gain = newStat - oldStat;
      const relevantGap = slot.stat === "leth" ? oppStats[slot.hero].leth - myStats[slot.hero].leth : oppStats[slot.hero].hp - myStats[slot.hero].hp;
      const gapRelevance = relevantGap > 0 ? 2.0 : 1.0;
      const impact = gain * gapRelevance;
      const costScore = Math.max(1, (gear.forge + 1) * 3);
      recs.push({
        type: "heroForge",
        piece: slot.key,
        troop: slot.hero,
        label: `${slot.icon} ${TROOP_NAMES[slot.hero]} ${slot.label} Forge ${gear.forge}→${gear.forge + 1}`,
        statGain: `+${gain.toFixed(1)}% ${slot.stat === "leth" ? "Leth" : "HP"}`,
        impact,
        costScore,
        efficiency: impact / costScore
      });
    }
  }
  recs.sort((a, b) => b.efficiency - a.efficiency);
  return recs.slice(0, 25);
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT DATA
// ═══════════════════════════════════════════════════════════════

function makeDefaultPlayer() {
  const govGear = {};
  GOV_GEAR_PIECES.forEach(p => govGear[p.key] = "none");
  const charms = {};
  CHARM_SLOTS.forEach(s => charms[s.key] = 0);
  const heroGear = {};
  HERO_GEAR_SLOTS.forEach(s => heroGear[s.key] = {
    enhance: 0,
    forge: 0,
    isRed: false
  });
  return {
    govGear,
    charms,
    heroGear,
    petPower: 0
  };
}
function makeMyDefaults() {
  const d = makeDefaultPlayer();
  d.govGear.wreath = "goldT2_0";
  d.govGear.charmstone = "goldT1_0";
  d.govGear.garb = "goldT2_0";
  d.govGear.gaiters = "goldT2_0";
  d.govGear.ring = "goldT1_0";
  d.govGear.shortstaff = "goldT1_0";
  d.heroGear.inf_helm = {
    enhance: 79,
    forge: 15,
    isRed: false
  };
  d.heroGear.inf_gloves = {
    enhance: 100,
    forge: 20,
    isRed: false
  };
  d.heroGear.inf_shroud = {
    enhance: 99,
    forge: 19,
    isRed: false
  };
  d.heroGear.inf_greaves = {
    enhance: 39,
    forge: 14,
    isRed: false
  };
  return d;
}

// ═══════════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════════

// Simulator-matching design tokens
const C = {
  bg: "#06080d",
  bg2: "#0c1018",
  panel: "#101520",
  panelBorder: "#1a2035",
  panelHover: "#151d30",
  accent: "#f59e0b",
  accentDim: "#92620a",
  red: "#ef4444",
  redDim: "#7f1d1d",
  blue: "#3b82f6",
  blueDim: "#1e3a5f",
  green: "#22c55e",
  greenDim: "#14532d",
  violet: "#a78bfa",
  text: "#e2e8f0",
  textDim: "#64748b",
  textMuted: "#475569",
  inputBg: "#0f1520",
  inputBorder: "#1e2840",
  fontDisplay: "'Oxanium', sans-serif",
  fontMono: "'IBM Plex Mono', monospace"
};
const S = {
  sel: {
    width: "100%",
    padding: "6px 10px",
    borderRadius: 6,
    border: `1px solid ${C.inputBorder}`,
    background: C.inputBg,
    color: C.text,
    fontSize: 13,
    fontFamily: C.fontDisplay,
    outline: "none",
    cursor: "pointer"
  },
  numIn: {
    width: 56,
    padding: "6px 10px",
    borderRadius: 6,
    border: `1px solid ${C.inputBorder}`,
    background: C.inputBg,
    color: C.text,
    fontSize: 13,
    fontFamily: C.fontMono,
    textAlign: "center",
    outline: "none"
  },
  card: {
    padding: 16,
    borderRadius: 12,
    background: C.panel,
    border: `1px solid ${C.panelBorder}`
  },
  panel: {
    flex: 1,
    minWidth: 320,
    background: C.panel,
    borderRadius: 12,
    border: `1px solid ${C.panelBorder}`,
    overflow: "hidden"
  },
  panelHeader: color => ({
    padding: "12px 16px",
    borderBottom: `1px solid ${C.panelBorder}`,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: `linear-gradient(135deg, ${color}08, transparent)`
  }),
  dot: color => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    boxShadow: `0 0 10px ${color}80`,
    flexShrink: 0
  }),
  panelBody: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  fieldLabel: {
    display: "block",
    fontSize: 10,
    color: C.textDim,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: C.fontDisplay
  },
  sectionDivider: {
    fontSize: 11,
    fontWeight: 700,
    color: C.textDim,
    letterSpacing: "0.06em",
    borderBottom: `1px solid ${C.panelBorder}`,
    paddingBottom: 4,
    textTransform: "uppercase"
  },
  totalBox: {
    padding: "10px 14px",
    background: C.inputBg,
    borderRadius: 8,
    border: `1px solid ${C.inputBorder}`
  },
  badge: color => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    background: `${color}1e`,
    color: color,
    border: `1px solid ${color}33`
  }),
  btn: (active, color) => ({
    flex: 1,
    padding: "10px 6px",
    borderRadius: "8px 8px 0 0",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.02em",
    fontFamily: C.fontDisplay,
    background: active ? C.panel : "transparent",
    color: active ? color || C.accent : C.textDim,
    borderColor: active ? C.panelBorder : "transparent",
    borderBottomColor: active ? C.panel : "transparent",
    transition: "all 0.2s"
  })
};

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════

function GovGearSelect({
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(e.target.value),
    style: S.sel
  }, GOV_GEAR_LEVELS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.id,
    value: g.id
  }, g.label, " (", g.bonus.toFixed(1), "%)")));
}
function CharmSelect({
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(Number(e.target.value)),
    style: S.sel
  }, CHARM_LEVELS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.level,
    value: c.level
  }, "Lv", c.level, " (", c.bonus, "%)")));
}
function StatBar({
  label,
  myVal,
  oppVal,
  troop
}) {
  const maxVal = Math.max(myVal, oppVal, 1);
  const myPct = myVal / maxVal * 100;
  const oppPct = oppVal / maxVal * 100;
  const diff = myVal - oppVal;
  const diffColor = diff > 0 ? "#4ade80" : diff < 0 ? "#f87171" : "#94a3b8";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 10,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4ade80",
      fontWeight: 600
    }
  }, myVal.toFixed(1), "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1",
      fontWeight: 500,
      fontSize: 9
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f87171",
      fontWeight: 600
    }
  }, oppVal.toFixed(1), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      height: 12,
      borderRadius: 3,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "rgba(0,0,0,0.3)",
      borderRadius: "3px 0 0 3px",
      display: "flex",
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${myPct}%`,
      background: `linear-gradient(90deg, transparent, ${TROOP_COLORS[troop]}88)`,
      transition: "width 0.3s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "rgba(0,0,0,0.3)",
      borderRadius: "0 3px 3px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${oppPct}%`,
      background: "linear-gradient(90deg, #ef444488, transparent)",
      transition: "width 0.3s"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 9,
      color: diffColor,
      fontWeight: 700,
      marginTop: 1
    }
  }, diff > 0 ? `+${diff.toFixed(1)}% AHEAD` : diff < 0 ? `${diff.toFixed(1)}% BEHIND` : "EVEN"));
}
function PlayerPanel({
  title,
  color,
  data,
  setData,
  section
}) {
  const updateGov = useCallback((k, v) => setData(d => ({
    ...d,
    govGear: {
      ...d.govGear,
      [k]: v
    }
  })), [setData]);
  const updateCharm = useCallback((k, v) => setData(d => ({
    ...d,
    charms: {
      ...d.charms,
      [k]: v
    }
  })), [setData]);
  const updateHero = useCallback((k, f, v) => setData(d => ({
    ...d,
    heroGear: {
      ...d.heroGear,
      [k]: {
        ...d.heroGear[k],
        [f]: v
      }
    }
  })), [setData]);
  const setAllCharms = useCallback((troop, lv) => setData(d => {
    const c = {
      ...d.charms
    };
    CHARM_SLOTS.filter(s => s.troop === troop).forEach(s => c[s.key] = lv);
    return {
      ...d,
      charms: c
    };
  }), [setData]);
  const setAllGov = useCallback(tier => setData(d => {
    const g = {
      ...d.govGear
    };
    GOV_GEAR_PIECES.forEach(p => g[p.key] = tier);
    return {
      ...d,
      govGear: g
    };
  }), [setData]);
  const setB = calcSetBonuses(data.govGear);
  return /*#__PURE__*/React.createElement("div", {
    style: S.panel
  }, /*#__PURE__*/React.createElement("div", {
    style: S.panelHeader(color)
  }, /*#__PURE__*/React.createElement("div", {
    style: S.dot(color)
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      margin: 0,
      fontFamily: C.fontDisplay
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: S.badge(color)
  }, title === "You" ? "ATTACKER" : "DEFENDER")), /*#__PURE__*/React.createElement("div", {
    style: S.panelBody
  }, section === "gov" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.fieldLabel,
      marginBottom: 0,
      flexShrink: 0
    }
  }, "SET ALL"), /*#__PURE__*/React.createElement("select", {
    onChange: e => {
      if (e.target.value) setAllGov(e.target.value);
      e.target.value = "";
    },
    style: {
      ...S.sel,
      flex: 1
    },
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "\u2014 Choose tier for all 6 pieces \u2014"), GOV_GEAR_LEVELS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.id,
    value: g.id
  }, g.label, " (", g.bonus.toFixed(1), "%)")))), GOV_GEAR_PIECES.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.key,
    style: {
      display: "grid",
      gridTemplateColumns: "80px 1fr",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.fieldLabel,
      marginBottom: 0,
      color: TROOP_COLORS[p.troop]
    }
  }, p.icon, " ", p.label), /*#__PURE__*/React.createElement(GovGearSelect, {
    value: data.govGear[p.key],
    onChange: v => updateGov(p.key, v)
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.totalBox
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      marginBottom: 2
    }
  }, "SET BONUSES (ALL TROOPS)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13,
      fontFamily: C.fontMono
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.green
    }
  }, "3pc: +", setB.def3, "% Def"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.blue
    }
  }, "6pc: +", setB.atk6, "% Atk")))), section === "charm" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, ["cav", "inf", "arch"].map(troop => /*#__PURE__*/React.createElement("div", {
    key: troop
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 3,
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.fieldLabel,
      marginBottom: 0,
      color: TROOP_COLORS[troop],
      flexShrink: 0
    }
  }, TROOP_NAMES[troop]), /*#__PURE__*/React.createElement("select", {
    onChange: e => {
      setAllCharms(troop, Number(e.target.value));
    },
    value: "",
    style: {
      ...S.sel,
      width: "auto",
      minWidth: 120,
      fontSize: 10,
      padding: "2px 6px"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Set All"), CHARM_LEVELS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.level,
    value: c.level
  }, "All \u2192 Lv", c.level, " (", c.bonus, "%)")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 3
    }
  }, CHARM_SLOTS.filter(s => s.troop === troop).map(s => /*#__PURE__*/React.createElement(CharmSelect, {
    key: s.key,
    value: data.charms[s.key],
    onChange: v => updateCharm(s.key, v)
  })))))), section === "hero" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, ["inf", "cav", "arch"].map(hero => /*#__PURE__*/React.createElement("div", {
    key: hero
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      color: TROOP_COLORS[hero],
      marginBottom: 3
    }
  }, TROOP_NAMES[hero], " Hero"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 3
    }
  }, HERO_GEAR_SLOTS.filter(s => s.hero === hero).map(s => {
    const g = data.heroGear[s.key];
    const maxEnh = g.isRed ? 200 : 100;
    return /*#__PURE__*/React.createElement("div", {
      key: s.key,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        borderRadius: 6,
        background: C.inputBg,
        border: `1px solid ${C.inputBorder}`,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        minWidth: 55,
        color: C.text,
        fontWeight: 600
      }
    }, s.icon, " ", s.label), /*#__PURE__*/React.createElement("button", {
      onClick: () => updateHero(s.key, "isRed", !g.isRed),
      style: {
        padding: "2px 6px",
        fontSize: 9,
        borderRadius: 3,
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontFamily: C.fontDisplay,
        background: g.isRed ? `${C.red}33` : `${C.accent}33`,
        color: g.isRed ? C.red : C.accent
      }
    }, g.isRed ? "RED" : "MYTH"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: C.textDim
      }
    }, "+"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: g.enhance,
      min: 0,
      max: maxEnh,
      onChange: e => updateHero(s.key, "enhance", Math.max(0, Math.min(maxEnh, Number(e.target.value) || 0))),
      style: S.numIn
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: C.textDim
      }
    }, "F"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: g.forge,
      min: 0,
      max: 20,
      onChange: e => updateHero(s.key, "forge", Math.max(0, Math.min(20, Number(e.target.value) || 0))),
      style: {
        ...S.numIn,
        width: 52
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: C.accent,
        fontFamily: C.fontMono,
        fontWeight: 600,
        marginLeft: "auto"
      }
    }, calcHeroGearStat(g.enhance, g.forge, g.isRed).toFixed(1), "%"));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 8px",
      borderRadius: 6,
      background: C.inputBg,
      border: `1px solid ${C.inputBorder}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.fieldLabel,
      marginBottom: 0
    }
  }, "\uD83D\uDC3E PET POWER"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: data.petPower,
    min: 0,
    onChange: e => setData(d => ({
      ...d,
      petPower: Number(e.target.value) || 0
    })),
    style: {
      ...S.numIn,
      width: 80
    }
  })))));
}

// ═══════════════════════════════════════════════════════════════
// COSTS TAB COMPONENT
// ═══════════════════════════════════════════════════════════════

function CostRow({
  label,
  value,
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: 5,
      background: "rgba(0,0,0,0.18)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#94a3b8"
    }
  }, icon, " ", label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: value > 0 ? "#fbbf24" : "#334155"
    }
  }, value > 0 ? value.toLocaleString() : "—"));
}

// XP per gear piece when used as enhancement material
const GEAR_XP_VALUES = {
  grey: 10,
  green: 30,
  blue: 60,
  purple: 150
};
function XpConversionPanel({
  totalXp
}) {
  if (totalXp <= 0) return null;
  const conversions = [{
    label: "Grey Gear (10 XP)",
    pieces: Math.ceil(totalXp / 10),
    color: "#94a3b8"
  }, {
    label: "Green Gear (30 XP)",
    pieces: Math.ceil(totalXp / 30),
    color: "#4ade80"
  }, {
    label: "Blue Gear (60 XP)",
    pieces: Math.ceil(totalXp / 60),
    color: "#60a5fa"
  }, {
    label: "Purple Gear (150 XP)",
    pieces: Math.ceil(totalXp / 150),
    color: "#a78bfa"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "8px 10px",
      borderRadius: 6,
      background: "rgba(0,0,0,0.15)",
      border: "1px solid rgba(255,255,255,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      marginBottom: 6
    }
  }, "\u2699\uFE0F XP Equivalent in Gear Pieces (", totalXp.toLocaleString(), " XP needed)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 4
    }
  }, conversions.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.label,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 8px",
      borderRadius: 4,
      background: "rgba(0,0,0,0.2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: c.color
    }
  }, c.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: c.color
    }
  }, c.pieces.toLocaleString())))));
}

// Event point values for different upgrade actions
// SG = Strongest Governor, HoG = Hall of Governors
// Gov Gear: "max score" = power gained; SG gives 36 pts per max score point, HoG gives 500 pts
// Charms: "max score by 1" = 70 pts in SG (Stages 1,3,4); power-based in HoG
// Hero Gear: Forgehammers = 4,000 pts each in SG; Mithril = 40,000 pts each in SG
// Note: "raise charm max score by 1" in SG means each charm level-up = 70 pts per charm level gained

// KvK Prep Phase charm level-up scores (from kingshotdata.com)
const KVK_CHARM_SCORES = {
  1: 625,
  2: 1250,
  3: 3125,
  4: 8750,
  5: 11250,
  6: 12500,
  7: 12500,
  8: 13000,
  9: 14000,
  10: 15000,
  11: 16000,
  12: 16000,
  13: 16000,
  14: 16000,
  15: 16000,
  16: 16000,
  17: 16000,
  18: 16000,
  19: 16000,
  20: 16000,
  21: 16000,
  22: 16000
};

// KvK Prep Phase gov gear level-up scores (Day 5)
const KVK_GOV_GEAR_SCORES = {
  "green0": 1125,
  "green1": 1875,
  "blue0": 3000,
  "blue1": 4500,
  "blue2": 5100,
  "blue3": 5400,
  "purple0": 3230,
  "purple1": 3230,
  "purple2": 3225,
  "purple3": 3225,
  "purpleT1_0": 3440,
  "purpleT1_1": 3440,
  "purpleT1_2": 4085,
  "purpleT1_3": 4085,
  "gold0": 6250,
  "gold1": 6250,
  "gold2": 6250,
  "gold3": 6250,
  "goldT1_0": 6250,
  "goldT1_1": 6250,
  "goldT1_2": 6250,
  "goldT1_3": 6250,
  "goldT2_0": 6250,
  "goldT2_1": 6250,
  "goldT2_2": 6250,
  "goldT2_3": 6250,
  "goldT3_0": 6250,
  "goldT3_1": 6250,
  "goldT3_2": 6250,
  "goldT3_3": 6250,
  "red0": 6250,
  "red1": 6250,
  "red2": 6250,
  "red3": 6250
};
function calcKvkGovGearScore(fromId, toId, numPieces) {
  const fromIdx = GOV_GEAR_LEVELS.findIndex(g => g.id === fromId);
  const toIdx = GOV_GEAR_LEVELS.findIndex(g => g.id === toId);
  let total = 0;
  for (let i = fromIdx + 1; i <= toIdx; i++) {
    const id = GOV_GEAR_LEVELS[i].id;
    total += KVK_GOV_GEAR_SCORES[id] || 6250; // default 6250 for higher red tiers
  }
  return total * numPieces;
}
function calcKvkCharmScore(fromLv, toLv, numCharms) {
  let total = 0;
  for (let lv = fromLv + 1; lv <= toLv; lv++) {
    total += KVK_CHARM_SCORES[lv] || 16000;
  }
  return total * numCharms;
}
function EventPointsPanel({
  type,
  data
}) {
  const rows = [];
  if (type === "gov") {
    const sgPts = Math.round((data.statGainTotal || 0) * 100 * 36);
    const kvkPts = data.kvkScore || 0;
    rows.push({
      event: "Strongest Governor",
      detail: `Gov Gear upgrade (36 pts/score)`,
      points: sgPts
    });
    rows.push({
      event: "KvK Prep Phase",
      detail: `Day 5 — Gov Gear upgrades`,
      points: kvkPts
    });
  }
  if (type === "charm") {
    const totalLevelUps = data.totalLevelUps || 0;
    const sgPts = totalLevelUps * 70;
    const kvkPts = data.kvkScore || 0;
    rows.push({
      event: "Strongest Governor",
      detail: `${totalLevelUps} level-ups × 70 pts`,
      points: sgPts
    });
    rows.push({
      event: "KvK Prep Phase",
      detail: `Days 1,3,4 — Charm upgrades`,
      points: kvkPts
    });
  }
  if (type === "hero") {
    const hammerPts = (data.hammersUsed || 0) * 4000;
    const mithrilPts = (data.mithrilUsed || 0) * 40000;
    const sgTotal = hammerPts + mithrilPts;
    rows.push({
      event: "Strongest Governor",
      detail: `Forgehammers (${data.hammersUsed || 0} × 4,000)`,
      points: hammerPts
    });
    rows.push({
      event: "Strongest Governor",
      detail: `Mithril (${data.mithrilUsed || 0} × 40,000)`,
      points: mithrilPts
    });
    rows.push({
      event: "Strongest Governor",
      detail: "SG TOTAL",
      points: sgTotal
    });
    // KvK: same point values — Day 4 & 5 both award forgehammer + mithril points
    rows.push({
      event: "KvK Prep Phase",
      detail: `Day 4/5 — Hammers + Mithril`,
      points: sgTotal
    });
  }
  if (rows.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "8px 10px",
      borderRadius: 6,
      background: "rgba(99,102,241,0.06)",
      border: "1px solid rgba(99,102,241,0.15)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#818cf8",
      marginBottom: 6
    }
  }, "\uD83C\uDFC6 Estimated Event Points"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 3
    }
  }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 4,
      background: r.detail.includes("TOTAL") ? "rgba(99,102,241,0.1)" : "rgba(0,0,0,0.15)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: r.detail.includes("TOTAL") ? "#c4b5fd" : "#94a3b8",
      fontWeight: r.detail.includes("TOTAL") ? 700 : 400
    }
  }, r.event), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#64748b"
    }
  }, r.detail)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: r.points > 0 ? "#818cf8" : "#334155",
      whiteSpace: "nowrap"
    }
  }, r.points > 0 ? r.points.toLocaleString() + " pts" : "—")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      marginTop: 4,
      fontStyle: "italic"
    }
  }, "Points based on community-verified event data. KvK charm scores vary by level."));
}
function CostsTab() {
  const [costSec, setCostSec] = useState("gov");

  // Governor Gear cost state
  const [govFrom, setGovFrom] = useState("goldT1_0");
  const [govTo, setGovTo] = useState("goldT2_0");
  const [govPieces, setGovPieces] = useState(6);
  const govCost = useMemo(() => calcGovUpgradeCost(govFrom, govTo, govPieces), [govFrom, govTo, govPieces]);
  const govFromBonus = GOV_GEAR_LEVELS.find(g => g.id === govFrom)?.bonus || 0;
  const govToBonus = GOV_GEAR_LEVELS.find(g => g.id === govTo)?.bonus || 0;

  // Charm cost state
  const [charmFrom, setCharmFrom] = useState(0);
  const [charmTo, setCharmTo] = useState(11);
  const [charmCount, setCharmCount] = useState(18);
  const charmCost = useMemo(() => calcCharmUpgradeCost(charmFrom, charmTo, charmCount), [charmFrom, charmTo, charmCount]);
  const charmFromBonus = CHARM_LEVELS.find(c => c.level === charmFrom)?.bonus || 0;
  const charmToBonus = CHARM_LEVELS.find(c => c.level === charmTo)?.bonus || 0;

  // Hero Gear cost state
  const [enhFrom, setEnhFrom] = useState(0);
  const [enhTo, setEnhTo] = useState(100);
  const [enhPieces, setEnhPieces] = useState(4);
  const [forgeFrom, setForgeFrom] = useState(0);
  const [forgeTo, setForgeTo] = useState(10);
  const [forgePieces, setForgePieces] = useState(4);
  const enhCost = useMemo(() => calcEnhanceUpgradeCost(enhFrom, enhTo, enhPieces), [enhFrom, enhTo, enhPieces]);
  const forgeCost = useMemo(() => calcForgeUpgradeCost(forgeFrom, forgeTo, forgePieces), [forgeFrom, forgeTo, forgePieces]);
  const numSel = (value, onChange, max, label) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#64748b"
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: 0,
    max: max,
    onChange: e => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0))),
    style: S.numIn
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, [["gov", "Gov Gear", "#fbbf24"], ["charm", "Charms", "#f472b6"], ["hero", "Hero Gear", "#2dd4bf"]].map(([id, lb, col]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setCostSec(id),
    style: S.btn(costSec === id, col)
  }, lb))), costSec === "gov" && /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 800,
      color: "#fbbf24"
    }
  }, "Governor Gear Upgrade Costs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 140
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "From"), /*#__PURE__*/React.createElement("select", {
    value: govFrom,
    onChange: e => setGovFrom(e.target.value),
    style: S.sel
  }, GOV_GEAR_LEVELS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.id,
    value: g.id
  }, g.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: "#475569",
      paddingTop: 14
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 140
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "To"), /*#__PURE__*/React.createElement("select", {
    value: govTo,
    onChange: e => setGovTo(e.target.value),
    style: S.sel
  }, GOV_GEAR_LEVELS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.id,
    value: g.id
  }, g.label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "Pieces"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, [1, 2, 3, 4, 6].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setGovPieces(n),
    style: {
      padding: "4px 10px",
      borderRadius: 4,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 700,
      background: govPieces === n ? "rgba(251,191,36,0.2)" : "rgba(0,0,0,0.25)",
      color: govPieces === n ? "#fbbf24" : "#64748b"
    }
  }, n)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b"
    }
  }, "Stat gain per piece"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: govToBonus > govFromBonus ? "#4ade80" : "#64748b"
    }
  }, "+", (govToBonus - govFromBonus).toFixed(2), "% Atk & Def")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(CostRow, {
    label: "Satin",
    value: govCost.satin,
    icon: "\uD83E\uDDF5"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Gilded Threads",
    value: govCost.gilded,
    icon: "\u2728"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Artisan's Vision",
    value: govCost.vision,
    icon: "\uD83D\uDD2E"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: "6px 10px",
      borderRadius: 5,
      background: "rgba(0,0,0,0.12)",
      fontSize: 10,
      color: "#64748b"
    }
  }, "Total for ", govPieces, " piece", govPieces > 1 ? "s" : "", ": ", GOV_GEAR_LEVELS.find(g => g.id === govFrom)?.label, " \u2192 ", GOV_GEAR_LEVELS.find(g => g.id === govTo)?.label), /*#__PURE__*/React.createElement(EventPointsPanel, {
    type: "gov",
    data: {
      statGainTotal: (govToBonus - govFromBonus) * govPieces,
      kvkScore: calcKvkGovGearScore(govFrom, govTo, govPieces)
    }
  })), costSec === "charm" && /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 800,
      color: "#f472b6"
    }
  }, "Governor Charm Upgrade Costs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "From Level"), /*#__PURE__*/React.createElement("select", {
    value: charmFrom,
    onChange: e => setCharmFrom(Number(e.target.value)),
    style: S.sel
  }, CHARM_LEVELS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.level,
    value: c.level
  }, "Lv", c.level, " (", c.bonus, "%)")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: "#475569",
      paddingTop: 14
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "To Level"), /*#__PURE__*/React.createElement("select", {
    value: charmTo,
    onChange: e => setCharmTo(Number(e.target.value)),
    style: S.sel
  }, CHARM_LEVELS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.level,
    value: c.level
  }, "Lv", c.level, " (", c.bonus, "%)"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "Number of Charms"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, [1, 3, 6, 12, 18].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setCharmCount(n),
    style: {
      padding: "4px 8px",
      borderRadius: 4,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 700,
      background: charmCount === n ? "rgba(244,114,182,0.2)" : "rgba(0,0,0,0.25)",
      color: charmCount === n ? "#f472b6" : "#64748b"
    }
  }, n)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b"
    }
  }, "Stat gain per charm"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: charmToBonus > charmFromBonus ? "#4ade80" : "#64748b"
    }
  }, "+", (charmToBonus - charmFromBonus).toFixed(1), "% Leth & HP")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(CostRow, {
    label: "Charm Guides",
    value: charmCost.guides,
    icon: "\uD83D\uDCD8"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Charm Designs",
    value: charmCost.designs,
    icon: "\uD83D\uDCD0"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: "6px 10px",
      borderRadius: 5,
      background: "rgba(0,0,0,0.12)",
      fontSize: 10,
      color: "#64748b"
    }
  }, "Total for ", charmCount, " charm", charmCount > 1 ? "s" : "", ": Lv", charmFrom, " \u2192 Lv", charmTo, charmCount === 6 && " (1 troop type)", charmCount === 12 && " (2 troop types)", charmCount === 18 && " (all 3 troop types)"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      marginBottom: 4
    }
  }, "Per-Level Breakdown (\xD71 charm)"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 180,
      overflowY: "auto",
      borderRadius: 6,
      background: "rgba(0,0,0,0.3)",
      padding: 6
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      fontSize: 10,
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: 3
    }
  }, "Level"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "Guides"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "Designs"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "Stat"))), /*#__PURE__*/React.createElement("tbody", null, CHARM_COSTS.filter(c => c.level > charmFrom && c.level <= charmTo).map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.level
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#cbd5e1"
    }
  }, "Lv", c.level), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#fbbf24",
      textAlign: "right"
    }
  }, c.guides), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#f472b6",
      textAlign: "right"
    }
  }, c.designs), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#4ade80",
      textAlign: "right"
    }
  }, "+", CHARM_LEVELS[c.level]?.bonus, "%"))))))), /*#__PURE__*/React.createElement(EventPointsPanel, {
    type: "charm",
    data: {
      totalLevelUps: Math.max(0, charmTo - charmFrom) * charmCount,
      kvkScore: calcKvkCharmScore(charmFrom, charmTo, charmCount)
    }
  })), costSec === "hero" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 800,
      color: "#2dd4bf"
    }
  }, "Hero Gear Enhancement Costs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "From +"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: enhFrom,
    min: 0,
    max: 200,
    onChange: e => setEnhFrom(Math.max(0, Math.min(200, Number(e.target.value) || 0))),
    style: {
      ...S.numIn,
      width: 56
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: "#475569",
      paddingTop: 12
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "To +"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: enhTo,
    min: 0,
    max: 200,
    onChange: e => setEnhTo(Math.max(0, Math.min(200, Number(e.target.value) || 0))),
    style: {
      ...S.numIn,
      width: 56
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "Pieces"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, [1, 4, 8, 12].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setEnhPieces(n),
    style: {
      padding: "4px 8px",
      borderRadius: 4,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 700,
      background: enhPieces === n ? "rgba(45,212,191,0.2)" : "rgba(0,0,0,0.25)",
      color: enhPieces === n ? "#2dd4bf" : "#64748b"
    }
  }, n)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b"
    }
  }, "Expedition stat gain (per piece, Forge 0)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "#4ade80"
    }
  }, calcHeroGearStat(enhFrom, 0, false).toFixed(1), "% \u2192 ", calcHeroGearStat(enhTo, 0, false).toFixed(1), "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(CostRow, {
    label: "Enhancement XP",
    value: enhCost.xp,
    icon: "\u26A1"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Mithril",
    value: enhCost.mithril,
    icon: "\uD83D\uDCA0"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Mythic Hero Gear",
    value: enhCost.mhg,
    icon: "\u2694\uFE0F"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "5px 10px",
      borderRadius: 5,
      background: "rgba(0,0,0,0.12)",
      fontSize: 10,
      color: "#64748b"
    }
  }, enhPieces, " piece", enhPieces > 1 ? "s" : "", " \u2022 +", enhFrom, " \u2192 +", enhTo, enhTo > 100 && " (requires Red gear)", enhPieces === 4 && " (1 hero set)", enhPieces === 12 && " (all 3 hero sets)")), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 800,
      color: "#a78bfa"
    }
  }, "Mastery Forging Costs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "From Lv"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: forgeFrom,
    min: 0,
    max: 20,
    onChange: e => setForgeFrom(Math.max(0, Math.min(20, Number(e.target.value) || 0))),
    style: {
      ...S.numIn,
      width: 48
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: "#475569",
      paddingTop: 12
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "To Lv"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: forgeTo,
    min: 0,
    max: 20,
    onChange: e => setForgeTo(Math.max(0, Math.min(20, Number(e.target.value) || 0))),
    style: {
      ...S.numIn,
      width: 48
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 2
    }
  }, "Pieces"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, [1, 4, 8, 12].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setForgePieces(n),
    style: {
      padding: "4px 8px",
      borderRadius: 4,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 700,
      background: forgePieces === n ? "rgba(167,139,250,0.2)" : "rgba(0,0,0,0.25)",
      color: forgePieces === n ? "#a78bfa" : "#64748b"
    }
  }, n))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(CostRow, {
    label: "Forgehammers",
    value: forgeCost.hammers,
    icon: "\uD83D\uDD28"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Mythic Hero Gear",
    value: forgeCost.mhg,
    icon: "\u2694\uFE0F"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "5px 10px",
      borderRadius: 5,
      background: "rgba(0,0,0,0.12)",
      fontSize: 10,
      color: "#64748b"
    }
  }, forgePieces, " piece", forgePieces > 1 ? "s" : "", " \u2022 Forge Lv", forgeFrom, " \u2192 Lv", forgeTo, forgeTo >= 11 && " (Lv11+ requires Mythic Hero Gear)"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      marginBottom: 4
    }
  }, "Per-Level Breakdown (\xD71 piece)"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 160,
      overflowY: "auto",
      borderRadius: 6,
      background: "rgba(0,0,0,0.3)",
      padding: 6
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      fontSize: 10,
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: 3
    }
  }, "Level"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "Hammers"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "MHG"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "Mastery%"))), /*#__PURE__*/React.createElement("tbody", null, FORGE_COSTS.filter(c => c.level > forgeFrom && c.level <= forgeTo).map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.level
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#cbd5e1"
    }
  }, "Lv", c.level), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#fbbf24",
      textAlign: "right"
    }
  }, c.hammers), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#a78bfa",
      textAlign: "right"
    }
  }, c.mhg || "—"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#4ade80",
      textAlign: "right"
    }
  }, "+", c.level * 10, "%")))))))), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 13,
      fontWeight: 800,
      color: "#cbd5e1"
    }
  }, "Combined Hero Gear Total"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(CostRow, {
    label: "Enhancement XP",
    value: enhCost.xp,
    icon: "\u26A1"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Mithril",
    value: enhCost.mithril,
    icon: "\uD83D\uDCA0"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Forgehammers",
    value: forgeCost.hammers,
    icon: "\uD83D\uDD28"
  }), /*#__PURE__*/React.createElement(CostRow, {
    label: "Mythic Hero Gear (total)",
    value: enhCost.mhg + forgeCost.mhg,
    icon: "\u2694\uFE0F"
  })), /*#__PURE__*/React.createElement(XpConversionPanel, {
    totalXp: enhCost.xp
  }), /*#__PURE__*/React.createElement(EventPointsPanel, {
    type: "hero",
    data: {
      hammersUsed: forgeCost.hammers,
      mithrilUsed: enhCost.mithril
    }
  }))));
}

// ═══════════════════════════════════════════════════════════════
// BATTLE SIMULATOR ENGINE (ported from Kingshot PvP Battle Simulator HTML)
// Complete hero database, SkillMod engine, battle calc, optimizers
// ═══════════════════════════════════════════════════════════════

const HEROES = {
  Chenko: {
    gen: 1,
    cls: "Cav",
    rarity: "SR",
    skill1: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Stand of Arms — Lethality +25%",
      chance: false
    },
    skill2: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Chenko's Defense — Dmg Reduction 20%",
      chance: false
    },
    skill3: null
  },
  Amadeus: {
    gen: 1,
    cls: "Inf",
    rarity: "SSR",
    skill1: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Battle Ready — Lethality +25%",
      chance: false
    },
    skill2: {
      effectOp: 102,
      type: "DamageUp",
      pct: 25,
      label: "Way of the Blade — Attack +25%",
      chance: false
    },
    skill3: {
      effectOp: 109,
      type: "DamageUp",
      pct: 50,
      label: "Unrighteous Strike — 40% chance Dmg +50%",
      chance: true,
      triggerPct: 40
    }
  },
  Gordon: {
    gen: 1,
    cls: "Inf",
    rarity: "SR",
    skill1: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 25,
      label: "Health Up 25%",
      chance: false
    },
    skill2: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Gordon's Guard — Dmg Reduction 20%",
      chance: false
    },
    skill3: null
  },
  Howard: {
    gen: 1,
    cls: "Inf",
    rarity: "R",
    skill1: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Dmg Reduction 20%",
      chance: false
    },
    skill2: null,
    skill3: null
  },
  Quinn: {
    gen: 1,
    cls: "Cav",
    rarity: "R",
    skill1: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Dmg Reduction 20%",
      chance: false
    },
    skill2: null,
    skill3: null
  },
  Saul: {
    gen: 1,
    cls: "Arch",
    rarity: "SSR",
    skill1: {
      effectOp: null,
      type: "DefenseUp",
      pct: 0,
      label: "Positional Batter — Dual Def 10%+15%",
      chance: false,
      dual: [{
        effectOp: 112,
        type: "DefenseUp",
        pct: 10
      }, {
        effectOp: 113,
        type: "DefenseUp",
        pct: 15
      }]
    },
    skill2: {
      effectOp: null,
      type: "Growth",
      pct: 0,
      label: "Resourceful — non-combat",
      chance: false,
      nonCombat: true
    },
    skill3: {
      effectOp: null,
      type: "DefenseUp",
      pct: 0,
      label: "Squad Training — Defense & Health Up",
      chance: false,
      dual: [{
        effectOp: 112,
        type: "DefenseUp",
        pct: 10
      }, {
        effectOp: 113,
        type: "DefenseUp",
        pct: 15
      }]
    }
  },
  Jabel: {
    gen: 1,
    cls: "Cav",
    rarity: "SSR",
    skill1: {
      effectOp: 150,
      type: "DefenseUp",
      pct: 50,
      label: "Rally Flag — 40% chance Dmg Taken -50%",
      chance: true,
      triggerPct: 40
    },
    skill2: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Jabel's Resolve — Dmg Reduction 20%",
      chance: false
    },
    skill3: {
      effectOp: 201,
      type: "OppDamageDown",
      pct: 20,
      label: "Intimidation — Enemy Dmg Down 20%",
      chance: false
    }
  },
  Marlin: {
    gen: 1,
    cls: "Arch",
    rarity: "SSR",
    skill1: {
      effectOp: 103,
      type: "DamageUp",
      pct: 50,
      label: "Rapid Fire — 40% chance Dmg +50%",
      chance: true,
      triggerPct: 40
    },
    skill2: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Precision — Lethality +25%",
      chance: false
    },
    skill3: {
      effectOp: null,
      type: "OppDamageDown",
      pct: 20,
      label: "Suppression — Enemy Lethality Down 20%",
      chance: false,
      dual: [{
        effectOp: 203,
        type: "OppDamageDown",
        pct: 20
      }]
    }
  },
  Helga: {
    gen: 1,
    cls: "Inf",
    rarity: "SSR",
    skill1: {
      effectOp: 151,
      type: "DefenseUp",
      pct: 50,
      label: "Shield Wall — 40% chance Dmg Taken -50%",
      chance: true,
      triggerPct: 40
    },
    skill2: {
      effectOp: 102,
      type: "DamageUp",
      pct: 25,
      label: "War Cry — Attack +25%",
      chance: false
    },
    skill3: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 25,
      label: "Fortitude — Health +25%",
      chance: false
    }
  },
  Yeonwoo: {
    gen: 2,
    cls: "Inf",
    rarity: "SR",
    skill1: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Lethality +25%",
      chance: false
    },
    skill2: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 20,
      label: "Yeonwoo's Protection — Health +20%",
      chance: false
    },
    skill3: null
  },
  Amane: {
    gen: 2,
    cls: "Cav",
    rarity: "SR",
    skill1: {
      effectOp: 102,
      type: "DamageUp",
      pct: 25,
      label: "Attack +25%",
      chance: false
    },
    skill2: {
      effectOp: 112,
      type: "DefenseUp",
      pct: 15,
      label: "Amane's Guard — Defense +15%",
      chance: false
    },
    skill3: null
  },
  Hilde: {
    gen: 2,
    cls: "Cav",
    rarity: "SSR",
    skill1: {
      effectOp: null,
      type: "DamageUp",
      pct: 0,
      label: "Dual Def10%+Atk15%",
      chance: false,
      dual: [{
        effectOp: 112,
        type: "DefenseUp",
        pct: 10
      }, {
        effectOp: 102,
        type: "DamageUp",
        pct: 15
      }]
    },
    skill2: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Hilde's Fury — Lethality +25%",
      chance: false
    },
    skill3: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Evasion — Dmg Reduction 20%",
      chance: false
    }
  },
  Zoe: {
    gen: 2,
    cls: "Inf",
    rarity: "SSR",
    skill1: {
      effectOp: 152,
      type: "DamageUp",
      pct: 40,
      label: "Sundering Wound — DmgUp +40%",
      chance: true,
      triggerPct: 50
    },
    skill2: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 25,
      label: "Last Stand — Health +25%",
      chance: false
    },
    skill3: {
      effectOp: 102,
      type: "DamageUp",
      pct: 25,
      label: "Battle Rage — Attack +25%",
      chance: false
    }
  },
  Fahd: {
    gen: 2,
    cls: "Cav",
    rarity: "SR",
    skill1: {
      effectOp: 201,
      type: "OppDamageDown",
      pct: 20,
      label: "Enemy Dmg -20%",
      chance: false
    },
    skill2: {
      effectOp: 112,
      type: "DefenseUp",
      pct: 15,
      label: "Fahd's Shield — Defense +15%",
      chance: false
    },
    skill3: null
  },
  Eric: {
    gen: 3,
    cls: "Inf",
    rarity: "SSR",
    skill1: {
      effectOp: 202,
      type: "OppDamageDown",
      pct: 20,
      label: "Holy Warrior — Enemy Atk -20%",
      chance: false
    },
    skill2: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 25,
      label: "Iron Will — Health +25%",
      chance: false
    },
    skill3: {
      effectOp: 112,
      type: "DefenseUp",
      pct: 20,
      label: "Bulwark — Defense +20%",
      chance: false
    }
  },
  Petra: {
    gen: 3,
    cls: "Cav",
    rarity: "SSR",
    skill1: {
      effectOp: 104,
      type: "DamageUp",
      pct: 50,
      label: "Evil Eye — 50% chance Dmg Taken +50%",
      chance: true,
      triggerPct: 50
    },
    skill2: {
      effectOp: 102,
      type: "DamageUp",
      pct: 50,
      label: "The Favor — 50% chance Attack +50%",
      chance: true,
      triggerPct: 50
    },
    skill3: {
      effectOp: 155,
      type: "DefenseUp",
      pct: 50,
      label: "The Shield — 40% chance Dmg Taken -50%",
      chance: true,
      triggerPct: 40
    }
  },
  Jaeger: {
    gen: 3,
    cls: "Arch",
    rarity: "SSR",
    skill1: {
      effectOp: 105,
      type: "DamageUp",
      pct: 40,
      label: "Tempest — 20% chance Dmg +40%",
      chance: true,
      triggerPct: 20
    },
    skill2: {
      effectOp: 203,
      type: "OppDamageDown",
      pct: 20,
      label: "Suppress — Enemy Lethality -20%",
      chance: false
    },
    skill3: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Marksman — Lethality +25%",
      chance: false
    }
  },
  Margot: {
    gen: 4,
    cls: "Cav",
    rarity: "SSR",
    skill1: {
      effectOp: 102,
      type: "DamageUp",
      pct: 25,
      label: "Warbringer — Attack +25%",
      chance: false
    },
    skill2: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Precision Strike — Lethality +25%",
      chance: false
    },
    skill3: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Dodge — Dmg Reduction 20%",
      chance: false
    }
  },
  Alcar: {
    gen: 4,
    cls: "Inf",
    rarity: "SSR",
    skill1: {
      effectOp: 153,
      type: "DefenseUp",
      pct: 70,
      label: "Rescuing Hands — 40% chance Def -70%",
      chance: true,
      triggerPct: 40
    },
    skill2: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 25,
      label: "Bastion — Health +25%",
      chance: false
    },
    skill3: {
      effectOp: 202,
      type: "OppDamageDown",
      pct: 20,
      label: "Weaken — Enemy Atk -20%",
      chance: false
    }
  },
  Rosa: {
    gen: 4,
    cls: "Arch",
    rarity: "SSR",
    skill1: {
      effectOp: 106,
      type: "DamageUp",
      pct: 50,
      label: "Chaos Gambit — 40% chance Dmg +50%",
      chance: true,
      triggerPct: 40
    },
    skill2: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Focus Fire — Lethality +25%",
      chance: false
    },
    skill3: {
      effectOp: 201,
      type: "OppDamageDown",
      pct: 20,
      label: "Debilitate — Enemy Dmg -20%",
      chance: false
    }
  },
  Vivian: {
    gen: 5,
    cls: "Arch",
    rarity: "SSR",
    skill1: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Crouching Tiger — Dmg Taken +25%",
      chance: false
    },
    skill2: {
      effectOp: 106,
      type: "DamageUp",
      pct: 50,
      label: "Focus Fire — 50% chance Dmg +50%",
      chance: true,
      triggerPct: 50
    },
    skill3: {
      effectOp: 102,
      type: "DamageUp",
      pct: 25,
      label: "Battle Stance — Attack +25%",
      chance: false
    }
  },
  LongFei: {
    gen: 5,
    cls: "Inf",
    rarity: "SSR",
    skill1: {
      effectOp: 154,
      type: "DefenseUp",
      pct: 50,
      label: "Mighty Paragon — 40% chance Def -50%",
      chance: true,
      triggerPct: 40
    },
    skill2: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 25,
      label: "Unyielding — Health +25%",
      chance: false
    },
    skill3: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Dragon Strike — Lethality +25%",
      chance: false
    }
  },
  Thrud: {
    gen: 5,
    cls: "Cav",
    rarity: "SSR",
    skill1: {
      effectOp: null,
      type: "DamageUp",
      pct: 0,
      label: "Battle Hunger — Dual Def+Atk",
      chance: false,
      dual: [{
        effectOp: 112,
        type: "DefenseUp",
        pct: 15
      }, {
        effectOp: 102,
        type: "DamageUp",
        pct: 15
      }]
    },
    skill2: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Berserker — Lethality +25%",
      chance: false
    },
    skill3: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Thick Skin — Dmg Reduction 20%",
      chance: false
    }
  },
  Triton: {
    gen: 6,
    cls: "Inf",
    rarity: "SSR",
    skill1: {
      effectOp: 113,
      type: "DefenseUp",
      pct: 25,
      label: "Command of Power — All Def +25%",
      chance: false
    },
    skill2: {
      effectOp: 112,
      type: "DefenseUp",
      pct: 20,
      label: "Iron Tide — Defense +20%",
      chance: false
    },
    skill3: {
      effectOp: 202,
      type: "OppDamageDown",
      pct: 20,
      label: "Suppress — Enemy Atk -20%",
      chance: false
    }
  },
  Sophia: {
    gen: 6,
    cls: "Cav",
    rarity: "SSR",
    skill1: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Arcane Pact — All Dmg +25%",
      chance: false
    },
    skill2: {
      effectOp: 102,
      type: "DamageUp",
      pct: 25,
      label: "Empowerment — Attack +25%",
      chance: false
    },
    skill3: {
      effectOp: 111,
      type: "DefenseUp",
      pct: 20,
      label: "Barrier — Dmg Reduction 20%",
      chance: false
    }
  },
  Yang: {
    gen: 6,
    cls: "Arch",
    rarity: "SSR",
    skill1: {
      effectOp: 108,
      type: "DamageUp",
      pct: 30,
      label: "Avalanche — ~35% chance Dmg +30%",
      chance: true,
      triggerPct: 35
    },
    skill2: {
      effectOp: 101,
      type: "DamageUp",
      pct: 25,
      label: "Precision — Lethality +25%",
      chance: false
    },
    skill3: {
      effectOp: 201,
      type: "OppDamageDown",
      pct: 20,
      label: "Blizzard — Enemy Dmg -20%",
      chance: false
    }
  }
};
const HERO_NAMES = Object.keys(HEROES);
const TROOP_TIERS = {
  T6: {
    Infantry: {
      atk: 243,
      leth: 10,
      hp: 730,
      def: 10
    },
    Cavalry: {
      atk: 730,
      leth: 10,
      hp: 243,
      def: 10
    },
    Archer: {
      atk: 974,
      leth: 10,
      hp: 183,
      def: 10
    }
  },
  T7: {
    Infantry: {
      atk: 283,
      leth: 12,
      hp: 850,
      def: 12
    },
    Cavalry: {
      atk: 850,
      leth: 12,
      hp: 283,
      def: 12
    },
    Archer: {
      atk: 1134,
      leth: 12,
      hp: 213,
      def: 12
    }
  },
  T8: {
    Infantry: {
      atk: 330,
      leth: 14,
      hp: 990,
      def: 14
    },
    Cavalry: {
      atk: 990,
      leth: 14,
      hp: 330,
      def: 14
    },
    Archer: {
      atk: 1320,
      leth: 14,
      hp: 248,
      def: 14
    }
  },
  T9: {
    Infantry: {
      atk: 385,
      leth: 16,
      hp: 1155,
      def: 16
    },
    Cavalry: {
      atk: 1155,
      leth: 16,
      hp: 385,
      def: 16
    },
    Archer: {
      atk: 1540,
      leth: 16,
      hp: 289,
      def: 16
    }
  },
  T10: {
    Infantry: {
      atk: 449,
      leth: 18,
      hp: 1347,
      def: 18
    },
    Cavalry: {
      atk: 1347,
      leth: 18,
      hp: 449,
      def: 18
    },
    Archer: {
      atk: 1796,
      leth: 18,
      hp: 337,
      def: 18
    }
  },
  T11: {
    Infantry: {
      atk: 524,
      leth: 21,
      hp: 1571,
      def: 21
    },
    Cavalry: {
      atk: 1571,
      leth: 21,
      hp: 524,
      def: 21
    },
    Archer: {
      atk: 2095,
      leth: 21,
      hp: 393,
      def: 21
    }
  }
};
const UNIT_TYPES = ["Infantry", "Cavalry", "Archer"];

// SkillMod calculation — exact port from HTML simulator
function calcSkillMod(joinerHeroes, useEV, leaderHeroes) {
  const groups = {
    DamageUp: {},
    OppDefenseDown: {},
    OppDamageDown: {},
    DefenseUp: {}
  };
  const addSkill = skill => {
    if (!skill || skill.nonCombat) return;
    if (skill.chance && !useEV) return;
    if (skill.dual) {
      skill.dual.forEach(d => {
        if (!groups[d.type]) groups[d.type] = {};
        const ePct = skill.chance && useEV ? d.pct * (skill.triggerPct || 0) / 100 : d.pct;
        groups[d.type][d.effectOp] = (groups[d.type][d.effectOp] || 0) + ePct;
      });
    } else if (skill.effectOp) {
      if (!groups[skill.type]) groups[skill.type] = {};
      const ePct = skill.chance && useEV ? skill.pct * (skill.triggerPct || 0) / 100 : skill.pct;
      groups[skill.type][skill.effectOp] = (groups[skill.type][skill.effectOp] || 0) + ePct;
    }
  };
  (leaderHeroes || []).forEach(name => {
    const h = HEROES[name];
    if (!h) return;
    if (h.skill1) addSkill(h.skill1);
    if (h.skill2) addSkill(h.skill2);
    if (h.skill3) addSkill(h.skill3);
  });
  (joinerHeroes || []).forEach(name => {
    const h = HEROES[name];
    if (!h) return;
    if (h.skill1) addSkill(h.skill1);
  });
  const prod = obj => Object.values(obj).reduce((a, v) => a * (1 + v / 100), 1);
  const damageUp = prod(groups.DamageUp);
  const oppDefDown = prod(groups.OppDefenseDown);
  const oppDmgDown = prod(groups.OppDamageDown);
  const defUp = prod(groups.DefenseUp);
  return {
    total: damageUp * oppDefDown / (oppDmgDown * defUp),
    damageUp,
    oppDefDown,
    oppDmgDown,
    defUp
  };
}

// Full battle calculation — exact port
function calcBattleFull(attacker, defender) {
  // Use the same formula as simulateBattle but with SkillMod from hero joiners
  var TROOP_MAP = { Infantry: "inf", Cavalry: "cav", Archer: "arch" };
  var troopAdvantage = { inf: "cav", cav: "arch", arch: "inf" };

  var atkTotal = (attacker.troops.Infantry || 0) + (attacker.troops.Cavalry || 0) + (attacker.troops.Archer || 0);
  var defTotal = (defender.troops.Infantry || 0) + (defender.troops.Cavalry || 0) + (defender.troops.Archer || 0);
  var armyMin = Math.min(atkTotal, defTotal);

  var atkSM = calcSkillMod(attacker.joiners || [], true, attacker.leaders || []);
  var defSM = calcSkillMod(defender.joiners || [], true, defender.leaders || []);

  var atkDmg = 0, defDmg = 0;

  // Separate offensive and defensive skill components
  // Offensive skills (DamageUp, OppDefenseDown) boost your own damage output
  // Defensive skills (DefenseUp, OppDamageDown) reduce the opponent's damage to you
  var myOffense = atkSM.damageUp * atkSM.oppDefDown;
  var defDefense = defSM.oppDmgDown * defSM.defUp;
  var oppOffense = defSM.damageUp * defSM.oppDefDown;
  var atkDefense = atkSM.oppDmgDown * atkSM.defUp;

  UNIT_TYPES.forEach(function(T) {
    var t = TROOP_MAP[T]; // "inf", "cav", "arch"
    var myT = attacker.troops[T] || 0;
    var oppT = defender.troops[T] || 0;

    // Get per-troop-type stats (same as simulateBattle)
    var myAtk = 1 + ((attacker.stats && attacker.stats[t] ? attacker.stats[t].atk : attacker.atkBonus) || 0) / 100;
    var myLeth = 1 + ((attacker.stats && attacker.stats[t] ? attacker.stats[t].leth : attacker.lethBonus) || 0) / 100;
    var oppDef = 1 + ((defender.stats && defender.stats[t] ? defender.stats[t].def : defender.defBonus) || 0) / 100;
    var oppHp = 1 + ((defender.stats && defender.stats[t] ? defender.stats[t].hp : defender.hpBonus) || 0) / 100;

    var oppAtk = 1 + ((defender.stats && defender.stats[t] ? defender.stats[t].atk : defender.atkBonus) || 0) / 100;
    var oppLeth = 1 + ((defender.stats && defender.stats[t] ? defender.stats[t].leth : defender.lethBonus) || 0) / 100;
    var myDef = 1 + ((attacker.stats && attacker.stats[t] ? attacker.stats[t].def : attacker.defBonus) || 0) / 100;
    var myHp = 1 + ((attacker.stats && attacker.stats[t] ? attacker.stats[t].hp : attacker.hpBonus) || 0) / 100;

    // Daryl's formula: Kills = √(Troops × ArmyMin) × (ATK × Leth) / (Def × HP) × SkillMod
    var myArmy = myT > 0 ? Math.sqrt(myT * armyMin) : 0;
    var oppArmy = oppT > 0 ? Math.sqrt(oppT * armyMin) : 0;

    var myDmgT = myArmy > 0 ? myArmy * (myAtk * myLeth) / ((oppDef * oppHp) || 1) * myOffense / (defDefense || 1) : 0;
    var oppDmgT = oppArmy > 0 ? oppArmy * (oppAtk * oppLeth) / ((myDef * myHp) || 1) * oppOffense / (atkDefense || 1) : 0;

    // Troop advantage: +10% proportional to how much of the enemy is the weak type
    var weakType = troopAdvantage[t];
    var weakTroopKey = weakType === "inf" ? "Infantry" : weakType === "cav" ? "Cavalry" : "Archer";
    var oppWeakPct = defTotal > 0 ? (defender.troops[weakTroopKey] || 0) / defTotal : 0;
    var myWeakPct = atkTotal > 0 ? (attacker.troops[weakTroopKey] || 0) / atkTotal : 0;
    myDmgT *= (1 + 0.10 * oppWeakPct);
    oppDmgT *= (1 + 0.10 * myWeakPct);

    atkDmg += myDmgT;
    defDmg += oppDmgT;
  });

  return {
    atkDmg: atkDmg,
    defDmg: defDmg,
    atkSM: atkSM,
    defSM: defSM,
    ratio: atkDmg / (defDmg || 1)
  };
}

// Joiner optimizer — tests all 1-4 joiner combos, ranks by EV damage ratio
function optimizeJoiners(atk, def) {
  const allHeroes = HERO_NAMES.filter(n => {
    const s1 = HEROES[n].skill1;
    return s1 && (s1.effectOp || s1.dual);
  });
  const combos = [];
  const len = allHeroes.length;
  for (let size = 1; size <= 4; size++) {
    const gen = (current, start) => {
      if (current.length === size) {
        const sm = calcSkillMod(current, true, atk.leaders || []);
        const hasChance = current.some(n => HEROES[n].skill1?.chance);
        combos.push({
          combo: [...current],
          skillMod: sm.total,
          hasChance,
          damageUp: sm.damageUp,
          defUp: sm.defUp
        });
        return;
      }
      for (let i = start; i < len; i++) {
        current.push(allHeroes[i]);
        gen(current, i);
        current.pop();
      }
    };
    gen([], 0);
  }
  const seen = new Set();
  const results = [];
  combos.sort((a, b) => b.skillMod - a.skillMod);
  for (const c of combos) {
    const key = c.combo.slice().sort().join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    const testAtk = {
      ...atk,
      joiners: c.combo
    };
    const r = calcBattleFull(testAtk, def);
    results.push({
      ...c,
      atkDmg: r.atkDmg,
      defDmg: r.defDmg,
      ratio: r.ratio
    });
    if (results.length >= 10) break;
  }
  results.sort((a, b) => b.ratio - a.ratio);
  return results;
}

// Formation optimizer — sweeps infantry/cavalry/archer % splits
function optimizeFormation(atk, def, total) {
  const results = [];
  for (let inf = 1; inf <= 80; inf += 3) {
    for (let cav = 1; cav <= 80; cav += 3) {
      const arch = 100 - inf - cav;
      if (arch < 1) continue;
      const troops = {
        Infantry: Math.round(total * inf / 100),
        Cavalry: Math.round(total * cav / 100),
        Archer: Math.round(total * arch / 100)
      };
      const r = calcBattleFull({
        ...atk,
        troops
      }, def);
      results.push({
        inf,
        cav,
        arch,
        troops,
        atkDmg: r.atkDmg,
        defDmg: r.defDmg,
        ratio: r.ratio
      });
    }
  }
  results.sort((a, b) => b.ratio - a.ratio);
  return results.slice(0, 8);
}

// Simplified battle sim for stat-gap analysis (uses BR stats directly)
// Global formula coefficients — loaded from Supabase on page load, updated by auto-calibration
var formulaCoeffs = {
  dmg_sqrt_weight: 1.0,
  atk_weight: 1.0,
  leth_weight: 1.0,
  def_weight: 1.0,
  hp_weight: 1.0,
  injured_scale: 1.0,
  version: 1
};

// Load formula coefficients from Supabase
(function loadFormulaConfig() {
  if (typeof fetch !== "undefined") {
    fetch("/api/formula-config").then(function (r) {
      return r.json();
    }).then(function (data) {
      if (data && data.coefficients) {
        formulaCoeffs = data.coefficients;
        console.log("[Kingshot] Formula v" + (formulaCoeffs.version || 1) + " loaded — " + (data.sample_count || 0) + " samples, " + (data.avg_error || 0) + "% error");
      }
    }).catch(function () {});
  }
})();
function simulateBattle(myBR, oppBR) {
  // ══════════════════════════════════════════════════════════════════
  // Kingshot Damage Formula — Validated by Daryl/GDKPS (kingshotguides.com)
  // Kills = √(Troops × ArmyMin) × (ATK × Leth) / (EnemyDef × EnemyHP) × SkillMod
  //
  // Calibrated version uses Math.pow(stat, coefficient) where coefficients
  // are auto-tuned from actual battle results stored in formula_config.
  // When all coefficients = 1.0, this reduces exactly to Daryl's linear formula.
  // ══════════════════════════════════════════════════════════════════
  var C_ATK = formulaCoeffs.atk_weight || 1.0;
  var C_LETH = formulaCoeffs.leth_weight || 1.0;
  var C_DEF = formulaCoeffs.def_weight || 1.0;
  var C_HP = formulaCoeffs.hp_weight || 1.0;
  var C_INJ = formulaCoeffs.injured_scale || 1.0;

  // Total troop counts for geometric mean army scaling
  var myTotal = (myBR.inf || 0) + (myBR.cav || 0) + (myBR.arch || 0);
  var oppTotal = (oppBR.inf || 0) + (oppBR.cav || 0) + (oppBR.arch || 0);
  var armyMin = Math.min(myTotal, oppTotal);

  var myDmgTotal = 0, oppDmgTotal = 0;
  var myPerTroop = {}, oppPerTroop = {};
  var myInjured = {}, oppInjured = {};

  // Troop type advantage multipliers (rock-paper-scissors)
  // Archer → Infantry: Ranged Strike +10%
  // Cavalry → Archer: Charge +10%
  // Infantry → Cavalry: Master Brawler +10%
  var troopAdvantage = { inf: "cav", cav: "arch", arch: "inf" };

  for (var ti = 0; ti < 3; ti++) {
    var t = ["inf", "cav", "arch"][ti];
    var myT = myBR[t] || 0;
    var oppT = oppBR[t] || 0;

    // Stat bonuses: 1 + (bonus% / 100) — e.g., +896.4% → 9.964
    var myAtk = 1 + (myBR[t + "Atk"] || myBR.atk || 0) / 100;
    var myLeth = 1 + (myBR[t + "Leth"] || myBR.leth || 0) / 100;
    var myDef = 1 + (myBR[t + "Def"] || myBR.def || 0) / 100;
    var myHp = 1 + (myBR[t + "Hp"] || myBR.hp || 0) / 100;
    var oppAtk = 1 + (oppBR[t + "Atk"] || oppBR.atk || 0) / 100;
    var oppLeth = 1 + (oppBR[t + "Leth"] || oppBR.leth || 0) / 100;
    var oppDef = 1 + (oppBR[t + "Def"] || oppBR.def || 0) / 100;
    var oppHp = 1 + (oppBR[t + "Hp"] || oppBR.hp || 0) / 100;

    // Daryl's formula: Kills = √(Troops × ArmyMin) × (ATK × Leth) / (Def × HP)
    // With calibrated exponents for auto-tuning
    var myArmy = myT > 0 ? Math.sqrt(myT * armyMin) : 0;
    var oppArmy = oppT > 0 ? Math.sqrt(oppT * armyMin) : 0;

    var myDmg = myArmy > 0 ? myArmy * (Math.pow(myAtk, C_ATK) * Math.pow(myLeth, C_LETH)) / (Math.pow(oppDef, C_DEF) * Math.pow(oppHp, C_HP) || 1) : 0;
    var oppDmg = oppArmy > 0 ? oppArmy * (Math.pow(oppAtk, C_ATK) * Math.pow(oppLeth, C_LETH)) / (Math.pow(myDef, C_DEF) * Math.pow(myHp, C_HP) || 1) : 0;

    // Apply troop type advantage: +10% damage to the type this troop is strong against
    // In a simple sim, we apply a fraction of this based on how much of the enemy is the weak type
    var weakType = troopAdvantage[t];
    var oppWeakPct = oppTotal > 0 ? (oppBR[weakType] || 0) / oppTotal : 0;
    var myWeakPct = myTotal > 0 ? (myBR[weakType] || 0) / myTotal : 0;
    myDmg *= (1 + 0.10 * oppWeakPct);
    oppDmg *= (1 + 0.10 * myWeakPct);

    myPerTroop[t] = myDmg;
    oppPerTroop[t] = oppDmg;
    myDmgTotal += myDmg;
    oppDmgTotal += oppDmg;
  }

  // ── Injured Troops Calculation ──
  // Casualty distribution based on battle type (default: Town Attack)
  // Town Attack: 55% lightly injured, 10% hospitalized, 35% dead (attacker)
  // Defender: 65% lightly, 35% hospitalized, 0% dead
  // The loser typically has 35% of their squad injured in town battles
  var battleType = myBR.battleType || "town_attack";
  var CASUALTY_RATES = {
    town_attack: { attacker: { lightly: 0.55, hospital: 0.10, dead: 0.35 }, defender: { lightly: 0.65, hospital: 0.35, dead: 0 } },
    resource_tile: { attacker: { lightly: 0.65, hospital: 0.35, dead: 0 }, defender: { lightly: 0.65, hospital: 0.35, dead: 0 } },
    sanctuary: { attacker: { lightly: 0.70, hospital: 0.30, dead: 0 }, defender: { lightly: 0.70, hospital: 0.30, dead: 0 } },
    bear_hunt: { attacker: { lightly: 0.98, hospital: 0.02, dead: 0 }, defender: { lightly: 1, hospital: 0, dead: 0 } },
    outpost_lv4: { attacker: { lightly: 0.60, hospital: 0.30, dead: 0.10 }, defender: { lightly: 0.60, hospital: 0.30, dead: 0.10 } }
  };
  var rates = CASUALTY_RATES[battleType] || CASUALTY_RATES.town_attack;

  // Distribute casualties proportionally across troop types based on damage received
  for (var ti2 = 0; ti2 < 3; ti2++) {
    var t2 = ["inf", "cav", "arch"][ti2];
    var myT2 = myBR[t2] || 0;
    var oppT2 = oppBR[t2] || 0;
    var oppDmgToMe = oppPerTroop[t2] || 0;
    var myDmgToOpp = myPerTroop[t2] || 0;

    // Injured ≈ troop_count × damage_proportion × casualty_rate × injured_scale
    var myDmgProportion = oppDmgTotal > 0 ? oppDmgToMe / oppDmgTotal : 0;
    var oppDmgProportion = myDmgTotal > 0 ? myDmgToOpp / myDmgTotal : 0;

    // The losing side has more casualties; ratio determines intensity
    var myLossIntensity = oppDmgTotal > myDmgTotal ? Math.min(1, oppDmgTotal / (myDmgTotal || 1) * 0.35) : Math.min(0.35, myDmgTotal > 0 ? oppDmgTotal / myDmgTotal * 0.15 : 0);
    var oppLossIntensity = myDmgTotal > oppDmgTotal ? Math.min(1, myDmgTotal / (oppDmgTotal || 1) * 0.35) : Math.min(0.35, oppDmgTotal > 0 ? myDmgTotal / oppDmgTotal * 0.15 : 0);

    myInjured[t2] = Math.min(myT2, Math.round(myT2 * myLossIntensity * (rates.attacker.lightly + rates.attacker.hospital) * C_INJ));
    oppInjured[t2] = Math.min(oppT2, Math.round(oppT2 * oppLossIntensity * (rates.defender.lightly + rates.defender.hospital) * C_INJ));
  }

  return {
    myDmg: myDmgTotal, oppDmg: oppDmgTotal,
    ratio: myDmgTotal / (oppDmgTotal || 1),
    myPerTroop: myPerTroop, oppPerTroop: oppPerTroop,
    myInjured: myInjured, oppInjured: oppInjured,
    myTotalInjured: (myInjured.inf || 0) + (myInjured.cav || 0) + (myInjured.arch || 0),
    oppTotalInjured: (oppInjured.inf || 0) + (oppInjured.cav || 0) + (oppInjured.arch || 0),
    casualtyRates: rates, battleType: battleType
  };
}

function calcStatNeededToWin(myBR, oppBR) {
  const result = simulateBattle(myBR, oppBR);
  if (result.ratio >= 1) return {
    winning: true,
    ratio: result.ratio,
    needs: []
  };
  const needs = [];
  // Test each stat across all troops
  for (const [suffix, label] of [["Atk", "Attack"], ["Leth", "Lethality"], ["Def", "Defense"], ["Hp", "Health"]]) {
    let lo = 0,
      hi = 500;
    for (let iter = 0; iter < 30; iter++) {
      const mid = (lo + hi) / 2;
      const testBR = {
        ...myBR
      };
      for (const t of ["inf", "cav", "arch"]) testBR[t + suffix] = (myBR[t + suffix] || 0) + mid;
      if (simulateBattle(testBR, oppBR).ratio >= 1) hi = mid;else lo = mid;
    }
    needs.push({
      stat: suffix.toLowerCase(),
      label,
      needed: Math.ceil(hi),
      isOffensive: suffix === "Atk" || suffix === "Leth"
    });
  }
  return {
    winning: false,
    ratio: result.ratio,
    needs
  };
}

// Hero selector component
function HeroSelect({
  value,
  onChange,
  label
}) {
  return /*#__PURE__*/React.createElement("select", {
    value: value || "",
    onChange: e => onChange(e.target.value || null),
    style: {
      ...S.sel,
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 ", label, " \u2014"), HERO_NAMES.map(n => {
    const h = HEROES[n];
    const cls = h.cls === "Inf" ? "⚔" : h.cls === "Cav" ? "🐴" : "🏹";
    return /*#__PURE__*/React.createElement("option", {
      key: n,
      value: n
    }, cls, " ", n, " (G", h.gen, " ", h.rarity, ")");
  }));
}
function BattleReportPanel({
  title,
  color,
  data,
  setData
}) {
  const upd = (k, v) => setData(d => ({
    ...d,
    [k]: v
  }));
  const statInput = (key, label) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: data[key] || 0,
    min: 0,
    onChange: e => upd(key, Number(e.target.value) || 0),
    style: S.numIn
  }));
  const troopTypes = [{
    key: "inf",
    label: "⚔ Infantry",
    color: TROOP_COLORS.inf
  }, {
    key: "cav",
    label: "🐴 Cavalry",
    color: TROOP_COLORS.cav
  }, {
    key: "arch",
    label: "🏹 Archer",
    color: TROOP_COLORS.arch
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      borderRadius: 8,
      background: C.inputBg,
      border: `1px solid ${color}33`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color,
      marginBottom: 8,
      letterSpacing: "0.04em"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "TROOPS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 6,
      margin: "8px 0 12px"
    }
  }, troopTypes.map(t => statInput(t.key, t.label))), troopTypes.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.key,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.sectionDivider,
      color: t.color
    }
  }, t.label, " STATS (%)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 4,
      marginTop: 6
    }
  }, statInput(t.key + "Atk", "ATK"), statInput(t.key + "Def", "DEF"), statInput(t.key + "Leth", "LETH"), statInput(t.key + "Hp", "HP")))), /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "HEROES & SETUP"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6,
      marginTop: 8,
      marginBottom: 8
    }
  }, troopTypes.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.key,
    style: {
      display: "grid",
      gridTemplateColumns: "80px 1fr 1fr",
      gap: 4,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.fieldLabel,
      marginBottom: 0,
      color: t.color
    }
  }, t.label.split(" ")[1]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "TG Level"), /*#__PURE__*/React.createElement("select", {
    value: data[t.key + "Tg"] || 5,
    onChange: e => upd(t.key + "Tg", Number(e.target.value)),
    style: {
      ...S.sel,
      fontSize: 11
    }
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, "TG ", n)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "Troop Tier"), /*#__PURE__*/React.createElement("select", {
    value: data[t.key + "Tier"] || "T10",
    onChange: e => upd(t.key + "Tier", e.target.value),
    style: {
      ...S.sel,
      fontSize: 11
    }
  }, ["T6", "T7", "T8", "T9", "T10", "T11"].map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      marginTop: 4
    }
  }, "LEAD HEROES (ALL 3 SKILLS)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 3,
      marginBottom: 6
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement(HeroSelect, {
    key: i,
    value: (data.leaders || [])[i],
    label: `Leader ${i + 1}`,
    onChange: v => {
      const l = [...(data.leaders || [null, null, null])];
      l[i] = v;
      upd("leaders", l);
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "JOINERS (SKILL 1 ONLY)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 3
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement(HeroSelect, {
    key: i,
    value: (data.joiners || [])[i],
    label: `Joiner ${i + 1}`,
    onChange: v => {
      const j = [...(data.joiners || [null, null, null, null])];
      j[i] = v;
      upd("joiners", j);
    }
  }))));
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

const TABS = [{
  id: "compare",
  label: "⚔️ Compare"
}, {
  id: "recommend",
  label: "🎯 Recommend"
}, {
  id: "costs",
  label: "💰 Costs"
}, {
  id: "reference",
  label: "📖 Reference"
}, {
  id: "cloud",
  label: "☁️ Cloud"
}];
function App() {
  const [tab, setTab] = useState("compare");
  const [myData, setMyData] = useState(makeMyDefaults);
  const [oppData, setOppData] = useState(makeDefaultPlayer);

  // Battle Report stats (from in-game battle reports) + hero setup
  // Per-troop stats: inf/cav/arch each have atk/def/leth/hp + tg (1-5) + tier (T6-T11)
  const [myBR, setMyBR] = useState({
    inf: 8000,
    cav: 15000,
    arch: 37000,
    infAtk: 130,
    infDef: 65,
    infLeth: 50,
    infHp: 45,
    cavAtk: 140,
    cavDef: 60,
    cavLeth: 55,
    cavHp: 40,
    archAtk: 120,
    archDef: 70,
    archLeth: 45,
    archHp: 50,
    infTg: 5,
    cavTg: 5,
    archTg: 5,
    infTier: "T10",
    cavTier: "T10",
    archTier: "T10",
    leaders: ["Amadeus", null, null],
    joiners: [null, null, null, null]
  });
  const [oppBR, setOppBR] = useState({
    inf: 12000,
    cav: 10000,
    arch: 28000,
    infAtk: 90,
    infDef: 100,
    infLeth: 35,
    infHp: 80,
    cavAtk: 95,
    cavDef: 90,
    cavLeth: 40,
    cavHp: 75,
    archAtk: 85,
    archDef: 95,
    archLeth: 30,
    archHp: 85,
    infTg: 5,
    cavTg: 5,
    archTg: 5,
    infTier: "T10",
    cavTier: "T10",
    archTier: "T10",
    leaders: ["Eric", null, null],
    joiners: [null, null, null, null]
  });
  const myStats = useMemo(() => computeAllStats(myData), [myData]);
  const oppStats = useMemo(() => computeAllStats(oppData), [oppData]);
  const recs = useMemo(() => generateRecommendations(myData, oppData), [myData, oppData]);

  // Battle simulation from BR stats
  const battleResult = useMemo(() => {
    const hasBR = myBR.inf + myBR.cav + myBR.arch > 0 && oppBR.inf + oppBR.cav + oppBR.arch > 0;
    if (!hasBR) return null;
    return simulateBattle(myBR, oppBR);
  }, [myBR, oppBR]);
  const statNeeds = useMemo(() => {
    const hasBR = myBR.inf + myBR.cav + myBR.arch > 0 && oppBR.inf + oppBR.cav + oppBR.arch > 0;
    if (!hasBR) return null;
    return calcStatNeededToWin(myBR, oppBR);
  }, [myBR, oppBR]);

  // Full battle calc with heroes (for joiner/formation optimizer)
  const fullBattleAtk = useMemo(() => ({
    troops: {
      Infantry: myBR.inf || 0,
      Cavalry: myBR.cav || 0,
      Archer: myBR.arch || 0
    },
    stats: {
      inf: { atk: myBR.infAtk || 0, leth: myBR.infLeth || 0, def: myBR.infDef || 0, hp: myBR.infHp || 0 },
      cav: { atk: myBR.cavAtk || 0, leth: myBR.cavLeth || 0, def: myBR.cavDef || 0, hp: myBR.cavHp || 0 },
      arch: { atk: myBR.archAtk || 0, leth: myBR.archLeth || 0, def: myBR.archDef || 0, hp: myBR.archHp || 0 }
    },
    leaders: (myBR.leaders || []).filter(Boolean),
    joiners: (myBR.joiners || []).filter(Boolean)
  }), [myBR]);
  const fullBattleDef = useMemo(() => ({
    troops: {
      Infantry: oppBR.inf || 0,
      Cavalry: oppBR.cav || 0,
      Archer: oppBR.arch || 0
    },
    stats: {
      inf: { atk: oppBR.infAtk || 0, leth: oppBR.infLeth || 0, def: oppBR.infDef || 0, hp: oppBR.infHp || 0 },
      cav: { atk: oppBR.cavAtk || 0, leth: oppBR.cavLeth || 0, def: oppBR.cavDef || 0, hp: oppBR.cavHp || 0 },
      arch: { atk: oppBR.archAtk || 0, leth: oppBR.archLeth || 0, def: oppBR.archDef || 0, hp: oppBR.archHp || 0 }
    },
    leaders: (oppBR.leaders || []).filter(Boolean),
    joiners: (oppBR.joiners || []).filter(Boolean)
  }), [oppBR]);

  // Full battle result with heroes/skills
  const fullBattleResult = useMemo(() => {
    if (fullBattleAtk.troops.Infantry + fullBattleAtk.troops.Cavalry + fullBattleAtk.troops.Archer === 0) return null;
    if (fullBattleDef.troops.Infantry + fullBattleDef.troops.Cavalry + fullBattleDef.troops.Archer === 0) return null;
    return calcBattleFull(fullBattleAtk, fullBattleDef);
  }, [fullBattleAtk, fullBattleDef]);

  // Joiner optimizer (only run when recommend tab is active and we have data)
  const [joinerResults, setJoinerResults] = useState(null);
  const [formationResults, setFormationResults] = useState(null);
  const [showAllRecs, setShowAllRecs] = useState(false);

  // Actual battle result — for calibrating the formula
  const [actualResult, setActualResult] = useState({
    outcome: "",
    // "win", "loss", "draw"
    myPowerLost: 0,
    oppPowerLost: 0,
    myInjuredInf: 0,
    myInjuredCav: 0,
    myInjuredArch: 0,
    oppInjuredInf: 0,
    oppInjuredCav: 0,
    oppInjuredArch: 0,
    myLightlyInf: 0,
    myLightlyCav: 0,
    myLightlyArch: 0,
    oppLightlyInf: 0,
    oppLightlyCav: 0,
    oppLightlyArch: 0
  });
  const [actualSubmitted, setActualSubmitted] = useState(false);
  const updActual = (k, v) => setActualResult(prev => ({
    ...prev,
    [k]: v
  }));
  const submitActualResult = useCallback(() => {
    if (!actualResult.outcome) {
      alert("Please select Win, Loss, or Draw first");
      return;
    }
    const payload = {
      governor_name: "User",
      kingdom: "Auto",
      predicted_ratio: battleResult ? battleResult.ratio : null,
      predicted_mydmg: battleResult ? battleResult.myDmg : null,
      predicted_oppdmg: battleResult ? battleResult.oppDmg : null,
      predicted_myinjured: battleResult ? battleResult.myTotalInjured : null,
      predicted_oppinjured: battleResult ? battleResult.oppTotalInjured : null,
      actual_outcome: actualResult.outcome,
      actual_mypowerlost: actualResult.myPowerLost,
      actual_opppowerlost: actualResult.oppPowerLost,
      actual_myinjuredinf: actualResult.myInjuredInf,
      actual_myinjuredcav: actualResult.myInjuredCav,
      actual_myinjuredarch: actualResult.myInjuredArch,
      actual_oppinjuredinf: actualResult.oppInjuredInf,
      actual_oppinjuredcav: actualResult.oppInjuredCav,
      actual_oppinjuredarch: actualResult.oppInjuredArch,
      input_mybr: myBR,
      input_oppbr: oppBR,
      profile_type: "actual_result"
    };
    if (typeof sbInsert === "function") {
      sbInsert("battle_reports", payload).then(function (res) {
        if (res.ok) setActualSubmitted(true);else console.error("Submit error:", res.error);
      });
    }
  }, [actualResult, battleResult, myBR, oppBR]);
  const [sbConnected] = useState(!!sbClient);
  const [adminKey, setAdminKey] = useState('');
  const [cloudMsg, setCloudMsg] = useState('');
  const [cloudData, setCloudData] = useState(null);
  const autoSaveTimer = React.useRef(null);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (typeof lsSave === 'function') lsSave({
      myData,
      oppData,
      myBR,
      oppBR
    });
  }, [myData, oppData, myBR, oppBR]);

  // Auto-submit to Supabase (debounced — saves 3 seconds after last change)
  useEffect(() => {
    if (!sbClient) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      // Only auto-save if there's meaningful data (at least some troops or gear set)
      const hasBRData = myBR.inf + myBR.cav + myBR.arch > 0;
      const hasGearData = Object.values(myData.govGear || {}).some(v => v !== "none");
      if (hasBRData) {
        sbInsert('battle_reports', {
          governor_name: 'Auto',
          kingdom: 'Auto',
          atk_inf: myBR.inf,
          atk_cav: myBR.cav,
          atk_arch: myBR.arch,
          atk_bonus: myBR.atk,
          leth_bonus: myBR.leth,
          def_bonus: myBR.def,
          hp_bonus: myBR.hp,
          atk_tier: myBR.tier || 'T10',
          atk_leaders: (myBR.leaders || []).filter(Boolean),
          atk_joiners: (myBR.joiners || []).filter(Boolean),
          def_inf: oppBR.inf,
          def_cav: oppBR.cav,
          def_arch: oppBR.arch,
          def_atk_bonus: oppBR.atk,
          def_leth_bonus: oppBR.leth,
          def_def_bonus: oppBR.def,
          def_hp_bonus: oppBR.hp,
          def_tier: oppBR.tier || 'T10',
          def_leaders: (oppBR.leaders || []).filter(Boolean),
          def_joiners: (oppBR.joiners || []).filter(Boolean),
          predicted_ratio: battleResult ? battleResult.ratio : null,
          outcome: 'unknown'
        }).catch(() => {});
      }
      if (hasGearData) {
        sbInsert('gear_configs', {
          governor_name: 'Auto',
          kingdom: 'Auto',
          gear_data: {
            myData,
            myBR
          },
          profile_type: 'full'
        }).catch(() => {});
      }
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [myData, oppData, myBR, oppBR, battleResult]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof lsLoad === 'function') {
      const saved = lsLoad();
      if (saved) {
        if (saved.myData) setMyData(saved.myData);
        if (saved.oppData) setOppData(saved.oppData);
        if (saved.myBR) setMyBR(saved.myBR);
        if (saved.oppBR) setOppBR(saved.oppBR);
      }
    }
  }, []);
  const loadCloudData = async table => {
    if (!adminKey) {
      setCloudMsg('Enter admin passphrase first');
      return;
    }
    if (typeof sbSelect !== 'function') {
      setCloudMsg('Supabase not available');
      return;
    }
    const res = await sbSelect(table, adminKey);
    if (res.error) setCloudMsg('Error: ' + res.error);else {
      setCloudData(res.data);
      setCloudMsg('Loaded ' + (res.data?.length || 0) + ' records from ' + table);
    }
  };
  const runOptimizers = useCallback(() => {
    if (fullBattleAtk.leaders.length === 0) return;
    const total = fullBattleAtk.troops.Infantry + fullBattleAtk.troops.Cavalry + fullBattleAtk.troops.Archer;
    if (total === 0) return;
    const jr = optimizeJoiners(fullBattleAtk, fullBattleDef);
    setJoinerResults(jr);
    const bestJoiners = jr.length > 0 ? jr[0].combo : fullBattleAtk.joiners;
    const fr = optimizeFormation({
      ...fullBattleAtk,
      joiners: bestJoiners
    }, fullBattleDef, total);
    setFormationResults(fr);
  }, [fullBattleAtk, fullBattleDef]);
  const gearScore = stats => {
    let t = 0;
    for (const troop of ["inf", "cav", "arch"]) t += stats[troop].atk + stats[troop].def + stats[troop].leth + stats[troop].hp;
    return t;
  };
  const myScore = gearScore(myStats);
  const oppScore = gearScore(oppStats);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: C.fontDisplay
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: "0 auto",
      padding: "0 16px 60px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 0",
      borderBottom: `1px solid ${C.panelBorder}`,
      background: `linear-gradient(180deg, ${C.panel}, transparent)`,
      margin: "0 -16px",
      padding: "20px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: `linear-gradient(135deg, ${C.accent}, ${C.red})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      fontWeight: 900,
      color: "#000",
      flexShrink: 0
    }
  }, "K"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: "-0.01em"
    }
  }, "Kingshot Gear Gap Analyzer"), /*#__PURE__*/React.createElement("span", {
    style: S.badge(C.accent)
  }, "PVP ENGINE V2"), /*#__PURE__*/React.createElement("span", {
    style: S.badge(C.green)
  }, "LIVE")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontFamily: C.fontMono,
      fontSize: 11,
      color: C.accent,
      background: C.inputBg,
      padding: "4px 10px",
      borderRadius: 4,
      display: "inline-block"
    }
  }, "Kills = \u221ATroops \xD7 (Atk \xD7 Leth) / (Def \xD7 HP) \xD7 SkillMod")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      paddingTop: 16
    }
  }, TABS.map(t => {
    const tabColors = {
      compare: C.accent,
      recommend: C.green,
      costs: C.violet,
      reference: "#f472b6",
      cloud: C.blue
    };
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => setTab(t.id),
      style: {
        padding: "10px 20px",
        borderRadius: "8px 8px 0 0",
        cursor: "pointer",
        border: `1px solid ${tab === t.id ? C.panelBorder : "transparent"}`,
        borderBottomColor: tab === t.id ? C.panel : "transparent",
        background: tab === t.id ? C.panel : "transparent",
        color: tab === t.id ? tabColors[t.id] || C.text : C.textDim,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.02em",
        fontFamily: C.fontDisplay,
        transition: "all 0.2s"
      }
    }, t.label);
  })), tab === "compare" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20,
      flexWrap: "wrap",
      marginTop: 16,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "YOUR GEAR SCORE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      fontFamily: C.fontMono,
      color: C.green
    }
  }, myScore.toFixed(0))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: C.textMuted,
      fontFamily: C.fontMono
    }
  }, "VS")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 200,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      textAlign: "right"
    }
  }, "OPPONENT SCORE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      fontFamily: C.fontMono,
      color: C.red
    }
  }, oppScore.toFixed(0)))), /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "\u2699 GOVERNOR GEAR"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      marginTop: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(PlayerPanel, {
    title: "You",
    color: C.green,
    data: myData,
    setData: setMyData,
    section: "gov"
  }), /*#__PURE__*/React.createElement(PlayerPanel, {
    title: "Opponent",
    color: C.blue,
    data: oppData,
    setData: setOppData,
    section: "gov"
  })), /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "\uD83D\uDC8E CHARMS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      marginTop: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(PlayerPanel, {
    title: "You",
    color: C.green,
    data: myData,
    setData: setMyData,
    section: "charm"
  }), /*#__PURE__*/React.createElement(PlayerPanel, {
    title: "Opponent",
    color: C.blue,
    data: oppData,
    setData: setOppData,
    section: "charm"
  })), /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "\uD83D\uDDE1 HERO GEAR"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      marginTop: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(PlayerPanel, {
    title: "You",
    color: C.green,
    data: myData,
    setData: setMyData,
    section: "hero"
  }), /*#__PURE__*/React.createElement(PlayerPanel, {
    title: "Opponent",
    color: C.blue,
    data: oppData,
    setData: setOppData,
    section: "hero"
  })), /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "\uD83D\uDCCB BATTLE REPORT STATS"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginTop: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 10px",
      fontSize: 10,
      color: C.textDim
    }
  }, "Enter stats from an in-game Battle Report to simulate outcomes and see what you need to win."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 250
    }
  }, /*#__PURE__*/React.createElement(BattleReportPanel, {
    title: "YOUR STATS",
    color: C.green,
    data: myBR,
    setData: setMyBR
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 250
    }
  }, /*#__PURE__*/React.createElement(BattleReportPanel, {
    title: "OPPONENT STATS",
    color: C.blue,
    data: oppBR,
    setData: setOppBR
  })))), /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "\uD83D\uDCCA STAT BREAKDOWN"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginTop: 12,
      marginBottom: 16
    }
  }, ["inf", "cav", "arch"].map(troop => /*#__PURE__*/React.createElement("div", {
    key: troop,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      color: TROOP_COLORS[troop],
      marginBottom: 4
    }
  }, TROOP_NAMES[troop].toUpperCase()), ["atk", "def", "leth", "hp"].map(stat => /*#__PURE__*/React.createElement(StatBar, {
    key: `${troop}_${stat}`,
    label: STAT_LABELS[stat],
    myVal: myStats[troop][stat],
    oppVal: oppStats[troop][stat],
    troop: troop
  }))))), battleResult && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "\u2694 DAMAGE RESULT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20,
      flexWrap: "wrap",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 150
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "YOUR DAMAGE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      fontFamily: C.fontMono,
      color: C.green
    }
  }, battleResult.myDmg.toFixed(2))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 150,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      textAlign: "right"
    }
  }, "OPPONENT DAMAGE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      fontFamily: C.fontMono,
      color: C.red
    }
  }, battleResult.oppDmg.toFixed(2)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      color: C.green,
      marginBottom: 6
    }
  }, "YOUR TROOPS INJURED"), ["inf", "cav", "arch"].map(t => {
    const injured = battleResult.myInjured[t] || 0;
    const total = myBR[t] || 0;
    const pct = total > 0 ? injured / total * 100 : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: t,
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: `1px solid ${C.panelBorder}`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: TROOP_COLORS[t],
        fontWeight: 600
      }
    }, t === "inf" ? "⚔" : t === "cav" ? "🐴" : "🏹", " ", TROOP_NAMES[t]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: C.fontMono,
        fontSize: 12,
        fontWeight: 700,
        color: injured > 0 ? C.red : C.textDim
      }
    }, injured.toLocaleString(), " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: C.textDim
      }
    }, "/ ", total.toLocaleString(), " (", pct.toFixed(1), "%)")));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.fieldLabel,
      marginBottom: 0
    }
  }, "TOTAL INJURED"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: C.fontMono,
      fontSize: 14,
      fontWeight: 800,
      color: C.red
    }
  }, battleResult.myTotalInjured.toLocaleString()))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      color: C.blue,
      marginBottom: 6
    }
  }, "OPPONENT TROOPS INJURED"), ["inf", "cav", "arch"].map(t => {
    const injured = battleResult.oppInjured[t] || 0;
    const total = oppBR[t] || 0;
    const pct = total > 0 ? injured / total * 100 : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: t,
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: `1px solid ${C.panelBorder}`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: TROOP_COLORS[t],
        fontWeight: 600
      }
    }, t === "inf" ? "⚔" : t === "cav" ? "🐴" : "🏹", " ", TROOP_NAMES[t]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: C.fontMono,
        fontSize: 12,
        fontWeight: 700,
        color: injured > 0 ? C.green : C.textDim
      }
    }, injured.toLocaleString(), " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: C.textDim
      }
    }, "/ ", total.toLocaleString(), " (", pct.toFixed(1), "%)")));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.fieldLabel,
      marginBottom: 0
    }
  }, "TOTAL INJURED"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: C.fontMono,
      fontSize: 14,
      fontWeight: 800,
      color: C.green
    }
  }, battleResult.oppTotalInjured.toLocaleString())))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      marginTop: 8,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "BATTLE RATIO"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      fontFamily: C.fontMono,
      color: battleResult.ratio >= 1 ? C.green : C.red
    }
  }, battleResult.ratio >= 1 ? "✓ WINNING" : "✗ LOSING", " \u2014 ", battleResult.ratio.toFixed(3))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.sectionDivider
  }, "\uD83D\uDCDD ACTUAL BATTLE RESULT"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: C.textDim,
      marginTop: 6,
      marginBottom: 10
    }
  }, "Enter the real outcome from your battle report. This data helps calibrate the formula for better accuracy over time."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 12
    }
  }, [["win", "✓ WIN", C.green], ["loss", "✗ LOSS", C.red], ["draw", "⚖ DRAW", C.accent]].map(function (opt) {
    return React.createElement("button", {
      key: opt[0],
      onClick: function () {
        updActual("outcome", opt[0]);
      },
      style: {
        flex: 1,
        padding: "10px 8px",
        borderRadius: 6,
        border: "1px solid " + (actualResult.outcome === opt[0] ? opt[2] : C.inputBorder),
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
        fontFamily: C.fontDisplay,
        background: actualResult.outcome === opt[0] ? opt[2] + "22" : C.inputBg,
        color: actualResult.outcome === opt[0] ? opt[2] : C.textDim
      }
    }, opt[1]);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "YOUR POWER LOST"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: actualResult.myPowerLost || "",
    placeholder: "0",
    onChange: function (e) {
      updActual("myPowerLost", Number(e.target.value) || 0);
    },
    style: S.numIn
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.fieldLabel
  }, "OPPONENT POWER LOST"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: actualResult.oppPowerLost || "",
    placeholder: "0",
    onChange: function (e) {
      updActual("oppPowerLost", Number(e.target.value) || 0);
    },
    style: S.numIn
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      color: C.green,
      marginBottom: 6
    }
  }, "YOUR ACTUAL INJURED"), [["inf", "⚔ Infantry"], ["cav", "🐴 Cavalry"], ["arch", "🏹 Archer"]].map(function (t) {
    return React.createElement("div", {
      key: t[0],
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
      }
    }, React.createElement("span", {
      style: {
        fontSize: 10,
        color: TROOP_COLORS[t[0]],
        fontWeight: 600
      }
    }, t[1]), React.createElement("input", {
      type: "number",
      value: actualResult["myInjured" + t[0].charAt(0).toUpperCase() + t[0].slice(1)] || "",
      placeholder: "0",
      onChange: function (e) {
        updActual("myInjured" + t[0].charAt(0).toUpperCase() + t[0].slice(1), Number(e.target.value) || 0);
      },
      style: {
        ...S.numIn,
        width: 90
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.totalBox,
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.fieldLabel,
      color: C.blue,
      marginBottom: 6
    }
  }, "OPPONENT ACTUAL INJURED"), [["inf", "⚔ Infantry"], ["cav", "🐴 Cavalry"], ["arch", "🏹 Archer"]].map(function (t) {
    return React.createElement("div", {
      key: t[0],
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
      }
    }, React.createElement("span", {
      style: {
        fontSize: 10,
        color: TROOP_COLORS[t[0]],
        fontWeight: 600
      }
    }, t[1]), React.createElement("input", {
      type: "number",
      value: actualResult["oppInjured" + t[0].charAt(0).toUpperCase() + t[0].slice(1)] || "",
      placeholder: "0",
      onChange: function (e) {
        updActual("oppInjured" + t[0].charAt(0).toUpperCase() + t[0].slice(1), Number(e.target.value) || 0);
      },
      style: {
        ...S.numIn,
        width: 90
      }
    }));
  }))), !actualSubmitted ? /*#__PURE__*/React.createElement("button", {
    onClick: submitActualResult,
    style: {
      width: "100%",
      padding: "12px 20px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 800,
      fontFamily: C.fontDisplay,
      background: actualResult.outcome ? "linear-gradient(135deg, " + C.accent + ", " + C.green + ")" : C.inputBg,
      color: actualResult.outcome ? "#000" : C.textDim
    }
  }, "\uD83D\uDCCA Submit Actual Result for Formula Calibration") : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "12px 20px",
      borderRadius: 8,
      background: C.green + "18",
      border: "1px solid " + C.green + "33"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: C.green
    }
  }, "\u2713 Submitted! Thank you \u2014 this data helps improve accuracy."))))), tab === "recommend" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, statNeeds && /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 14,
      fontWeight: 800,
      color: statNeeds.winning ? "#4ade80" : "#f59e0b"
    }
  }, statNeeds.winning ? "✓ You're Already Winning!" : "📊 Stats Needed to Overcome Opponent"), statNeeds.winning ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: "#4ade80"
    }
  }, "Your damage ratio is ", statNeeds.ratio.toFixed(3), " \u2014 you outperform your opponent based on current battle report stats.") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      fontSize: 10,
      color: "#64748b"
    }
  }, "Current ratio: ", statNeeds.ratio.toFixed(3), ". You need to increase any ONE of these stats to reach parity (ratio \u2265 1.0):"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6
    }
  }, statNeeds.needs.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.stat,
    style: {
      padding: "8px 12px",
      borderRadius: 6,
      background: n.isOffensive ? "rgba(251,191,36,0.06)" : "rgba(96,165,250,0.06)",
      border: `1px solid ${n.isOffensive ? "rgba(251,191,36,0.15)" : "rgba(96,165,250,0.15)"}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8"
    }
  }, n.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      color: n.isOffensive ? "#fbbf24" : "#60a5fa"
    }
  }, "+", n.needed, "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#64748b"
    }
  }, "additional needed")))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px 0 0",
      fontSize: 10,
      color: "#64748b",
      fontStyle: "italic"
    }
  }, "These are the minimum additional stat% on top of your current bonuses. Use the gear recommendations below to determine which upgrades provide this gain most efficiently."))), !statNeeds && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      textAlign: "center",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: "#64748b"
    }
  }, "Enter battle report stats on the Compare tab (troops + Atk/Leth/Def/HP%) to see what you need to overcome your opponent.")), fullBattleAtk.leaders.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 800,
      color: "#a78bfa"
    }
  }, "\uD83E\uDDE0 Battle Optimizer"), /*#__PURE__*/React.createElement("button", {
    onClick: runOptimizers,
    style: {
      padding: "6px 14px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 700,
      background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))",
      color: "#a78bfa"
    }
  }, "Run Optimizer")), fullBattleResult && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10,
      padding: "6px 10px",
      borderRadius: 6,
      background: "rgba(0,0,0,0.2)",
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "Current battle result: "), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      color: fullBattleResult.ratio >= 1 ? "#4ade80" : "#f87171"
    }
  }, "Ratio ", fullBattleResult.ratio.toFixed(3), " \u2014 SkillMod: Atk \xD7", fullBattleResult.atkSM.total.toFixed(3), " / Def \xD7", fullBattleResult.defSM.total.toFixed(3))), joinerResults && joinerResults.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#818cf8",
      marginBottom: 6
    }
  }, "Best Joiner Combos (by EV damage ratio)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, joinerResults.slice(0, 6).map((jr, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 5,
      background: i === 0 ? "rgba(74,222,128,0.06)" : "rgba(0,0,0,0.12)",
      border: i === 0 ? "1px solid rgba(74,222,128,0.15)" : "1px solid transparent"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: i === 0 ? "#4ade80" : "#64748b",
      width: 18
    }
  }, "#", i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexWrap: "wrap",
      gap: 3
    }
  }, jr.combo.map((name, j) => {
    const h = HEROES[name];
    const col = h?.skill1?.chance ? "#f59e0b" : h?.skill1?.type === "DamageUp" || h?.skill1?.dual?.some(d => d.type === "DamageUp") ? "#ef4444" : "#3b82f6";
    return /*#__PURE__*/React.createElement("span", {
      key: j,
      style: {
        padding: "1px 6px",
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 600,
        background: `${col}18`,
        color: col,
        border: `1px solid ${col}33`
      }
    }, name);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      minWidth: 60
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: jr.ratio >= 1 ? "#4ade80" : "#f87171"
    }
  }, jr.ratio.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#64748b"
    }
  }, jr.hasChance ? "EV" : "Guaranteed")))))), formationResults && formationResults.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#818cf8",
      marginBottom: 6
    }
  }, "Best Formation Splits (by damage ratio)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, formationResults.slice(0, 5).map((fr, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 5,
      background: i === 0 ? "rgba(74,222,128,0.06)" : "rgba(0,0,0,0.12)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: i === 0 ? "#4ade80" : "#64748b",
      width: 18
    }
  }, "#", i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f59e0b"
    }
  }, "Inf ", fr.inf, "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#a78bfa"
    }
  }, "Cav ", fr.cav, "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4ade80"
    }
  }, "Arc ", fr.arch, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 4,
      borderRadius: 2,
      overflow: "hidden",
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${fr.inf}%`,
      background: "#f59e0b"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${fr.cav}%`,
      background: "#a78bfa"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${fr.arch}%`,
      background: "#4ade80"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      minWidth: 55
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: fr.ratio >= 1 ? "#4ade80" : "#f87171"
    }
  }, fr.ratio.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#64748b"
    }
  }, "ratio")))))), !joinerResults && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: "#64748b",
      textAlign: "center",
      padding: 8
    }
  }, "Set your lead heroes on the Compare tab, then click \"Run Optimizer\" to find the best joiner combos and formations.")), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 3px",
      fontSize: 15,
      fontWeight: 800,
      color: C.text
    }
  }, "Top Gear Upgrade Recommendations"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 12px",
      fontSize: 10,
      color: C.textDim
    }
  }, "Ranked by PvP impact / cost efficiency. Prioritizes closing stat gaps."), recs.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.textDim,
      textAlign: "center",
      padding: 16
    }
  }, "Enter gear on both sides to see recommendations.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, recs.slice(0, showAllRecs ? recs.length : 5).map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 6,
      background: i === 0 ? `${C.green}0f` : C.inputBg,
      border: i === 0 ? `1px solid ${C.green}33` : `1px solid ${C.inputBorder}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24,
      height: 24,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 900,
      fontSize: 11,
      background: i < 3 ? `${C.green}1a` : C.inputBg,
      color: i < 3 ? C.green : C.textDim,
      flexShrink: 0
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: C.text,
      marginBottom: 1
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: TROOP_COLORS[r.troop],
      fontWeight: 600
    }
  }, TROOP_NAMES[r.troop]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: C.green
    }
  }, r.statGain))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: C.accent,
      fontFamily: C.fontMono
    }
  }, r.efficiency.toFixed(1)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: C.textDim
    }
  }, "EFF")))), recs.length > 5 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAllRecs(!showAllRecs),
    style: {
      padding: "8px 16px",
      borderRadius: 6,
      border: `1px solid ${C.inputBorder}`,
      cursor: "pointer",
      background: C.inputBg,
      color: C.textDim,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: C.fontDisplay,
      textAlign: "center"
    }
  }, showAllRecs ? `▲ Show Top 5 Only` : `▼ Show All ${recs.length} Recommendations`)))), tab === "costs" && /*#__PURE__*/React.createElement(CostsTab, null), tab === "reference" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 13,
      fontWeight: 800,
      color: "#60a5fa"
    }
  }, "Battle Formula"), /*#__PURE__*/React.createElement("code", {
    style: {
      display: "block",
      padding: 10,
      borderRadius: 6,
      background: "rgba(0,0,0,0.4)",
      fontSize: 11,
      color: "#4ade80",
      lineHeight: 1.5
    }
  }, "Kills = sqrt(Troops) x (Atk x Leth) / (EnemyDef x EnemyHP) x SkillMod")), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 13,
      fontWeight: 800,
      color: "#2dd4bf"
    }
  }, "Hero Gear Expedition Formula"), /*#__PURE__*/React.createElement("code", {
    style: {
      display: "block",
      padding: 10,
      borderRadius: 6,
      background: "rgba(0,0,0,0.4)",
      fontSize: 11,
      color: "#2dd4bf",
      lineHeight: 1.5
    }
  }, "Final% = (50 + 0.5 x Enhance) x (1 + Forge x 10%)", "\n", "Mythic: Enhance 0-100 | Red: Enhance 0-200"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontSize: 10,
      color: "#94a3b8"
    }
  }, "Red gear is created by imbuing Mythic Lv100 + Mastery Lv10 + sacrifice 3 Mythic pieces. Red extends enhance to 200 with additional imbuement milestones at +120, +160, +200.")), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 13,
      fontWeight: 800,
      color: "#f472b6"
    }
  }, "Charm Table (Lv0-22)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 3,
      fontSize: 10
    }
  }, CHARM_LEVELS.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.level,
    style: {
      padding: "3px 6px",
      borderRadius: 3,
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, "Lv", c.level), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f472b6",
      fontWeight: 600
    }
  }, "+", c.bonus, "%")))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "5px 0 0",
      fontSize: 10,
      color: "#94a3b8"
    }
  }, "Each charm = Lethality% + Health% for its troop type. 6 charms per type, 18 total.")), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 13,
      fontWeight: 800,
      color: "#fbbf24"
    }
  }, "Gov Gear Set Bonuses"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 6px",
      fontSize: 10,
      color: "#94a3b8"
    }
  }, "3 pieces at same quality = Defense% to all troops. 6 pieces = Attack% to all troops."), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 180,
      overflowY: "auto",
      borderRadius: 6,
      background: "rgba(0,0,0,0.3)",
      padding: 6
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      fontSize: 10,
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: 3
    }
  }, "Tier"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "3pc Def%"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "6pc Atk%"))), /*#__PURE__*/React.createElement("tbody", null, SET_BONUSES.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.tier
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#cbd5e1"
    }
  }, s.label), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#4ade80",
      textAlign: "right"
    }
  }, "+", s.def3, "%"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#60a5fa",
      textAlign: "right"
    }
  }, "+", s.atk6, "%"))))))), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 13,
      fontWeight: 800,
      color: "#a78bfa"
    }
  }, "Gov Gear Stats (Key Tiers)"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 200,
      overflowY: "auto",
      borderRadius: 6,
      background: "rgba(0,0,0,0.3)",
      padding: 6
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      fontSize: 10,
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      color: "#64748b"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: 3
    }
  }, "Tier"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: 3
    }
  }, "Atk & Def %"))), /*#__PURE__*/React.createElement("tbody", null, GOV_GEAR_LEVELS.filter((_, i) => i === 0 || i % 4 === 0 || i > 28).map(g => /*#__PURE__*/React.createElement("tr", {
    key: g.id
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#cbd5e1"
    }
  }, g.label), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "2px 3px",
      color: "#fbbf24",
      textAlign: "right",
      fontWeight: 600
    }
  }, "+", g.bonus.toFixed(2), "%")))))))), tab === "cloud" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: sbConnected ? C.green : C.red,
      boxShadow: sbConnected ? `0 0 8px ${C.green}88` : "none"
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 800,
      color: C.violet
    }
  }, "\u2601\uFE0F Cloud Sync"), /*#__PURE__*/React.createElement("span", {
    style: S.badge(sbConnected ? C.green : C.red)
  }, sbConnected ? "CONNECTED" : "OFFLINE")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: C.textDim
    }
  }, "Data is automatically saved to the cloud database every 3 seconds after changes. All submissions are anonymous. Only the admin can view submitted data."), cloudMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "6px 10px",
      borderRadius: 4,
      background: C.inputBg,
      fontSize: 10,
      color: C.textDim
    }
  }, cloudMsg)), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 800,
      color: C.accent
    }
  }, "\uD83D\uDCC1 JSON Import / Export"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => typeof exportJSON === 'function' && exportJSON({
      myData,
      oppData,
      myBR,
      oppBR,
      exportedAt: new Date().toISOString()
    }),
    style: {
      padding: "8px 16px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: C.fontDisplay,
      background: `${C.accent}22`,
      color: C.accent
    }
  }, "\uD83D\uDCE5 Export Config"), /*#__PURE__*/React.createElement("button", {
    onClick: () => typeof importJSON === 'function' && importJSON(data => {
      if (data.myData) setMyData(data.myData);
      if (data.oppData) setOppData(data.oppData);
      if (data.myBR) setMyBR(data.myBR);
      if (data.oppBR) setOppBR(data.oppBR);
      setCloudMsg('Config imported!');
    }),
    style: {
      padding: "8px 16px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: C.fontDisplay,
      background: `${C.violet}22`,
      color: C.violet
    }
  }, "\uD83D\uDCE4 Import Config"))), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 800,
      color: C.red
    }
  }, "\uD83D\uDD10 Admin Panel"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      fontSize: 10,
      color: C.textDim
    }
  }, "Enter admin passphrase to view submitted data."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: adminKey,
    onChange: e => setAdminKey(e.target.value),
    placeholder: "Admin passphrase",
    style: {
      ...S.sel,
      flex: 1
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      marginBottom: 8
    }
  }, ["battle_reports", "gear_configs", "formula_corrections"].map(table => /*#__PURE__*/React.createElement("button", {
    key: table,
    onClick: () => loadCloudData(table),
    style: {
      padding: "6px 12px",
      borderRadius: 5,
      border: "none",
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 600,
      fontFamily: C.fontDisplay,
      background: `${C.red}18`,
      color: C.red
    }
  }, "View ", table))), cloudData && cloudData.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 300,
      overflowY: "auto",
      borderRadius: 6,
      background: C.inputBg,
      padding: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.textDim,
      marginBottom: 4
    }
  }, cloudData.length, " records"), cloudData.map((row, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "6px 8px",
      marginBottom: 4,
      borderRadius: 4,
      background: C.bg,
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: C.textDim
    }
  }, "#", i + 1, " \u2014 ", row.created_at?.slice(0, 16) || 'N/A'), /*#__PURE__*/React.createElement("pre", {
    style: {
      color: C.text,
      fontSize: 9,
      overflow: "auto",
      maxHeight: 80,
      margin: "4px 0 0",
      fontFamily: C.fontMono
    }
  }, JSON.stringify(row, null, 1).slice(0, 500)))))), /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      fontSize: 13,
      fontWeight: 800,
      color: C.textDim
    }
  }, "\uD83D\uDCBE Local Storage"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: C.textDim
    }
  }, "All inputs auto-save to your browser. Use JSON Export for backups."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      try {
        localStorage.removeItem(LS_KEY);
      } catch (e) {}
      window.location.reload();
    },
    style: {
      marginTop: 6,
      padding: "6px 12px",
      borderRadius: 5,
      border: "none",
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 600,
      fontFamily: C.fontDisplay,
      background: `${C.red}18`,
      color: C.red
    }
  }, "Clear All Saved Data"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "16px 0 6px",
      fontSize: 9,
      color: C.textMuted,
      fontFamily: C.fontMono
    }
  }, "KINGSHOT GEAR GAP ANALYZER V2 \u2022 [RED]Legendofzenzen K710 \u2022 Data: kingshot.net, kingshotwiki.com")));
}


export default App;

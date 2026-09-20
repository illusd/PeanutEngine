import {
  world,
  system,
  GameMode,
  ItemStack,
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus
} from "@minecraft/server";

// ============================================================
//  PeanutEngine 花生引擎  v1.4.2  |  Minecraft 26.51
//  穩定 API：Custom Command（不用 chatSend / 不用 Beta APIs）
// ============================================================

const CONFIG = {
  startingMoney: 500,
  maxVeinSize: 48,
  requireSneak: true,
  rtpRange: 3000,
  rtpMinY: 60,
  tpaTimeoutSeconds: 60,
  maxHomes: 10,
  backpackSlotsPerPage: 27,
  maxBackpackPages: 5,
  maxTerritoriesPerPlayer: 5,
  selectItemId: "minecraft:golden_shovel",
  nightVisionSecs: 30,
  landCheckEvery: 40,
  sleepCheckEvery: 80,
  veinBatchSize: 8,
  ores: [
    "minecraft:coal_ore", "minecraft:deepslate_coal_ore",
    "minecraft:iron_ore", "minecraft:deepslate_iron_ore",
    "minecraft:copper_ore", "minecraft:deepslate_copper_ore",
    "minecraft:gold_ore", "minecraft:deepslate_gold_ore",
    "minecraft:redstone_ore", "minecraft:deepslate_redstone_ore",
    "minecraft:lapis_ore", "minecraft:deepslate_lapis_ore",
    "minecraft:diamond_ore", "minecraft:deepslate_diamond_ore",
    "minecraft:emerald_ore", "minecraft:deepslate_emerald_ore",
    "minecraft:nether_gold_ore", "minecraft:nether_quartz_ore",
    "minecraft:ancient_debris"
  ],
  logs: [
    "minecraft:oak_log", "minecraft:spruce_log", "minecraft:birch_log",
    "minecraft:jungle_log", "minecraft:acacia_log", "minecraft:dark_oak_log",
    "minecraft:mangrove_log", "minecraft:cherry_log", "minecraft:pale_oak_log",
    "minecraft:crimson_stem", "minecraft:warped_stem",
    "minecraft:stripped_oak_log", "minecraft:stripped_spruce_log",
    "minecraft:stripped_birch_log", "minecraft:stripped_jungle_log",
    "minecraft:stripped_acacia_log", "minecraft:stripped_dark_oak_log",
    "minecraft:stripped_mangrove_log", "minecraft:stripped_cherry_log",
    "minecraft:stripped_pale_oak_log", "minecraft:stripped_crimson_stem",
    "minecraft:stripped_warped_stem"
  ]
};

function msg(player, text) { try { player.sendMessage(text); } catch (e) {} }
function broadcast(text) { try { world.sendMessage(text); } catch (e) {} }
function findPlayer(name) {
  if (!name) return null;
  const lower = String(name).toLowerCase();
  return world.getPlayers().find(p => p.name.toLowerCase() === lower) || null;
}
function getPlayerFromOrigin(origin) {
  try {
    const e = origin.sourceEntity;
    if (e && e.typeId === "minecraft:player") return e;
  } catch (e) {}
  return null;
}
function ok(message) { return { status: CustomCommandStatus.Success, message }; }
function fail(message) { return { status: CustomCommandStatus.Failure, message }; }

// ---------- 金錢 ----------
function getMoney(player) {
  let m = player.getDynamicProperty("pe_money");
  if (m === undefined || m === null) {
    m = CONFIG.startingMoney;
    player.setDynamicProperty("pe_money", m);
  }
  return Number(m) || 0;
}
function setMoney(player, amount) {
  const v = Math.max(0, Math.floor(Number(amount) || 0));
  player.setDynamicProperty("pe_money", v);
  return v;
}
function addMoney(player, delta) { return setMoney(player, getMoney(player) + delta); }

// ---------- 床 / sleep ----------
function saveBed(player, loc, dimId) {
  player.setDynamicProperty("pe_bed_x", loc.x);
  player.setDynamicProperty("pe_bed_y", loc.y);
  player.setDynamicProperty("pe_bed_z", loc.z);
  player.setDynamicProperty("pe_bed_dim", dimId);
}
function getBed(player) {
  const x = player.getDynamicProperty("pe_bed_x");
  if (x === undefined || x === null) return null;
  return {
    x: Number(x), y: Number(player.getDynamicProperty("pe_bed_y")),
    z: Number(player.getDynamicProperty("pe_bed_z")),
    dim: player.getDynamicProperty("pe_bed_dim") || "minecraft:overworld"
  };
}
function saveReturnPos(player) {
  const loc = player.location;
  player.setDynamicProperty("pe_ret_x", loc.x);
  player.setDynamicProperty("pe_ret_y", loc.y);
  player.setDynamicProperty("pe_ret_z", loc.z);
  player.setDynamicProperty("pe_ret_dim", player.dimension.id);
  player.setDynamicProperty("pe_sleep_pending", true);
}
function getReturnPos(player) {
  if (!player.getDynamicProperty("pe_sleep_pending")) return null;
  return {
    x: Number(player.getDynamicProperty("pe_ret_x")),
    y: Number(player.getDynamicProperty("pe_ret_y")),
    z: Number(player.getDynamicProperty("pe_ret_z")),
    dim: player.getDynamicProperty("pe_ret_dim") || "minecraft:overworld"
  };
}
function clearReturn(player) { player.setDynamicProperty("pe_sleep_pending", false); }

// ---------- Home ----------
function getHomes(player) {
  try {
    const raw = player.getDynamicProperty("pe_homes");
    return raw ? JSON.parse(String(raw)) : {};
  } catch (e) { return {}; }
}
function saveHomes(player, homes) {
  player.setDynamicProperty("pe_homes", JSON.stringify(homes));
}

// ---------- 背包 ----------
function getBackpack(player, page) {
  try {
    const raw = player.getDynamicProperty(`pe_bp_${page}`);
    return raw ? JSON.parse(String(raw)) : [];
  } catch (e) { return []; }
}
function saveBackpack(player, page, slots) {
  player.setDynamicProperty(`pe_bp_${page}`, JSON.stringify(slots));
}

// ---------- 領地 ----------
function getAllLands() {
  try {
    const raw = world.getDynamicProperty("pe_lands");
    return raw ? JSON.parse(String(raw)) : {};
  } catch (e) { return {}; }
}
let _landsCache = null, _landsCacheAt = 0;
function getAllLandsCached() {
  const now = Date.now();
  if (_landsCache && now - _landsCacheAt < 2000) return _landsCache;
  _landsCache = getAllLands();
  _landsCacheAt = now;
  return _landsCache;
}
function saveAllLands(lands) {
  world.setDynamicProperty("pe_lands", JSON.stringify(lands));
  _landsCache = null;
}
function getPlayerLandCount(playerId) {
  const lands = getAllLands();
  let n = 0;
  for (const k of Object.keys(lands)) if (lands[k].ownerId === playerId) n++;
  return n;
}
function isInLand(x, y, z, dim, land) {
  if (land.dim !== dim) return false;
  const minX = Math.min(land.x1, land.x2), maxX = Math.max(land.x1, land.x2);
  const minZ = Math.min(land.z1, land.z2), maxZ = Math.max(land.z1, land.z2);
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ && y >= land.yMin && y <= land.yMax;
}
function findLandAt(x, y, z, dim) {
  const lands = getAllLandsCached();
  for (const name of Object.keys(lands)) {
    if (isInLand(x, y, z, dim, lands[name])) return { name, ...lands[name] };
  }
  return null;
}
function getSelection(player) {
  try {
    const raw = player.getDynamicProperty("pe_sel");
    return raw ? JSON.parse(String(raw)) : [];
  } catch (e) { return []; }
}
function saveSelection(player, arr) {
  player.setDynamicProperty("pe_sel", JSON.stringify(arr));
}

// ---------- TPA ----------
const tpaRequests = new Map();
function getAutoAccept(player) { return !!player.getDynamicProperty("pe_tpauto"); }
function setAutoAccept(player, on) { player.setDynamicProperty("pe_tpauto", !!on); }
function cleanupTpa() {
  const now = Date.now();
  for (const [toId, req] of tpaRequests.entries()) {
    if (now > req.expire) {
      tpaRequests.delete(toId);
      const from = world.getPlayers().find(p => p.id === req.fromId);
      if (from) msg(from, "§c你的傳送請求已過期。");
    }
  }
}

// ---------- 封禁 ----------
function getBans() {
  try {
    const raw = world.getDynamicProperty("pe_bans");
    return raw ? JSON.parse(String(raw)) : {};
  } catch (e) { return {}; }
}
function saveBans(bans) {
  world.setDynamicProperty("pe_bans", JSON.stringify(bans));
}
function isBannedName(name) {
  if (!name) return null;
  const bans = getBans();
  const key = String(name).toLowerCase();
  for (const k of Object.keys(bans)) {
    if (k.toLowerCase() === key) return { name: k, ...bans[k] };
  }
  return null;
}
function isAdmin(player) {
  try {
    if (player.getGameMode() === GameMode.creative) return true;
  } catch (e) {}
  try {
    if (player.hasTag("admin") || player.hasTag("op") || player.hasTag("pe_admin")) return true;
  } catch (e) {}
  return false;
}
function kickBanned(player, info) {
  const reason = (info && info.reason) ? String(info.reason).replace(/"/g, "") : "You are banned";
  const name = player.name;
  // 避開 @s 選擇器錯誤：改用明確玩家名稱踢出
  system.run(() => {
    let kicked = false;
    const tries = [
      () => world.getDimension(player.dimension.id).runCommand(`kick "${name}" §cBanned: ${reason}`),
      () => world.getDimension("minecraft:overworld").runCommand(`kick "${name}" §cBanned: ${reason}`),
      () => player.runCommand(`kick "${name}" §cBanned: ${reason}`)
    ];
    for (const fn of tries) {
      try {
        fn();
        kicked = true;
        break;
      } catch (e) {}
    }
    if (!kicked) {
      try { msg(player, `§c§l你已被封禁\n§c原因：${reason}\n§7請聯繫管理員`); } catch (e) {}
    }
  });
}

// ---------- 連鎖 ----------
const processedBreaks = new Set();
function isOre(id) { return CONFIG.ores.includes(id); }
function isLog(id) { return CONFIG.logs.includes(id); }
function getConnected(startBlock, typeId, maxSize) {
  const result = [];
  const visited = new Set();
  const queue = [startBlock];
  while (queue.length > 0 && result.length < maxSize) {
    const block = queue.shift();
    const key = `${block.x},${block.y},${block.z}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (block.typeId !== typeId) continue;
    result.push(block);
    for (const n of [block.above(), block.below(), block.north(), block.south(), block.east(), block.west()]) {
      if (n && !visited.has(`${n.x},${n.y},${n.z}`)) queue.push(n);
    }
  }
  return result;
}
function doVeinBreak(player, startBlock, typeId) {
  const blocks = getConnected(startBlock, typeId, CONFIG.maxVeinSize);
  if (blocks.length <= 1) return;
  const coords = [];
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    coords.push(`${Math.floor(b.x)} ${Math.floor(b.y)} ${Math.floor(b.z)}`);
  }
  let idx = 0;
  const batch = CONFIG.veinBatchSize || 8;
  const step = () => {
    const end = Math.min(idx + batch, coords.length);
    for (; idx < end; idx++) {
      try { player.runCommand(`setblock ${coords[idx]} air destroy`); } catch (e) {}
    }
    if (idx < coords.length) system.run(step);
  };
  system.run(step);
  msg(player, `§a連鎖破壞了 §e${blocks.length} §a個方塊`);
}

// ---------- 雙門 ----------
function isDoor(typeId) {
  return !!typeId && typeId.endsWith("_door") && !typeId.includes("trapdoor");
}
function getDoorOpen(block) {
  try {
    const perm = block.permutation;
    let v = perm.getState("open_bit");
    if (v === undefined || v === null) v = perm.getState("open");
    return !!v;
  } catch (e) { return false; }
}
function setDoorOpen(block, open) {
  try {
    const perm = block.permutation;
    let next = null;
    try { next = perm.withState("open_bit", open); } catch (e1) {
      try { next = perm.withState("open", open); } catch (e2) {}
    }
    if (next) { block.setPermutation(next); return true; }
  } catch (e) {}
  return false;
}
function togglePairedDoor(block) {
  try {
    if (!isDoor(block.typeId)) return;
    const targetOpen = getDoorOpen(block);
    const dim = block.dimension;
    const x = Math.floor(block.x), y = Math.floor(block.y), z = Math.floor(block.z);
    for (const o of [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }]) {
      const other = dim.getBlock({ x: x + o.x, y, z: z + o.z });
      if (other && other.typeId === block.typeId && getDoorOpen(other) !== targetOpen) {
        setDoorOpen(other, targetOpen);
      }
    }
  } catch (e) {}
}

// ---------- 副手火把 ----------
function getOffhandItem(player) {
  try {
    const eq = player.getComponent("minecraft:equippable") || player.getComponent("equippable");
    if (eq && typeof eq.getEquipment === "function") {
      for (const slot of ["Offhand", "offhand"]) {
        try {
          const item = eq.getEquipment(slot);
          if (item) return item;
        } catch (e) {}
      }
    }
  } catch (e) {}
  return null;
}
function hasTorchOffhand(player) {
  const item = getOffhandItem(player);
  if (!item) return false;
  const id = item.typeId;
  return id.includes("torch") || id.includes("lantern");
}

// ============================================================
//  事件（穩定 afterEvents）
// ============================================================
world.afterEvents.playerBreakBlock.subscribe((ev) => {
  const player = ev.player;
  if (!player || !player.isValid()) return;

  // 領地選取鏟
  try {
    const inv = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
    const item = inv?.container?.getItem(player.selectedSlotIndex ?? 0);
    if (item && item.typeId === CONFIG.selectItemId) {
      let sel = getSelection(player);
      const loc = { x: Math.floor(ev.block.x), y: Math.floor(ev.block.y), z: Math.floor(ev.block.z) };
      if (!sel.some(p => p.x === loc.x && p.y === loc.y && p.z === loc.z)) {
        if (sel.length >= 4) sel = [];
        sel.push(loc);
        saveSelection(player, sel);
        msg(player, `§a已選取第 §e${sel.length} §a個角：§f${loc.x}, ${loc.y}, ${loc.z}`);
        if (sel.length === 4) {
          msg(player, "§a四角完成！輸入：§e/pe:tdone <高度> <名稱>");
        }
      }
      return;
    }
  } catch (e) {}

  // 領地保護還原
  const land = findLandAt(ev.block.x, ev.block.y, ev.block.z, player.dimension.id);
  if (land && land.protected && land.ownerId !== player.id) {
    msg(player, `§c保護領地【${land.name}】禁止破壞`);
    const typeId = ev.brokenBlockPermutation.type.id;
    system.run(() => {
      try { player.runCommand(`setblock ${Math.floor(ev.block.x)} ${Math.floor(ev.block.y)} ${Math.floor(ev.block.z)} ${typeId}`); } catch (e) {}
    });
    return;
  }

  if (CONFIG.requireSneak && !player.isSneaking) return;
  const typeId = ev.brokenBlockPermutation.type.id;
  if (!isOre(typeId) && !isLog(typeId)) return;
  const key = `${player.id}_${ev.block.x}_${ev.block.y}_${ev.block.z}`;
  if (processedBreaks.has(key)) return;
  processedBreaks.add(key);
  system.runTimeout(() => processedBreaks.delete(key), 10);
  system.run(() => {
    try {
      const dim = player.dimension;
      const loc = ev.block.location;
      let start = null;
      for (const o of [{ x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }]) {
        const b = dim.getBlock({ x: loc.x + o.x, y: loc.y + o.y, z: loc.z + o.z });
        if (b && b.typeId === typeId) { start = b; break; }
      }
      if (start) doVeinBreak(player, start, typeId);
    } catch (e) {}
  });
});

world.afterEvents.playerPlaceBlock.subscribe((ev) => {
  if (ev.block.typeId.includes("bed")) {
    saveBed(ev.player, ev.block.location, ev.player.dimension.id);
    msg(ev.player, "§a已記錄床位置，可用 §e/pe:sleep");
  }
  const land = findLandAt(ev.block.x, ev.block.y, ev.block.z, ev.player.dimension.id);
  if (land && land.protected && land.ownerId !== ev.player.id) {
    msg(ev.player, "§c保護領地禁止放置");
    system.run(() => {
      try { ev.player.runCommand(`setblock ${Math.floor(ev.block.x)} ${Math.floor(ev.block.y)} ${Math.floor(ev.block.z)} air`); } catch (e) {}
    });
  }
});

world.afterEvents.playerInteractWithBlock.subscribe((ev) => {
  if (!ev.block) return;
  const typeId = ev.block.typeId;
  if (isDoor(typeId)) {
    const dkey = `${Math.floor(ev.block.x)},${Math.floor(ev.block.y)},${Math.floor(ev.block.z)}`;
    if (!togglePairedDoor._cd) togglePairedDoor._cd = new Map();
    const now = Date.now();
    if ((togglePairedDoor._cd.get(dkey) || 0) + 300 <= now) {
      togglePairedDoor._cd.set(dkey, now);
      system.runTimeout(() => {
        try {
          const b = ev.player.dimension.getBlock(ev.block.location);
          if (b) togglePairedDoor(b);
        } catch (e) {}
      }, 1);
    }
  }
  if (typeId.includes("bed")) {
    saveBed(ev.player, ev.block.location, ev.player.dimension.id);
    system.run(() => {
      try {
        const time = world.getAbsoluteTime() % 24000;
        if (time >= 12500 && time <= 23500) {
          world.setTimeOfDay(0);
          broadcast(`§e${ev.player.name} §a睡覺了，夜晚已跳過！`);
        }
      } catch (e) {}
    });
  }
});

// 合併定時器
const wasSleeping = new Map();
const lastLandChunk = new Map();
let tickCounter = 0;
let lastNightSkip = 0;

system.runInterval(() => {
  tickCounter++;
  const players = world.getPlayers();
  if (!players.length) return;

  if (tickCounter % 10 === 0) {
    for (const player of players) {
      try {
        const sleeping = !!player.isSleeping;
        const prev = wasSleeping.get(player.id) || false;
        if (prev && !sleeping) {
          const ret = getReturnPos(player);
          if (ret) {
            system.run(() => {
              try {
                player.teleport({ x: ret.x, y: ret.y, z: ret.z }, { dimension: world.getDimension(ret.dim) });
                msg(player, "§a已回到 /pe:sleep 前的位置");
                clearReturn(player);
              } catch (e) {}
            });
          }
        }
        wasSleeping.set(player.id, sleeping);
      } catch (e) {}
    }
  }

  if (tickCounter % CONFIG.sleepCheckEvery === 0) {
    const now = Date.now();
    if (now - lastNightSkip > 5000) {
      for (const p of players) {
        try {
          if (p.isSleeping) {
            world.setTimeOfDay(0);
            lastNightSkip = now;
            broadcast(`§e${p.name} §a睡覺了，夜晚已跳過！`);
            break;
          }
        } catch (e) {}
      }
    }
  }

  if (tickCounter % CONFIG.landCheckEvery === 0) {
    for (const player of players) {
      try {
        const loc = player.location;
        const key = `${Math.floor(loc.x) >> 4},${Math.floor(loc.z) >> 4},${player.dimension.id}`;
        if (lastLandChunk.get(player.id) === key) continue;
        lastLandChunk.set(player.id, key);
        const land = findLandAt(Math.floor(loc.x), Math.floor(loc.y), Math.floor(loc.z), player.dimension.id);
        if (land && land.protected && land.ownerId !== player.id) {
          const tag = "pe_in_land_" + land.name;
          if (!player.hasTag(tag)) {
            for (const t of player.getTags()) if (t.startsWith("pe_in_land_")) player.removeTag(t);
            player.addTag(tag);
            msg(player, `§e進入 §f${land.owner} §e領地【${land.name}】 §7離開：/pe:tout`);
          }
        } else {
          for (const t of player.getTags()) if (t.startsWith("pe_in_land_")) player.removeTag(t);
        }
      } catch (e) {}
    }
  }

  if (tickCounter % 100 === 0) {
    cleanupTpa();
    for (const player of players) {
      try {
        if (hasTorchOffhand(player)) {
          player.runCommand(`effect @s night_vision ${CONFIG.nightVisionSecs} 0 true`);
        }
      } catch (e) {}
    }
  }
}, 1);

// ============================================================
//  Custom Commands（穩定 API，26.51）
// ============================================================
system.beforeEvents.startup.subscribe((init) => {
  const reg = init.customCommandRegistry;
  const Any = CommandPermissionLevel.Any;
  const str = (name) => ({ type: CustomCommandParamType.String, name });
  const int = (name) => ({ type: CustomCommandParamType.Integer, name });

  function needPlayer(origin) {
    const p = getPlayerFromOrigin(origin);
    if (!p) return { player: null, err: fail("僅玩家可使用") };
    return { player: p, err: null };
  }

  // /pe 或 /pe:help
  reg.registerCommand({
    name: "pe:help", description: "PeanutEngine 指令說明",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    system.run(() => {
      msg(player, "§6===== PeanutEngine =====");
      msg(player, "§e/pe:money §7金錢  §e/pe:pay <玩家> <金額>");
      msg(player, "§e/pe:ahsell <價格> §7賣手持  §e/pe:rtp");
      msg(player, "§e/pe:tpa <玩家> §e/pe:tpahere <玩家>");
      msg(player, "§e/pe:tpaccept §e/pe:tpacancel §e/pe:tpauto");
      msg(player, "§e/pe:seth <名> §e/pe:h <名> §e/pe:delh <名>");
      msg(player, "§e/pe:bp <頁> §e/pe:bpput <頁> §e/pe:bptake <頁> <號>");
      msg(player, "§e/pe:tselect §e/pe:tdone <高> <名> §e/pe:tprotect <名>");
      msg(player, "§e/pe:tout §e/pe:delt <名> §e/pe:sleep");
      msg(player, "§e/pe:ban <玩家> [原因] §e/pe:unban <玩家> §e/pe:banlist");
      msg(player, "§7蹲下挖礦連鎖｜雙門同步｜副手火把夜視");
      msg(player, "§7管理：需創造模式或 tag admin/op/pe_admin");
    });
    return ok("已顯示說明");
  });

  reg.registerCommand({
    name: "pe:money", description: "查看金錢",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    return ok(`你的金錢：${getMoney(player)}`);
  });

  reg.registerCommand({
    name: "pe:pay", description: "轉帳",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("player"), int("amount")]
  }, (origin, targetName, amount) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (amount <= 0) return fail("金額須為正整數");
    if (getMoney(player) < amount) return fail("金錢不足");
    const target = findPlayer(targetName);
    if (!target) return fail("找不到玩家（需在線）");
    if (target.id === player.id) return fail("不能轉給自己");
    addMoney(player, -amount);
    addMoney(target, amount);
    system.run(() => msg(target, `§a收到 §e${player.name} §a轉帳 §e${amount}`));
    return ok(`已支付 ${amount} 給 ${target.name}`);
  });

  reg.registerCommand({
    name: "pe:ahsell", description: "出售手持物品",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [int("price")]
  }, (origin, price) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (price <= 0) return fail("價格須為正整數");
    try {
      const inv = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
      if (!inv?.container) return fail("無法讀取背包");
      const slot = player.selectedSlotIndex ?? 0;
      const item = inv.container.getItem(slot);
      if (!item) return fail("請手持要賣的物品");
      const name = item.typeId.replace("minecraft:", "");
      const amt = item.amount;
      inv.container.setItem(slot, undefined);
      addMoney(player, price);
      system.run(() => broadcast(`§e${player.name} §7出售 §f${amt}x ${name} §7得 §e${price}`));
      return ok(`已出售 ${amt}x ${name} 獲得 ${price}`);
    } catch (e) { return fail("出售失敗"); }
  });

  reg.registerCommand({
    name: "pe:rtp", description: "隨機傳送",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    try {
      const x = Math.floor(Math.random() * CONFIG.rtpRange * 2) - CONFIG.rtpRange;
      const z = Math.floor(Math.random() * CONFIG.rtpRange * 2) - CONFIG.rtpRange;
      const y = CONFIG.rtpMinY + Math.floor(Math.random() * 40);
      player.teleport({ x: x + 0.5, y, z: z + 0.5 });
      return ok(`隨機傳送到 ${x}, ${y}, ${z}`);
    } catch (e) { return fail("傳送失敗"); }
  });

  // TPA
  reg.registerCommand({
    name: "pe:tpa", description: "請求傳送到玩家",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("player")]
  }, (origin, targetName) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const target = findPlayer(targetName);
    if (!target) return fail("找不到玩家");
    if (target.id === player.id) return fail("不能向自己請求");
    if (getAutoAccept(target)) {
      try {
        player.teleport(target.location, { dimension: target.dimension });
        system.run(() => msg(target, `§e${player.name} §a已傳來（自動接受）`));
        return ok(`已傳到 ${target.name}`);
      } catch (e) { return fail("傳送失敗"); }
    }
    tpaRequests.set(target.id, { fromId: player.id, type: "tpa", expire: Date.now() + CONFIG.tpaTimeoutSeconds * 1000 });
    system.run(() => {
      msg(target, `§e${player.name} §a想傳送到你這裡！§e/pe:tpaccept §7或 §e/pe:tpacancel`);
    });
    return ok(`已向 ${target.name} 發送請求`);
  });

  reg.registerCommand({
    name: "pe:tpahere", description: "請求玩家傳到你這",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("player")]
  }, (origin, targetName) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const target = findPlayer(targetName);
    if (!target) return fail("找不到玩家");
    if (target.id === player.id) return fail("不能向自己請求");
    if (getAutoAccept(target)) {
      try {
        target.teleport(player.location, { dimension: player.dimension });
        system.run(() => msg(target, `§e${player.name} §a將你傳來（自動接受）`));
        return ok(`已將 ${target.name} 傳來`);
      } catch (e) { return fail("傳送失敗"); }
    }
    tpaRequests.set(target.id, { fromId: player.id, type: "tpahere", expire: Date.now() + CONFIG.tpaTimeoutSeconds * 1000 });
    system.run(() => msg(target, `§e${player.name} §a想讓你傳到他那！§e/pe:tpaccept`));
    return ok(`已向 ${target.name} 發送請求`);
  });

  reg.registerCommand({
    name: "pe:tpaccept", description: "接受傳送請求",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const req = tpaRequests.get(player.id);
    if (!req) return fail("沒有待處理請求");
    if (Date.now() > req.expire) { tpaRequests.delete(player.id); return fail("請求已過期"); }
    const from = world.getPlayers().find(p => p.id === req.fromId);
    if (!from) { tpaRequests.delete(player.id); return fail("對方已離線"); }
    try {
      if (req.type === "tpa") {
        from.teleport(player.location, { dimension: player.dimension });
        system.run(() => msg(from, `§a已傳到 ${player.name}`));
      } else {
        player.teleport(from.location, { dimension: from.dimension });
        system.run(() => msg(from, `§e${player.name} §a已接受並傳來`));
      }
      tpaRequests.delete(player.id);
      return ok("已接受傳送");
    } catch (e) { return fail("傳送失敗"); }
  });

  reg.registerCommand({
    name: "pe:tpacancel", description: "取消/拒絕傳送",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const req = tpaRequests.get(player.id);
    if (req) {
      tpaRequests.delete(player.id);
      const from = world.getPlayers().find(p => p.id === req.fromId);
      if (from) system.run(() => msg(from, `§c${player.name} 拒絕了請求`));
      return ok("已拒絕");
    }
    let found = false;
    for (const [toId, r] of tpaRequests.entries()) {
      if (r.fromId === player.id) {
        tpaRequests.delete(toId);
        found = true;
      }
    }
    return found ? ok("已取消你發出的請求") : fail("沒有可取消的請求");
  });

  reg.registerCommand({
    name: "pe:tpauto", description: "開關自動接受TPA",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const now = getAutoAccept(player);
    setAutoAccept(player, !now);
    return ok(!now ? "已開啟自動接受" : "已關閉自動接受");
  });

  // Home
  reg.registerCommand({
    name: "pe:seth", description: "設定家",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("name")]
  }, (origin, name) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const homes = getHomes(player);
    if (!homes[name] && Object.keys(homes).length >= CONFIG.maxHomes) return fail(`最多 ${CONFIG.maxHomes} 個家`);
    const loc = player.location;
    homes[name] = { x: loc.x, y: loc.y, z: loc.z, dim: player.dimension.id };
    saveHomes(player, homes);
    return ok(`已設家：${name}`);
  });

  reg.registerCommand({
    name: "pe:h", description: "回家",
    permissionLevel: Any, cheatsRequired: false,
    optionalParameters: [str("name")]
  }, (origin, name) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const homes = getHomes(player);
    if (!name) {
      const keys = Object.keys(homes);
      return keys.length ? ok("你的家：" + keys.join(", ")) : fail("尚未設家，用 /pe:seth <名>");
    }
    const h = homes[name];
    if (!h) return fail(`找不到家 ${name}`);
    try {
      player.teleport({ x: h.x, y: h.y, z: h.z }, { dimension: world.getDimension(h.dim || "minecraft:overworld") });
      return ok(`已傳到 ${name}`);
    } catch (e) { return fail("傳送失敗"); }
  });

  reg.registerCommand({
    name: "pe:delh", description: "刪除家",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("name")]
  }, (origin, name) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const homes = getHomes(player);
    if (!homes[name]) return fail(`找不到家 ${name}`);
    delete homes[name];
    saveHomes(player, homes);
    return ok(`已刪除家 ${name}`);
  });

  // 背包
  reg.registerCommand({
    name: "pe:bp", description: "開啟背包頁",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [int("page")]
  }, (origin, page) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (page < 1 || page > CONFIG.maxBackpackPages) return fail(`頁數 1-${CONFIG.maxBackpackPages}`);
    const slots = getBackpack(player, page);
    system.run(() => {
      msg(player, `§6===== 背包 第 ${page} 頁 =====`);
      if (!slots.length) msg(player, "§7（空）");
      else slots.forEach((s, i) => msg(player, `§e[${i + 1}] §f${s.id.replace("minecraft:", "")} x${s.amount}`));
      msg(player, `§a/pe:bpput ${page} §7存入  §a/pe:bptake ${page} <號> §7取出`);
    });
    return ok(`背包第 ${page} 頁`);
  });

  reg.registerCommand({
    name: "pe:bpput", description: "存入背包",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [int("page")]
  }, (origin, page) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (page < 1 || page > CONFIG.maxBackpackPages) return fail("頁數錯誤");
    try {
      const inv = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
      if (!inv?.container) return fail("無法讀取背包");
      const item = inv.container.getItem(player.selectedSlotIndex ?? 0);
      if (!item) return fail("請手持物品");
      const slots = getBackpack(player, page);
      if (slots.length >= CONFIG.backpackSlotsPerPage) return fail("此頁已滿");
      slots.push({ id: item.typeId, amount: item.amount });
      saveBackpack(player, page, slots);
      inv.container.setItem(player.selectedSlotIndex ?? 0, undefined);
      return ok(`已存入 ${item.amount}x ${item.typeId.replace("minecraft:", "")}`);
    } catch (e) { return fail("存入失敗"); }
  });

  reg.registerCommand({
    name: "pe:bptake", description: "取出背包物品",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [int("page"), int("slot")]
  }, (origin, page, slotNum) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const slots = getBackpack(player, page);
    const idx = slotNum - 1;
    if (idx < 0 || idx >= slots.length) return fail("編號不存在");
    const s = slots[idx];
    try {
      const inv = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
      if (!inv?.container) return fail("無法讀取背包");
      let empty = -1;
      for (let i = 0; i < 36; i++) if (!inv.container.getItem(i)) { empty = i; break; }
      if (empty < 0) return fail("背包已滿");
      inv.container.setItem(empty, new ItemStack(s.id, s.amount));
      slots.splice(idx, 1);
      saveBackpack(player, page, slots);
      return ok(`已取出 ${s.amount}x ${s.id.replace("minecraft:", "")}`);
    } catch (e) { return fail("取出失敗"); }
  });

  // 領地
  reg.registerCommand({
    name: "pe:tselect", description: "取得領地選取鏟",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    try {
      const inv = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
      if (!inv?.container) return fail("無法給予");
      let empty = -1;
      for (let i = 0; i < 36; i++) if (!inv.container.getItem(i)) { empty = i; break; }
      if (empty < 0) return fail("背包已滿");
      inv.container.setItem(empty, new ItemStack(CONFIG.selectItemId, 1));
      saveSelection(player, []);
      return ok("已給金鏟，請在四角各破壞一方塊");
    } catch (e) { return fail("給予失敗"); }
  });

  reg.registerCommand({
    name: "pe:tdone", description: "完成領地建立",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [int("height"), str("name")]
  }, (origin, height, name) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (height < 1) return fail("高度須 >= 1");
    if (getAllLands()[name]) return fail("名稱已存在");
    if (getPlayerLandCount(player.id) >= CONFIG.maxTerritoriesPerPlayer) return fail("領地數量已滿");
    const sel = getSelection(player);
    if (sel.length < 2) return fail("請先用金鏟選至少兩個角");
    let minX = sel[0].x, maxX = sel[0].x, minZ = sel[0].z, maxZ = sel[0].z, minY = sel[0].y;
    for (const p of sel) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
      minY = Math.min(minY, p.y);
    }
    const lands = getAllLands();
    lands[name] = {
      owner: player.name, ownerId: player.id, dim: player.dimension.id,
      x1: minX, z1: minZ, x2: maxX, z2: maxZ,
      yMin: minY, yMax: minY + height, protected: false, name
    };
    saveAllLands(lands);
    saveSelection(player, []);
    return ok(`領地建造成功！${name} (${minX},${minZ})-(${maxX},${maxZ}) 保護：/pe:tprotect ${name}`);
  });

  reg.registerCommand({
    name: "pe:tprotect", description: "保護領地",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("name")]
  }, (origin, name) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const lands = getAllLands();
    if (!lands[name]) return fail("找不到領地");
    if (lands[name].ownerId !== player.id) return fail("不是你的領地");
    lands[name].protected = true;
    saveAllLands(lands);
    return ok(`已保護【${name}】`);
  });

  reg.registerCommand({
    name: "pe:tout", description: "離開領地並隨機傳送",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    for (const t of player.getTags()) if (t.startsWith("pe_in_land_")) player.removeTag(t);
    try {
      const x = Math.floor(Math.random() * CONFIG.rtpRange * 2) - CONFIG.rtpRange;
      const z = Math.floor(Math.random() * CONFIG.rtpRange * 2) - CONFIG.rtpRange;
      const y = CONFIG.rtpMinY + Math.floor(Math.random() * 40);
      player.teleport({ x: x + 0.5, y, z: z + 0.5 });
      return ok("已離開並隨機傳送");
    } catch (e) { return fail("傳送失敗"); }
  });

  reg.registerCommand({
    name: "pe:delt", description: "刪除領地",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("name")]
  }, (origin, name) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const lands = getAllLands();
    if (!lands[name]) return fail("找不到領地");
    if (lands[name].ownerId !== player.id) return fail("不是你的領地");
    delete lands[name];
    saveAllLands(lands);
    return ok(`已刪除【${name}】`);
  });

  reg.registerCommand({
    name: "pe:sleep", description: "傳送到床",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    const bed = getBed(player);
    if (!bed) return fail("尚未記錄床位置");
    saveReturnPos(player);
    try {
      player.teleport({ x: bed.x + 0.5, y: bed.y, z: bed.z + 0.5 }, { dimension: world.getDimension(bed.dim) });
      return ok("已傳到床，睡覺後會回原處");
    } catch (e) { return fail("傳送失敗"); }
  });

  // ---- Ban ----
  reg.registerCommand({
    name: "pe:ban", description: "封禁玩家",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("player")],
    optionalParameters: [str("reason")]
  }, (origin, targetName, reason) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (!isAdmin(player)) return fail("需要創造模式或 admin/op/pe_admin 標籤");
    if (!targetName) return fail("請指定玩家名稱");
    const r = reason || "No reason";
    const bans = getBans();
    // 統一用小寫 key 存，顯示用原名
    const storeKey = String(targetName);
    bans[storeKey] = {
      reason: String(r),
      by: player.name,
      at: Date.now()
    };
    // 清掉可能的大小寫重複
    for (const k of Object.keys(bans)) {
      if (k !== storeKey && k.toLowerCase() === storeKey.toLowerCase()) delete bans[k];
    }
    bans[storeKey] = { reason: String(r), by: player.name, at: Date.now() };
    saveBans(bans);
    const online = findPlayer(targetName);
    if (online) kickBanned(online, bans[storeKey]);
    system.run(() => broadcast(`§c${targetName} 已被 ${player.name} 封禁：${r}`));
    return ok(`已封禁 ${targetName}：${r}`);
  });

  reg.registerCommand({
    name: "pe:unban", description: "解除封禁",
    permissionLevel: Any, cheatsRequired: false,
    mandatoryParameters: [str("player")]
  }, (origin, targetName) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (!isAdmin(player)) return fail("需要創造模式或 admin/op/pe_admin 標籤");
    const bans = getBans();
    let removed = false;
    for (const k of Object.keys(bans)) {
      if (k.toLowerCase() === String(targetName).toLowerCase()) {
        delete bans[k];
        removed = true;
      }
    }
    if (!removed) return fail("該玩家不在封禁名單");
    saveBans(bans);
    return ok(`已解除封禁 ${targetName}`);
  });

  reg.registerCommand({
    name: "pe:banlist", description: "查看封禁名單",
    permissionLevel: Any, cheatsRequired: false
  }, (origin) => {
    const { player, err } = needPlayer(origin);
    if (err) return err;
    if (!isAdmin(player)) return fail("需要創造模式或 admin/op/pe_admin 標籤");
    const bans = getBans();
    const keys = Object.keys(bans);
    if (!keys.length) return ok("封禁名單是空的");
    system.run(() => {
      msg(player, "§6===== 封禁名單 =====");
      for (const k of keys) {
        const b = bans[k];
        msg(player, `§c${k} §7- ${b.reason || "?"} §8(by ${b.by || "?"})`);
      }
    });
    return ok(`共 ${keys.length} 人`);
  });
});

world.afterEvents.playerSpawn.subscribe((ev) => {
  const player = ev.player;
  // 每次進出都檢查封禁
  const ban = isBannedName(player.name);
  if (ban) {
    kickBanned(player, ban);
    return;
  }
  if (ev.initialSpawn) {
    getMoney(player);
    system.runTimeout(() => {
      msg(player, "§6[PeanutEngine] §a輸入 §e/pe:help §a查看指令");
    }, 40);
  }
});

system.runTimeout(() => {
  broadcast("§6[PeanutEngine v1.4.2] §a已載入｜含 ban｜Custom Command｜無 Beta｜26.51");
}, 40);

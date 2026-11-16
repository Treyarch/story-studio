-- Test du pack par les commandes joueur et les seuls services hôtes simulés.
local folder = assert(arg[1])
package.path = folder .. '/?.lua;' .. folder .. '/script/?.lua;' .. package.path
local labels, callbacks, images, update, feedback = {}, {}, {}, nil, nil
local stored, rejectWrite, failRead, duration, status, plays = nil, false, false, 16, 'stop', 0
local function copy(value)
    if type(value) ~= 'table' then return value end
    local result = {}; for k, v in pairs(value) do result[k] = copy(v) end; return result
end
progression = {load = function() if failRead then error('lecture') end; return copy(stored) end,
    save = function(_, value) if not rejectWrite then stored = copy(value) end end}
window, document = {}, {}
lv = {obj = {}, label = {}, img = {}, img_src = {}, style = {}, color = {}, group = {}, timer = {}, event = {}, font = {},
    EVENT_KEY = 2, EVENT_CLICKED = 3, STATE_DEFAULT = 0, LABEL_LONG_WRAP = 1, OBJ_FLAG_SCROLLABLE = 1, OPA_COVER = 255}
for _, name in ipairs({'remove_style_all','set_pos','set_size','clear_flag','add_style','clean','add_flag'}) do lv.obj[name] = function() end end
for _, name in ipairs({'set_text_font','set_text_color','set_bg_color','set_bg_opa'}) do lv.style[name] = function() end end
for _, name in ipairs({'remove_all_objs','set_editing','add_obj'}) do lv.group[name] = function() end end
lv.obj.new = function() return {} end
lv.style.new = function() return {} end
lv.color.hex = function(v) return v end
lv.label.new = function() local v = {}; labels[#labels+1] = v; return v end
lv.label.set_long_mode = function() end
lv.label.set_text = function(obj, value) obj.text = value end
lv.img_src.load = function(path) return {path = path} end
lv.img_src.get_width = function() return 80 end
lv.img_src.get_height = function() return 80 end
lv.img.new = function() return {} end
lv.img.set_src = function(_, src) images[#images+1] = src and src.path or false end
lv.img.set_zoom = function() end
lv.obj.add_event_cb = function(_, callback, event) callbacks[event] = callback end
lv.event.get_key_value = function(event) return event end
lv.timer.new = function(callback) update = callback; return {} end
audio = {get_status = function() return status end, get_volume = function() return 50 end,
    duration = function() return duration end, stop = function() status = 'stop' end,
    load = function(_, _, callback) feedback = callback; callback('stop', 0); return 0 end,
    play = function() plays = plays + 1; status = 'play' end}
goto_library = function() end
local function start()
    labels, callbacks, images = {}, {}, {}
    for _, name in ipairs({'passage','rules','savegame','adventure_data','presentation','display'}) do package.loaded[name] = nil end
    dofile(folder .. '/main.lua'); setup()
end
local function visible() local out = {}; for _, v in ipairs(labels) do out[#out+1] = v.text or '' end; return table.concat(out, '\n') end
local function expect(value) assert(visible():find(value,1,true), value .. '\n' .. visible()) end
local function absent(value) assert(not visible():find(value,1,true), value .. '\n' .. visible()) end
local function advance(n) for _ = 1, n or 5 do update() end end
local function choose(value)
    for _ = 1, 80 do
        for _, v in ipairs(labels) do if v.text == '> ' .. value then advance(5); callbacks[lv.EVENT_CLICKED](); return end end
        callbacks[lv.EVENT_KEY](19)
    end
    error('Choix absent : ' .. value .. '\n' .. visible())
end
local function listen()
    advance(1); assert(status == 'play'); feedback('play',1); status = 'stop'; feedback('stop',16)
end
start()
expect('Commencer')
choose('Chapitres écoutés'); expect('Aucun'); back_callback()
choose('Commencer'); listen(); choose('Pisteur'); listen()
back_callback(); expect('50 %')
choose('Ta fiche personnage'); expect('Pisteur'); expect('Les archives des lucioles'); back_callback()
choose('Tes affaires'); expect('Aucun'); back_callback()
local before = copy(stored)
choose('Chapitres écoutés'); choose('Choisis ta classe'); choose('Choisis ta classe'); choose('Réécouter'); advance(1)
assert(status == 'play'); back_callback(); back_callback(); back_callback(); back_callback()
choose('Reprendre'); listen()
assert(stored.sceneId == before.sceneId and stored.classId == before.classId)
print('OK : menu illustré et consultation indépendante')
-- Une visite interrompue reste commencée, sans autoriser la réécoute.
stored = nil; start(); choose('Commencer'); advance(1); back_callback()
choose('Chapitres écoutés'); choose('Choisis ta classe'); expect('Commencé'); absent('Réécouter')
back_callback(); back_callback(); choose('Reprendre')
rejectWrite = true; listen(); expect('Sauvegarde impossible')
assert(stored['heard:depart'] == 0)
rejectWrite = false; choose('Réessayer'); choose('Pisteur'); listen()
back_callback(); choose('Ton carnet de reporter'); expect('Aucun'); absent('La porte ouverte')
back_callback(); choose('Reprendre'); listen()
choose('Prendre la clé'); listen(); back_callback(); choose('Tes affaires'); choose('Clé : 1')
local inventoryState = copy(stored); back_callback(); back_callback(); choose('Reprendre'); listen()
assert(stored['item:cle'] == inventoryState['item:cle'])
choose('Ouvrir avec la clé'); listen(); back_callback(); expect('100 %')
choose('Ton carnet de reporter'); choose('La porte ouverte'); expect('Le chemin'); expect('est libre.')
back_callback(); back_callback(); choose('Tes affaires'); expect('Aucun'); back_callback()
local completed = copy(stored)
choose('Chapitres écoutés'); choose('Choisis ta classe'); choose('Choisis ta classe'); choose('Réécouter'); listen()
for k,v in pairs(completed) do assert(stored[k] == v, 'La réécoute a modifié ' .. k) end
back_callback(); back_callback(); back_callback(); start(); expect('100 %')
choose('Recommencer'); choose('Annuler'); assert(stored.classId == 'pisteur')
choose('Recommencer'); choose('Oui, recommencer'); listen(); choose('Ami des animaux'); listen()
choose('Prendre la clé'); listen(); choose('Ouvrir avec la clé'); listen(); back_callback(); expect('100 %')
assert(stored.classId == 'ami' and stored['reward:coffre'] == 1)
-- Un callback d'une lecture interrompue n'enregistre aucune écoute.
stored = nil; start(); choose('Commencer'); advance(1)
local stale = feedback; back_callback(); stale('play',1); stale('stop',16)
assert(stored['heard:depart'] == 0)
start(); choose('Reprendre'); listen(); assert(stored['heard:depart'] == 1)
assert(#images > 0, 'Aucune illustration demandée à l’hôte')
print('OK : écoutes confirmées, reprise, deux branches, inventaire et nouveau départ')

local validState = copy(stored)
stored.schema = 1
start(); expect('Partie incompatible'); assert(stored.schema == 1)
stored = validState
start(); expect('Reprendre')

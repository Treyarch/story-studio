-- Même frontière hôte LVGL/audio/progression que le harnais des prototypes.
-- Le moteur, les règles et les données proviennent du contenu réellement généré.
local folder = assert(arg[1])
package.path = folder .. "/?.lua;" .. folder .. "/script/?.lua;" .. package.path
local randomCalls = 0
local callbacks, labels, update, feedback, exited, plays, loadResult, audioStatus, loadedPath
local saves = {}
local dieValue = 7
local originalRandom = math.random
math.random = function(maximum)
    assert(maximum == 20)
    randomCalls = randomCalls + 1
    assert(dieValue, "Un jet deja sauvegarde ne doit jamais etre relance")
    return dieValue
end
local rejectWrite, rejectRead, discardWrite, failReadAfterWrite = false, false, false, false
local throwAfterWrite, corruptAfterWrite = false, false
local duration, stuckAudio = 16, false
local function copy(value)
    if type(value) ~= "table" then return value end
    local result = {}
    for key, item in pairs(value) do result[key] = copy(item) end
    return result
end
progression = {
    load = function(slot)
        if rejectRead then error("lecture refusee") end
        return copy(saves[slot] or {})
    end,
    save = function(slot, value)
        if rejectWrite then return false end
        if discardWrite then return end
        saves[slot] = copy(value)
        if failReadAfterWrite then rejectRead = true end
        if corruptAfterWrite then saves[slot].sceneId = "absente" end
        if throwAfterWrite then error("erreur apres ecriture") end
    end,
}
progression.save("temoin", {texte = "autre aventure intacte"})
window, document = {}, {}
lv = {obj = {}, label = {}, style = {}, group = {}, timer = {}, color = {}, font = {},
      LABEL_LONG_WRAP = 1, EVENT_KEY = 2, EVENT_CLICKED = 3, STATE_DEFAULT = 0,
      OBJ_FLAG_SCROLLABLE = 1, OPA_COVER = 255, event = {}}
for _, name in ipairs({"remove_style_all", "set_pos", "set_size", "clear_flag", "add_style", "clean", "add_flag"}) do
    lv.obj[name] = function() end
end
for _, name in ipairs({"set_text_font", "set_text_color", "set_bg_color", "set_bg_opa"}) do
    lv.style[name] = function() end
end
for _, name in ipairs({"remove_all_objs", "set_editing", "add_obj"}) do
    lv.group[name] = function() end
end
lv.obj.new = function() return {} end
lv.style.new = function() return {} end
lv.color.hex = function(value) return value end
lv.obj.set_pos = function(obj, x, y) obj.x, obj.y = x, y end
lv.label.new = function() local label = {}; labels[#labels + 1] = label; return label end
lv.label.set_long_mode = function() end
lv.label.set_text = function(label, text) label.text = text end
lv.obj.add_event_cb = function(_, callback, event) callbacks[event] = callback end
lv.event.get_key_value = function(event) return event end
lv.timer.new = function(callback) update = callback; return {} end
audio = {get_status = function() return audioStatus end,
         get_volume = function() return 50 end,
         duration = function() return duration end,
         stop = function() if not stuckAudio then audioStatus = "stop" end end,
         load = function(_, path, callback)
             assert(path:match("%-stereo%.mp3$"))
             loadedPath = path
             feedback = callback
             callback("stop", 0) -- Arret synchrone de l'ancienne piste pendant load.
             return loadResult
         end,
         play = function() plays = plays + 1; audioStatus = "play" end}
goto_library = function() exited = true end

local function start(result)
    callbacks, labels, exited, plays, loadResult = {}, {}, false, 0, result or 0
    audioStatus = "stop"
    for _, name in ipairs({"passage", "rules", "savegame", "adventure_data"}) do package.loaded[name] = nil end
    dofile(folder .. "/main.lua")
    setup()
end
local function advance(count) for _ = 1, count do update() end end
local function click() callbacks[lv.EVENT_CLICKED]() end

-- Reconstitue la lecture des libellés avec leur indicateur séparé.
local function rowText(row)
    if row.x == 30 then
        for _, arrow in ipairs(labels) do
            if arrow.x == 12 and arrow.y == row.y and arrow.text == '>' then return '> ' .. (row.text or '') end
        end
        return '  ' .. (row.text or '')
    end
    return row.text or ''
end
local function visible()
    local lines = {}
    for _, label in ipairs(labels) do lines[#lines + 1] = rowText(label) end
    return table.concat(lines, "\n")
end
local function expect(text)
    assert(visible():gsub("%s+", " "):find(text:gsub("%s+", " "), 1, true), "Texte attendu : " .. text .. "\nEcran :\n" .. visible())
end
local function expectScene(title)
    local scene = require('rules').scene(saves.partie.sceneId)
    assert(scene.title == title, 'Scène attendue : ' .. title)
    for _, label in ipairs(labels) do
        if label.y == 8 then assert(label.text == '', 'Le titre de scène doit rester masqué') end
    end
end
local function choose(label)
    for _ = 1, 60 do
        for _, row in ipairs(labels) do
            if rowText(row) == "> " .. label then advance(4); click(); return end
        end
        callbacks[lv.EVENT_KEY](string.char(19))
    end
    error("Choix absent : " .. label .. "\n" .. visible())
end
-- Le texte des scènes est paginé dans les deux tiers de l'écran.
local function expectPaged(text)
    local chunks = {}
    local first
    for _, row in ipairs(labels) do if row.y == 48 then first = row.text; break end end
    for _ = 1, 30 do
        for _, row in ipairs(labels) do if row.y == 48 then chunks[#chunks + 1] = row.text or '' end end
        if table.concat(chunks):gsub('%s+', ''):find(text:gsub('%s+', ''), 1, true) then return end
        choose('Texte suivant')
        for _, row in ipairs(labels) do if row.y == 48 and row.text == first then error('Texte absent des pages : ' .. text) end end
    end
    error('Trop de pages : ' .. text)
end
local function narration()
    if not visible():find("Écoute", 1, true) then return end
    advance(1)
    assert(plays > 0)
    expect("Écoute")
    feedback("play", 1)
    advance(640)
    audioStatus = "stop"
    feedback("stop", 16)
end

local function travel(label)
    choose(label)
    callbacks[lv.EVENT_KEY](string.char(10)) -- Double notification du même appui.
    narration()
end

local function fresh(className)
    saves.partie = nil
    dieValue = 7
    start()
    travel("Commencer")
    expectScene("Choisis ta classe")
    travel(className or "Pisteur")
end
local function reachRoll(className)
    travel("Prendre la clé")
    travel("Ouvrir avec la clé")
    travel("Traverser la porte")
    travel(className == "Ami des animaux" and "Parler au renard" or "Lire les traces")
end
local function same(first, second)
    for key, value in pairs(first) do assert(second[key] == value, "Etat modifie : " .. key) end
    for key, value in pairs(second) do assert(first[key] == value, "Champ ajoute : " .. key) end
end
local function absent(text)
    assert(not visible():find(text, 1, true), "Texte inattendu : " .. text .. "\n" .. visible())
end

for _, className in ipairs({"Pisteur", "Ami des animaux"}) do
    fresh(className)
    choose("Inventaire")
    expect("Classe : " .. className)
    expect("Clé : 0")
    choose("Retour à la scène")
    local initial = copy(saves.partie)
    choose("[x] Tout ou rien — Action impossible")
    same(initial, saves.partie) -- Aucun effet partiel, même le premier don.
    if className == "Pisteur" then choose("[x] Changer de classe — Action impossible") end
    travel("Recevoir un jeton")
    travel("Recevoir un jeton")
    assert(saves.partie['item:jeton:"é\\'] == 2)
    travel("Prendre la clé")
    local withKey = copy(saves.partie)
    choose("[x] Prendre la clé — Le coffre est déjà vide.")
    choose("[x] Reprendre autrement la clé — Action impossible") -- Identité de récompense, pas de choix.
    choose("[x] Tout ou rien — Action impossible")
    same(withKey, saves.partie)
    choose("Inventaire")
    expect("Clé : 1")
    choose("Retour à la scène")
    back_callback()
    assert(exited)
    travel("Reprendre") -- Le même module reste actif.
    start()
    travel("Reprendre") -- Une nouvelle instance retrouve le même état.
    same(withKey, saves.partie)
    travel("Ouvrir avec la clé")
    assert(saves.partie['item:cle'] == 0 and saves.partie['event:porte-ouverte'] == 1)
    travel("Traverser la porte")
    if className == "Pisteur" then
        absent("Parler au renard") -- Choix masqué.
    else choose("[x] Lire les traces — Pisteur requis.") end
    start()
    travel("Reprendre") -- Conditions réévaluées après restauration.
    if className == "Pisteur" then absent("Parler au renard") end
    travel(className == "Pisteur" and "Lire les traces" or "Parler au renard")
    travel("Lancer le dé")
    expectPaged("Le dé des rencontres : 7 / 20")
    travel("Terminer")
    expectScene("Fin explicite")
    back_callback()
    choose("Recommencer")
    choose("Annuler")
    travel("Reprendre")
    expectScene("Fin explicite")
    back_callback()
    choose("Recommencer")
    travel("Oui, recommencer")
    expectScene("Choisis ta classe")
    assert(saves.partie.classId == "" and saves.partie['item:cle'] == 0)
    assert(saves.partie['roll:rencontre'] == 0 and saves.partie['reward:coffre'] == 0)
end
print("OK : classes, inventaire générique, récompense unique ou répétable, atomicité et fin")

-- La narration est pilotée par le choix, sans perdre les effets ni la sauvegarde.
fresh()
local hasAudio = require("rules").describe(require("rules").initialPartie()).audio ~= nil
local beforePlays = plays
choose("Recevoir sans narration")
advance(2)
assert(plays == beforePlays)
expectScene("La clairière")
assert(saves.partie['item:jeton:"é\\'] == 1)
rejectWrite = true
choose("Recevoir sans narration")
expect("Sauvegarde impossible")
assert(saves.partie['item:jeton:"é\\'] == 1)
rejectWrite = false
choose("Réessayer")
advance(2)
assert(plays == beforePlays and saves.partie['item:jeton:"é\\'] == 2)
choose("Revenir par le dé sans narration")
advance(2)
assert(plays == beforePlays and saves.partie['roll:retour'] == 7)
expectPaged("Dé de retour : 7 / 20")
travel("Recevoir un jeton") -- Champ absent : la narration reste activée.
assert(plays == beforePlays + (hasAudio and 1 or 0))
beforePlays = plays
travel("Changer de scène avec narration")
assert(plays == beforePlays + (hasAudio and 1 or 0))
expectScene("La rencontre")
print("OK : retour sans narration, effets, nouvelle tentative, jet et autre scène")

for result = 1, 20 do
    fresh()
    reachRoll()
    dieValue = result
    rejectWrite = true
    local before = copy(saves.partie)
    choose("Lancer le dé")
    expect("Sauvegarde impossible")
    same(before, saves.partie)
    absent(" / 20") -- Conséquence jamais affichée avant confirmation.
    dieValue = nil
    choose("Annuler")
    rejectWrite = false
    travel("Lancer le dé") -- L'annulation ne reroule pas le résultat proposé.
    expectPaged("Le dé des rencontres : " .. result .. " / 20")
    assert(saves.partie.sceneId == (result <= 10 and "fin-lucioles" or "fin-renard"))
    travel("Revoir la rencontre")
    travel("Lancer le dé") -- Revisite.
    back_callback()
    travel("Reprendre")
    start()
    travel("Reprendre")
    expectPaged("Le dé des rencontres : " .. result .. " / 20")
    travel("Revoir la rencontre")
    dieValue = 20
    travel("Autre dé")
    dieValue = nil
    assert(saves.partie['roll:autre'] == 20 and saves.partie['roll:rencontre'] == result)
end
print("OK : vingt valeurs, revisites, reprise, nouvelle instance et deux identités de jet")

-- Refus de la toute première écriture : aucun état ni conséquence inventés.
saves.partie = nil
start()
rejectWrite = true
choose("Commencer")
expect("Sauvegarde impossible")
assert(saves.partie == nil)
choose("Annuler")
expect("Commencer")
rejectWrite = false

fresh()
reachRoll()
dieValue, rejectWrite = 4, true
choose("Lancer le dé")
expect("Sauvegarde impossible")
dieValue, rejectWrite = nil, false
travel("Réessayer")
expectPaged("Le dé des rencontres : 4 / 20")
-- Un nouveau départ confirmé abandonne aussi les tirages proposés refusés.
travel("Revoir la rencontre")
dieValue, rejectWrite = 6, true
choose("Autre dé")
expect("Sauvegarde impossible")
choose("Annuler")
rejectWrite = false
back_callback()
choose("Recommencer")
travel("Oui, recommencer")
travel("Pisteur")
reachRoll()
dieValue = 17
travel("Autre dé")
expectPaged("Autre dé : 17 / 20")

fresh()
local before = copy(saves.partie)
rejectWrite = true
travel("Prendre la clé")
expect("Sauvegarde impossible")
same(before, saves.partie)
rejectWrite = false
travel("Réessayer")
assert(saves.partie['item:cle'] == 1)
discardWrite = true
travel("Ouvrir avec la clé")
expect("Sauvegarde impossible")
choose("Annuler")
assert(saves.partie['item:cle'] == 1 and saves.partie['event:porte-ouverte'] == 0)
discardWrite = false
throwAfterWrite = true
travel("Ouvrir avec la clé") -- L'exception seule ne prouve pas l'échec.
assert(saves.partie['item:cle'] == 0)
throwAfterWrite = false
travel("Traverser la porte")
travel("Lire les traces")
failReadAfterWrite = true
dieValue = 13
choose("Lancer le dé")
expect("Sauvegarde à vérifier")
absent("Annuler")
dieValue = nil
back_callback()
expect("Sauvegarde à vérifier") -- Quitter ne contourne pas la réconciliation.
failReadAfterWrite, rejectRead = false, false
choose("Relire la partie")
travel("Reprendre")
expectPaged("Le dé des rencontres : 13 / 20")
assert(saves.partie.sceneId == "fin-renard")
-- Une sauvegarde disparue n'est pas un nouveau départ si la partie est connue.
local known = copy(saves.partie)
travel("Revoir la rencontre")
failReadAfterWrite = true
dieValue = 18
choose("Autre dé")
expect("Sauvegarde à vérifier")
failReadAfterWrite, rejectRead = false, false
saves.partie = nil
choose("Relire la partie")
expect("Sauvegarde illisible")
absent("Commencer")
saves.partie = copy(known)
choose("Réessayer")
travel("Reprendre")
-- Incertitude avec ancienne valeur conservée : réutiliser le résultat proposé.
travel("Revoir la rencontre")
discardWrite, failReadAfterWrite = true, false
local load = progression.load
local unreadable = false
progression.load = function(slot) if unreadable then error("lecture") end; return load(slot) end
local save = progression.save
progression.save = function(slot, value) save(slot, value); unreadable = true end
dieValue = nil -- La proposition 18 survit aussi à la disparition temporaire du slot.
choose("Autre dé")
expect("Sauvegarde à vérifier")
dieValue = nil
unreadable, discardWrite = false, false
progression.load, progression.save = load, save
choose("Relire la partie")
travel("Reprendre")
travel("Autre dé")
expectPaged("Autre dé : 18 / 20")
print("OK : refus, écriture sans effet, exception après écriture et réconciliation des deux issues")

local valid = copy(saves.partie)
local invalids = {
    {"schema", 99}, {"adventureId", "etrangere"}, {"saveVersion", 2}, {"sceneId", "absente"},
    {"classId", "magicien"}, {"item:cle", -1}, {"item:cle", 0.5}, {"event:porte-ouverte", 2},
    {"reward:coffre", false}, {"roll:rencontre", 21}, {"roll:autre", "7"}, {"inconnu", 1},
}
for _, mutation in ipairs(invalids) do
    saves.partie = copy(valid)
    saves.partie[mutation[1]] = mutation[2]
    local original = copy(saves.partie)
    start()
    expect("Sauvegarde illisible")
    absent("Commencer")
    same(original, saves.partie)
end
saves.partie = copy(valid)
saves.partie['item:cle'] = nil
start()
expect("Sauvegarde illisible")
saves.partie = copy(valid)
rejectRead = true
start()
expect("Sauvegarde illisible")
rejectRead = false
choose("Réessayer")
travel("Reprendre")
same(valid, saves.partie)
-- Une valeur tierce illisible après écriture interdit toute poursuite.
corruptAfterWrite = true
travel("Revoir la rencontre")
expect("Sauvegarde à vérifier")
corruptAfterWrite = false
choose("Relire la partie")
expect("Sauvegarde illisible")
saves.partie = copy(valid)
choose("Réessayer")
travel("Reprendre")
back_callback()
choose("Recommencer")
failReadAfterWrite = true
choose("Oui, recommencer")
expect("Sauvegarde à vérifier")
failReadAfterWrite, rejectRead = false, false
choose("Relire la partie")
travel("Reprendre")
expectScene("Choisis ta classe")
assert(progression.load("temoin").texte == "autre aventure intacte")
print("OK : sauvegardes invalides ou incompatibles préservées et nouveau départ isolé")

local data = require("adventure_data")
assert(data.title == 'Aventure "libre" \\ café\nDeuxième ligne\0fin', "Chaîne Lua altérée")
if data.scenes[1].audio then
    fresh()
    start(-1)
    choose("Reprendre")
    advance(1)
    expect("Audio indisponible")
    choose("Continuer sans audio")
    expectScene("La clairière")
    start()
    choose("Reprendre")
    advance(1)
    expect("Écoute") -- Le stop synchrone dans load n'achève rien.
    audioStatus = "stop"
    advance(161)
    expect("La narration ne démarre pas")
    choose("Continuer sans audio")
    expectScene("La clairière")
    start()
    choose("Reprendre")
    advance(1)
    feedback("play", 1)
    audioStatus = "stop"
    feedback("stop", 1)
    expect("Lecture arrêtée trop tôt")
    choose("Continuer sans audio")
    start()
    choose("Reprendre")
    advance(1)
    local oldFeedback = feedback
    back_callback()
    choose("Reprendre")
    advance(1)
    oldFeedback("play", 16)
    oldFeedback("stop", 16)
    expect("Écoute")
    feedback("play", 15)
    audioStatus = "stop"
    feedback("stop", 16)
    expectScene("La clairière")
    duration = nil
    start()
    choose("Reprendre")
    advance(1)
    expect("Durée audio indisponible")
    choose("Continuer sans audio")
    duration, stuckAudio = 16, true
    start()
    audioStatus = "play"
    choose("Reprendre")
    advance(201)
    expect("Le lecteur audio ne répond pas")
    stuckAudio = false
    back_callback()
    assert(exited)
    print("OK : erreurs audio, durée, arrêt prématuré, callbacks périmés et retour bibliothèque")
end
math.random = originalRandom
assert(randomCalls >= 40)
print("OK : parcours complet du runtime généré")

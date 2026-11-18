-- Test du pack par les commandes joueur et les seuls services hôtes simulés.
local folder = assert(arg[1])
package.path = folder .. '/?.lua;' .. folder .. '/script/?.lua;' .. package.path
local screenRoot
local imageWidgets = {}
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
-- Observations des couleurs sur les vrais objets destinataires de LVGL.
lv.style.set_text_color = function(style, color) style.textColor = color end
lv.style.set_bg_color = function(style, color) style.backgroundColor = color end
lv.obj.add_style = function(obj, style)
    if style.textColor then obj.textColor = style.textColor end
    if style.backgroundColor then obj.backgroundColor = style.backgroundColor end
end
lv.obj.set_size = function(obj, width, height) obj.width, obj.height = width, height; if width == 320 and height == 212 then screenRoot = obj end end
lv.obj.set_pos = function(obj, x, y) obj.x, obj.y = x, y end
lv.color.hex = function(v) return v end
lv.label.new = function(parent) local v = {parent = parent}; labels[#labels+1] = v; return v end
lv.label.set_long_mode = function() end
lv.label.set_text = function(obj, value) obj.text = value end
lv.img_src.load = function(path)
    local source = {path = path, width = path == 'journal.png' and 296 or 80, height = path == 'journal.png' and 140 or 80}
    local file = io.open(folder .. '/' .. path, 'rb') or io.open(folder .. '/img/' .. path, 'rb')
    if file then
        local header = file:read(12); file:close()
        if header and header:sub(1,4) == 'liff' then source.width, source.height = string.unpack('>I4I4', header, 5) end
    end
    return source
end
lv.img_src.get_width = function(source) return source.width end
lv.img_src.get_height = function(source) return source.height end
lv.img.new = function(parent) local v = {parent = parent}; imageWidgets[#imageWidgets+1] = v; return v end
lv.img.set_src = function(obj, src) obj.sourcePath = src and src.path; obj.source = src; images[#images+1] = src and src.path or false end
lv.img.set_zoom = function(obj, zoom) obj.zoom = zoom end
lv.obj.add_event_cb = function(_, callback, event) callbacks[event] = callback end
lv.event.get_key_value = function(event) return event end
lv.timer.new = function(callback) update = callback; return {} end
audio = {get_status = function() return status end, get_volume = function() return 50 end,
    duration = function() return duration end, stop = function() status = 'stop' end,
    load = function(_, _, callback) feedback = callback; callback('stop', 0); return 0 end,
    play = function() plays = plays + 1; status = 'play' end}
goto_library = function() end
local function start()
    labels, callbacks, images, imageWidgets = {}, {}, {}, {}
    for _, name in ipairs({'passage','rules','savegame','adventure_data','presentation','display'}) do package.loaded[name] = nil end
    dofile(folder .. '/main.lua'); setup()
end
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
local function visible() local out = {}; for _, v in ipairs(labels) do out[#out+1] = rowText(v) end; return table.concat(out, '\n') end
local function expect(value) assert(visible():gsub('%s+', ' '):find(value:gsub('%s+', ' '),1,true), value .. '\n' .. visible()) end
local function expectScene(title)
    assert(require('rules').scene(stored.sceneId).title == title, 'Scène attendue : ' .. title)
    for _, label in ipairs(labels) do
        if label.y == 20 then assert(label.text == '', 'Le titre de scène doit rester masqué') end
        if label.x == 30 then assert(label.width == 172, 'Les options débordent dans le tiers des illustrations') end
        if label.y == 48 then assert(label.width == 202, 'La description déborde dans le tiers des illustrations') end
    end
end
local function absent(value) assert(not visible():gsub('%s+', ' '):find(value:gsub('%s+', ' '),1,true), value .. '\n' .. visible()) end
local function advance(n) for _ = 1, n or 5 do update() end end
local function focus(value)
    for _ = 1, 80 do
        for _, v in ipairs(labels) do
            local selectedText = rowText(v):match('> (.*)') or ''
            selectedText = selectedText:gsub('^%[x%] ', '')
            if selectedText == value or selectedText:sub(1, #value+2) == value .. '  ' then advance(5); return end
        end
        callbacks[lv.EVENT_KEY](19)
    end
    error('Choix absent : ' .. value .. '\n' .. visible())
end
local function choose(value) focus(value); callbacks[lv.EVENT_CLICKED]() end
local function listen()
    advance(1); assert(status == 'play'); feedback('play',1); status = 'stop'; feedback('stop',16)
end
-- Démonstration combinée : mêmes commandes depuis les deux générateurs et le pack livré.
if require('adventure_data').id == '4f67c0b8-d1c9-4d51-9a46-9d290de13f11' then
    local data = require('adventure_data')
    local saves, rolls, paths = 0, 0, {}
    local save, load = progression.save, audio.load
    progression.save = function(...) saves = saves + 1; return save(...) end
    audio.load = function(_, path, callback) paths[#paths+1] = path; return load(_, path, callback) end
    math.random = function() rolls = rolls + 1; return 7 end
    local function snapshot() return {state = copy(stored), saves = saves, rolls = rolls, plays = plays} end
    local function unchanged(before, allowAudio)
        for k,v in pairs(before.state) do assert(stored[k] == v, 'Consultation modifie ' .. k) end
        for k,v in pairs(stored) do assert(before.state[k] == v, 'Consultation ajoute ' .. k) end
        assert(saves == before.saves and rolls == before.rolls, 'Consultation sauvegarde ou tire un dé')
        if not allowAudio then assert(plays == before.plays, 'Lecture automatique en consultation') end
    end
    local function body()
        for _, label in ipairs(labels) do if label.parent == screenRoot and label.height == 140 then return label end end
        error('Texte de fiche absent')
    end
    local function picture()
        for _, img in ipairs(imageWidgets) do if img.parent == screenRoot and img.sourcePath then return img end end
    end
    local function screen(id) for _, s in ipairs(data.screens) do if s.id == id then return s end end end
    local function allText()
        local out = body().text
        for _ = 1, 250 do
            focus('Texte suivant')
            if visible():find('> [x] Texte suivant',1,true) then return out:gsub('%s+','') end
            choose('Texte suivant'); out = out .. body().text
        end
        error('Fin du texte inaccessible')
    end
    start(); choose('Commencer'); listen(); choose('Devenir Pisteur'); listen(); back_callback()
    local before = snapshot()
    focus('Tes affaires'); assert(picture().sourcePath == screen('accueil').links[1].image)
    focus('Ton personnage'); assert(picture().sourcePath == screen('accueil').links[4].image); unchanged(before)
    choose('Tes affaires'); expect('Inventaire vide.'); back_callback(); unchanged(before)
    choose('Tes souvenirs'); absent('La clé découverte'); absent('La lumière retrouvée'); choose('Page suivante')
    expect('L’atelier secret'); choose('L’atelier secret'); expect('Tes souvenirs'); unchanged(before); back_callback()
    choose('Le message partagé'); expect('Le message du gardien'); assert(body().x == 164 and picture().x == 12)
    assert(screenRoot.backgroundColor == 0x392e46); assert(status == 'stop'); unchanged(before)
    assert(allText():find('Dernierrepère:lalanternebleue.',1,true), 'Description longue tronquée')
    choose('Écouter la description'); advance(1); assert(status == 'play' and paths[#paths] == screen('message').audio)
    local stale = feedback; back_callback(); assert(status == 'stop'); expect('L’atelier des lucioles')
    stale('play',1); stale('stop',16); unchanged(before, true)
    before = snapshot(); choose('Les archives'); choose('Message des archives'); expect('Le message du gardien')
    choose('Écouter la description'); listen(); expect('Le message du gardien'); back_callback(); expect('Les archives'); back_callback(); unchanged(before,true)
    before = snapshot(); choose('Lire le carnet'); assert(body().text == '' and picture().x == 12 and picture().y == 48)
    choose('Lire la description'); assert(not picture() and body().width == 296); expect('Dernière ligne'); choose('Voir l’illustration'); assert(picture()); back_callback(); unchanged(before)
    choose('Ton personnage'); local description = allText(); assert(description:find('Talent:Pisteur.',1,true)); assert(not description:find('Talent:Amidesanimaux',1,true)); assert(not description:find('Découverte:',1,true)); back_callback(); unchanged(before)
    choose('Reprendre'); advance(1); assert(paths[#paths] == data.scenes[2].audio and status == 'play'); stale('stop',16); assert(status == 'play')
    feedback('play',1); status = 'stop'; feedback('stop',16)
    choose('Prendre les six objets'); assert(status == 'stop' and stored['reward:sac'] == 1 and stored['event:cle-decouverte'] == 1)
    for _, item in ipairs(data.items) do assert(stored['item:' .. item.id] == 1) end
    back_callback(); before = snapshot(); choose('Tes affaires'); expect('Clé de cuivre'); expect('Lanterne'); choose('Page suivante'); expect('Galet bleu'); expect('Plume'); choose('Plume'); expect('Plume'); back_callback(); expect('2 / 2')
    choose('Page précédente'); choose('Clé de cuivre'); assert(status == 'stop'); choose('Écouter la description'); advance(1); assert(paths[#paths] == data.items[1].audio)
    stale = feedback; back_callback(); assert(status == 'stop'); stale('play',1); stale('stop',16); expect('Tes affaires'); back_callback(); unchanged(before,true)
    before = snapshot(); choose('Tes souvenirs'); choose('Page suivante'); choose('La clé découverte'); expect('Le message du gardien'); back_callback(); expect('2 / 2'); back_callback(); unchanged(before)
    choose('Ouvrir l’atelier'); listen(); assert(stored.sceneId == 'atelier' and stored['item:cle'] == 0 and stored['event:atelier-ouvert'] == 1 and stored['reward:sac'] == 1)
    assert(screenRoot.backgroundColor == 0x193f35); back_callback(); before = snapshot()
    choose('Ouvrir l’atelier — Cette possibilité attend une découverte.'); expect('L’atelier des lucioles'); unchanged(before)
    choose('Tes affaires'); absent('Clé de cuivre'); choose('Page suivante'); expect('Plume'); back_callback(); unchanged(before)
    choose('Tes souvenirs'); choose('Page suivante'); choose('L’atelier secret'); expect('Le message du gardien'); back_callback(); expect('La clé découverte'); back_callback(); unchanged(before)
    choose('Ton personnage'); description = allText(); assert(description:find('Découverte:tuasouvertl’atelier.',1,true)); back_callback(); unchanged(before)
    choose('Reprendre'); listen(); choose('Déposer les cinq objets'); assert(status == 'stop'); back_callback(); before = snapshot(); choose('Tes affaires'); expect('Inventaire vide.'); back_callback(); unchanged(before)
    choose('Reprendre'); listen(); choose('Lire les traces'); listen(); back_callback(); before = snapshot(); choose('Reprendre'); listen(); unchanged(before,true); assert(rolls == 0)
    choose('Lancer le dé des lueurs'); listen(); expectScene('La lumière dorée'); assert(rolls == 1 and stored['roll:lueurs'] == 7 and stored['event:lumiere'] == 1)
    back_callback(); before = snapshot(); choose('Tes souvenirs'); choose('Page suivante'); expect('La lumière retrouvée'); choose('La lumière retrouvée'); expect('Le message du gardien'); back_callback(); back_callback(); unchanged(before)
    start(); expect('L’atelier des lucioles'); choose('Reprendre'); listen(); expectScene('La lumière dorée'); unchanged(before,true)
    stored = nil; start(); choose('Commencer'); listen(); choose('Devenir Ami des animaux'); listen(); choose('Prendre les six objets'); back_callback(); choose('Ouvrir l’atelier'); listen(); back_callback()
    choose('Ton personnage'); description = allText(); assert(description:find('Talent:Amidesanimaux.',1,true)); assert(not description:find('Talent:Pisteur.',1,true)); back_callback()
    choose('Reprendre'); listen(); choose('Écouter les lucioles'); listen(); expectScene('Le dé des lueurs')
    print('OK : démonstration complète, six objets, souvenirs, fiches, audio et commandes narratives')
    return
end

-- Fiche personnage : informations filtrées par les vraies conditions, consultation sans effet.
local character = false
for _, screen in ipairs(require('adventure_data').screens or {}) do if screen.type == 'character' then character = true end end
if character then
    local data = require('adventure_data')
    local saves = 0
    local save = progression.save
    progression.save = function(...) saves = saves + 1; return save(...) end
    math.random = function() error('La fiche personnage déclenche un jet') end
    local function body()
        for _, label in ipairs(labels) do if label.parent == screenRoot and label.height == 140 then return label end end
        error('Texte personnage absent')
    end
    local function visit(pisteur, ami, discovery, item, link, secret)
        local before, writes, count = copy(stored), saves, plays
        choose(link or 'Ton personnage')
        assert(status == 'stop' and plays == count)
        assert(screenRoot.backgroundColor == 0x334455 and body().textColor == 0xffeecc)
        assert(body().x == 164 and body().width == 144)
        local portrait = false
        for _, img in ipairs(imageWidgets) do if img.parent == screenRoot and img.sourcePath then
            assert(img.x == 12 and img.y == 48); portrait = true
        end end
        assert(portrait, 'Portrait absent')
        local read = body().text
        for _ = 1, 100 do
            focus('Texte suivant')
            if visible():find('> [x] Texte suivant', 1, true) then break end
            choose('Texte suivant'); read = read .. '\n' .. body().text
        end
        expect('FINPERSO')
        assert((read:find('PISTEUR',1,true) ~= nil) == pisteur)
        assert((read:find('AMI',1,true) ~= nil) == ami)
        assert((read:find('DECOUV',1,true) ~= nil) == discovery)
        assert((read:find('PORTEUR',1,true) ~= nil) == item)
        assert((read:find('SECRET',1,true) ~= nil) == (secret or false), 'Conjonction de conditions ignorée')
        for i = 0, 23 do assert(read:find(string.format('Texte%02dé', i),1,true), 'Texte long tronqué') end
        choose('Texte précédent'); absent('FINPERSO'); choose('Texte suivant'); expect('FINPERSO')
        absent('Écouter la description'); back_callback()
        assert(saves == writes and plays == count)
        for k,v in pairs(before) do assert(stored[k] == v, 'Personnage modifie ' .. k) end
        for k,v in pairs(stored) do assert(before[k] == v, 'Personnage ajoute ' .. k) end
    end
    start(); choose('Commencer'); listen(); back_callback()
    visit(false, false, false, false)
    choose('Portrait sans média'); assert(body().text == '' and body().x == 12 and body().width == 296)
    absent('Aucun élément disponible'); back_callback()
    choose('Reprendre'); listen(); choose('Pisteur'); listen(); back_callback()
    visit(true, false, false, false)
    choose('Parcours A'); visit(true, false, false, false, 'Portrait partagé'); expect('Archives A'); back_callback()
    choose('Reprendre'); listen(); choose('Prendre la clé'); listen(); back_callback()
    visit(true, false, false, true)
    choose('Reprendre'); listen(); choose('Ouvrir avec la clé'); listen(); back_callback()
    visit(true, false, true, false)
    choose('Reprendre'); listen(); expectScene('La clairière')
    -- Une autre partie montre l'autre classe, sans conserver les découvertes précédentes.
    stored = nil; start(); choose('Commencer'); listen(); choose('Ami des animaux'); listen(); back_callback()
    visit(false, true, false, false)
    choose('Reprendre'); listen(); choose('Prendre la clé'); listen(); choose('Ouvrir avec la clé'); listen(); back_callback()
    visit(false, true, true, false, nil, true)
    choose('Reprendre'); listen(); expectScene('La clairière')
    print('OK : fiche personnage conditionnelle, portrait, texte long et retour au récit')
    return
end

-- Fiches enrichies : lecture intégrale, média explicite et cycle audio indépendant du récit.
local rich = false
for _, screen in ipairs(require('adventure_data').screens or {}) do if screen.id == 'fiche-enrichie' then rich = true end end
if rich then
    local data = require('adventure_data')
    local saves, paths = 0, {}
    local save, load = progression.save, audio.load
    progression.save = function(...) saves = saves + 1; return save(...) end
    audio.load = function(_, path, callback) paths[#paths+1] = path; return load(_, path, callback) end
    math.random = function() error('Une fiche a déclenché un jet') end
    local function unchanged(before, writes)
        for k,v in pairs(before) do assert(stored[k] == v, 'Fiche modifie ' .. k) end
        for k,v in pairs(stored) do assert(before[k] == v, 'Fiche ajoute ' .. k) end
        assert(saves == writes, 'Fiche sauvegarde une transaction')
    end
    local function body()
        for _, label in ipairs(labels) do if label.parent == screenRoot and label.height == 140 then return label end end
        error('Fenêtre de lecture absente')
    end
    local function picture()
        for _, img in ipairs(imageWidgets) do if img.parent == screenRoot and img.sourcePath then return img end end
    end
    local function screen(id) for _, entry in ipairs(data.screens) do if entry.id == id then return entry end end end
    start(); choose('Commencer'); listen(); choose('Pisteur'); advance(1); assert(status == 'play')
    back_callback(); assert(status == 'stop' and stored['heard:clairiere'] == 0)
    local before, writes, count = copy(stored), saves, plays
    choose('Consulter les archives'); assert(plays == count and status == 'stop')
    assert(body().x == 164 and body().width == 144)
    assert(picture().x == 12 and picture().y == 48)
    assert(picture().source.width * picture().zoom / 256 > 84, 'La fiche conserve une petite vignette')
    local read = {}; for line in body().text:gmatch('[^\n]+') do read[#read+1] = line end
    for _ = 1, 200 do
        focus('Texte suivant')
        if visible():find('> [x] Texte suivant', 1, true) then break end
        choose('Texte suivant')
        local last; for line in body().text:gmatch('[^\n]+') do last = line end
        read[#read+1] = last
    end
    expect('TERMINUS')
    assert(table.concat(read, '') == screen('fiche-enrichie').text:gsub('%s+', ''), 'Le défilement perd ou répète du contenu')
    choose('Texte précédent'); absent('TERMINUS'); choose('Texte suivant'); expect('TERMINUS'); unchanged(before, writes)
    choose('Écouter la description'); advance(1); assert(status == 'play' and paths[#paths] == screen('fiche-enrichie').audio)
    local stale = feedback; choose('Arrêter la description'); assert(status == 'stop'); stale('play', 1); stale('stop',16)
    expect('Les archives'); expect('TERMINUS'); unchanged(before, writes)
    choose('Écouter la description'); listen(); expect('Les archives'); expect('TERMINUS'); unchanged(before, writes)
    assert(stored['heard:clairiere'] == 0, 'L’écoute de fiche valide la narration interrompue')
    choose('Écouter la description'); advance(1); stale = feedback; back_callback(); expect('Le bureau du village'); assert(status == 'stop')
    stale('play',1); stale('stop',16); unchanged(before, writes)
    choose('Reprendre'); advance(1); assert(paths[#paths] == data.scenes[2].audio and status == 'play')
    stale('stop',16); assert(status == 'play'); feedback('play',1); status = 'stop'; feedback('stop',16)
    assert(stored['heard:clairiere'] == 1 and stored['item:cle'] == 0)
    before, writes = copy(stored), saves
    back_callback(); choose('Consulter les archives')
    local realLoad = audio.load; audio.load = function() return -1 end
    choose('Écouter la description'); advance(1); expect('Audio indisponible'); expect('Les archives'); unchanged(before, writes)
    audio.load = realLoad; choose('Écouter la description'); advance(1); feedback('play',1); status = 'stop'; feedback('stop',2)
    expect('Lecture arrêtée trop tôt'); expect('Les archives'); unchanged(before, writes); back_callback()
    choose('Lire le carnet'); assert(body().text == '' and picture().x == 12 and picture().y == 48 and picture().zoom == 256)
    local title; for _, label in ipairs(labels) do if label.y == 20 then title = label.text end end; assert(title == '')
    choose('Lire la description'); expect('FINCARNET'); assert(body().x == 12 and body().width == 296 and not picture())
    choose('Voir l’illustration'); assert(body().text == '' and picture().zoom == 256); back_callback()
    choose('Fiche sans média'); assert(body().text == '' and not picture()); absent('Écouter la description'); back_callback(); unchanged(before, writes)
    choose('Reprendre'); listen(); choose('Prendre la clé'); listen()
    before, writes, count = copy(stored), saves, plays
    back_callback(); choose('Tes affaires'); choose('Clé'); assert(plays == count)
    choose('Écouter la description'); advance(1)
    local item; for _, entry in ipairs(data.items) do if entry.id == 'cle' then item = entry end end
    assert(paths[#paths] == item.audio and status == 'play'); stale = feedback
    back_callback(); expect('Tes affaires'); assert(status == 'stop'); stale('play',1); stale('stop',16); unchanged(before, writes)
    back_callback(); choose('Tes souvenirs'); choose('Clé découverte'); expect('Les archives')
    choose('Écouter la description'); listen(); back_callback(); expect('Tes souvenirs'); back_callback(); unchanged(before, writes)
    choose('Reprendre'); listen(); unchanged(before, writes)
    print('OK : fiches split/pleine image, texte intégral, audio explicite et événements périmés')
    return
end

-- Illustration liée à la sélection : aucune destination ni transaction avant validation.
if require('adventure_data').screens and require('adventure_data').screens[1].illustrationMode == 'selection' then
    local data = require('adventure_data')
    local saves = 0
    local save = progression.save
    progression.save = function(...) saves = saves + 1; return save(...) end
    math.random = function() error('La sélection a déclenché un jet') end
    local function scene(id) for _, entry in ipairs(data.scenes) do if entry.id == id then return entry end end end
    local function choice(id) for _, entry in ipairs(data.choices) do if entry.id == id then return entry end end end
    local function screen(id) for _, entry in ipairs(data.screens) do if entry.id == id then return entry end end end
    local function link(menu, id) for _, entry in ipairs(screen(menu).links) do if entry.id == id then return entry end end end
    local function image(path)
        local found
        for _, obj in ipairs(imageWidgets) do if obj.parent == screenRoot then found = obj; break end end
        assert(found and found.sourcePath == path, 'Illustration de la mauvaise sélection : ' .. tostring(found and found.sourcePath) .. ' attendu ' .. tostring(path))
    end
    local function unchanged(before, writes, playCount)
        for k,v in pairs(before) do assert(stored[k] == v, 'Sélection modifie ' .. k) end
        assert(saves == writes and plays == playCount, 'Sélection déclenche sauvegarde ou audio')
    end
    start(); image(screen('accueil').image)
    focus('Voir la carte'); image(link('accueil','carte').image)
    focus('Lire la note'); image(screen('accueil').image)
    focus('Note 4'); image(link('accueil','note-4').image); assert(stored == nil and saves == 0)
    choose('Parcours B'); image(link('archives-b','carte').image)
    focus('Lancer le dé'); image(nil); focus('Retour'); image(nil)
    back_callback(); choose('Parcours A'); image(screen('archives-a').image)
    focus('Carte partagée'); image(screen('archives-a').image)
    focus('Visiter B'); image(screen('archives-a').image)
    back_callback(); choose('Commencer'); image(scene('depart').image); listen()
    local before, writes, playCount = copy(stored), saves, plays
    focus('Ami des animaux'); image(scene('depart').image)
    focus('Pisteur'); image(scene('depart').image); unchanged(before, writes, playCount)
    choose('Pisteur'); image(scene('clairiere').image); listen()
    before, writes, playCount = copy(stored), saves, plays
    absent('Image cachée'); focus('Prendre la clé'); image(choice('prendre-cle').image)
    focus('Recevoir un jeton'); image(choice('bonus-choix').image)
    focus('Ouvrir avec la clé — Il faut une clé et une porte fermée.'); image(choice('ouvrir-porte').image)
    focus('Recevoir sans narration'); image(scene('clairiere').image); unchanged(before, writes, playCount)
    back_callback(); focus('Partir comme pisteur'); image(link('accueil','depart-menu').image)
    focus('Note 4'); image(link('accueil','note-4').image); unchanged(before, writes, playCount)
    choose('Lire la note'); expect('Bienvenue.'); back_callback()
    choose('Reprendre'); listen(); unchanged(before, writes, playCount + 1)
    choose('Prendre la clé'); listen(); assert(stored['item:cle'] == 1 and stored['reward:coffre'] == 1)
    back_callback(); start(); focus('Note 4'); image(link('accueil','note-4').image)
    print('OK : illustrations communes et sélectionnées, filtrage, défilement et absence d’effets')
    return
end

-- Collection d'auteur : filtrage avant pagination et découverte indépendante de la possession.
local collection = false
for _, screen in ipairs(require('adventure_data').screens or {}) do if screen.source == 'collection' then collection = true end end
if collection then
    math.random = function() error('La collection a déclenché un jet') end
    local saves = 0
    local save = progression.save
    progression.save = function(...) saves = saves + 1; return save(...) end
    local function unchanged(before, writes)
        for k,v in pairs(before) do assert(stored[k] == v, 'Collection modifie ' .. k) end
        for k,v in pairs(stored) do assert(before[k] == v, 'Collection ajoute ' .. k) end
        assert(saves == writes, 'Collection sauvegarde une transaction')
    end
    local function cells(expected)
        local names = {}
        for _, label in ipairs(labels) do
            if label.parent.width == 144 and (label.text or '') ~= '' then names[#names+1] = label.text:sub(3):gsub('^%[x%] ', '') end
        end
        assert(#names == #expected, 'Nombre incorrect de contenus visibles')
        for i,name in ipairs(names) do assert(name == expected[i], 'Mauvaise entrée paginée : ' .. name) end
    end
    start(); choose('Commencer'); listen(); choose('Pisteur'); listen()
    local before, writes, playCount = copy(stored), saves, plays
    back_callback(); choose('Secrets invisibles'); cells({}); expect('Collection'); expect('vide.'); absent('Voix des bêtes'); back_callback()
    choose('Tes souvenirs'); cells({'Village','Passage secret','Pont','Bois'})
    absent('Clé découverte'); absent('Clé possédée'); absent('Voix des bêtes')
    choose('Passage secret'); expect('Tes souvenirs'); absent('Le passage secret'); unchanged(before, writes)
    local locked = false; for _, label in ipairs(labels) do if rowText(label) == '> [x] Passage secret' then locked = true end end
    assert(locked, 'Entrée indisponible non marquée comme verrouillée')
    choose('Page suivante'); cells({'Port','Archives'}); choose('Archives'); expect('La carte du village')
    back_callback(); expect('2 / 2'); cells({'Port','Archives'}); back_callback(); assert(plays == playCount)
    choose('Reprendre'); listen(); unchanged(before, writes)
    choose('Prendre la clé'); listen(); assert(stored['item:cle'] == 1 and stored['event:cle-decouverte'] == 1)
    back_callback(); choose('Tes souvenirs'); cells({'Village','Passage secret','Clé découverte','Clé possédée'})
    choose('Clé découverte'); expect('Souvenir de la clé'); expect('autrefois'); back_callback(); back_callback()
    choose('Reprendre'); listen(); choose('Ouvrir avec la clé'); listen()
    assert(stored['item:cle'] == 0 and stored['event:cle-decouverte'] == 1)
    before, writes, playCount = copy(stored), saves, plays
    back_callback(); choose('Tes affaires'); cells({}); expect('vide.'); back_callback()
    for _ = 1, 2 do
        choose('Tes souvenirs'); cells({'Village','Passage secret','Clé découverte','Pont'}); absent('Clé possédée')
        choose('Passage secret'); expect('Le passage secret'); back_callback()
        choose('Clé découverte'); expect('Souvenir de la clé'); back_callback()
        choose('Page suivante'); cells({'Bois','Port','Archives'}); choose('Archives'); expect('La carte du village'); back_callback(); back_callback()
    end
    unchanged(before, writes); assert(plays == playCount)
    choose('Reprendre'); listen(); unchanged(before, writes)
    start(); choose('Tes souvenirs'); cells({'Village','Passage secret','Clé découverte','Pont'}); absent('Clé possédée'); unchanged(before, writes)
    print('OK : collections, entrées masquées/verrouillées, souvenirs et possession indépendante')
    return
end

-- Grille de production : cases, pages, données réutilisées et possession actuelle.
local inventoryGrid = false
for _, screen in ipairs(require('adventure_data').screens or {}) do if screen.type == 'grid' then inventoryGrid = true end end
if inventoryGrid then
    local saves = 0
    local save = progression.save
    progression.save = function(...) saves = saves + 1; return save(...) end
    local function unchanged(before, writes)
        for k,v in pairs(before) do assert(stored[k] == v, 'Consultation modifie ' .. k) end
        for k,v in pairs(stored) do assert(before[k] == v, 'Consultation ajoute ' .. k) end
        assert(saves == writes, 'Consultation sauvegarde une transaction')
    end
    local function cells(expected)
        local count = 0
        for _, label in ipairs(labels) do
            if label.parent.width == 144 and (label.text or '') ~= '' then
                count = count + 1
                assert(label.text:sub(3) == expected[count], 'Mauvais contenu de case : ' .. label.text)
                assert(label.parent.x == (count % 2 == 1 and 12 or 164))
                assert(label.parent.y == (count <= 2 and 48 or 118))
                local item
                for _, value in ipairs(require('adventure_data').items) do if value.name == expected[count] then item = value end end
                local image
                for _, obj in ipairs(imageWidgets) do if obj.parent == label.parent then image = obj.sourcePath end end
                assert(image == item.image, 'Image incorrecte dans la case ' .. count)
                if label.text:sub(1,2) == '> ' then assert(label.parent.backgroundColor == 0xaabbcc, 'Case sélectionnée non mise en évidence') end
            end
        end
        assert(count == #expected, 'Nombre incorrect de cases')
    end
    local function detail(name, fragment, itemId)
        local playsBefore = plays
        choose(name); expect(fragment)
        assert(screenRoot.backgroundColor == 0x223344, 'Thème de la fiche type perdu')
        local item
        for _, value in ipairs(require('adventure_data').items) do if value.id == itemId then item = value end end
        local found = false
        for _, img in ipairs(imageWidgets) do
            if img.sourcePath then assert(img.sourcePath == item.image, 'Image du mauvais objet'); found = true end
        end
        assert(found == (item.image ~= nil), 'Image facultative non respectée')
        assert(plays == playsBefore, 'Consultation déclenche un audio')
    end
    start(); choose('Commencer'); listen(); choose('Pisteur'); listen()
    back_callback(); choose('Tes affaires'); expect('Inventaire'); expect('vide.'); cells({}); back_callback()
    choose('Reprendre'); listen(); choose('Tout recevoir'); listen()
    local before, writes = copy(stored), saves
    back_callback(); choose('Tes affaires'); cells({'Clé','Corde','Boussole','Lanterne'})
    absent('Jeton'); detail('Corde', 'solide.', 'corde'); back_callback(); cells({'Clé','Corde','Boussole','Lanterne'})
    detail('Boussole', 'le nord.', 'boussole'); back_callback()
    choose('Page suivante'); expect('2 / 2'); cells({'Galet','Carte'})
    detail('Carte', 'port.', 'carte-objet'); back_callback(); expect('2 / 2'); cells({'Galet','Carte'})
    local selected = false; for _, label in ipairs(labels) do if rowText(label) == '> Carte' then selected = true end end
    assert(selected, 'La fiche ne retrouve pas la bonne sélection de la page')
    choose('Page précédente'); cells({'Clé','Corde','Boussole','Lanterne'})
    back_callback(); expect('Le bureau du village'); choose('Reprendre'); listen(); unchanged(before, writes)
    choose('Tout déposer'); listen(); back_callback(); choose('Tes affaires'); cells({}); expect('vide.')
    back_callback(); choose('Reprendre'); listen(); choose('Prendre la clé'); listen()
    back_callback(); choose('Tes affaires'); cells({'Clé'}); detail('Clé', 'dorée.', 'cle'); back_callback(); back_callback()
    choose('Reprendre'); listen(); choose('Ouvrir avec la clé'); listen(); assert(stored['item:cle'] == 0)
    back_callback(); choose('Tes affaires'); cells({}); expect('vide.'); back_callback()
    before, writes = copy(stored), saves
    start(); choose('Tes affaires'); cells({}); expect('vide.'); back_callback(); choose('Reprendre'); listen(); unchanged(before, writes)
    print('OK : grille 2 × 2, pagination, fiche type, inventaire vide et possession actuelle')
    return
end

-- Valeurs attendues indépendantes de l'algorithme d'héritage du lecteur.
if require('adventure_data').theme then
    local function colors(background, text, selection)
        assert(screenRoot.backgroundColor == background, 'Fond incorrect')
        local heading; for _, obj in ipairs(labels) do if obj.y == 20 then heading = obj end end
        assert(heading and heading.textColor == text, 'Texte du titre incorrect')
        for _, obj in ipairs(labels) do
            if rowText(obj):sub(1, 2) == '> ' then assert(obj.textColor == selection, 'Sélection incorrecte')
            elseif rowText(obj):sub(1, 2) == '  ' then assert(obj.textColor == text, 'Texte de choix incorrect') end
        end
    end
    start(); colors(0x203040, 0xffeecc, 0xff7700)
    callbacks[lv.EVENT_KEY](19); colors(0x203040, 0xffeecc, 0xff7700)
    choose('Voir la carte'); colors(0x112233, 0x00ddaa, 0xff7700)
    back_callback(); colors(0x203040, 0xffeecc, 0xff7700)
    choose('Lire la note'); colors(0x112233, 0xffeecc, 0xff7700)
    back_callback(); choose('Commencer'); colors(0x112233, 0xffeecc, 0xff7700); listen()
    choose('Pisteur'); listen(); colors(0x101112, 0xffeecc, 0xabcdef)
    local before = copy(stored)
    back_callback(); colors(0x203040, 0xffeecc, 0xff7700)
    choose('Parcours A'); colors(0x112233, 0xffeecc, 0xff7700)
    choose('Carte partagée'); colors(0x112233, 0x00ddaa, 0xff7700)
    back_callback(); colors(0x112233, 0xffeecc, 0xff7700)
    back_callback(); choose('Reprendre'); listen(); colors(0x101112, 0xffeecc, 0xabcdef)
    for k,v in pairs(before) do assert(stored[k] == v, 'Couleurs ont modifié la partie') end
    start(); colors(0x203040, 0xffeecc, 0xff7700)
    choose('Reprendre'); listen(); colors(0x101112, 0xffeecc, 0xabcdef)
    print('OK : thème, remplacements et couleurs appliquées aux objets LVGL')
    return
end

-- Menus mixtes : parcours commun aux données compilées et au pack de production.
local mixed = false
for _, screen in ipairs(require('adventure_data').screens or {}) do if screen.id == 'archives-a' then mixed = true end end
if mixed then
    local saves, rolls = 0, 0
    local save = progression.save
    progression.save = function(...) saves = saves + 1; return save(...) end
    math.random = function() rolls = rolls + 1; return 7 end
    local function unchanged(before, writes)
        for k,v in pairs(before) do assert(stored[k] == v, 'Partie modifiée : ' .. k) end
        for k,v in pairs(stored) do assert(before[k] == v, 'Champ ajouté : ' .. k) end
        assert(saves == writes, 'Sauvegarde pendant consultation ou commande refusée')
    end
    start(); choose('Partir comme pisteur'); listen()
    assert(stored.sceneId == 'clairiere' and stored.classId == 'pisteur')
    back_callback(); choose('Note 4'); expect('Bienvenue.'); back_callback()
    choose('Parcours A'); expect('Archives A'); absent('Commande cachée')
    local before, writes = copy(stored), saves
    choose('Passer avec la clé — Accès refusé'); unchanged(before, writes)
    choose('Payer deux clés — Accès refusé'); unchanged(before, writes)
    choose('Carte partagée'); expect('La carte du village'); back_callback(); expect('Archives A')
    choose('Visiter B'); expect('Archives B'); choose('Carte partagée'); expect('La carte du village')
    back_callback(); expect('Archives B'); back_callback(); expect('Archives A'); back_callback(); expect('Le bureau du village')
    choose('Parcours B'); choose('Carte partagée'); back_callback(); expect('Archives B')
    back_callback(); expect('Le bureau du village'); unchanged(before, writes)
    choose('Reprendre'); listen(); unchanged(before, writes)
    choose('Prendre la clé'); listen(); assert(stored['item:cle'] == 1)
    before, writes = copy(stored), saves
    back_callback(); choose('Parcours A')
    choose('Payer deux clés — Accès refusé'); unchanged(before, writes)
    -- Échec confirmé puis nouvelle tentative : une seule consommation après confirmation.
    rejectWrite = true; choose('Passer avec la clé'); expect('Sauvegarde impossible')
    assert(stored.sceneId == 'clairiere' and stored['item:cle'] == 1 and stored['event:porte-ouverte'] == 0)
    rejectWrite = false; choose('Réessayer'); listen()
    assert(stored.sceneId == 'sentier' and stored['item:cle'] == 0 and stored['event:porte-ouverte'] == 1)
    back_callback(); choose('Parcours A'); before, writes = copy(stored), saves
    choose('Passer avec la clé — Accès refusé'); unchanged(before, writes)
    back_callback(); choose('Parcours B'); choose('Lancer le dé'); listen()
    assert(stored['roll:rencontre'] == 7 and rolls == 1)
    local destination = stored.sceneId
    back_callback(); choose('Parcours B'); choose('Lancer le dé'); listen()
    assert(stored.sceneId == destination and rolls == 1, 'Jet de menu rejoué')
    before, writes = copy(stored), saves
    back_callback(); choose('Parcours A'); choose('Carte partagée'); back_callback(); back_callback()
    choose('Reprendre'); listen(); unchanged(before, writes)
    start(); expect('Reprendre'); choose('Parcours B'); choose('Carte partagée'); back_callback(); expect('Archives B')
    back_callback(); choose('Reprendre'); listen(); unchanged(before, writes)
    print('OK : sous-menus, fiche partagée, commandes atomiques et reprise')
    return
end

-- Même parcours utilisé depuis le compilateur JS et le pack Rust.
if require('adventure_data').mainMenuId then
    local loads, saves, rolls = {}, 0, 0
    local save = progression.save
    progression.save = function(...) saves = saves + 1; return save(...) end
    local load = audio.load
    audio.load = function(_, path, callback) loads[#loads+1] = path; return load(_, path, callback) end
    math.random = function() rolls = rolls + 1; return 7 end
    local function sameState(before)
        for k,v in pairs(before) do assert(stored[k] == v, 'Consultation a modifié ' .. k) end
        for k,v in pairs(stored) do assert(before[k] == v, 'Consultation a ajouté ' .. k) end
    end
    local function roundtrip()
        local before, writes, draws = copy(stored), saves, rolls
        back_callback(); assert(status == 'stop'); expect('Le bureau du village')
        local stopped = feedback
        if stopped then stopped('play',1); stopped('stop',16) end
        for _ = 1, 2 do
            local playCount = plays
            choose('Voir la carte'); expect('La carte du village'); expect('Le vieux')
            assert(plays == playCount, 'La fiche lance une narration')
            assert(images[#images] ~= false, 'Image de fiche absente')
            back_callback(); expect('Le bureau du village')
            choose('Lire la note'); expect('Bienvenue.'); assert(images[#images] == false, 'Image précédente conservée')
            back_callback()
        end
        choose('Reprendre'); advance(1)
        assert(status == 'play' and loads[#loads] == loads[#loads-1], 'La même scène doit être relue depuis le début')
        feedback('play',1); status = 'stop'; feedback('stop',16)
        sameState(before); assert(saves == writes and rolls == draws, 'Consultation a sauvegardé ou tiré un dé')
    end
    start(); expect('Le bureau du village'); choose('Lire la note'); back_callback(); assert(stored == nil)
    choose('Commencer'); listen(); choose('Pisteur'); listen()
    choose('Recevoir un jeton'); listen(); choose('Prendre la clé'); listen()
    assert(stored['item:cle'] == 1 and stored['reward:coffre'] == 1)
    roundtrip()
    choose('Ouvrir avec la clé'); listen(); assert(stored['item:cle'] == 0)
    choose('Traverser la porte'); listen(); choose('Lire les traces'); listen(); choose('Lancer le dé'); listen()
    assert(stored['roll:rencontre'] == 7 and rolls == 1)
    roundtrip()
    -- Reprise après réouverture ; mêmes données, aucune transaction narrative.
    local before = copy(stored); start(); expect('Reprendre'); choose('Reprendre'); listen(); sameState(before)
    -- Interruption en pleine narration puis événement retardé de l'ancienne piste.
    back_callback(); choose('Reprendre'); advance(1); local stale = feedback
    local writes, snapshot = saves, copy(stored)
    back_callback(); stale('play',1); stale('stop',16); sameState(snapshot); assert(saves == writes)
    expect('Le bureau du village'); choose('Voir la carte'); back_callback(); choose('Reprendre'); listen()
    print('OK : écrans du graphe, fiche facultative, audio et reprise sans effet')
    return
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

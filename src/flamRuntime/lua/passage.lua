-- Runtime FLAM piloté par le document : rendu et cycle de vie du firmware.
local adventure = {}
local scenes = require("rules")
local display = require("display")
local enhanced = scenes.data.presentation ~= nil
local presentation = enhanced and require("presentation") or nil
local consultation, consultStack, audioPath, replaying, backgroundImage, detailOption
local savegame = require("savegame")
local partie = scenes.initialPartie()
local hasPartie = false
local loadProblem, pendingSave
local proposedRolls = {}
local choices, rows = {}, {}
local root, heading, body, first, second, hint, timer
local styles = {}
local selected, phase, ticks, lastClick, loading = 1, "ready", 0, -20, 0
local audioPending, audioAccepted, heardPlay = false, false, false
local loadResult, lastEvent, playedSecond, playStarted = "-", "-", 0, 0
local bodyPages, bodyPage, contentChoices = {}, 1, nil
local expectedDuration = 0
local playbackId = 0

local function text(parent, value, y, height, size)
    local obj = lv.label.new(parent)
    lv.obj.remove_style_all(obj)
    lv.obj.set_pos(obj, 12, y)
    lv.obj.set_size(obj, enhanced and 202 or 296, height)
    lv.label.set_long_mode(obj, lv.LABEL_LONG_WRAP)
    lv.label.set_text(obj, value)
    local style = lv.style.new()
    lv.style.set_text_font(style, size)
    lv.style.set_text_color(style, lv.color.hex(0xf3f0df))
    styles[#styles + 1] = style
    lv.obj.add_style(obj, style, lv.STATE_DEFAULT)
    return obj
end

local function setBody(value)
    bodyPages, bodyPage, contentChoices = {}, 1, nil
    if not enhanced then lv.label.set_text(body, value); return end
    local lines, line = {}, ""
    local length = 0
    for glyph in value:gmatch("[%z\1-\127\194-\244][\128-\191]*") do
        if glyph == "\n" or length == 20 then
            lines[#lines+1], line, length = line, "", 0
        end
        if glyph ~= "\n" then line, length = line .. glyph, length + 1 end
    end
    lines[#lines+1] = line
    for i = 1, #lines, 2 do bodyPages[#bodyPages+1] = lines[i] .. (lines[i+1] and "\n" .. lines[i+1] or "") end
    lv.label.set_text(body, bodyPages[1] or "")
end

local function drawChoices()
    if enhanced and #bodyPages > 1 and phase ~= "intro" then
        if not contentChoices then contentChoices = choices end
        choices = {}
        for _, option in ipairs(contentChoices) do choices[#choices+1] = option end
        choices[#choices+1] = {label = "Texte suivant", action = "page"}
    end
    display.progress(enhanced and phase == "ready" and presentation.progress(partie) or nil)
    local thumbs = {}
    local offset = math.floor((selected - 1) / #rows) * #rows
    for index, row in ipairs(rows) do
        local option = choices[offset + index]
        if consultation and option then thumbs[index] = option.image end
        local prefix = offset + index == selected and "> " or "  "
        if option and option.enabled == false then prefix = prefix .. "[x] " end
        lv.label.set_text(row, option and (prefix .. option.label) or "")
    end
    display.thumbnails(thumbs)
    local option = choices[selected]
    display.image(option and option.image or backgroundImage)
end

local function storageError(kind)
    phase, selected = "storage-error", 1
    if kind == "uncertain" then
        choices = {{label = "Relire la partie", action = "reload"}, {label = "Bibliothèque", action = "leave"}}
        lv.label.set_text(heading, "Sauvegarde à vérifier")
        setBody("L'action a peut-être été sauvée.\nRelis la partie avant de continuer.")
    elseif kind == "read" then
        choices = {{label = "Réessayer", action = "reload"}, {label = "Bibliothèque", action = "leave"}}
        lv.label.set_text(heading, "Sauvegarde illisible")
        setBody("Ta partie n'a pas été effacée.\nRéessaie ou quitte l'aventure.")
    else
        choices = {{label = "Réessayer", action = "retry-save"}, {label = "Annuler", action = "cancel-save"},
                   {label = "Bibliothèque", action = "leave"}}
        lv.label.set_text(heading, "Sauvegarde impossible")
        setBody("Action non confirmée.\nRéessaie ou annule ce choix.")
    end
    lv.label.set_text(hint, "Aucune nouvelle partie automatique.")
    drawChoices()
end

local function restore()
    local restored, problem = savegame.read()
    if restored and not scenes.validPartie(restored) then problem = "invalid" end
    if not restored and hasPartie and not problem then problem = "read" end
    loadProblem = problem
    if not problem then
        if pendingSave and pendingSave.action == "restart" and savegame.equal(restored, pendingSave.candidate) then
            proposedRolls = {}
        end
        pendingSave = nil
        if restored then partie, hasPartie = restored, true
        else partie, hasPartie = scenes.initialPartie(), false end
    end
end

local function commit(candidate, action)
    local ok, problem = savegame.write(candidate, hasPartie and partie or nil)
    if not ok then
        pendingSave = {candidate = candidate, action = action}
        if problem == "uncertain" then loadProblem = "uncertain" end
        storageError(problem == "uncertain" and "uncertain" or "write")
        return false
    end
    pendingSave = nil
    if action == "restart" then proposedRolls = {} end
    partie, hasPartie = candidate, true
    return true
end

local function showChoices()
    consultation, replaying, consultStack = nil, false, {}
    backgroundImage = scenes.describe(partie).image
    phase, selected = "scene", 1
    local view = scenes.describe(partie)
    choices = {}
    for _, choice in ipairs(view.choices) do choices[#choices + 1] = choice end
    choices[#choices + 1] = {label = enhanced and "Menu de l'aventure" or "Inventaire", action = enhanced and "welcome" or "inventory"}
    lv.label.set_text(heading, view.title)
    setBody(view.body)
    lv.label.set_text(hint, "Tourne la molette, puis clique.")
    drawChoices()
end

local function inventory()
    phase, selected = "inventory", 1
    choices = {{label = "Retour à la scène", action = "scene"}}
    lv.label.set_text(heading, "Ton inventaire")
    local description, entries = scenes.inventory(partie)
    for _, entry in ipairs(entries) do choices[#choices + 1] = entry end
    setBody(description)
    lv.label.set_text(hint, "Clique pour revenir à la scène.")
    drawChoices()
end

local function welcome()
    consultation, replaying, consultStack = nil, false, {}
    backgroundImage = enhanced and scenes.data.presentation.image or nil
    audio.stop()
    if loadProblem then storageError(loadProblem == "uncertain" and "uncertain" or "read"); return end
    phase, selected, audioPending, audioAccepted, heardPlay = "ready", 1, false, false, false
    playbackId = playbackId + 1
    choices = {{label = hasPartie and "Reprendre" or "Commencer", action = "intro"}}
    if enhanced then
        for _, entry in ipairs(presentation.sections()) do choices[#choices+1] = entry end
    end
    if hasPartie then choices[#choices + 1] = {label = "Recommencer", action = "confirm-restart"} end
    choices[#choices + 1] = {label = "Bibliothèque", action = "leave"}
    lv.label.set_text(heading, scenes.data.title)
    setBody(enhanced and (presentation.progress(partie) .. " %\n" .. scenes.data.presentation.text) or "Une aventure personnelle")
    lv.label.set_text(hint, "Retour : bibliothèque")
    drawChoices()
end

local function leave()
    -- La FLAM reprend le meme module sans rappeler setup : laisser un depart actif.
    welcome()
    audio.stop()
    goto_library()
end

local function diagnostics()
    local volume = audio.get_volume and audio.get_volume() or "?"
    lv.label.set_text(second, "V=" .. tostring(volume) .. " état=" .. tostring(audio.get_status()))
    lv.label.set_text(hint, "L=" .. tostring(loadResult) .. " E=" .. lastEvent .. " t=" .. tostring(playedSecond))
end

local function beginNarration()
    replaying = false
    if not hasPartie and not commit(scenes.acquire(partie)) then return end
    audioPath = scenes.describe(partie).audio
    backgroundImage = scenes.describe(partie).image
    display.image(backgroundImage)
    if not audioPath then showChoices(); return end
    phase, audioPending, audioAccepted, heardPlay = "intro", true, false, false
    playbackId = playbackId + 1
    loading, loadResult, lastEvent, playedSecond, playStarted = 0, "-", "-", 0, ticks
    lv.label.set_text(heading, scenes.describe(partie).title)
    setBody("Écoute le début de cette scène...")
    for _, row in ipairs(rows) do lv.label.set_text(row, "") end
    diagnostics()
end

local function consult(title, description, entries, image)
    consultation = {title = title, description = description, entries = entries, image = image}
    phase, selected, backgroundImage = "consultation", 1, image
    lv.label.set_text(heading, title)
    setBody(description ~= "" and description or (#entries == 0 and "Aucun élément disponible." or ""))
    choices = {}
    for _, entry in ipairs(entries) do choices[#choices+1] = entry end
    choices[#choices+1] = {label = "Retour", action = "back"}
    lv.label.set_text(hint, "Retour : rubrique précédente")
    drawChoices()
end

local function openConsult(title, description, entries, image)
    if consultation then consultStack[#consultStack+1] = consultation end
    consult(title, description, entries, image)
end

local function back()
    if phase == "storage-error" then return end
    playbackId = playbackId + 1
    audioPending, audioAccepted = false, false
    audio.stop()
    if replaying then
        replaying = false
        consult(consultation.title, consultation.description, consultation.entries, consultation.image)
    elseif #consultStack > 0 then
        local parent = table.remove(consultStack)
        consult(parent.title, parent.description, parent.entries, parent.image)
    elseif phase == "ready" then leave()
    else welcome() end
end

local function finishNarration()
    if replaying then back(); return end
    if enhanced then
        local candidate = scenes.completeListening(partie)
        if not savegame.equal(candidate, partie) and not commit(candidate, "listened") then return end
    end
    showChoices()
end

-- Le choix est recalculé avant la sauvegarde, y compris lors d'une nouvelle tentative.
local function followChoice(id)
    local candidate, replayAudio = scenes.transition(partie, id, proposedRolls)
    if candidate and commit(candidate, id) then
        if replayAudio then beginNarration() else showChoices() end
    end
end

local function click()
    if ticks - lastClick < 4 then return end
    lastClick = ticks
    local option = choices[selected]
    if phase == "intro" or not option or option.enabled == false then return end
    if option.action == "intro" then
        beginNarration()
    elseif option.action == "reload" then restore(); welcome()
    elseif option.action == "retry-save" then
        if pendingSave then
            local action = pendingSave.action
            local candidate = pendingSave.candidate
            if action == "listened" then
                if commit(scenes.completeListening(partie), "listened") then showChoices() end
            elseif action and action ~= "restart" then followChoice(action)
            elseif candidate and commit(candidate, action) then beginNarration() end
        end
    elseif option.action == "cancel-save" then
        pendingSave = nil
        if hasPartie then showChoices() else welcome() end
    elseif option.action == "confirm-restart" then
        phase, selected = "confirm-restart", 1
        choices = {{label = "Annuler", action = "welcome"}, {label = "Oui, recommencer", action = "restart"}}
        lv.label.set_text(heading, "Recommencer cette partie ?")
        setBody("Ta progression sera remplacée.\nChoisis Annuler pour la garder.")
        lv.label.set_text(hint, "Un nouveau départ pour cette aventure.")
        drawChoices()
    elseif option.action == "restart" then
        if commit(scenes.acquire(scenes.initialPartie()), "restart") then beginNarration() end
    elseif option.action == "welcome" then welcome()
    elseif option.action == "leave" then leave()
    elseif option.action == "page" then
        bodyPage = bodyPage % #bodyPages + 1
        lv.label.set_text(body, bodyPages[bodyPage])
    elseif option.action == "back" then back()
    elseif option.action == "section" then
        local description, entries = presentation.section(partie, option.section)
        openConsult(option.label, description, entries, option.image)
    elseif option.action == "chapter" then openConsult(option.label, option.text, option.entries, option.image)
    elseif option.action == "detail" then
        detailOption = option
        openConsult(option.label, option.text or "", option.audio and {{label = "Réécouter", action = "replay"}} or {}, option.image)
    elseif option.action == "replay" then
        replaying, phase, audioPath, audioPending, audioAccepted, heardPlay = true, "intro", detailOption.audio, true, false, false
        playbackId = playbackId + 1
        loading, playedSecond, playStarted = 0, 0, ticks
        setBody("Écoute le passage... Retour pour interrompre.")
        for _, row in ipairs(rows) do lv.label.set_text(row, "") end
    elseif option.action == "inventory" then inventory()
    elseif option.action == "scene" then showChoices()
    elseif option.choiceId then
        followChoice(option.choiceId)
    end
end

local function key(event)
    local value = lv.event.get_key_value(event)
    if value == nil then return end
    local code = type(value) == "number" and value or string.byte(value)
    if code == 10 then click()
    elseif (code == 19 or code == 20) and phase ~= "intro" and #choices > 0 then
        selected = ((selected - 1 + (code == 19 and 1 or -1)) % #choices) + 1
        drawChoices()
    end
end

local function audioError(message)
    phase, selected = "audio-error", 1
    playbackId = playbackId + 1
    audio.stop()
    choices = {{label = "Continuer sans audio", action = replaying and "back" or "scene"}}
    setBody(message)
    drawChoices()
    diagnostics()
end

local function feedback(status, second)
    if phase ~= "intro" then return end
    lastEvent = tostring(status)
    if audioAccepted and type(second) == "number" then playedSecond = math.max(playedSecond, second) end
    if status == "play" then heardPlay = true end
    -- Le chargement peut notifier l'arret de l'ancienne piste avant audio.play.
    if audioAccepted and heardPlay and status == "stop" then
        if playedSecond >= expectedDuration - 1 then
            finishNarration()
        else
            audioError("Lecture arrêtée trop tôt.\nNote les valeurs ci-dessous.")
        end
    end
end

local function tick()
    ticks = ticks + 1
    if phase == "intro" or phase == "audio-error" then diagnostics() end
    if phase ~= "intro" then return end
    if audioAccepted then
        if audio.get_status() == "play" then heardPlay = true end
        if ticks - playStarted > 160 and audio.get_status() == "stop" then
            if heardPlay and playedSecond >= expectedDuration - 1 then
                finishNarration()
            else
                audioError("La narration ne démarre pas.\nNote les valeurs ci-dessous.")
            end
        end
        return
    end
    if not audioPending then return end
    loading = loading + 1
    if audio.get_status() == "stop" then
        audioPending = false
        local path = audioPath
        local id = playbackId
        loadResult = audio.load(0, path, function(status, second)
            if id == playbackId then feedback(status, second) end
        end)
        if loadResult == 0 then
            expectedDuration = audio.duration and tonumber(audio.duration()) or nil
            if not expectedDuration or expectedDuration <= 1 then
                audioError("Durée audio indisponible.\nLa lecture n'est pas validée.")
                return
            end
            -- Accepter les evenements de lecture seulement apres le retour de load.
            audioAccepted, heardPlay, playStarted = true, false, ticks
            audio.play()
        else
            audioError("Audio indisponible.\nContinue sans narration.")
        end
    elseif loading == 1 then
        audio.stop()
    elseif loading > 200 then
        audioError("Le lecteur audio ne répond pas.")
    end
end

function adventure.start()
    playbackId = playbackId + 1
    selected, phase, ticks, lastClick, loading = 1, "ready", 0, -20, 0
    audioPending, audioAccepted, heardPlay = false, false, false
    styles = {}
    -- La sortie hote gere la destruction. Ne pas nettoyer LVGL avant goto_library.
    back_callback = enhanced and back or leave
    lv.group.remove_all_objs(document)
    lv.obj.clean(window)
    lv.group.set_editing(document, true)
    root = lv.obj.new(window)
    lv.obj.remove_style_all(root)
    lv.obj.set_size(root, 320, 212)
    lv.obj.clear_flag(root, lv.OBJ_FLAG_SCROLLABLE)
    local background = lv.style.new()
    lv.style.set_bg_color(background, lv.color.hex(0x132e32))
    lv.style.set_bg_opa(background, lv.OPA_COVER)
    styles[#styles + 1] = background
    lv.obj.add_style(root, background, lv.STATE_DEFAULT)
    display.start(root)
    heading = text(root, scenes.data.title, 8, 34, lv.font.nunito_bold_20)
    lv.obj.set_size(heading, 296, 34)
    body = text(root, "Écoute le début de ton aventure...", 48, 62, lv.font.nunito_bold_16)
    first = text(root, "", 111, 26, lv.font.nunito_bold_16)
    second = text(root, "", 140, 26, lv.font.nunito_bold_16)
    local third = text(root, "", 169, 22, lv.font.nunito_bold_16)
    rows = {first, second, third}
    if enhanced and lv.LABEL_LONG_SCROLL_CIRCULAR then
        lv.label.set_long_mode(heading, lv.LABEL_LONG_SCROLL_CIRCULAR)
        for _, row in ipairs(rows) do lv.label.set_long_mode(row, lv.LABEL_LONG_SCROLL_CIRCULAR) end
    end
    hint = text(root, "Bouton retour : bibliothèque.", 195, 17, lv.font.nunito_bold_12)
    lv.obj.set_size(hint, 296, 17)
    lv.obj.add_event_cb(root, key, lv.EVENT_KEY)
    lv.obj.add_event_cb(root, click, lv.EVENT_CLICKED)
    lv.group.add_obj(document, root)
    timer = lv.timer.new(tick, 25, nil)
    restore()
    welcome()
end

return adventure

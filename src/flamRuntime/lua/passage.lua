-- Runtime FLAM piloté par le document : rendu et cycle de vie du firmware.
local adventure = {}
local scenes = require("rules")
local display = require("display")
local enhanced = scenes.data.presentation ~= nil or scenes.data.mainMenuId ~= nil
local presentation = scenes.data.presentation and require("presentation") or nil
local consultation, consultStack, audioPath, replaying, backgroundImage, detailOption, illustrationMode
local savegame = require("savegame")
local partie = scenes.initialPartie()
local hasPartie = false
local loadProblem, pendingSave
local proposedRolls = {}
local choices, rows = {}, {}
local root, heading, body, first, second, hint, timer
local styles = {}
local labelStyles, backgroundStyle, palette = {}, nil, {}
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
    labelStyles[obj] = style
    lv.obj.add_style(obj, style, lv.STATE_DEFAULT)
    return obj
end

-- Réutiliser les mêmes styles garde une mémoire bornée pendant la navigation.
local function applyColors(screen)
    local defaults = {background = "#132e32", text = "#f3f0df", selection = "#53d9d1"}
    for field, fallback in pairs(defaults) do
        local value = screen and screen.colors and screen.colors[field]
            or (scenes.data.theme and scenes.data.theme[field]) or fallback
        palette[field] = tonumber(value:sub(2), 16)
    end
    lv.style.set_bg_color(backgroundStyle, lv.color.hex(palette.background))
    lv.obj.add_style(root, backgroundStyle, lv.STATE_DEFAULT)
    for obj, style in pairs(labelStyles) do
        lv.style.set_text_color(style, lv.color.hex(palette.text))
        lv.obj.add_style(obj, style, lv.STATE_DEFAULT)
    end
end

local function wrapLines(value, width)
    local lines, line, length = {}, "", 0
    for paragraph in (value .. "\n"):gmatch("([^\n]*)\n") do
        for word in paragraph:gmatch("%S+") do
            local glyphs = {}
            for glyph in word:gmatch("[%z\1-\127\194-\244][\128-\191]*") do glyphs[#glyphs+1] = glyph end
            if length > 0 and length + 1 + #glyphs > width then
                lines[#lines+1], line, length = line, "", 0
            end
            if length > 0 then line, length = line .. " ", length + 1 end
            for _, glyph in ipairs(glyphs) do
                if length == width then lines[#lines+1], line, length = line, "", 0 end
                line, length = line .. glyph, length + 1
            end
        end
        lines[#lines+1], line, length = line, "", 0
    end
    return lines
end

local function setBody(value)
    bodyPages, bodyPage, contentChoices = {}, 1, nil
    if not enhanced then lv.label.set_text(body, value); return end
    local lines = wrapLines(value, 12)
    for i = 1, #lines, 2 do bodyPages[#bodyPages+1] = lines[i] .. (lines[i+1] and "\n" .. lines[i+1] or "") end
    lv.label.set_text(body, bodyPages[1] or "")
end

local detailLayoutActive = false
local function drawDetail()
    local detail = consultation and consultation.detail
    if not detail then
        if detailLayoutActive then
            lv.obj.set_pos(body, 12, 48)
            lv.obj.set_size(body, enhanced and 202 or 296, 62)
            lv.label.set_long_mode(hint, lv.LABEL_LONG_WRAP)
            detailLayoutActive = false
        end
        return false
    end
    detailLayoutActive = true
    display.grid(nil); display.progress(nil); display.thumbnails({})
    local hasImage = consultation.image ~= nil
    local showText = detail.layout ~= 'fullImage' or detail.showText or not hasImage
    local split = detail.layout == 'split' and hasImage
    local lines = wrapLines(consultation.description, split and 9 or 18)
    local maximum = math.max(1, #lines - 6)
    detail.offset = math.max(1, math.min(detail.offset or 1, maximum))
    lv.obj.set_pos(body, split and 164 or 12, 48)
    lv.obj.set_size(body, split and 144 or 296, 140)
    local visible = {}
    if showText then for i = detail.offset, math.min(#lines, detail.offset + 6) do visible[#visible+1] = lines[i] end end
    lv.label.set_text(body, table.concat(visible, '\n'))
    for _, row in ipairs(rows) do lv.label.set_text(row, '') end
    local imagePath = consultation.image
    if detail.layout == 'fullImage' and showText then imagePath = nil end
    display.image(imagePath, detail.layout)
    choices = {}
    if detail.audio then choices[#choices+1] = {label = phase == 'detail-audio' and 'Arrêter la description' or 'Écouter la description', action = 'detail-audio'} end
    if detail.layout == 'fullImage' and hasImage and consultation.description ~= '' then
        choices[#choices+1] = {label = showText and 'Voir l’illustration' or 'Lire la description', action = 'detail-view'}
    end
    if showText and maximum > 1 then
        choices[#choices+1] = {label = 'Texte précédent', action = 'detail-scroll', delta = -1, enabled = detail.offset > 1}
        choices[#choices+1] = {label = 'Texte suivant', action = 'detail-scroll', delta = 1, enabled = detail.offset < maximum}
    end
    choices[#choices+1] = {label = 'Retour', action = 'back'}
    selected = math.min(selected, #choices)
    consultation.selected = selected
    local option = choices[selected]
    lv.label.set_long_mode(hint, lv.LABEL_LONG_SCROLL_CIRCULAR or lv.LABEL_LONG_WRAP)
    lv.label.set_text(hint, (detail.audioError and (detail.audioError .. ' ') or '') .. '> ' .. (option.enabled == false and '[x] ' or '') .. option.label
        .. (showText and maximum > 1 and ('  ' .. detail.offset .. '/' .. maximum) or ''))
    lv.style.set_text_color(labelStyles[hint], lv.color.hex(palette.selection))
    lv.obj.add_style(hint, labelStyles[hint], lv.STATE_DEFAULT)
    return true
end

local function drawGrid()
    local grid = consultation and consultation.grid
    if not grid or #grid.entries == 0 then display.grid(nil); return false end
    local entries, pages = {}, math.ceil(#grid.entries / 4)
    choices = {}
    local offset = (grid.page - 1) * 4
    for i = 1, 4 do
        local item = grid.entries[offset + i]
        if item then
            entries[i] = item
            choices[#choices+1] = {label = item.name, enabled = item.enabled,
                action = consultation.screen.source == 'inventory' and 'item-detail' or 'screen',
                item = item, screenId = consultation.screen.source == 'inventory' and consultation.screen.detailScreenId or item.screenId}
        end
    end
    if grid.page > 1 then choices[#choices+1] = {label = 'Page précédente', action = 'grid-page', delta = -1} end
    if grid.page < pages then choices[#choices+1] = {label = 'Page suivante', action = 'grid-page', delta = 1} end
    choices[#choices+1] = {label = 'Retour', action = 'back'}
    consultation.selected = selected
    lv.label.set_text(body, '')
    for _, row in ipairs(rows) do lv.label.set_text(row, '') end
    display.progress(nil); display.thumbnails({}); display.image(nil)
    display.grid(entries, selected, palette)
    local option = choices[selected]
    lv.label.set_text(hint, grid.page .. ' / ' .. pages .. (selected > #entries and ('  > ' .. option.label) or '  Tourne, puis clique.'))
    return true
end

local function drawChoices()
    if drawDetail() then return end
    if drawGrid() then return end
    if consultation then consultation.selected = selected end
    if enhanced and #bodyPages > 1 and phase ~= "intro" then
        if not contentChoices then contentChoices = choices end
        choices = {}
        for _, option in ipairs(contentChoices) do choices[#choices+1] = option end
        choices[#choices+1] = {label = "Texte suivant", action = "page"}
    end
    display.progress(presentation and phase == "ready" and presentation.progress(partie) or nil)
    local thumbs = {}
    local offset = math.floor((selected - 1) / #rows) * #rows
    for index, row in ipairs(rows) do
        local option = choices[offset + index]
        if consultation and not consultation.screen and option then thumbs[index] = option.image end
        local prefix = offset + index == selected and "> " or "  "
        if option and option.enabled == false then prefix = prefix .. "[x] " end
        lv.label.set_text(row, option and (prefix .. option.label) or "")
        local style = labelStyles[row]
        lv.style.set_text_color(style, lv.color.hex(offset + index == selected and palette.selection or palette.text))
        lv.obj.add_style(row, style, lv.STATE_DEFAULT)
    end
    display.thumbnails(thumbs)
    local option = choices[selected]
    if illustrationMode == "common" then display.image(backgroundImage)
    else display.image(option and option.image or backgroundImage) end
end

local function storageError(kind)
    applyColors(nil)
    phase, selected = "storage-error", 1
    if kind == "uncertain" then
        choices = {{label = "Relire la partie", action = "reload"}, {label = "Bibliothèque", action = "leave"}}
        lv.label.set_text(heading, "Sauvegarde à vérifier")
        setBody("L'action a peut-être été sauvée.\nRelis la partie avant de continuer.")
    elseif kind == "invalid" then
        choices = {{label = "Relire la partie", action = "reload"}, {label = "Bibliothèque", action = "leave"}}
        lv.label.set_text(heading, "Partie incompatible")
        setBody("Cette partie ne correspond pas à cette version de l'aventure. Elle n'a pas été effacée.")
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
    illustrationMode = scenes.scene(partie.sceneId).illustrationMode or "common"
    applyColors(scenes.scene(partie.sceneId))
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

local function mainMenuEntries(menu)
    local entries = {{label = hasPartie and "Reprendre" or "Commencer", action = "intro"}}
    for _, option in ipairs(scenes.menuEntries(partie, menu.id)) do entries[#entries+1] = option end
    if hasPartie then entries[#entries+1] = {label = "Recommencer", action = "confirm-restart"} end
    entries[#entries+1] = {label = "Bibliothèque", action = "leave"}
    return entries
end

local function welcome()
    consultation, replaying, consultStack = nil, false, {}
    local menu
    for _, screen in ipairs(scenes.data.screens or {}) do
        if screen.id == scenes.data.mainMenuId then menu = screen end
    end
    applyColors(menu)
    illustrationMode = menu and (menu.illustrationMode or "common") or nil
    if menu then backgroundImage = menu.image
    else backgroundImage = presentation and scenes.data.presentation.image or nil end
    phase, selected, audioPending, audioAccepted, heardPlay = "ready", 1, false, false, false
    playbackId = playbackId + 1
    audio.stop()
    if loadProblem then storageError(loadProblem == "uncertain" and "uncertain" or (enhanced and loadProblem == "invalid" and "invalid" or "read")); return end
    if menu then choices = mainMenuEntries(menu)
    else
        choices = {{label = hasPartie and "Reprendre" or "Commencer", action = "intro"}}
        if presentation then
            for _, entry in ipairs(presentation.sections()) do choices[#choices+1] = entry end
        end
        if hasPartie then choices[#choices+1] = {label = "Recommencer", action = "confirm-restart"} end
        choices[#choices+1] = {label = "Bibliothèque", action = "leave"}
    end
    lv.label.set_text(heading, menu and menu.title or scenes.data.title)
    setBody(menu and menu.text or (presentation and (presentation.progress(partie) .. " %\n" .. scenes.data.presentation.text) or "Une aventure personnelle"))
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
    illustrationMode = "common"
    consultation, consultStack, replaying = nil, {}, false
    playbackId = playbackId + 1
    audioPending, audioAccepted, heardPlay = false, false, false
    audio.stop()
    if not hasPartie and not commit(scenes.acquire(partie)) then return end
    applyColors(scenes.scene(partie.sceneId))
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

local function consult(title, description, entries, image, cursor, screen, grid, detail)
    applyColors(screen)
    illustrationMode = screen and screen.type == "menu" and (screen.illustrationMode or "common") or nil
    consultation = {title = title, description = description, entries = entries, image = image, screen = screen, grid = grid, detail = detail}
    phase, selected, backgroundImage = "consultation", cursor or 1, image
    local sectionTitle = consultStack[1] and consultStack[1].title
    lv.label.set_text(heading, not detail and sectionTitle and sectionTitle ~= title and (sectionTitle .. " / " .. title) or title)
    setBody(detail and "" or (description ~= "" and description or (not grid and #entries == 0 and "Aucun élément disponible." or "")))
    choices = {}
    for _, entry in ipairs(entries) do choices[#choices+1] = entry end
    choices[#choices+1] = {label = "Retour", action = "back"}
    lv.label.set_text(hint, "Retour : rubrique précédente")
    drawChoices()
end

local function openConsult(title, description, entries, image, screen, grid, detail)
    if consultation then consultStack[#consultStack+1] = consultation end
    if screen and (screen.type == 'detail' or screen.type == 'character') and not detail then detail = {layout = screen.layout or 'split', audio = screen.audio, offset = 1} end
    consult(title, description, entries, image, nil, screen, grid, detail)
end

local function back()
    if phase == "storage-error" then return end
    playbackId = playbackId + 1
    audioPending, audioAccepted = false, false
    audio.stop()
    if replaying then
        replaying = false
        consult(consultation.title, consultation.description, consultation.entries, consultation.image, consultation.selected, consultation.screen, consultation.grid, consultation.detail)
    elseif #consultStack > 0 then
        local parent = table.remove(consultStack)
        consult(parent.title, parent.description, parent.entries, parent.image, parent.selected, parent.screen, parent.grid, parent.detail)
    elseif phase == "ready" then leave()
    else welcome() end
end

local function finishNarration()
    if phase == 'detail-audio' then
        playbackId = playbackId + 1
        audioPending, audioAccepted, heardPlay = false, false, false
        phase = 'consultation'
        audio.stop()
        drawChoices()
        return
    end
    if replaying then back(); return end
    if enhanced then
        local candidate = scenes.completeListening(partie)
        if not savegame.equal(candidate, partie) and not commit(candidate, "listened") then return end
    end
    showChoices()
end

-- Le choix est recalculé avant la sauvegarde, y compris lors d'une nouvelle tentative.
local function followChoice(id, menuId, linkId)
    local candidate, replayAudio = scenes.transition(partie, id, proposedRolls, menuId, linkId)
    local action = menuId and {choiceId = id, menuId = menuId, linkId = linkId} or id
    if candidate and commit(candidate, action) then
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
            elseif type(action) == "table" then followChoice(action.choiceId, action.menuId, action.linkId)
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
    elseif option.action == 'detail-scroll' then
        consultation.detail.offset = consultation.detail.offset + option.delta
        drawChoices()
    elseif option.action == 'detail-view' then
        consultation.detail.showText = not consultation.detail.showText
        drawChoices()
    elseif option.action == 'detail-audio' then
        playbackId = playbackId + 1
        audioPending, audioAccepted, heardPlay = false, false, false
        local playing = phase == 'detail-audio'
        phase = playing and 'consultation' or 'detail-audio'
        audio.stop()
        if not playing then
            consultation.detail.audioError = nil
            audioPath, audioPending = consultation.detail.audio, true
            loading, loadResult, lastEvent, playedSecond, playStarted = 0, '-', '-', 0, ticks
        end
        drawChoices()
    elseif option.action == "back" then back()
    elseif option.action == 'grid-page' then
        consultation.grid.page = consultation.grid.page + option.delta
        selected = 1
        drawChoices()
    elseif option.action == 'item-detail' then
        for _, screen in ipairs(scenes.data.screens or {}) do
            if screen.id == option.screenId and screen.type == 'detail' and screen.contentSource == 'item' then
                openConsult(option.item.name, option.item.text or '', {}, option.item.image, screen, nil, {layout = screen.layout or 'split', audio = option.item.audio, offset = 1})
                break
            end
        end
    elseif option.action == "screen" then
        for _, screen in ipairs(scenes.data.screens or {}) do
            if screen.id == option.screenId then
                local entries = screen.type == "menu" and (screen.id == scenes.data.mainMenuId and mainMenuEntries(screen) or scenes.menuEntries(partie, screen.id)) or {}
                if screen.type == 'grid' then
                    local items = scenes.gridEntries(partie, screen)
                    openConsult(screen.title, #items == 0 and (screen.source == 'inventory' and 'Inventaire vide.' or 'Collection vide.') or '', {}, nil, screen, {entries = items, page = 1})
                elseif screen.contentSource ~= 'item' then
                    openConsult(screen.title, screen.type == 'character' and scenes.characterText(partie, screen) or screen.text, entries, screen.image, screen)
                end
                break
            end
        end
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
        followChoice(option.choiceId, option.menuId, option.linkId)
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
    if phase == 'detail-audio' then
        playbackId = playbackId + 1
        audioPending, audioAccepted, heardPlay = false, false, false
        phase = 'consultation'
        audio.stop()
        consultation.detail.audioError = message:match('^[^\n]+')
        drawChoices()
        return
    end
    phase, selected = "audio-error", 1
    playbackId = playbackId + 1
    audio.stop()
    choices = {{label = "Continuer sans audio", action = replaying and "back" or "scene"}}
    setBody(message)
    drawChoices()
    diagnostics()
end

local function feedback(status, second)
    if phase ~= "intro" and phase ~= "detail-audio" then return end
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
    if phase ~= "intro" and phase ~= "detail-audio" then return end
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
    styles, labelStyles, palette = {}, {}, {}
    detailLayoutActive = false
    -- La sortie hote gere la destruction. Ne pas nettoyer LVGL avant goto_library.
    back_callback = enhanced and back or leave
    lv.group.remove_all_objs(document)
    lv.obj.clean(window)
    lv.group.set_editing(document, true)
    root = lv.obj.new(window)
    lv.obj.remove_style_all(root)
    lv.obj.set_size(root, 320, 212)
    lv.obj.clear_flag(root, lv.OBJ_FLAG_SCROLLABLE)
    backgroundStyle = lv.style.new()
    lv.style.set_bg_color(backgroundStyle, lv.color.hex(0x132e32))
    lv.style.set_bg_opa(backgroundStyle, lv.OPA_COVER)
    styles[#styles + 1] = backgroundStyle
    lv.obj.add_style(root, backgroundStyle, lv.STATE_DEFAULT)
    display.start(root)
    heading = text(root, scenes.data.title, 8, 34, lv.font.nunito_bold_20)
    lv.obj.set_size(heading, 296, 34)
    if enhanced then
        local adventureTitle = text(root, scenes.data.title, 1, 17, lv.font.nunito_bold_12)
        lv.obj.set_size(adventureTitle, 296, 17)
        if lv.LABEL_LONG_SCROLL_CIRCULAR then lv.label.set_long_mode(adventureTitle, lv.LABEL_LONG_SCROLL_CIRCULAR) end
        lv.obj.set_pos(heading, 12, 20)
        lv.obj.set_size(heading, 296, 27)
    end
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

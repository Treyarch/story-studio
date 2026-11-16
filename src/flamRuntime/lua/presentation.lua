-- Vues de consultation : aucune transition, écriture ou lecture audio ici.
local rules = require('rules')
local view = rules.data.presentation
local presentation = {}
function presentation.progress(state)
    local count = 0
    for _, milestone in ipairs(view.progress.milestones) do count = count + state['milestone:' .. milestone.id] end
    return math.min(100, math.floor(100 * count / view.progress.target))
end
function presentation.sections()
    local entries = {}
    for _, section in ipairs(view.sections) do
        if section.enabled then entries[#entries+1] = {label = section.title, image = section.image, action = 'section', section = section} end
    end
    return entries
end
function presentation.chapters(state)
    local entries = {}
    for _, chapter in ipairs(view.chapters) do
        local passages, complete, total, started = {}, true, 0, false
        for _, passage in ipairs(chapter.passages) do
            local scene = rules.scene(passage.sceneId)
            if rules.conditionsMet(state, passage.conditions) then
                total = total + 1
                local heard = state['heard:' .. scene.id] == 1
                local discovered = state['visited:' .. scene.id] == 1
                if discovered then started = true end
                if not heard and scene.audio then complete = false end
                if not discovered then complete = false end
                if discovered and (not scene.audio or heard) then
                    passages[#passages+1] = {label = scene.title, image = scene.image, text = scene.text,
                        audio = passage.replayable and scene.audio or nil, action = 'detail'}
                end
            end
        end
        -- Ne jamais révéler une branche inconnue par un titre de passage.
        if started then
            entries[#entries+1] = {label = chapter.title, image = chapter.image, action = 'chapter',
                text = complete and total > 0 and 'Écouté / découvert' or 'Commencé', entries = passages}
        end
    end
    return entries
end
function presentation.section(state, section)
    if section.kind == 'chapters' then return '', presentation.chapters(state) end
    local entries, description = {}, ''
    if section.kind == 'inventory' then
        for _, item in ipairs(rules.data.items) do
            local quantity = state['item:' .. item.id]
            if quantity > 0 then entries[#entries+1] = {label = item.name .. ' : ' .. quantity,
                text = item.text or '', image = item.image, audio = item.audio, action = 'detail'} end
        end
    else
        if section.kind == 'character' then description = rules.inventory(state) end
        for _, entry in ipairs(section.entries) do
            local enabled = rules.conditionsMet(state, entry.conditions)
            if enabled then entries[#entries+1] = {label = entry.title, text = entry.text, image = entry.image, audio = entry.audio, action = 'detail'}
            elseif entry.unavailable == 'disabled' then entries[#entries+1] = {label = 'Indisponible', enabled = false} end
        end
    end
    return description, entries
end
return presentation

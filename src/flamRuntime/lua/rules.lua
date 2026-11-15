-- Les règles portent uniquement sur des données ; aucun appel à l'hôte.
local data = require("adventure_data")
local rules = {data = data}
local definitions = {}
for _, collection in ipairs({"scenes", "choices", "classes", "items", "events", "rewards", "rolls"}) do
    definitions[collection] = {}
    for _, entry in ipairs(data[collection]) do definitions[collection][entry.id] = entry end
end

local function integer(value, minimum, maximum)
    return type(value) == "number" and value >= minimum and value <= maximum and value % 1 == 0
end

function rules.initialPartie()
    local state = {schema = 1, adventureId = data.id, saveVersion = data.saveVersion,
                   sceneId = data.startSceneId, classId = ""}
    for _, pair in ipairs({{"items", "item:"}, {"events", "event:"}, {"rewards", "reward:"}, {"rolls", "roll:"}}) do
        for _, entry in ipairs(data[pair[1]]) do state[pair[2] .. entry.id] = 0 end
    end
    return state
end

function rules.validPartie(state)
    if type(state) ~= "table" then return false end
    local shape = rules.initialPartie()
    for key in pairs(state) do if shape[key] == nil then return false end end
    for key in pairs(shape) do if state[key] == nil then return false end end
    if state.schema ~= 1 or state.adventureId ~= data.id or state.saveVersion ~= data.saveVersion
        or not definitions.scenes[state.sceneId]
        or (state.classId ~= "" and not definitions.classes[state.classId]) then return false end
    for _, entry in ipairs(data.items) do
        if not integer(state["item:" .. entry.id], 0, 9007199254740991) then return false end
    end
    for _, collection in ipairs({"events", "rewards", "rolls"}) do
        local prefix = collection == "events" and "event:" or collection == "rewards" and "reward:" or "roll:"
        for _, entry in ipairs(data[collection]) do
            if not integer(state[prefix .. entry.id], 0, collection == "rolls" and 20 or 1) then return false end
        end
    end
    return true
end

local function conditionsMet(state, choice)
    for _, condition in ipairs(choice.conditions) do
        if condition.type == "class" and state.classId ~= condition.classId then return false end
        if condition.type == "item" and state["item:" .. condition.itemId] < condition.quantity then return false end
        if condition.type == "event" and (state["event:" .. condition.eventId] == 1) ~= condition.present then return false end
    end
    return true
end

local function applyEffects(state, effects)
    for _, effect in ipairs(effects) do
        if effect.type == "chooseClass" then
            if state.classId ~= "" and state.classId ~= effect.classId then return false end
            state.classId = effect.classId
        elseif effect.type == "setEvent" then state["event:" .. effect.eventId] = 1
        else
            local key = "item:" .. effect.itemId
            local quantity = state[key] + (effect.type == "giveItem" and effect.quantity or -effect.quantity)
            if not integer(quantity, 0, 9007199254740991) then return false end
            state[key] = quantity
        end
    end
    return true
end

local function candidateFor(state, id)
    local scene, choice = definitions.scenes[state.sceneId], definitions.choices[id]
    if not choice or scene.ending then return nil end
    local belongs = false
    for _, choiceId in ipairs(scene.choices) do if choiceId == id then belongs = true end end
    if not belongs or not conditionsMet(state, choice) then return nil end
    local reward = choice.rewardId and definitions.rewards[choice.rewardId]
    if reward and not reward.repeatable and state["reward:" .. reward.id] == 1 then return nil end
    local candidate = {}
    for key, value in pairs(state) do candidate[key] = value end
    if not applyEffects(candidate, choice.effects) then return nil end
    if reward then
        if not applyEffects(candidate, reward.effects) then return nil end
        candidate["reward:" .. reward.id] = 1
    end
    return candidate, choice
end

-- Décrire n'effectue aucun tirage et n'applique aucun effet à la partie.
function rules.describe(state)
    local scene = definitions.scenes[state.sceneId]
    local view = {title = scene.title, body = scene.text, audio = scene.audio, ending = scene.ending, choices = {}}
    for _, roll in ipairs(data.rolls) do
        if state["roll:" .. roll.id] > 0 then
            view.body = view.body .. "\n" .. roll.name .. " : " .. state["roll:" .. roll.id] .. " / 20"
        end
    end
    if not scene.ending then
        for _, id in ipairs(scene.choices) do
            local choice = definitions.choices[id]
            local enabled = candidateFor(state, id) ~= nil
            if enabled or choice.unavailable.mode ~= "hidden" then
                local label = choice.label
                if not enabled then
                    local explanation = choice.unavailable.explanation
                    label = label .. " — " .. (explanation ~= "" and explanation or "Conditions ou effets impossibles.")
                end
                view.choices[#view.choices + 1] = {label = label, choiceId = id, enabled = enabled}
            end
        end
    end
    return view
end

function rules.transition(state, id, proposedRolls)
    local candidate, choice = candidateFor(state, id)
    if not candidate then return nil end
    if choice.rollId then
        local key = "roll:" .. choice.rollId
        local result = candidate[key]
        if result == 0 then
            result = proposedRolls[choice.rollId] or math.random(20)
            proposedRolls[choice.rollId] = result
            candidate[key] = result
        end
        for _, outcome in ipairs(definitions.rolls[choice.rollId].outcomes) do
            if result >= outcome.min and result <= outcome.max then candidate.sceneId = outcome.destination end
        end
    else candidate.sceneId = choice.destination end
    if not rules.validPartie(candidate) then return nil end
    return candidate
end

function rules.inventory(state)
    local class = definitions.classes[state.classId]
    local entries = {}
    for _, item in ipairs(data.items) do
        entries[#entries + 1] = {label = item.name .. " : " .. tostring(state["item:" .. item.id]), enabled = false}
    end
    return "Classe : " .. (class and class.name or "à choisir"), entries
end

return rules

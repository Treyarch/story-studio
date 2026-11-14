-- Contenu original : les choix de l'auteur sont distincts du rendu et du stockage.
local scenes = {}

function scenes.describe(partie)
    if partie.scene == "clairiere" then
        return {
            title = "La clairière des lucioles",
            audio = "intro-stereo.mp3",
            body = "Un coffre près du sentier.\nUne porte mène au village.",
            choices = {
                {label = "Explorer le coffre", destination = "coffre"},
                {label = "Voir la porte", destination = "porte"},
            },
        }
    elseif partie.scene == "coffre" then
        return {
            title = "Le coffre",
            audio = "coffre-stereo.mp3",
            body = partie.chest == 1 and "Le coffre est vide.\nTu as déjà trouvé sa clé." or "Une clé brille dans le coffre.",
            choices = {
                {label = "Prendre la clé", enabled = partie.chest == 0,
                 destination = "coffre", effects = {keys = 1, chest = 1}},
                {label = "Retour à la clairière", destination = "clairiere"},
            },
        }
    elseif partie.scene == "porte" then
        return {
            title = "La porte du village",
            audio = "porte-stereo.mp3",
            body = partie.door == 1 and "La porte est ouverte.\nLe village t'attend." or "La porte est fermée.",
            choices = {
                partie.door == 1 and {label = "Traverser la porte", destination = "rencontre"}
                or {label = partie.keys > 0 and "Ouvrir avec la clé" or "Ouvrir - nécessite une clé",
                    enabled = partie.keys > 0, destination = "porte", effects = {keys = 0, door = 1}},
                {label = "Retour à la clairière", destination = "clairiere"},
            },
        }
    elseif partie.scene == "rencontre" then
        return {
            title = "Le dé des rencontres", audio = "rencontre-stereo.mp3",
            body = partie.roll == 0 and "Qui t'accompagnera au village ?\nLance ton dé à vingt faces."
                or ("Dé : " .. tostring(partie.roll) .. " / 20\n" ..
                    (partie.roll <= 10 and "Des lucioles te font signe." or "Un renard vient à ta rencontre.")),
            choices = {
                partie.roll == 0 and {label = "Lancer le dé", destination = "rencontre", roll = true}
                or {label = "Suivre la rencontre", destination = "fin"},
                {label = "Retour à la porte", destination = "porte"},
            },
        }
    elseif partie.scene == "fin" then
        return {
            title = "Fin de l'aventure",
            body = partie.roll <= 10 and "Les lucioles t'escortent au village.\nBienvenue !"
                or "Le renard te guide vers le village.\nBienvenue !",
            audio = partie.roll <= 10 and "fin-stereo.mp3" or "renard-stereo.mp3",
            choices = {{label = "Retour à la clairière", destination = "clairiere"}},
        }
    end
end

function scenes.initialPartie()
    return {schema = 2, scene = "clairiere", keys = 0, chest = 0, door = 0, roll = 0}
end

function scenes.validPartie(value)
    if type(value) ~= "table" or value.schema ~= 2 or type(value.scene) ~= "string" then return false end
    if type(value.roll) ~= "number" or value.roll % 1 ~= 0 or value.roll < 0 or value.roll > 20 then return false end
    for _, name in ipairs({"keys", "chest", "door"}) do
        if value[name] ~= 0 and value[name] ~= 1 then return false end
    end
    if value.keys + value.door ~= value.chest then return false end
    if (value.scene == "fin" or value.scene == "rencontre" or value.roll > 0) and value.door ~= 1 then return false end
    if value.scene == "fin" and value.roll == 0 then return false end
    local fields = {schema = true, scene = true, keys = true, chest = true, door = true, roll = true}
    for name in pairs(value) do if not fields[name] then return false end end
    return scenes.describe(value) ~= nil
end

return scenes

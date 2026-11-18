-- Sources retenues pendant l'affichage : une illustration et trois vignettes au plus.
local display = {}
local widget, source, current, currentLayout, progressBar, thumbnails
local rowImages = {}
local entrance, currentIdentity
local cells, gridVisible = {}, false
function display.start(root)
    widget, source, current, currentLayout = nil, nil, nil, nil
    rowImages, thumbnails, cells, gridVisible = {}, {}, {}, false
    entrance, currentIdentity = nil, nil
    progressBar = lv.obj.new(root)
    lv.obj.remove_style_all(progressBar)
    lv.obj.set_pos(progressBar, 12, 101)
    local style = lv.style.new()
    lv.style.set_bg_color(style, lv.color.hex(0x53d9d1))
    lv.style.set_bg_opa(style, lv.OPA_COVER)
    lv.obj.add_style(progressBar, style, lv.STATE_DEFAULT)
    display.progressStyle = style
    lv.obj.add_flag(progressBar, lv.OBJ_FLAG_HIDDEN)
    if lv.img and lv.img_src then
        widget = lv.img.new(root)
        lv.obj.remove_style_all(widget)
        lv.obj.set_pos(widget, 224, 55)
        lv.obj.add_flag(widget, lv.OBJ_FLAG_HIDDEN)
        for i = 1, 3 do
            thumbnails[i] = lv.img.new(root)
            lv.obj.remove_style_all(thumbnails[i])
            lv.obj.set_pos(thumbnails[i], 280, 110 + (i-1) * 29)
            lv.obj.add_flag(thumbnails[i], lv.OBJ_FLAG_HIDDEN)
        end
    end
    for i = 1, 4 do
        local x, y = 12 + ((i - 1) % 2) * 152, 48 + math.floor((i - 1) / 2) * 70
        local box = lv.obj.new(root)
        lv.obj.remove_style_all(box)
        lv.obj.set_pos(box, x, y)
        lv.obj.set_size(box, 144, 68)
        lv.obj.clear_flag(box, lv.OBJ_FLAG_SCROLLABLE)
        local style = lv.style.new()
        lv.style.set_bg_opa(style, lv.OPA_COVER)
        local label = lv.label.new(box)
        lv.obj.remove_style_all(label)
        lv.obj.set_pos(label, 2, 44)
        lv.obj.set_size(label, 140, 22)
        lv.label.set_long_mode(label, lv.LABEL_LONG_SCROLL_CIRCULAR or lv.LABEL_LONG_WRAP)
        local textStyle = lv.style.new()
        lv.style.set_text_font(textStyle, lv.font.nunito_bold_16)
        local img
        if lv.img and lv.img_src then
            img = lv.img.new(box)
            lv.obj.remove_style_all(img)
            lv.obj.set_pos(img, 48, 2)
            lv.obj.add_flag(img, lv.OBJ_FLAG_HIDDEN)
        end
        cells[i] = {box = box, label = label, img = img, style = style, textStyle = textStyle}
        lv.obj.add_flag(box, lv.OBJ_FLAG_HIDDEN)
    end
end
-- Une seule page retient au plus quatre sources d'image, réutilisées ou relâchées.
function display.grid(entries, selected, palette)
    if not entries and not gridVisible then return end
    gridVisible = entries ~= nil
    for i, cell in ipairs(cells) do
        local entry = entries and entries[i]
        local path = entry and entry.image
        if cell.img and cell.current ~= path then
            lv.obj.add_flag(cell.img, lv.OBJ_FLAG_HIDDEN)
            lv.img.set_src(cell.img, nil)
            cell.source, cell.current = nil, path
            if path then
                local ok, result = pcall(lv.img_src.load, path)
                if ok and result then
                    cell.source = result
                    lv.img.set_src(cell.img, result)
                    local w, h = lv.img_src.get_width(result), lv.img_src.get_height(result)
                    lv.img.set_zoom(cell.img, math.floor(256 * math.min(48/w, 40/h, 1)))
                    lv.obj.clear_flag(cell.img, lv.OBJ_FLAG_HIDDEN)
                end
            end
        end
        lv.label.set_text(cell.label, entry and ((selected == i and '> ' or '  ') .. (entry.enabled == false and '[x] ' or '') .. entry.name) or '')
        if entry then
            lv.style.set_bg_color(cell.style, lv.color.hex(selected == i and palette.selection or palette.background))
            lv.style.set_text_color(cell.textStyle, lv.color.hex(selected == i and palette.background or palette.text))
            lv.obj.add_style(cell.box, cell.style, lv.STATE_DEFAULT)
            lv.obj.add_style(cell.label, cell.textStyle, lv.STATE_DEFAULT)
            lv.obj.clear_flag(cell.box, lv.OBJ_FLAG_HIDDEN)
        else lv.obj.add_flag(cell.box, lv.OBJ_FLAG_HIDDEN) end
    end
end

function display.progress(value)
    if not progressBar then return end
    lv.obj.add_flag(progressBar, lv.OBJ_FLAG_HIDDEN)
    if value ~= nil then
        lv.obj.set_size(progressBar, math.max(1, math.floor(202 * value / 100)), 3)
        lv.obj.clear_flag(progressBar, lv.OBJ_FLAG_HIDDEN)
    end
end
function display.thumbnails(paths)
    for i, obj in ipairs(thumbnails or {}) do
        local path = paths[i]
        if not rowImages[i] or rowImages[i].path ~= path then
            lv.obj.add_flag(obj, lv.OBJ_FLAG_HIDDEN)
            lv.img.set_src(obj, nil)
            rowImages[i] = nil
            if path then
                local ok, result = pcall(lv.img_src.load, path)
                if ok and result then
                    rowImages[i] = {path = path, source = result}
                    lv.img.set_src(obj, result)
                    local w, h = lv.img_src.get_width(result), lv.img_src.get_height(result)
                    lv.img.set_zoom(obj, math.floor(256 * math.min(24/w, 24/h, 1)))
                    lv.obj.clear_flag(obj, lv.OBJ_FLAG_HIDDEN)
                end
            end
        end
    end
end
-- L'horloge du lecteur avance aussi pendant les menus et les scènes silencieuses.
function display.tick()
    if not entrance then return end
    entrance.frame = math.min(12, entrance.frame + 1)
    local remaining = (1 - entrance.frame / 12) ^ 3
    lv.obj.set_pos(widget, entrance.x + math.floor((320 - entrance.visualX) * remaining), entrance.y)
    if entrance.frame == 12 then entrance = nil end
end
function display.image(path, layout, identity)
    if not widget or (path == current and layout == currentLayout and identity == currentIdentity) then return end
    entrance, currentIdentity = nil, identity
    if path ~= current then
        lv.obj.add_flag(widget, lv.OBJ_FLAG_HIDDEN)
        lv.img.set_src(widget, nil)
        source, current = nil, path
        collectgarbage('collect')
        if path then
            local ok, result = pcall(lv.img_src.load, path)
            if ok and result then source = result; lv.img.set_src(widget, source) end
        end
    end
    currentLayout = layout
    if not source then return end
    local x, y, width, height = 224, 55, 84, 48
    if layout == 'split' then x, y, width, height = 12, 48, 140, 140
    elseif layout == 'fullImage' then x, y, width, height = 12, 48, 296, 140 end
    lv.obj.set_pos(widget, x, y)
    local w, h = lv.img_src.get_width(source), lv.img_src.get_height(source)
    local zoom = math.min(width / w, height / h)
    if not layout then zoom = math.min(zoom, 1) end
    if layout == 'scene' then zoom = math.min(106 / w, 212 / h) end
    local scaled = math.max(1, math.floor(256 * zoom))
    lv.img.set_zoom(widget, scaled)
    if layout == 'scene' then
        zoom = scaled / 256
        local visualX = 214 + (106 - w * zoom) / 2
        -- LVGL transforme l'image autour de son centre par défaut.
        x = math.floor(visualX + w * (zoom - 1) / 2)
        y = math.floor(212 - h * zoom + h * (zoom - 1) / 2)
        entrance = {x = x, y = y, visualX = visualX, frame = 0}
        lv.obj.set_pos(widget, x + math.ceil(320 - visualX), y)
    end
    lv.obj.clear_flag(widget, lv.OBJ_FLAG_HIDDEN)
end
return display

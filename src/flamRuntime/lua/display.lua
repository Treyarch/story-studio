-- Sources retenues pendant l'affichage : une illustration et trois vignettes au plus.
local display = {}
local widget, source, current, progressBar, thumbnails
local rowImages = {}
function display.start(root)
    widget, source, current = nil, nil, nil
    rowImages, thumbnails = {}, {}
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
function display.image(path)
    if not widget or path == current then return end
    lv.obj.add_flag(widget, lv.OBJ_FLAG_HIDDEN)
    -- Le widget est masqué avant de relâcher la référence de l'ancienne source.
    lv.img.set_src(widget, nil)
    source, current = nil, path
    collectgarbage('collect')
    if not path then return end
    local ok, result = pcall(lv.img_src.load, path)
    if not ok or not result then return end
    source = result
    lv.img.set_src(widget, source)
    local width, height = lv.img_src.get_width(source), lv.img_src.get_height(source)
    lv.img.set_zoom(widget, math.floor(256 * math.min(84 / width, 48 / height, 1)))
    lv.obj.clear_flag(widget, lv.OBJ_FLAG_HIDDEN)
end
return display

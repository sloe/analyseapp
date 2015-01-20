# -*- coding: utf-8 -*-

import re

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires
def index():
    return dict()

def error():
    return dict()

def videoelement():
    size_errors = []

    # For sizes, URL vars override the session but don't overwrite it
    if not session.video_sizes:
        session.video_sizes = {}

    if 0 in session.video_sizes:
        width, height = session.video_sizes[0]
    else:
        width, height = 1280, 720

    if request.vars.size:
        match = re.match(r'(\d+)x(\d+)$', str(request.vars.size))
        if match:
            width, height = int(match.group(1)), int(match.group(2))
        else:
            size_errors.append(T("Cannot decode size element in URL - must be in the form 123x456"))

    size_form, size_script = oar_video_size_form((width, height))

    if size_form.process(keepvalues=True, onsuccess=None).accepted:
        match = re.match(r'(\d+)x(\d+)$', size_form.vars.f_size)
        if not match:
            size_errors.append(T("Cannot decode size - must be in the form 123x456"))
        else:
            width, height = int(match.group(1)), int(match.group(2))
            session.video_sizes[0] = width, height

    elif size_form.errors:
        size_errors.append(T("Size form error"))

    width = max(0, min(width, 10000))
    height = max(0, min(height, 10000))
    size_errors.append("Size is %dx%d" % (width, height))

    if size_errors:
        response.flash += ". ".join([str(x) for x in size_errors])

    link_form, link_script = oar_link_form()

    return dict(height=height,
                link_form=link_form,
                link_script=link_script,
                size_form=size_form,
                size_script=size_script,
                width=width)


def video():
    elements = videoelement()
    elements.update(select())
    return elements


def select():
    select_errors = []

    if request.vars.treeselector_items:
        session.current_selection = request.vars.treeselector_items

    selector_form, selector_script = oar_selector_form(session.current_selection)

    if selector_form.process(keepvalues=True, onsuccess=None).accepted:
        response.flash += T("Changed to %s %s" % (selector_form.vars.treeselector_tree, selector_form.vars.treeselector_items))
    elif selector_form.errors:
        select_errors.append(T("Selector form error"))

    if select_errors:
        response.flash += ". ".join([str(x) for x in select_errors])

    final_item = None
    fps = "29.97"
    gdrive_found = None
    genspec = None
    source_item = None
    speed_factor = "1"


    if session.current_selection:
        tree = sloelib_get_tree();
        final_item = sloelib.SloeTreeNode.get_object_by_uuid(session.current_selection)
        if final_item:
            find_str = final_item._subtree+'/'+final_item.leafname
            gdrive_found = sloelib_gdrive_find(find_str)

            common_ids = sloelib.SloeUtil.extract_common_id(final_item.get('common_id', ''))
            genspec = sloelib.SloeTreeNode.get_object_by_uuid(common_ids.get('G'))
            source_item = sloelib.SloeTreeNode.get_object_by_uuid(common_ids.get('I'))
            if genspec:
                fps = genspec.get('output_frame_rate', fps)
                speed_factor = genspec.get('speed_factor', speed_factor)

    return dict(
        final_item=final_item,
        fps=fps,
        gdrive_found=gdrive_found,
        genspec=genspec,
        selector_form=selector_form,
        selector_script=selector_script,
        source_item=source_item,
        speed_factor=speed_factor
    )


def treeselectoritems():
    tree_selector, selector_by_uuid = sloelib_get_tree_selector('final')
    tree_selected = "/".join(request.args)
    tree_entries = [x[1] for x in tree_selector if x[0] == tree_selected]
    item_entries=[{'title': 'Select', 'uuid': ''}] + tree_entries[0]
    return dict(
        current_item_uuid = session.current_selection or '',
        item_entries=item_entries
    )

# -*- coding: utf-8 -*-

import re

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

def error():
    return dict()


def index():
    tree_selector, selector_by_uuid = sloelib_get_tree_selector('final')
    return dict(
        tree_selector=tree_selector,
        selector_by_uuid=selector_by_uuid
    )


def yt():
    if len(request.args) < 1:
        redirect(URL('index'))
    req_uuid, is_valid = sloe_condition_uuid(request.args[0])
    if not is_valid:
        raise HTTP(404, "Cannot decode UUID from %s</br>%s" % (XML(request.args[0], sanitize=True), A("Home", _href=URL('index'))))
    redirect(URL('video', req_uuid, host=True, scheme=True))


def viewitem():
    if len(request.args) < 1:
        redirect(URL('index'))
    req_uuid, is_valid = sloe_condition_uuid(request.args[0])
    item = sloelib_get_item(req_uuid)
    if not item:
        raise HTTP(404, "Nothing found for UUID %s</br>%s" % (XML(req_uuid, sanitize=True), A("Home", _href=URL('index'))))
    return dict(item=Storage(item.as_dict()))


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

    if size_errors:
        session.flash += ". ".join([str(x) for x in size_errors])

    link_form, link_script = oar_link_form()

    return dict(height=height,
                link_form=link_form,
                link_script=link_script,
                size_form=size_form,
                size_script=size_script,
                width=width)


def video():
    sloe_process_singlevid_request()
    elements = videoelement()
    elements.update(select())
    return elements


def select():
    select_errors = []

    selector_form, selector_script = oar_selector_form(session.current_selection)

    if selector_form.process(keepvalues=True, onsuccess=None).accepted:
        if sloe_verify_uuid(selector_form.vars.treeselector_items):
            redirect(URL(args=[selector_form.vars.treeselector_items]))
    elif selector_form.errors:
        select_errors.append(T("Selector form error"))

    if select_errors:
        session.flash += ". ".join([str(x) for x in select_errors])

    if session.current_selection:
        fii = sloelib_get_final_item_info(session.current_selection)
        link_args=[session.current_selection]
    else:
        fii = Storage()
        link_args=[]

    if fii.filesize:
        size_str = "%.1fMB" % (float(fii.filesize) / 2**20)
    else:
        size_str = None

    # vi is video information, for videos without a final item
    vi = Storage(
        fps=fii.fps or '29.97',
        size_str=size_str,
        speed_factor=fii.speed_factor or '1'
    )

    return dict(
        fii=fii,
        link_args=link_args,
        selector_form=selector_form,
        selector_script=selector_script,
        vi=vi
    )


def treeselectoritems():
    tree_selector, selector_by_uuid = sloelib_get_tree_selector('final')
    tree_selected = "/".join(request.args)
    tree_entries = [x[1] for x in tree_selector if x[0] == tree_selected]
    item_entries=[{'menutitle': 'Select', 'uuid': ''}] + tree_entries[0]
    return dict(
        current_item_uuid = session.current_selection or '',
        item_entries=item_entries
    )


def debuginfoframe():
    if session.current_selection:
        fii = sloelib_get_final_item_info(session.current_selection)
        link_args=[session.current_selection]
    else:
        fii = Storage()
        link_args=[]

    return dict(
        fii=fii,
        link_args=link_args
    )

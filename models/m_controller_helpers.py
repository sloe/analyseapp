
def sloe_reset_current_if_valid(new_uuid):
    item = sloelib.SloeTreeNode.get_object_by_uuid_or_none(new_uuid)
    if not item:
        raise HTTP(404, "Nothing found for UUID %s</br>%s" % (XML(new_uuid, sanitize=True), A("Home", _href=URL('index'))))
    if item.type == 'item' and item._primacy == 'final':
        session.current_selection = new_uuid
    else:
        redirect(URL("viewitem", new_uuid))


def sloe_process_singlevid_request():
    if len(request.args) == 0:
        if session.current_selection and sloe_verify_uuid(session.current_selection):
            redirect(URL(args=[session.current_selection]))
    else:
        req_uuid = request.args[0]
        if not sloe_verify_uuid(req_uuid):
            raise HTTP(404, "Cannot decode UUID from %s</br>%s" % (XML(req_uuid, sanitize=True), A("Home", _href=URL('index'))))
        if req_uuid != session.current_selection:
            sloe_reset_current_if_valid(req_uuid)


def sloe_if_url_is_loadable(test_url):
    import requests
    import requests.exceptions
    try:
        response = requests.head(test_url)
    except requests.exceptions.RequestException as e:
        return False
    return response.status_code == 200


def sloe_cdn_find(final_item):
    import urllib
    cdn_subpath = urllib.quote(final_item.get_file_url_subpath())

    cdn_urls = [
        "https://cdn.oarstack.com/%s" % cdn_subpath,
        "https://cdn-origin.oarstack.com/%s" % cdn_subpath
    ]

    for cdn_url in cdn_urls:
        if sloe_if_url_is_loadable(cdn_url):
            return cdn_url

    return None


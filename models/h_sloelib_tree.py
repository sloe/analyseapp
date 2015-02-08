
import logging
import os

import sloelib
from sloeplugins import *

def sloelib_get_tree():

    config_filename = os.path.join(request.folder, "private/sloelib_config.cfg")
    config_spec = sloelib.SloeConfigSpec.new_from_ini_file(config_filename, "Loading initial config")
    config_spec.apply_to_config(sloelib.SloeConfig.inst(), "global")

    def reload_tree():
        logging.info("Performing full load of tree")

        tree = sloelib.SloeTree.inst()
        tree.reset()
        tree.load_filesize = False
        tree.load()
        logging.info("Loaded tree")
        # FIXME: sloelib uses the global UUID_LIB, which we also need to preserve in the cache
        return (tree, sloelib.SloeTreeNode.UUID_LIB)

    tree_c, uuid_lib_c = cache.disk('sloelib_tree', reload_tree, time_expire=360)
    sloelib.SloeTree.instance = tree_c
    sloelib.SloeTreeNode.UUID_LIB = uuid_lib_c

    return tree_c


def sloelib_get_tree_selector(params):
    tree = sloelib_get_tree()

    selector = []
    selector_by_uuid = {}

    for subtree, album, items in sloelib.SloeTreeUtil.walk_items(tree.root_album):
        this_selector = []
        try:
            for item in items:
                if sloelib.SloeTreeUtil.object_matches_selector(item, params):
                    common_ids = sloelib.SloeUtil.extract_common_id(item.get('common_id', ''))
                    genspec = sloelib.SloeTreeNode.get_object_by_uuid_or_none(common_ids.get('G'))
                    item_mb_size = float(item.video_size) / 2**20
                    item_size = "%.0fMB" % item_mb_size
                    output_short_description = genspec.get("output_short_description", "")
                    if genspec and genspec.get("output_description", None):
                        item_spec = ("%s %.2fs" %
                                     (genspec.output_description, float(item.video_duration)))
                        if output_short_description:
                            item_shortspec = "%s %s" % (output_short_description, item_size)
                        else:
                            item_shortspec = "%s" % item_size
                    else:
                        item_spec = ""
                        item_shortspec = item_spec

                    item_title = item.name
                    item_menutitle = "%s, %s" % (item.name, item_shortspec)

                    item_record = {
                        'uuid': item.uuid,
                        'menutitle': item_menutitle,
                        'size': item_size,
                        'spec': item_spec,
                        'title': item_title
                    }

                    this_selector.append(item_record)
                    selector_by_uuid[item.uuid] = (album._subtree, this_selector, item_record)

            if this_selector:
                sorted_this_selector = sorted(this_selector, key=lambda x: x.get('menutitle'))
                selector.append((album._subtree, sorted_this_selector))

        except Exception, e:
            logging.error('sloelib_get_tree_selector: %s' % str(e))
            raise

    sorted_selector = sorted(selector, key=lambda x: x[0])
    return sorted_selector, selector_by_uuid


def sloelib_get_final_item_info(final_item_uuid):

    def _reload_item(_final_item_uuid):
        tree = sloelib_get_tree();
        final_item = sloelib.SloeTreeNode.get_object_by_uuid(_final_item_uuid)
        if final_item:
            filesize = final_item.get('video_size', None)
            if filesize:
                filesize = int(filesize)
            find_str = final_item._subtree+'/'+final_item.leafname
            gdrive_objects = sloelib_gdrive_find(find_str)

            common_ids = sloelib.SloeUtil.extract_common_id(final_item.get('common_id', ''))
            genspec = sloelib.SloeTreeNode.get_object_by_uuid(common_ids.get('G'))
            source_item = sloelib.SloeTreeNode.get_object_by_uuid(common_ids.get('I'))
            if genspec:
                fps = genspec.get('output_frame_rate', None)
                speed_factor = genspec.get('speed_factor', None)

            remote_items = sloelib.SloeTreeUtil.find_remoteitems_for_final_item(final_item.uuid)

            related_remote_items = sloelib.SloeTreeUtil.find_remoteitems_for_source_item(source_item.uuid)

        return Storage(
            common_ids=common_ids,
            filesize=filesize,
            final_item=final_item,
            fps=fps,
            gdrive_objects=gdrive_objects,
            genspec=genspec,
            related_remote_items=related_remote_items,
            remote_items=remote_items,
            source_item=source_item,
            speed_factor=speed_factor
        )

    cache_id = "final_item_%s" % final_item_uuid
    final_item_info = cache.disk(cache_id, lambda: _reload_item(final_item_uuid), time_expire=30)
    if not final_item_info.gdrive_objects:
        # Regenerate info if there are no gdrive items
        final_item_info = cache.disk(cache_id, lambda: _reload_item(final_item_uuid), time_expire=0)

    return final_item_info



def sloelib_get_item(item_uuid):

    def _reload_item(_item_uuid):
        tree = sloelib_get_tree();
        item = sloelib.SloeTreeNode.get_object_by_uuid_or_none(_item_uuid)
        return item
    cache_id = "item_%s" % item_uuid
    item_info = cache.disk(cache_id, lambda: _reload_item(item_uuid), time_expire=30)
    if not item_info:
        item_info = cache.disk(cache_id, lambda: _reload_item(item_uuid), time_expire=0)
    return item_info

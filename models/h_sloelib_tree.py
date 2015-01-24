
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
    tree = sloelib_get_tree();

    selector = []
    selector_by_uuid = {}

    for subtree, album, items in sloelib.SloeTreeUtil.walk_items(tree.root_album):
        this_selector = []
        try:
            for item in items:
                if sloelib.SloeTreeUtil.object_matches_selector(item, params):
                    item_spec = ("%sx%s %.2fs %.1fMB" %
                                 (item.video_width, item.video_height, float(item.video_duration), float(item.video_size) / 2**20))

                    item_title = "%s (%s)" % (item.name, item_spec)
                    item_record = {
                        'uuid': item.uuid,
                        'spec': item_spec,
                        'title': item_title
                    }

                    this_selector.append(item_record)
                    selector_by_uuid[item.uuid] = (album._subtree, this_selector, item_record)

            if this_selector:
                selector.append((album._subtree, this_selector))

        except Exception, e:
            logging.error('sloelib_get_tree_selector: %s' % str(e))
            raise

    return selector, selector_by_uuid


def sloelib_get_final_item_info(final_item_uuid):

    def _reload_item(_final_item_uuid):
        tree = sloelib_get_tree();
        final_item = sloelib.SloeTreeNode.get_object_by_uuid(_final_item_uuid)
        if final_item:
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
        final_item_info = cache.disk(cache_id, _reload_item, time_expire=0)

    return final_item_info

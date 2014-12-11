
import logging
import os

import sloelib
from sloeplugins import *

def sloelib_get_tree():
    
    def reload_tree():
        logging.info("Performing full load of tree")
        config_filename = os.path.join(request.folder, "private/sloelib_config.cfg")
        config_spec = sloelib.SloeConfigSpec.new_from_ini_file(config_filename, "Loading initial config")
        config_spec.apply_to_config(sloelib.SloeConfig.inst(), "global")
        
        tree = sloelib.SloeTree.inst()
        tree.reset()
        tree.load_filesize = False
        tree.load()
        logging.info("Loaded tree")        
        return tree
        
    return cache.disk('sloelib_tree', reload_tree, time_expire=360)


def sloelib_get_tree_selector(params):
    tree = sloelib_get_tree();

    selector = []

    for subtree, album, items in sloelib.SloeTreeUtil.walk_items(tree.root_album):
        this_selector = []
        try:
            for item in items:
                if sloelib.SloeTreeUtil.object_matches_selector(item, params):                        
                    item_spec = ("%sx%s %.2fs %.1fMB" %
                                 (item.video_width, item.video_height, float(item.video_duration), float(item.video_size) / 2**20))
                        
                    item_title = "%s (%s)" % (item.name, item_spec)
                    
                    this_selector.append({
                        'uuid': item.uuid,
                        'spec': item_spec,
                        'title': item_title}
                    )
            if this_selector:    
                selector.append((album._subtree, this_selector))
                    
        except Exception, e:
            logging.error('sloelib_get_tree_selector: %s' % str(e))
            raise

    return selector
            
        
            
 
    
    
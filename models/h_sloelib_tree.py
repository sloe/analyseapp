
import logging

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
        
    return cache.ram('sloelib_tree', reload_tree, time_expire=360)


import logging
import os

import sloelib
from sloeplugins import *

def sloelib_gdrive_find(find_str):
    finder = sloeplugin_gdrive.SloeGDriveFinder()

    found_items = finder.find(find_str, exact=True)

    results = [Storage(x) for x in found_items]

    return results
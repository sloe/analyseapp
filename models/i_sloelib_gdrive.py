
import logging
import os

import sloelib
from sloeplugins import *

def sloelib_gdrive_find(find_str):
    finder = sloeplugin_gdrive.SloeGDriveFinder()

    results = finder.find(find_str, exact=True)

    return results
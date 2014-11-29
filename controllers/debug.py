import os

def index():
    tree = sloelib_get_tree()
    return dict(tree=tree.__dict__, root=tree.root_album.__dict__)

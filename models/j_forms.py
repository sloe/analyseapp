
def oar_video_size_form(current_size):
    sizes = [
        (320, 180),
        (480, 270),
        (640, 360),
        (960, 540),
        (1280, 720),
        (1920, 1080),
        (2560, 1440)
    ]

    if current_size not in sizes:
        sizes.append(current_size)
        sizes = sorted(sizes)

    sizes_set = ["%dx%d" % x for x in sizes]

    size_default = "%dx%d" % current_size

    script = SCRIPT("""
$('document').ready(function(){
    $('#sizecombo').change(function(){
        $('#sizeform').submit();
    });
});
""")

    form = SQLFORM.factory(
        Field('f_size', default=size_default, label='Resolution', requires=IS_IN_SET(sizes_set, zero=None)),
        formstyle='divs',
        buttons=[]
    )

    form.attributes['_id'] = 'sizeform'
    form.element('select').attributes['_id'] = 'sizecombo'

    return form, script


def oar_selector_form(current_selection):
    tree_selector = sloelib_get_tree_selector('final')

    script = SCRIPT("""
$('document').ready(function(){
    $('#treeselector_items').change(function(){
        $('#treeselector_form').submit();
    });
});

function treeselector_tree_onchange(){
    var treeopts = document.getElementById("treeselector_tree");
    var tree_selected = treeopts.options[treeopts.selectedIndex].value;
    ajax('treeselectoritems/'+tree_selected, [], 'treeselector_items');
};

""")

    subtree_names = [x[0] for x in tree_selector]

    form = FORM(
        SELECT(*subtree_names, _id='treeselector_tree', _name='treeselector_tree', _onchange='treeselector_tree_onchange();'),
        SELECT('Loading...', _id='treeselector_items',  _name='treeselector_items'),
        _id='treeselector_form'
    )

    return form, script

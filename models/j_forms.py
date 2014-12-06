
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

    size_script = SCRIPT("""
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

    return form, size_script

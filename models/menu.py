response.title = settings.title
response.subtitle = settings.subtitle
response.meta.author = '%(author)s <%(author_email)s>' % settings
response.meta.keywords = settings.keywords
response.meta.description = settings.description
response.menu = [
    (T('Index'),URL('default','index')==URL(),URL('default','index'),[]),
    (T('Video'),URL('default','video')==URL(),URL('default','video'),[]),
    (T('Info'), False, "http://www.oarstack.com/2015/04/oarstack-analysis/", []),
]
response.google_analytics_id="UA-52135133-2"

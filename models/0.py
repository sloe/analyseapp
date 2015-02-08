from gluon.storage import Storage
settings = Storage()

settings.migrate = True
settings.title = 'Oarstack Analysis'
settings.subtitle = 'Rowing videos'
settings.author = 'Oarstack Admins'
settings.author_email = 'admins@oarstack.com'
settings.keywords = 'Rowing, Video, Slow Motion'
settings.description = 'Slow motion analysis for rowing videos'
settings.layout_theme = 'Default'
settings.database_uri = 'sqlite://storage.sqlite'
settings.security_key = 'b8e87585-6963-4876-8893-f86c45bf5da3'
settings.email_server = 'localhost'
settings.email_sender = 'you@example.com'
settings.email_login = ''
settings.login_method = 'local'
settings.login_config = ''
settings.plugins = []

import logging
logger = logging.getLogger("web2py.app.analyseapp")
logger.setLevel(logging.DEBUG)

import logging
import os
import sys
import json
import cherrypy
import splunk
import splunk.appserver.mrsparkle.controllers as controllers
import splunk.appserver.mrsparkle.lib.util as util
import splunk.util
import splunk.clilib.cli_common
import shutil
from splunk.appserver.mrsparkle.lib.decorators import expose_page
from splunk.appserver.mrsparkle.lib.routes import route
from splunk.appserver.mrsparkle.lib import jsonresponse

from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path

logger = logging.getLogger('splunk')
settings = splunk.clilib.cli_common.getConfStanza('app', 'ui')
savepath = settings['savepath']
pendingPath = settings['temppath']




_APPNAME = 'splunk_components_collection'
def setup_logger(level):
    """
    Setup a logger for the REST handler.
    """
    logger = logging.getLogger('splunk.appserver.%s.controllers.my_script' % _APPNAME)
    logger.propagate = False  # Prevent the log messages from being duplicated in the python.log file
    logger.setLevel(level)
    file_handler = logging.handlers.RotatingFileHandler(
        make_splunkhome_path(['var', 'log', 'splunk', 'my_script_controller.log']), maxBytes=25000000, backupCount=5)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger
 
logger = setup_logger(logging.DEBUG)
 
class scc_simpleupload_service(controllers.BaseController):
    # /custom/MyAppName/my_script/my_endpoint
    @expose_page(must_login=True, methods=['GET'])
	
    def list(self, **kwargs):
        # DO YOUR THINGS WITH THE KWARGS PASSED
        return 'aaa'
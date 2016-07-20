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

logger = logging.getLogger('splunk')

#
# These helpers would better be factorized since there are used
# both by scc_simpleupload_service and scc_simpleupload_upload endpoints
# TODO
#
def get_savepath(app):
    settings = splunk.clilib.cli_common.getConfStanza(app, 'scc_simpleupload')
    logger.info('get_savepath settings={}'.format(settings))
    return settings['savepath']

def get_temppath(app):
    settings = splunk.clilib.cli_common.getConfStanza(app, 'scc_simpleupload')
    logger.info('get_temppath settings={}'.format(settings))
    return settings['temppath']


class scc_simpleupload_service(controllers.BaseController):

    def render_json(self, response_data, set_mime="text/json"):
        cherrypy.response.headers["Content-Type"] = set_mime
        if isinstance(response_data, jsonresponse.JsonResponse):
            response = response_data.toJson().replace("</", "<\\/")
        else:
            response = json.dumps(response_data).replace("</", "<\\/")
        return " " * 256  + "\n" + response

    @route('/:action=alreadyuploaded')
    @expose_page(must_login=True, methods=['GET','POST'])
    def alreadyuploaded(self, **kwargs):
        return 'already uploaded'

    @route('/:action=list')
    @expose_page(must_login=True, methods=['GET','POST'])
    def list(self, **kwargs):
        logger.info("Call received on scc_simpleupload_service endpoint " \
            + "'list' action with {} params".format(cherrypy.request.params))

        savepath = get_savepath(cherrypy.request.params.get('app'))
        pendingPath = get_temppath(cherrypy.request.params.get('app'))

        logger.info('Working on (temppath,{}) and (savepath,{})'.format(pendingPath, savepath))

        files = []
        if os.path.exists(savepath):
            savedFiles = os.listdir(savepath)
        else:
            savedFiles = []

        for fname in savedFiles:
            size=0
            saveFile=os.path.join(savepath, fname)
            isFile = os.path.isfile(saveFile)
            if(isFile and fname[0] != '.'):
                size = os.path.getsize(saveFile)
            files.append({'name': fname, 'size': size, 'isFile': isFile, 'finished': True })

        if os.path.exists(pendingPath):
            pendingFiles = os.listdir(pendingPath)
        else:
            pendingFiles = []

        for fname in pendingFiles:
            size=0
            isFile = os.path.isfile(os.path.join(pendingPath, fname))
            pendingFolder = os.path.join(pendingPath, fname)
            if(not isFile and fname[0] != '.'):
                chunks = os.listdir(pendingFolder)
                size = 0
                parts = 0
                for chunk in chunks:
                    try:
                        chunkNumber = int(chunk[chunk.rfind('.')+1:])
                    except:
                        chunkNumber = -1

                    if(chunkNumber>0):
                        chunkPath = os.path.join(pendingFolder, chunk)
                        if(os.path.isfile(chunkPath) and chunk[0] != '.'):
                            parts = parts + 1
                            size = size + os.path.getsize(chunkPath)
                            fname = chunk[:chunk.rfind('.')]

                if(fname):
                    files.append({'name': fname, 'size': size, 'isFile': isFile, 'finished': False, 'parts': parts })

        return self.render_json(files)

    @route('/:action=remove/:fname')
    @expose_page(must_login=True, methods=['GET','POST'])
    def remove(self, fname, **kwargs):
        logger.info("Call received on scc_simpleupload_service endpoint " \
            + "'remove' action with {} params".format(cherrypy.request.params))

        savepath = get_savepath(cherrypy.request.params.get('app'))

        os.remove(os.path.join(savepath,fname))
        return self.render_json(fname)

    @route('/:action=removeall')
    @expose_page(must_login=True, methods=['GET','POST'])
    def removeall(self, **kwargs):
        logger.info("Call received on scc_simpleupload_service endpoint " \
            + "'removeall' action with {} params".format(cherrypy.request.params))

        savepath = get_savepath(cherrypy.request.params.get('app'))

        if os.path.exists(savepath):
            logger.warn('purge uploaded files '+ savepath)
            shutil.rmtree(savepath)

        return self.render_json([0])

    @route('/:action=removepending')
    @expose_page(must_login=True, methods=['GET','POST'])
    def removepending(self, **kwargs):
        logger.info("Call received on scc_simpleupload_service endpoint " \
            + "'removepending' action with {} params".format(cherrypy.request.params))

        pendingPath = get_temppath(cherrypy.request.params.get('app'))

        if os.path.exists(pendingPath):
            logger.warn('purge pending files '+ pendingPath)
            shutil.rmtree(pendingPath)

        return self.render_json([0])


"""
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

    #Setup a logger for the REST handler.

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
"""
